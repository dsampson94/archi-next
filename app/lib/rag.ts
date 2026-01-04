import { prisma } from '@/app/lib/prisma';
import { generateEmbedding, generateChatCompletion, calculateConfidence } from '@/app/lib/openai';
import { queryVectors, type VectorMetadata } from '@/app/lib/pinecone';

export interface RAGQueryResult {
  content: string;
  confidence: number;
  tokensUsed: number;
  latencyMs: number;
  citations: {
    documentId: string;
    documentTitle: string;
    chunkId: string;
    snippet: string;
    score: number;
  }[];
  shouldHandoff: boolean;
}

export interface RAGQueryOptions {
  topK?: number;
  confidenceThreshold?: number;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

const DEFAULT_OPTIONS: RAGQueryOptions = {
  topK: 5,
  confidenceThreshold: 0.7,
  maxTokens: 1024,
  temperature: 0.7,
  model: 'gpt-4-turbo-preview',
};

/**
 * Main RAG query function - retrieves context and generates response
 */
export async function queryRAG(
  tenantId: string,
  query: string,
  systemPrompt: string,
  options?: RAGQueryOptions
): Promise<RAGQueryResult> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  console.log(`[RAG] Processing query for tenant ${tenantId}: "${query.slice(0, 100)}..."`);
  
  try {
    // Step 1: Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Step 2: Search Pinecone for similar chunks
    const vectorResults = await queryVectors(tenantId, queryEmbedding, opts.topK);
    
    console.log(`[RAG] Found ${vectorResults.length} relevant chunks`);
    
    // Step 3: Check if we have relevant context
    const relevantChunks = vectorResults.filter((r) => r.score > 0.5);
    const hasRelevantContext = relevantChunks.length > 0;
    
    // Step 4: Build context from chunks
    const context = buildContext(relevantChunks);
    
    // Step 5: Generate response using LLM
    const llmResponse = await generateChatCompletion(
      systemPrompt,
      query,
      context || 'No relevant documents found in the knowledge base.',
      {
        temperature: opts.temperature,
        maxTokens: opts.maxTokens,
        model: opts.model,
      }
    );
    
    // Step 6: Calculate confidence
    const similarityScores = relevantChunks.map((r) => r.score);
    const confidence = calculateConfidence(similarityScores, hasRelevantContext);
    
    // Step 7: Build citations
    const citations = relevantChunks.map((chunk) => ({
      documentId: chunk.metadata.documentId,
      documentTitle: chunk.metadata.documentTitle,
      chunkId: chunk.metadata.chunkId,
      snippet: chunk.metadata.content.slice(0, 200) + '...',
      score: chunk.score,
    }));
    
    const latencyMs = Date.now() - startTime;
    
    console.log(`[RAG] Response generated in ${latencyMs}ms, confidence: ${confidence.toFixed(2)}`);
    
    return {
      content: llmResponse.content,
      confidence,
      tokensUsed: llmResponse.tokensUsed,
      latencyMs,
      citations,
      shouldHandoff: confidence < (opts.confidenceThreshold || 0.7),
    };
  } catch (error) {
    console.error('[RAG] Error processing query:', error);
    
    return {
      content: "I'm sorry, I encountered an error while processing your question. Please try again or contact support if the issue persists.",
      confidence: 0,
      tokensUsed: 0,
      latencyMs: Date.now() - startTime,
      citations: [],
      shouldHandoff: true,
    };
  }
}

/**
 * Build context string from retrieved chunks
 */
function buildContext(
  chunks: { metadata: VectorMetadata; score: number }[]
): string {
  if (chunks.length === 0) {
    return '';
  }
  
  // Group chunks by document for better context
  const chunksByDoc = new Map<string, { title: string; chunks: string[]; score: number }>();
  
  for (const chunk of chunks) {
    const docId = chunk.metadata.documentId;
    if (!chunksByDoc.has(docId)) {
      chunksByDoc.set(docId, {
        title: chunk.metadata.documentTitle,
        chunks: [],
        score: chunk.score,
      });
    }
    chunksByDoc.get(docId)!.chunks.push(chunk.metadata.content);
  }
  
  // Build formatted context
  const contextParts: string[] = [];
  
  chunksByDoc.forEach((doc, docId) => {
    contextParts.push(`## From "${doc.title}" (relevance: ${(doc.score * 100).toFixed(0)}%)\n`);
    contextParts.push(doc.chunks.join('\n\n'));
    contextParts.push('\n---\n');
  });
  
  return contextParts.join('\n');
}

/**
 * Store a query and its response for analytics
 */
export async function logQuery(
  tenantId: string,
  conversationId: string,
  query: string,
  result: RAGQueryResult
): Promise<void> {
  // Store citations in the database
  const message = await prisma.message.findFirst({
    where: {
      conversationId,
      direction: 'OUTBOUND',
    },
    orderBy: { createdAt: 'desc' },
  });
  
  if (message && result.citations.length > 0) {
    for (const citation of result.citations) {
      await prisma.citation.create({
        data: {
          messageId: message.id,
          chunkId: citation.chunkId,
          snippet: citation.snippet,
        },
      });
    }
  }
}

/**
 * Get similar questions that have been asked before
 */
export async function getSimilarQuestions(
  tenantId: string,
  query: string,
  limit: number = 5
): Promise<{ question: string; count: number }[]> {
  // This would require storing question embeddings
  // For now, return empty array - can be implemented later
  return [];
}

/**
 * Get agent configuration for a tenant
 */
export async function getAgentConfig(tenantId: string): Promise<{
  systemPrompt: string;
  temperature: number;
  model: string;
  confidenceThreshold: number;
  fallbackMessage: string;
} | null> {
  const agent = await prisma.agent.findFirst({
    where: { tenantId, isActive: true },
  });
  
  if (!agent) {
    return null;
  }
  
  return {
    systemPrompt: agent.systemPrompt,
    temperature: agent.temperature,
    model: agent.model,
    confidenceThreshold: agent.confidenceThreshold,
    fallbackMessage: agent.fallbackMessage || "I'm not sure about that. Let me connect you with someone who can help.",
  };
}
