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

// GET /api/conversations - List conversations
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {
      tenantId: user.tenantId,
    };

    if (filter === 'active') {
      where.isHandedOff = false;
      where.status = 'ACTIVE';
    } else if (filter === 'handed-off') {
      where.isHandedOff = true;
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { messages: true },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true },
          },
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    return NextResponse.json({
      conversations: conversations.map((c) => ({
        id: c.id,
        externalUserId: c.externalUserId,
        externalUserName: c.externalUserName,
        status: c.status,
        isHandedOff: c.isHandedOff,
        lastMessageAt: c.messages[0]?.createdAt || c.updatedAt,
        messageCount: c._count.messages,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
