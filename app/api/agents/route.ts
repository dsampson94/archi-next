import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/app/lib/prisma';
import { MODEL_PRICING } from '@/app/lib/pricing';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

interface JWTPayload {
  userId: string;
  email: string;
  tenantId: string;
  role: string;
}

async function getAuthUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

// GET /api/agents - Get ALL agents for workspace (supports multiple bots)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('id');

    // If specific agent requested
    if (agentId) {
      const agent = await prisma.agent.findFirst({
        where: {
          id: agentId,
          tenantId: user.tenantId,
        },
        include: {
          knowledgeBases: {
            select: { id: true, name: true },
          },
          _count: {
            select: { conversations: true },
          },
        },
      });

      if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }

      return NextResponse.json({ agent });
    }

    // Get all agents for workspace
    const agents = await prisma.agent.findMany({
      where: {
        tenantId: user.tenantId,
      },
      include: {
        knowledgeBases: {
          select: { id: true, name: true },
        },
        _count: {
          select: { conversations: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Also return the first/default agent for backwards compatibility
    const agent = agents.length > 0 ? agents[0] : null;

    // Include available models
    const availableModels = Object.entries(MODEL_PRICING).map(([id, info]) => ({
      id,
      label: info.label,
      provider: info.provider,
      inputCost: info.input,
      outputCost: info.output,
    }));

    return NextResponse.json({ agents, agent, availableModels });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

// POST /api/agents - Create a NEW agent
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can create agents
    if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Count existing agents
    const agentCount = await prisma.agent.count({
      where: { tenantId: user.tenantId },
    });

    // Validate model
    const modelId = body.model || 'gpt-4o-mini';
    if (!MODEL_PRICING[modelId as keyof typeof MODEL_PRICING]) {
      return NextResponse.json({ error: 'Invalid model selected' }, { status: 400 });
    }

    const agent = await prisma.agent.create({
      data: {
        tenantId: user.tenantId,
        name: body.name || `Bot ${agentCount + 1}`,
        description: body.description,
        systemPrompt: body.systemPrompt || 'You are a helpful AI assistant.',
        responseRules: body.responseRules,
        tone: body.tone || 'professional',
        temperature: body.temperature ?? 0.7,
        provider: body.provider || 'OPENAI',
        model: modelId,
        maxTokens: body.maxTokens ?? 1024,
        confidenceThreshold: body.confidenceThreshold ?? 0.7,
        handoffMessage: body.handoffMessage,
        greeting: body.greeting,
        greetingMessage: body.greetingMessage,
        isActive: body.isActive ?? true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'agent.create',
        entity: 'Agent',
        entityId: agent.id,
        newValues: { name: agent.name, model: agent.model },
        tenantId: user.tenantId,
        userId: user.userId,
      },
    });

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}

// PUT /api/agents - Update an existing agent
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can update agents
    if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const agentId = body.id;

    // Validate model if provided
    if (body.model && !MODEL_PRICING[body.model as keyof typeof MODEL_PRICING]) {
      return NextResponse.json({ error: 'Invalid model selected' }, { status: 400 });
    }

    // If no ID provided, update first agent (backwards compatibility)
    let existingAgent;
    if (agentId) {
      existingAgent = await prisma.agent.findFirst({
        where: { id: agentId, tenantId: user.tenantId },
      });
    } else {
      existingAgent = await prisma.agent.findFirst({
        where: { tenantId: user.tenantId },
      });
    }

    if (!existingAgent) {
      // Create if doesn't exist
      const agent = await prisma.agent.create({
        data: {
          tenantId: user.tenantId,
          name: body.name || 'Archi Assistant',
          description: body.description,
          systemPrompt: body.systemPrompt || 'You are a helpful AI assistant.',
          responseRules: body.responseRules,
          tone: body.tone || 'professional',
          temperature: body.temperature ?? 0.7,
          provider: body.provider || 'OPENAI',
          model: body.model || 'gpt-4o-mini',
          maxTokens: body.maxTokens ?? 1024,
          confidenceThreshold: body.confidenceThreshold ?? 0.7,
          handoffMessage: body.handoffMessage,
          greeting: body.greeting,
          greetingMessage: body.greetingMessage,
          isActive: true,
        },
      });
      return NextResponse.json({ agent }, { status: 201 });
    }

    const oldValues = {
      name: existingAgent.name,
      model: existingAgent.model,
      provider: existingAgent.provider,
    };

    const agent = await prisma.agent.update({
      where: { id: existingAgent.id },
      data: {
        name: body.name ?? existingAgent.name,
        description: body.description ?? existingAgent.description,
        systemPrompt: body.systemPrompt ?? existingAgent.systemPrompt,
        responseRules: body.responseRules ?? existingAgent.responseRules,
        tone: body.tone ?? existingAgent.tone,
        temperature: body.temperature ?? existingAgent.temperature,
        provider: body.provider ?? existingAgent.provider,
        model: body.model ?? existingAgent.model,
        maxTokens: body.maxTokens ?? existingAgent.maxTokens,
        confidenceThreshold: body.confidenceThreshold ?? existingAgent.confidenceThreshold,
        handoffMessage: body.handoffMessage ?? existingAgent.handoffMessage,
        greeting: body.greeting ?? existingAgent.greeting,
        greetingMessage: body.greetingMessage ?? existingAgent.greetingMessage,
        isActive: body.isActive ?? existingAgent.isActive,
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'agent.update',
        entity: 'Agent',
        entityId: agent.id,
        oldValues,
        newValues: { name: agent.name, model: agent.model, provider: agent.provider },
        tenantId: user.tenantId,
        userId: user.userId,
      },
    });

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    );
  }
}

// DELETE /api/agents - Delete an agent
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete agents
    if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('id');

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
    }

    // Verify agent belongs to tenant
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, tenantId: user.tenantId },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Check if it's the last agent
    const agentCount = await prisma.agent.count({
      where: { tenantId: user.tenantId },
    });

    if (agentCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last agent. Create another agent first.' },
        { status: 400 }
      );
    }

    // Delete the agent
    await prisma.agent.delete({
      where: { id: agentId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'agent.delete',
        entity: 'Agent',
        entityId: agentId,
        oldValues: { name: agent.name, model: agent.model },
        tenantId: user.tenantId,
        userId: user.userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { error: 'Failed to delete agent' },
      { status: 500 }
    );
  }
}
