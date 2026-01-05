import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
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

// GET /api/workspaces - Get all workspaces for user
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all workspaces user is a member of
    // Note: Using simple query to support databases without ownerId column
    const allWorkspaces = await prisma.tenant.findMany({
      where: {
        users: {
          some: {
            id: user.userId,
          },
        },
      },
      include: {
        _count: {
          select: { agents: true, users: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mark current workspace - treat first workspace as "owner" for now
    const workspaces = allWorkspaces.map((w, index) => ({ 
      ...w, 
      isOwner: index === 0 || w.id === user.tenantId, 
      isCurrent: w.id === user.tenantId 
    }));

    return NextResponse.json({ 
      workspaces,
      currentWorkspaceId: user.tenantId,
    });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspaces' },
      { status: 500 }
    );
  }
}

// POST /api/workspaces - Create new workspace
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 });
    }

    // Count user's workspaces (limit to prevent abuse)
    const workspaceCount = await prisma.tenant.count({
      where: { ownerId: user.userId },
    });

    const MAX_WORKSPACES = 10;
    if (workspaceCount >= MAX_WORKSPACES) {
      return NextResponse.json(
        { error: `Maximum of ${MAX_WORKSPACES} workspaces allowed` },
        { status: 400 }
      );
    }

    // Generate unique slug from name
    const baseSlug = body.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const timestamp = Date.now().toString(36);
    const slug = `${baseSlug}-${timestamp}`;

    // Create workspace
    const workspace = await prisma.tenant.create({
      data: {
        name: body.name.trim(),
        slug,
        ownerId: user.userId,
        tokenBalance: 1000, // Free starting tokens
        users: {
          connect: { id: user.userId },
        },
      },
    });

    // Create default agent
    await prisma.agent.create({
      data: {
        tenantId: workspace.id,
        name: 'Assistant',
        systemPrompt: 'You are a helpful AI assistant.',
        tone: 'professional',
        temperature: 0.7,
        model: 'gpt-4o-mini',
        maxTokens: 1024,
        confidenceThreshold: 0.7,
        isActive: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'workspace.create',
        entity: 'Tenant',
        entityId: workspace.id,
        newValues: { name: workspace.name },
        tenantId: workspace.id,
        userId: user.userId,
      },
    });

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    console.error('Error creating workspace:', error);
    return NextResponse.json(
      { error: 'Failed to create workspace' },
      { status: 500 }
    );
  }
}

// PUT /api/workspaces - Switch to a different workspace
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const workspaceId = body.workspaceId;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    // Verify user has access to workspace
    const workspace = await prisma.tenant.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: user.userId },
          { users: { some: { id: user.userId } } },
        ],
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Get user's role in the workspace (owner has OWNER role, others have their current role)
    const role = workspace.ownerId === user.userId ? 'OWNER' : user.role;

    // Issue new JWT with updated tenantId
    const newToken = await new SignJWT({
      userId: user.userId,
      email: user.email,
      tenantId: workspaceId,
      role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('auth-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({ 
      success: true, 
      workspace,
      role,
    });
  } catch (error) {
    console.error('Error switching workspace:', error);
    return NextResponse.json(
      { error: 'Failed to switch workspace' },
      { status: 500 }
    );
  }
}

// PATCH /api/workspaces - Update workspace name
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const workspaceId = body.workspaceId || user.tenantId;

    // Verify user is owner
    const workspace = await prisma.tenant.findFirst({
      where: {
        id: workspaceId,
        ownerId: user.userId,
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found or not owner' }, { status: 404 });
    }

    const updated = await prisma.tenant.update({
      where: { id: workspaceId },
      data: {
        name: body.name?.trim() || workspace.name,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ workspace: updated });
  } catch (error) {
    console.error('Error updating workspace:', error);
    return NextResponse.json(
      { error: 'Failed to update workspace' },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces - Delete a workspace
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('id');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    // Cannot delete current workspace
    if (workspaceId === user.tenantId) {
      return NextResponse.json(
        { error: 'Cannot delete current workspace. Switch to another workspace first.' },
        { status: 400 }
      );
    }

    // Verify user is owner
    const workspace = await prisma.tenant.findFirst({
      where: {
        id: workspaceId,
        ownerId: user.userId,
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found or not owner' }, { status: 404 });
    }

    // Check user has at least one other workspace
    const otherWorkspaces = await prisma.tenant.count({
      where: {
        ownerId: user.userId,
        NOT: { id: workspaceId },
      },
    });

    if (otherWorkspaces === 0) {
      return NextResponse.json(
        { error: 'Cannot delete your only workspace' },
        { status: 400 }
      );
    }

    // Delete workspace (cascade will handle related records)
    await prisma.tenant.delete({
      where: { id: workspaceId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return NextResponse.json(
      { error: 'Failed to delete workspace' },
      { status: 500 }
    );
  }
}
