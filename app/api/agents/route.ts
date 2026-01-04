import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/app/lib/prisma';

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

// GET /api/agents - Get agent for tenant
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agent = await prisma.agent.findFirst({
      where: {
        tenantId: user.tenantId,
      },
    });

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Error fetching agent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent' },
      { status: 500 }
    );
  }
}

// POST /api/agents - Create agent
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can create/update agents
    if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Check if agent already exists
    const existingAgent = await prisma.agent.findFirst({
      where: { tenantId: user.tenantId },
    });

    if (existingAgent) {
      return NextResponse.json(
        { error: 'Agent already exists. Use PUT to update.' },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.create({
      data: {
        tenantId: user.tenantId,
        name: body.name || 'Archi Assistant',
        systemPrompt: body.systemPrompt,
        responseRules: body.responseRules,
        tone: body.tone,
        confidenceThreshold: body.confidenceThreshold ?? 0.7,
        handoffMessage: body.handoffMessage,
        greeting: body.greeting,
        isActive: true,
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

// PUT /api/agents - Update agent
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

    // Find existing agent
    const existingAgent = await prisma.agent.findFirst({
      where: { tenantId: user.tenantId },
    });

    if (!existingAgent) {
      // Create if doesn't exist
      const agent = await prisma.agent.create({
        data: {
          tenantId: user.tenantId,
          name: body.name || 'Archi Assistant',
          systemPrompt: body.systemPrompt,
          responseRules: body.responseRules,
          tone: body.tone,
          confidenceThreshold: body.confidenceThreshold ?? 0.7,
          handoffMessage: body.handoffMessage,
          greeting: body.greeting,
          isActive: true,
        },
      });
      return NextResponse.json({ agent }, { status: 201 });
    }

    const agent = await prisma.agent.update({
      where: { id: existingAgent.id },
      data: {
        name: body.name,
        systemPrompt: body.systemPrompt,
        responseRules: body.responseRules,
        tone: body.tone,
        confidenceThreshold: body.confidenceThreshold,
        handoffMessage: body.handoffMessage,
        greeting: body.greeting,
        isActive: body.isActive ?? existingAgent.isActive,
        updatedAt: new Date(),
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
