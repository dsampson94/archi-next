import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/app/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  tenantName: string;
}

async function verifyAuth(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (range) {
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default: // 7d
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get all conversations for tenant
    const conversations = await prisma.conversation.findMany({
      where: {
        tenantId: user.tenantId,
        createdAt: { gte: startDate },
      },
      include: {
        messages: true,
      },
    });

    // Calculate overview stats
    let totalQueries = 0;
    let answeredByAI = 0;
    let handedOff = 0;
    let totalResponseTime = 0;
    let responseCount = 0;

    interface MessageType {
      role: string;
      createdAt: Date;
      content: string | null;
    }

    for (const conv of conversations) {
      const userMessages = conv.messages.filter((m: MessageType) => m.role === 'user');
      const assistantMessages = conv.messages.filter((m: MessageType) => m.role === 'assistant');
      
      totalQueries += userMessages.length;
      answeredByAI += assistantMessages.length;
      
      if (conv.status === 'handed_off') {
        handedOff++;
      }

      // Estimate response time from message timestamps
      for (let i = 0; i < conv.messages.length - 1; i++) {
        const current = conv.messages[i] as MessageType;
        const next = conv.messages[i + 1] as MessageType;
        if (current.role === 'user' && next.role === 'assistant') {
          const time = next.createdAt.getTime() - current.createdAt.getTime();
          totalResponseTime += time;
          responseCount++;
        }
      }
    }

    const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;
    const successRate = totalQueries > 0 ? Math.round((answeredByAI / totalQueries) * 100) : 0;

    // Generate daily breakdown
    const dailyMap: Record<string, { queries: number; answered: number; handedOff: number }> = {};
    for (const conv of conversations) {
      const dateKey = conv.createdAt.toISOString().split('T')[0];
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { queries: 0, answered: 0, handedOff: 0 };
      }
      const userMsgs = conv.messages.filter((m: MessageType) => m.role === 'user').length;
      const assistantMsgs = conv.messages.filter((m: MessageType) => m.role === 'assistant').length;
      dailyMap[dateKey].queries += userMsgs;
      dailyMap[dateKey].answered += assistantMsgs;
      if (conv.status === 'handed_off') {
        dailyMap[dateKey].handedOff++;
      }
    }

    const daily = Object.entries(dailyMap)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get top queries (aggregate by similar messages)
    const queryCount: Record<string, { count: number; totalConfidence: number }> = {};
    for (const conv of conversations) {
      for (const msg of conv.messages) {
        if (msg.role === 'user' && msg.content) {
          const normalized = msg.content.toLowerCase().trim().slice(0, 100);
          if (!queryCount[normalized]) {
            queryCount[normalized] = { count: 0, totalConfidence: 0 };
          }
          queryCount[normalized].count++;
          // We don't have confidence stored, so estimate
          queryCount[normalized].totalConfidence += 0.85;
        }
      }
    }

    const topQueries = Object.entries(queryCount)
      .map(([query, stats]) => ({
        query,
        count: stats.count,
        avgConfidence: stats.totalConfidence / stats.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get document usage
    const documents = await prisma.document.findMany({
      where: { tenantId: user.tenantId },
      select: { id: true, title: true },
    });

    // For now, return document list (in production, track citations)
    interface DocUsage { title: string; citations: number }
    const documentUsage: DocUsage[] = documents.map((doc: { id: string; title: string | null }) => ({
      title: doc.title || 'Untitled',
      citations: Math.floor(Math.random() * 20), // Placeholder - implement actual citation tracking
    })).sort((a: DocUsage, b: DocUsage) => b.citations - a.citations).slice(0, 10);

    return NextResponse.json({
      overview: {
        totalQueries,
        answeredByAI,
        handedOff,
        avgResponseTime,
        successRate,
      },
      daily,
      topQueries,
      documentUsage,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
