/**
 * Archi RAG Services
 * 
 * This module exports all the services needed for the RAG pipeline:
 * - Pinecone: Vector database for semantic search
 * - OpenAI: Embeddings and chat completions  
 * - Document Processor: Parse, chunk, and embed documents
 * - RAG: Query processing and response generation
 */

// Pinecone vector database
export {
  getIndex,
  getTenantNamespace,
  upsertVectors,
  queryVectors,
  deleteDocumentVectors,
  deleteTenantVectors,
  type VectorMetadata,
  type UpsertVectorParams,
} from './pinecone';

// OpenAI services
export {
  generateEmbedding,
  generateEmbeddings,
  generateChatCompletion,
  transcribeAudio,
  calculateConfidence,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
} from './openai';

// Document processing
export {
  processDocument,
  extractTextFromBuffer,
  reprocessTenantDocuments,
  type ProcessDocumentResult,
} from './document-processor';

// RAG query service
export {
  queryRAG,
  logQuery,
  getSimilarQuestions,
  getAgentConfig,
  type RAGQueryResult,
  type RAGQueryOptions,
} from './rag';

// Prisma database
export { prisma } from './prisma';
