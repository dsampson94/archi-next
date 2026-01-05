import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

async function verifyAdmin(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    // Only OWNER role can access admin
    if (payload.role !== 'OWNER') {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// GET - Get single tenant details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        agents: {
          select: {
            id: true,
            name: true,
            isActive: true,
            createdAt: true,
          },
        },
        whatsappNumbers: {
          select: {
            id: true,
            phoneNumber: true,
            displayName: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            users: true,
            documents: true,
            conversations: true,
            agents: true,
            knowledgeBases: true,
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Get usage stats for this tenant
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [messagesThisMonth, totalMessages, documentsSize] = await Promise.all([
      prisma.message.count({
        where: {
          conversation: { tenantId: id },
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.message.count({
        where: { conversation: { tenantId: id } },
      }),
      prisma.document.aggregate({
        where: { tenantId: id },
        _sum: { fileSize: true },
      }),
    ]);

    return NextResponse.json({
      tenant: {
        ...tenant,
        createdAt: tenant.createdAt.toISOString(),
        updatedAt: tenant.updatedAt.toISOString(),
        trialEndsAt: tenant.trialEndsAt?.toISOString(),
      },
      usage: {
        messagesThisMonth,
        totalMessages,
        documentsSize: documentsSize._sum?.fileSize || 0,
        maxDocuments: tenant.maxDocuments,
        maxMessages: tenant.maxMessages,
      },
    });
  } catch (error) {
    console.error('[Admin Get Tenant] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenant' },
      { status: 500 }
    );
  }
}

// PATCH - Update tenant
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, slug, plan, status, maxDocuments, maxMessages, trialEndsAt } = body;

    // Check if slug is taken by another tenant
    if (slug) {
      const existing = await prisma.tenant.findFirst({
        where: { slug, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'Slug already taken' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (plan !== undefined) updateData.plan = plan;
    if (status !== undefined) updateData.status = status;
    if (maxDocuments !== undefined) updateData.maxDocuments = maxDocuments;
    if (maxMessages !== undefined) updateData.maxMessages = maxMessages;
    if (trialEndsAt !== undefined) updateData.trialEndsAt = trialEndsAt ? new Date(trialEndsAt) : null;

    const tenant = await prisma.tenant.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error('[Admin Update Tenant] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update tenant' },
      { status: 500 }
    );
  }
}

// DELETE - Delete tenant (with all related data)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Delete tenant - cascades will handle related data
    await prisma.tenant.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin Delete Tenant] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete tenant' },
      { status: 500 }
    );
  }
}
