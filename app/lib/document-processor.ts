import { prisma } from '@/app/lib/prisma';
import { generateEmbeddings } from '@/app/lib/openai';
import { upsertVectors, deleteDocumentVectors, type VectorMetadata } from '@/app/lib/pinecone';
import { downloadFile, extractKeyFromUrl } from '@/app/lib/s3';
import { processWithVision, shouldUseVision } from '@/app/lib/vision-processor';
import pdf from 'pdf-parse';

// Chunking configuration
const CHUNK_SIZE = 800; // tokens (roughly 4 chars per token)
const CHUNK_OVERLAP = 200; // tokens
const CHARS_PER_TOKEN = 4;

export interface ProcessDocumentResult {
  success: boolean;
  chunkCount: number;
  error?: string;
}

/**
 * Main document processing pipeline
 */
export async function processDocument(
  documentId: string
): Promise<ProcessDocumentResult> {
  console.log(`[DocumentProcessor] Starting processing for document ${documentId}`);
  
  try {
    // Get document from database
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { tenant: true },
    });
    
    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }
    
    // Update status to processing
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'PROCESSING' },
    });
    
    // Extract text based on file type
    // PRIORITY: Use existing rawContent if available (already extracted during upload)
    let rawContent: string;
    
    if (document.rawContent && document.rawContent.length > 100) {
      // Use existing content if it's substantial
      console.log(`[DocumentProcessor] Using existing rawContent (${document.rawContent.length} chars)`);
      rawContent = document.rawContent;
    } else {
      // Need to extract content from file
      let buffer: Buffer | null = null;
      
      // Get the file buffer
      if (document.fileUrl) {
        const s3Key = extractKeyFromUrl(document.fileUrl);
        if (s3Key) {
          console.log(`[DocumentProcessor] Downloading from S3: ${s3Key}`);
          buffer = await downloadFile(s3Key);
        } else if (document.fileUrl.startsWith('data:')) {
          const matches = document.fileUrl.match(/^data:[^;]+;base64,(.+)$/);
          if (matches) {
            buffer = Buffer.from(matches[1], 'base64');
          }
        }
      }
      
      if (!buffer) {
        throw new Error('No content available for processing');
      }
      
      // Use GPT-4 Vision for PDFs (understands images, charts, tables)
      if (shouldUseVision(document.fileType)) {
        console.log(`[DocumentProcessor] Using GPT-4 Vision for ${document.fileType}`);
        const visionResult = await processWithVision(buffer, document.fileType, document.title);
        
        if (visionResult.success && visionResult.content.length > 0) {
          rawContent = visionResult.content;
          console.log(`[DocumentProcessor] Vision extracted ${rawContent.length} chars with ${visionResult.pages.length} pages`);
        } else {
          // Fallback to basic text extraction
          console.log(`[DocumentProcessor] Vision failed, falling back to basic extraction: ${visionResult.error}`);
          rawContent = await extractTextFromBuffer(buffer, document.fileType);
        }
      } else {
        // Use basic extraction for text files
        rawContent = await extractTextFromBuffer(buffer, document.fileType);
      }
    }
    
    // Chunk the content
    const chunks = chunkText(rawContent, document.title);
    console.log(`[DocumentProcessor] Created ${chunks.length} chunks`);
    
    // Generate embeddings for all chunks
    const chunkTexts = chunks.map((c) => c.content);
    const embeddings = await generateEmbeddings(chunkTexts);
    console.log(`[DocumentProcessor] Generated ${embeddings.length} embeddings`);
    
    // Delete existing vectors for this document (in case of re-processing)
    await deleteDocumentVectors(document.tenantId, documentId);
    
    // Store chunks in database and prepare vectors for Pinecone
    const vectors: { id: string; values: number[]; metadata: VectorMetadata }[] = [];
    
    // Delete existing chunks
    await prisma.documentChunk.deleteMany({
      where: { documentId },
    });
    
    // Prepare all chunks and vectors in memory first
    const chunkData = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkId = `${documentId}_chunk_${i}`;
      
      chunkData.push({
        id: chunkId,
        documentId,
        content: chunk.content,
        chunkIndex: i,
        pageNumber: chunk.pageNumber,
        startChar: chunk.startChar,
        endChar: chunk.endChar,
        embedding: embeddings[i],
        metadata: {
          title: document.title,
          fileName: document.fileName,
        },
      });
      
      // Prepare for Pinecone
      vectors.push({
        id: chunkId,
        values: embeddings[i],
        metadata: {
          documentId,
          chunkId,
          chunkIndex: i,
          content: chunk.content,
          documentTitle: document.title,
          pageNumber: chunk.pageNumber,
          tenantId: document.tenantId,
          knowledgeBaseId: document.knowledgeBaseId || '', // For filtering by KB
        },
      });
    }
    
    // Batch create all chunks at once
    await prisma.documentChunk.createMany({
      data: chunkData,
    });
    console.log(`[DocumentProcessor] Created ${chunkData.length} chunks in DB`);
    
    // Upsert to Pinecone
    await upsertVectors(document.tenantId, vectors);
    
    // Update document status
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
        chunkCount: chunks.length,
        rawContent,
      },
    });
    
    console.log(`[DocumentProcessor] Successfully processed document ${documentId}`);
    
    return {
      success: true,
      chunkCount: chunks.length,
    };
  } catch (error) {
    console.error(`[DocumentProcessor] Error processing document ${documentId}:`, error);
    
    // Update document with error status
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    
    return {
      success: false,
      chunkCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Extract text from a file URL based on file type
 * Uses S3 client to download files directly (handles private buckets)
 */
async function extractTextFromUrl(url: string, fileType: string): Promise<string> {
  // Try to extract S3 key from URL and download directly
  const s3Key = extractKeyFromUrl(url);
  
  let buffer: Buffer;
  
  if (s3Key) {
    // Download from S3 directly (works with private buckets)
    console.log(`[DocumentProcessor] Downloading from S3: ${s3Key}`);
    try {
      buffer = await downloadFile(s3Key);
    } catch (error) {
      console.error(`[DocumentProcessor] S3 download failed, trying URL fetch:`, error);
      // Fallback to URL fetch for backwards compatibility
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      buffer = Buffer.from(await response.arrayBuffer());
    }
  } else {
    // Handle data URLs or external URLs
    if (url.startsWith('data:')) {
      // Extract base64 data from data URL
      const matches = url.match(/^data:[^;]+;base64,(.+)$/);
      if (!matches) {
        throw new Error('Invalid data URL format');
      }
      buffer = Buffer.from(matches[1], 'base64');
    } else {
      // External URL - fetch directly
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      buffer = Buffer.from(await response.arrayBuffer());
    }
  }

  // Now extract text from buffer based on file type
  return extractTextFromBuffer(buffer, fileType);
}

/**
 * Extract text from a buffer (for direct uploads)
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  fileType: string
): Promise<string> {
  switch (fileType) {
    case 'PDF': {
      const data = await pdf(buffer);
      return data.text;
    }
    
    case 'TXT':
    case 'MD':
    case 'HTML': {
      return buffer.toString('utf-8');
    }
    
    case 'JSON': {
      const json = JSON.parse(buffer.toString('utf-8'));
      return JSON.stringify(json, null, 2);
    }
    
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

interface TextChunk {
  content: string;
  pageNumber?: number;
  startChar: number;
  endChar: number;
}

/**
 * Chunk text into overlapping segments
 */
function chunkText(text: string, documentTitle: string): TextChunk[] {
  const chunks: TextChunk[] = [];
  
  // Clean the text
  const cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  if (!cleanedText) {
    return [];
  }
  
  const chunkSizeChars = CHUNK_SIZE * CHARS_PER_TOKEN;
  const overlapChars = CHUNK_OVERLAP * CHARS_PER_TOKEN;
  
  let startIndex = 0;
  let chunkIndex = 0;
  
  while (startIndex < cleanedText.length) {
    // Calculate end index
    let endIndex = startIndex + chunkSizeChars;
    
    // Try to break at a sentence boundary
    if (endIndex < cleanedText.length) {
      const searchStart = Math.max(startIndex + chunkSizeChars - 200, startIndex);
      const searchEnd = Math.min(startIndex + chunkSizeChars + 200, cleanedText.length);
      const searchText = cleanedText.slice(searchStart, searchEnd);
      
      // Look for sentence endings
      const sentenceEndings = ['. ', '.\n', '? ', '?\n', '! ', '!\n'];
      let bestBreak = -1;
      
      for (const ending of sentenceEndings) {
        const idx = searchText.lastIndexOf(ending);
        if (idx !== -1) {
          const absoluteIdx = searchStart + idx + ending.length;
          if (absoluteIdx > bestBreak && absoluteIdx > startIndex + 100) {
            bestBreak = absoluteIdx;
          }
        }
      }
      
      if (bestBreak !== -1) {
        endIndex = bestBreak;
      }
    } else {
      endIndex = cleanedText.length;
    }
    
    const chunkContent = cleanedText.slice(startIndex, endIndex).trim();
    
    if (chunkContent.length > 50) { // Skip very small chunks
      // Add document context to chunk
      const contextualChunk = chunkIndex === 0
        ? `Document: ${documentTitle}\n\n${chunkContent}`
        : chunkContent;
      
      chunks.push({
        content: contextualChunk,
        startChar: startIndex,
        endChar: endIndex,
        pageNumber: estimatePageNumber(startIndex, cleanedText),
      });
    }
    
    // Move start index with overlap
    startIndex = endIndex - overlapChars;
    if (startIndex >= cleanedText.length - 100) {
      break; // Avoid tiny trailing chunks
    }
    
    chunkIndex++;
  }
  
  return chunks;
}

/**
 * Estimate page number based on character position
 */
function estimatePageNumber(charIndex: number, fullText: string): number {
  // Rough estimate: ~2500 characters per page
  const charsPerPage = 2500;
  
  // Count form feeds (page breaks) up to this point
  const textUpToIndex = fullText.slice(0, charIndex);
  const pageBreaks = (textUpToIndex.match(/\f/g) || []).length;
  
  if (pageBreaks > 0) {
    return pageBreaks + 1;
  }
  
  return Math.floor(charIndex / charsPerPage) + 1;
}

/**
 * Re-process all documents for a tenant
 */
export async function reprocessTenantDocuments(tenantId: string): Promise<void> {
  const documents = await prisma.document.findMany({
    where: { tenantId },
    select: { id: true },
  });
  
  for (const doc of documents) {
    await processDocument(doc.id);
  }
}
