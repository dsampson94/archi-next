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

/**
 * GET /api/dashboard/stats - Get dashboard statistics
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { name: true },
    });
    
    // Get counts
    const [
      totalDocuments,
      processedDocuments,
      pendingDocuments,
      failedDocuments,
      totalConversations,
      conversationsThisWeek,
      activeConversationsToday,
      totalMessages,
      answeredMessages,
      handedOffCount,
      totalUsers,
      newUsersThisWeek,
    ] = await Promise.all([
      prisma.document.count({ where: { tenantId: auth.tenantId } }),
      prisma.document.count({ 
        where: { 
          tenantId: auth.tenantId,
          status: 'COMPLETED',
        },
      }),
      prisma.document.count({ 
        where: { 
          tenantId: auth.tenantId,
          status: { in: ['PENDING', 'PROCESSING'] },
        },
      }),
      prisma.document.count({ 
        where: { 
          tenantId: auth.tenantId,
          status: 'FAILED',
        },
      }),
      prisma.conversation.count({ where: { tenantId: auth.tenantId } }),
      prisma.conversation.count({ 
        where: { 
          tenantId: auth.tenantId,
          createdAt: { gte: weekAgo },
        },
      }),
      prisma.conversation.count({ 
        where: { 
          tenantId: auth.tenantId,
          updatedAt: { gte: todayStart },
        },
      }),
      prisma.message.count({
        where: {
          conversation: { tenantId: auth.tenantId },
          direction: 'INBOUND',
        },
      }),
      prisma.message.count({
        where: {
          conversation: { tenantId: auth.tenantId },
          direction: 'OUTBOUND',
          senderType: 'AI',
        },
      }),
      prisma.conversation.count({
        where: {
          tenantId: auth.tenantId,
          isHandedOff: true,
        },
      }),
      // Count unique external users (WhatsApp contacts)
      prisma.conversation.groupBy({
        by: ['externalUserId'],
        where: { tenantId: auth.tenantId },
      }).then((r: Array<{ externalUserId: string }>) => r.length),
      prisma.conversation.groupBy({
        by: ['externalUserId'],
        where: { 
          tenantId: auth.tenantId,
          createdAt: { gte: weekAgo },
        },
      }).then((r: Array<{ externalUserId: string }>) => r.length),
    ]);
    
    // Calculate success rate
    const successRate = totalMessages > 0 
      ? Math.round((answeredMessages / totalMessages) * 100)
      : 100;
    
    // Get recent conversations
    const recentConversations = await prisma.conversation.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, createdAt: true },
        },
      },
    });
    
    // Get top questions (most frequent inbound messages)
    const topQuestions = await prisma.message.groupBy({
      by: ['content'],
      where: {
        conversation: { tenantId: auth.tenantId },
        direction: 'INBOUND',
        contentType: 'TEXT',
      },
      _count: { content: true },
      orderBy: { _count: { content: 'desc' } },
      take: 5,
    });
    
    return NextResponse.json({
      userName: user?.name?.split(' ')[0],
      documents: {
        total: totalDocuments,
        processed: processedDocuments,
        pending: pendingDocuments,
        failed: failedDocuments,
      },
      conversations: {
        total: totalConversations,
        thisWeek: conversationsThisWeek,
        activeToday: activeConversationsToday,
      },
      messages: {
        total: totalMessages,
        answered: answeredMessages,
        handedOff: handedOffCount,
        successRate,
      },
      users: {
        total: totalUsers,
        newThisWeek: newUsersThisWeek,
      },
      recentConversations: recentConversations.map((c: {
        id: string;
        externalUserId: string;
        messages: Array<{ content: string; createdAt: Date }>;
        updatedAt: Date;
        status: string;
        isHandedOff: boolean;
      }) => ({
        id: c.id,
        phoneNumber: c.externalUserId,
        lastMessage: c.messages[0]?.content || '',
        lastMessageTime: c.messages[0]?.createdAt?.toISOString() || c.updatedAt.toISOString(),
        status: c.status,
        handedOff: c.isHandedOff,
      })),
      topQuestions: topQuestions.map((q: { content: string; _count: { content: number } }) => ({
        query: q.content,
        count: q._count.content,
      })),
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
