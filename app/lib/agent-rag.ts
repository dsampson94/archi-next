/**
 * Agent-aware RAG system
 * - Queries only the agent's linked knowledge bases
 * - Uses the agent's configured LLM model
 * - Saves conversations for future learning
 */

import { prisma } from '@/app/lib/prisma';
import { generateEmbedding, generateChatCompletion, calculateConfidence } from '@/app/lib/openai';
import { queryVectors } from '@/app/lib/pinecone';
import { processDocument } from '@/app/lib/document-processor';

export interface AgentConfig {
  id: string;
  name: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  model: string;
  provider: string;
  confidenceThreshold: number;
  fallbackMessage: string;
  greeting: string | null;
  knowledgeBaseIds: string[];
}

export interface AgentQueryResult {
  content: string;
  confidence: number;
  tokensUsed: number;
  latencyMs: number;
  model: string;
  citations: {
    documentId: string;
    documentTitle: string;
    chunkId: string;
    snippet: string;
    score: number;
  }[];
  shouldHandoff: boolean;
}

/**
 * Get full agent configuration including linked knowledge bases
 */
export async function getAgentWithKnowledgeBases(agentId: string): Promise<AgentConfig | null> {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      knowledgeBases: {
        select: { id: true },
      },
    },
  });

  if (!agent) {
    return null;
  }

  return {
    id: agent.id,
    name: agent.name,
    systemPrompt: agent.systemPrompt,
    temperature: agent.temperature,
    maxTokens: agent.maxTokens,
    model: agent.model,
    provider: agent.provider,
    confidenceThreshold: agent.confidenceThreshold,
    fallbackMessage: agent.fallbackMessage || "I'm not sure about that. Let me connect you with someone who can help.",
    greeting: agent.greeting,
    knowledgeBaseIds: agent.knowledgeBases.map((kb) => kb.id),
  };
}

/**
 * Get default/first active agent for a tenant
 */
export async function getDefaultAgent(tenantId: string): Promise<AgentConfig | null> {
  const agent = await prisma.agent.findFirst({
    where: { tenantId, isActive: true },
    include: {
      knowledgeBases: {
        select: { id: true },
      },
    },
  });

  if (!agent) {
    return null;
  }

  return {
    id: agent.id,
    name: agent.name,
    systemPrompt: agent.systemPrompt,
    temperature: agent.temperature,
    maxTokens: agent.maxTokens,
    model: agent.model,
    provider: agent.provider,
    confidenceThreshold: agent.confidenceThreshold,
    fallbackMessage: agent.fallbackMessage || "I'm not sure about that. Let me connect you with someone who can help.",
    greeting: agent.greeting,
    knowledgeBaseIds: agent.knowledgeBases.map((kb) => kb.id),
  };
}

/**
 * Query the agent's knowledge base and generate a response
 */
export async function queryAgent(
  tenantId: string,
  agentId: string,
  query: string,
  conversationId?: string
): Promise<AgentQueryResult> {
  const startTime = Date.now();

  // Get agent configuration
  const agent = await getAgentWithKnowledgeBases(agentId);
  if (!agent) {
    throw new Error(`Agent ${agentId} not found`);
  }

  console.log(`[AgentRAG] Query for agent "${agent.name}" (model: ${agent.model}): "${query.slice(0, 100)}..."`);

  try {
    // Step 1: Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Step 2: Build filter for agent's knowledge bases
    let filter: Record<string, unknown> | undefined;
    if (agent.knowledgeBaseIds.length > 0) {
      filter = {
        knowledgeBaseId: { $in: agent.knowledgeBaseIds },
      };
      console.log(`[AgentRAG] Filtering by ${agent.knowledgeBaseIds.length} knowledge bases`);
    }

    // Step 3: Search Pinecone for similar chunks (filtered by KB)
    const vectorResults = await queryVectors(tenantId, queryEmbedding, 5, filter);

    console.log(`[AgentRAG] Found ${vectorResults.length} relevant chunks`);

    // Step 4: Check if we have relevant context
    const relevantChunks = vectorResults.filter((r) => r.score > 0.5);
    const hasRelevantContext = relevantChunks.length > 0;

    // Step 5: Build context from chunks
    const context = buildContext(relevantChunks);

    // Step 6: Generate response using agent's configured LLM
    const llmResponse = await generateChatCompletion(
      agent.systemPrompt,
      query,
      context || 'No relevant documents found in the knowledge base.',
      {
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        model: agent.model,
      }
    );

    // Step 7: Calculate confidence
    const similarityScores = relevantChunks.map((r) => r.score);
    const confidence = calculateConfidence(similarityScores, hasRelevantContext);

    // Step 8: Build citations
    const citations = relevantChunks.map((chunk) => ({
      documentId: chunk.metadata.documentId,
      documentTitle: chunk.metadata.documentTitle,
      chunkId: chunk.metadata.chunkId,
      snippet: chunk.metadata.content.slice(0, 200) + '...',
      score: chunk.score,
    }));

    const latencyMs = Date.now() - startTime;

    console.log(`[AgentRAG] Response generated in ${latencyMs}ms, confidence: ${confidence.toFixed(2)}, model: ${agent.model}`);

    const result: AgentQueryResult = {
      content: llmResponse.content,
      confidence,
      tokensUsed: llmResponse.tokensUsed,
      latencyMs,
      model: agent.model,
      citations,
      shouldHandoff: confidence < agent.confidenceThreshold,
    };

    // Step 9: Save conversation exchange for learning (async, don't wait)
    if (conversationId) {
      saveConversationForLearning(tenantId, agentId, query, result).catch((err) =>
        console.error('[AgentRAG] Failed to save conversation for learning:', err)
      );
    }

    return result;
  } catch (error) {
    console.error('[AgentRAG] Error processing query:', error);

    return {
      content: "I'm sorry, I encountered an error while processing your question. Please try again or contact support if the issue persists.",
      confidence: 0,
      tokensUsed: 0,
      latencyMs: Date.now() - startTime,
      model: agent.model,
      citations: [],
      shouldHandoff: true,
    };
  }
}

/**
 * Build context string from retrieved chunks
 */
function buildContext(
  chunks: { metadata: { documentId: string; documentTitle: string; content: string }; score: number }[]
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

  chunksByDoc.forEach((doc) => {
    contextParts.push(`## From "${doc.title}" (relevance: ${(doc.score * 100).toFixed(0)}%)\n`);
    contextParts.push(doc.chunks.join('\n\n'));
    contextParts.push('\n---\n');
  });

  return contextParts.join('\n');
}

/**
 * Save conversation Q&A to a document for future learning
 * This creates a .txt document that gets processed and added to the KB
 */
async function saveConversationForLearning(
  tenantId: string,
  agentId: string,
  question: string,
  result: AgentQueryResult
): Promise<void> {
  // Only save high-confidence responses (agent learned something useful)
  if (result.confidence < 0.7) {
    return;
  }

  // Get the agent's primary knowledge base
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      knowledgeBases: {
        take: 1,
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!agent || agent.knowledgeBases.length === 0) {
    console.log('[AgentRAG] No knowledge base to save conversation to');
    return;
  }

  const knowledgeBaseId = agent.knowledgeBases[0].id;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // Create Q&A content
  const content = `# Conversation Log - ${new Date().toLocaleString()}

## Question
${question}

## Answer
${result.content}

## Metadata
- Confidence: ${(result.confidence * 100).toFixed(1)}%
- Model: ${result.model}
- Citations: ${result.citations.map((c) => c.documentTitle).join(', ') || 'None'}
`;

  // Create document record
  const document = await prisma.document.create({
    data: {
      title: `Q&A: ${question.slice(0, 50)}...`,
      description: 'Auto-saved conversation for knowledge building',
      fileName: `conversation-${timestamp}.txt`,
      fileType: 'TXT',
      fileSize: Buffer.byteLength(content, 'utf8'),
      rawContent: content,
      status: 'PENDING',
      tenantId,
      knowledgeBaseId,
      tags: ['conversation', 'auto-generated', 'qa'],
    },
  });

  console.log(`[AgentRAG] Saved conversation as document ${document.id} for learning`);

  // Process the document (generate embeddings and store in Pinecone)
  processDocument(document.id).catch((err) =>
    console.error(`[AgentRAG] Failed to process conversation document ${document.id}:`, err)
  );
}

/**
 * Test an agent with a query (for the test panel)
 */
export async function testAgentQuery(
  tenantId: string,
  agentId: string,
  query: string
): Promise<AgentQueryResult & { agentName: string }> {
  const agent = await getAgentWithKnowledgeBases(agentId);
  if (!agent) {
    throw new Error(`Agent ${agentId} not found`);
  }

  const result = await queryAgent(tenantId, agentId, query);

  return {
    ...result,
    agentName: agent.name,
  };
}
