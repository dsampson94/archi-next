import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/app/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
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
 * GET /api/usage - Get current usage statistics for the tenant
 * Used for displaying quota usage and enforcing limits
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant with limits
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        id: true,
        name: true,
        plan: true,
        status: true,
        trialEndsAt: true,
        maxDocuments: true,
        maxMessages: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Get current month's date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Fetch usage counts in parallel
    const [
      documentCount,
      processingDocuments,
      customerCount,
      conversationCount,
      messagesThisMonth,
      activeConversations,
    ] = await Promise.all([
      // Total documents
      prisma.document.count({
        where: { tenantId: user.tenantId },
      }),
      // Documents currently processing
      prisma.document.count({
        where: { 
          tenantId: user.tenantId,
          status: { in: ['PENDING', 'PROCESSING'] },
        },
      }),
      // Active customers
      prisma.customerContact.count({
        where: { tenantId: user.tenantId, isActive: true },
      }),
      // Total conversations
      prisma.conversation.count({
        where: { tenantId: user.tenantId },
      }),
      // Messages this month
      prisma.message.count({
        where: {
          conversation: { tenantId: user.tenantId },
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
      // Active conversations (last 24 hours)
      prisma.conversation.count({
        where: {
          tenantId: user.tenantId,
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Calculate usage percentages
    const documentUsagePercent = Math.round((documentCount / tenant.maxDocuments) * 100);
    const messageUsagePercent = Math.round((messagesThisMonth / tenant.maxMessages) * 100);

    // Determine if limits are reached
    const limits = {
      documentsReached: documentCount >= tenant.maxDocuments,
      messagesReached: messagesThisMonth >= tenant.maxMessages,
      documentsWarning: documentUsagePercent >= 80,
      messagesWarning: messageUsagePercent >= 80,
    };

    // Calculate trial status
    const isTrialActive = tenant.status === 'TRIAL' && tenant.trialEndsAt && new Date(tenant.trialEndsAt) > now;
    const trialDaysRemaining = tenant.trialEndsAt
      ? Math.max(0, Math.ceil((new Date(tenant.trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        plan: tenant.plan,
        status: tenant.status,
        isTrialActive,
        trialDaysRemaining,
      },
      usage: {
        documents: {
          used: documentCount,
          limit: tenant.maxDocuments,
          percent: documentUsagePercent,
          processing: processingDocuments,
        },
        messages: {
          used: messagesThisMonth,
          limit: tenant.maxMessages,
          percent: messageUsagePercent,
          periodStart: startOfMonth.toISOString(),
          periodEnd: endOfMonth.toISOString(),
        },
        customers: customerCount,
        conversations: {
          total: conversationCount,
          active: activeConversations,
        },
      },
      limits,
      recommendations: getRecommendations(tenant.plan, limits, documentUsagePercent, messageUsagePercent),
    });
  } catch (error) {
    console.error('[Usage] Error fetching usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}

function getRecommendations(
  plan: string,
  limits: { documentsReached: boolean; messagesReached: boolean; documentsWarning: boolean; messagesWarning: boolean },
  docPercent: number,
  msgPercent: number
): string[] {
  const recommendations: string[] = [];

  if (limits.documentsReached) {
    recommendations.push('Document limit reached. Upgrade your plan to add more documents.');
  } else if (limits.documentsWarning) {
    recommendations.push(`You've used ${docPercent}% of your document quota. Consider upgrading soon.`);
  }

  if (limits.messagesReached) {
    recommendations.push('Monthly message limit reached. Your assistant won\'t respond until next month or you upgrade.');
  } else if (limits.messagesWarning) {
    recommendations.push(`You've used ${msgPercent}% of your monthly messages. Consider upgrading if you expect more traffic.`);
  }

  if (plan === 'STARTER' && (docPercent > 50 || msgPercent > 50)) {
    recommendations.push('Growing fast? The Professional plan offers 5x the limits with priority support.');
  }

  return recommendations;
}
