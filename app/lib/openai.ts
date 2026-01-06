import OpenAI from 'openai';

// Lazy-initialized OpenAI client
let openaiInstance: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiInstance = new OpenAI({ apiKey });
  }
  return openaiInstance;
}

// Embedding model - text-embedding-3-small is cost-effective and performant
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAI();
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  });
  
  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in batch
 * OpenAI supports up to 2048 texts per batch
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  
  // Process in batches of 100 for reliability
  const batchSize = 100;
  const allEmbeddings: number[][] = [];
  
  const openai = getOpenAI();
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
      dimensions: EMBEDDING_DIMENSIONS,
    });
    
    // Sort by index to maintain order
    const sorted = response.data.sort((a: { index: number }, b: { index: number }) => a.index - b.index);
    allEmbeddings.push(...sorted.map((d: { embedding: number[] }) => d.embedding));
  }
  
  return allEmbeddings;
}

/**
 * Chat completion for RAG responses
 */
export async function generateChatCompletion(
  systemPrompt: string,
  userMessage: string,
  context: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  }
): Promise<{
  content: string;
  tokensUsed: number;
  model: string;
}> {
  const openai = getOpenAI();
  const model = options?.model || 'gpt-4-turbo-preview';
  
  const response = await openai.chat.completions.create({
    model,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 1024,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Context from company documents:
---
${context}
---

User question: ${userMessage}

Instructions:
- Answer based ONLY on the context provided above
- If the context doesn't contain relevant information, say so honestly
- Be concise and direct
- Cite specific documents when possible`,
      },
    ],
  });
  
  return {
    content: response.choices[0]?.message?.content || 'I could not generate a response.',
    tokensUsed: response.usage?.total_tokens || 0,
    model: response.model,
  };
}

/**
 * Transcribe audio using Whisper
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string = 'audio.ogg'
): Promise<string> {
  const openai = getOpenAI();
  // Create a File object from the buffer using Uint8Array
  const uint8Array = new Uint8Array(audioBuffer);
  const file = new File([uint8Array], filename, { type: 'audio/ogg' });
  
  const response = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file,
    language: 'en', // Can be made dynamic based on tenant settings
  });
  
  return response.text;
}

/**
 * Calculate confidence score based on similarity scores and response
 */
export function calculateConfidence(
  similarityScores: number[],
  hasRelevantContext: boolean
): number {
  if (!hasRelevantContext || similarityScores.length === 0) {
    return 0.3; // Low confidence when no relevant context
  }
  
  // Average of top similarity scores, weighted by relevance
  const avgScore = similarityScores.reduce((a, b) => a + b, 0) / similarityScores.length;
  
  // Scale to 0-1 range (Pinecone scores are typically 0.5-1.0 for relevant matches)
  const normalizedScore = Math.min(1, Math.max(0, (avgScore - 0.5) * 2));
  
  // Boost confidence if we have multiple relevant chunks
  const countBonus = Math.min(0.1, similarityScores.length * 0.02);
  
  return Math.min(1, normalizedScore + countBonus);
}

export { EMBEDDING_MODEL, EMBEDDING_DIMENSIONS };
