import { Pinecone, RecordMetadata } from '@pinecone-database/pinecone';

// Lazy-initialized Pinecone client
let pineconeInstance: Pinecone | null = null;

function getPinecone(): Pinecone {
  if (!pineconeInstance) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error('PINECONE_API_KEY environment variable is not set');
    }
    pineconeInstance = new Pinecone({ apiKey });
  }
  return pineconeInstance;
}

// Get the index for document embeddings
export const getIndex = () => {
  const indexName = process.env.PINECONE_INDEX || 'archi-docs';
  return getPinecone().index(indexName);
};

// Namespace format: tenant_{tenantId}
export const getTenantNamespace = (tenantId: string) => `tenant_${tenantId}`;

export interface VectorMetadata extends RecordMetadata {
  documentId: string;
  chunkId: string;
  chunkIndex: number;
  content: string;
  documentTitle: string;
  pageNumber?: number;
  tenantId: string;
  knowledgeBaseId?: string;
  [key: string]: any;
}

export interface UpsertVectorParams {
  id: string;
  values: number[];
  metadata: VectorMetadata;
}

/**
 * Upsert vectors to Pinecone for a specific tenant
 */
export async function upsertVectors(
  tenantId: string,
  vectors: UpsertVectorParams[]
): Promise<void> {
  const index = getIndex();
  const namespace = getTenantNamespace(tenantId);
  
  // Pinecone recommends batches of 100
  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await index.namespace(namespace).upsert(batch);
  }
  
  console.log(`[Pinecone] Upserted ${vectors.length} vectors for tenant ${tenantId}`);
}

/**
 * Query similar vectors from Pinecone
 */
export async function queryVectors(
  tenantId: string,
  queryVector: number[],
  topK: number = 5,
  filter?: Record<string, unknown>
): Promise<{
  id: string;
  score: number;
  metadata: VectorMetadata;
}[]> {
  const index = getIndex();
  const namespace = getTenantNamespace(tenantId);
  
  const results = await index.namespace(namespace).query({
    vector: queryVector,
    topK,
    includeMetadata: true,
    filter,
  });
  
  // Cast matches to unknown first to work around strict typing
  const matches = results.matches || [];
  return matches.map((match: unknown) => {
    const m = match as { id?: string; score?: number; metadata?: RecordMetadata };
    return {
      id: m.id || '',
      score: m.score || 0,
      metadata: (m.metadata || {}) as VectorMetadata,
    };
  });
}

/**
 * Delete vectors for a specific document
 */
export async function deleteDocumentVectors(
  tenantId: string,
  documentId: string
): Promise<void> {
  const index = getIndex();
  const namespace = getTenantNamespace(tenantId);
  
  // Delete by metadata filter
  await index.namespace(namespace).deleteMany({
    documentId: { $eq: documentId },
  });
  
  console.log(`[Pinecone] Deleted vectors for document ${documentId}`);
}

/**
 * Delete all vectors for a tenant
 */
export async function deleteTenantVectors(tenantId: string): Promise<void> {
  const index = getIndex();
  const namespace = getTenantNamespace(tenantId);
  
  await index.namespace(namespace).deleteAll();
  
  console.log(`[Pinecone] Deleted all vectors for tenant ${tenantId}`);
}
