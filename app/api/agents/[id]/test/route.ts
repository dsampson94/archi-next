import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { testAgentQuery, getAgentWithKnowledgeBases } from '@/app/lib/agent-rag';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

async function validateAuth(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * POST /api/agents/[id]/test - Test chat with an agent
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await validateAuth();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Verify agent belongs to tenant
    const agent = await getAgentWithKnowledgeBases(params.id);
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Query the agent
    const result = await testAgentQuery(auth.tenantId, params.id, message);

    return NextResponse.json({
      success: true,
      response: result.content,
      confidence: result.confidence,
      model: result.model,
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs,
      citations: result.citations,
      shouldHandoff: result.shouldHandoff,
      agentName: result.agentName,
    });
  } catch (error) {
    console.error('Error testing agent:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents/[id]/test - Get agent info for test panel
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await validateAuth();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const agent = await getAgentWithKnowledgeBases(params.id);
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      agent: {
        id: agent.id,
        name: agent.name,
        model: agent.model,
        provider: agent.provider,
        greeting: agent.greeting,
        knowledgeBaseCount: agent.knowledgeBaseIds.length,
      },
    });
  } catch (error) {
    console.error('Error fetching agent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent' },
      { status: 500 }
    );
  }
}
