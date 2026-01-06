import { getOpenAI } from '@/app/lib/openai';
import { pdf } from 'pdf-to-img';

/**
 * GPT-4 Vision Document Processor
 * Converts document pages to images and uses GPT-4 Vision to extract ALL content
 * including text, images, charts, tables, and layouts
 */

const MAX_PAGES = 20; // Limit pages to process (cost control)

interface PageContent {
  pageNumber: number;
  content: string;
  hasImages: boolean;
  hasCharts: boolean;
  hasTables: boolean;
}

export interface VisionProcessResult {
  success: boolean;
  content: string;
  pages: PageContent[];
  error?: string;
}

/**
 * Process a PDF using GPT-4 Vision
 * Converts each page to an image and extracts all content including images/charts
 */
export async function processWithVision(
  buffer: Buffer,
  fileType: string,
  documentTitle: string
): Promise<VisionProcessResult> {
  console.log(`[VisionProcessor] Starting vision processing for ${documentTitle}`);
  
  try {
    if (fileType !== 'PDF') {
      // For non-PDFs, return simple text extraction indicator
      return {
        success: false,
        content: '',
        pages: [],
        error: 'Vision processing only supports PDF files currently',
      };
    }
    
    // Convert PDF pages to images
    const pages: PageContent[] = [];
    let pageCount = 0;
    
    // pdf-to-img returns an async generator
    const pdfDocument = await pdf(buffer, { scale: 2.0 }); // Higher scale for better quality
    
    for await (const pageImage of pdfDocument) {
      pageCount++;
      
      if (pageCount > MAX_PAGES) {
        console.log(`[VisionProcessor] Reached max pages limit (${MAX_PAGES})`);
        break;
      }
      
      console.log(`[VisionProcessor] Processing page ${pageCount}`);
      
      // Convert to base64
      const base64Image = pageImage.toString('base64');
      
      // Send to GPT-4 Vision
      const pageContent = await extractPageContent(base64Image, pageCount, documentTitle);
      pages.push(pageContent);
    }
    
    // Combine all page contents
    const fullContent = pages
      .map((p) => `--- Page ${p.pageNumber} ---\n${p.content}`)
      .join('\n\n');
    
    console.log(`[VisionProcessor] Processed ${pages.length} pages, total content: ${fullContent.length} chars`);
    
    return {
      success: true,
      content: fullContent,
      pages,
    };
  } catch (error) {
    console.error(`[VisionProcessor] Error:`, error);
    return {
      success: false,
      content: '',
      pages: [],
      error: error instanceof Error ? error.message : 'Vision processing failed',
    };
  }
}

/**
 * Extract content from a single page image using GPT-4 Vision
 */
async function extractPageContent(
  base64Image: string,
  pageNumber: number,
  documentTitle: string
): Promise<PageContent> {
  const openai = getOpenAI();
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o', // GPT-4 Vision model
    max_tokens: 4096,
    messages: [
      {
        role: 'system',
        content: `You are a document analysis expert. Extract ALL content from this document page comprehensively.

Your task:
1. Extract ALL text exactly as written (preserve formatting, lists, tables)
2. Describe ALL images, diagrams, charts, and graphics in detail
3. Describe any tables with their structure and data
4. Note any logos, signatures, or visual elements
5. Preserve the logical reading order

Format your response as clean, searchable text that captures everything on the page.
For images/charts, describe them like: [IMAGE: Description of what the image shows]
For tables, format them clearly with headers and data.

Be thorough - this text will be used to answer questions about the document.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Extract all content from page ${pageNumber} of "${documentTitle}". Include every detail visible on the page.`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${base64Image}`,
              detail: 'high',
            },
          },
        ],
      },
    ],
  });
  
  const content = response.choices[0]?.message?.content || '';
  
  // Analyze content for metadata
  const hasImages = content.toLowerCase().includes('[image:') || 
                    content.toLowerCase().includes('image shows') ||
                    content.toLowerCase().includes('diagram') ||
                    content.toLowerCase().includes('photo');
  const hasCharts = content.toLowerCase().includes('chart') || 
                    content.toLowerCase().includes('graph') ||
                    content.toLowerCase().includes('plot');
  const hasTables = content.toLowerCase().includes('table') ||
                    content.includes('|') ||
                    content.toLowerCase().includes('column');
  
  return {
    pageNumber,
    content,
    hasImages,
    hasCharts,
    hasTables,
  };
}

/**
 * Quick check if a document would benefit from vision processing
 */
export function shouldUseVision(fileType: string): boolean {
  // PDFs often have images, charts, complex layouts
  return fileType === 'PDF';
}
