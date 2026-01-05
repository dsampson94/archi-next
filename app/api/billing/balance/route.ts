import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/app/lib/prisma';
import { TOKEN_PACKAGES, MODEL_PRICING } from '@/app/lib/pricing';

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
 * GET /api/billing/balance - Get token balance and usage stats
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant - try with tokenBalance, fallback if column doesn't exist
    let tokenBalance = 1000; // Default balance
    
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: user.tenantId },
        select: {
          id: true,
          name: true,
          tokenBalance: true,
        },
      });
      
      if (tenant) {
        tokenBalance = tenant.tokenBalance;
      }
    } catch (dbError) {
      // tokenBalance column might not exist in production yet
      console.warn('tokenBalance column not found, using default:', dbError);
      const tenant = await prisma.tenant.findUnique({
        where: { id: user.tenantId },
        select: { id: true, name: true },
      });
      
      if (!tenant) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
      }
    }

    // Get usage stats for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    let monthlyUsage = 0;
    let recentTransactions: any[] = [];
    let totalPurchased = 0;

    try {
      const [usageResult, transactions, purchaseResult] = await Promise.all([
        prisma.tokenTransaction.aggregate({
          where: {
            tenantId: user.tenantId,
            type: 'USAGE',
            createdAt: { gte: startOfMonth },
          },
          _sum: { amount: true },
        }),
        prisma.tokenTransaction.findMany({
          where: { tenantId: user.tenantId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        prisma.tokenTransaction.aggregate({
          where: {
            tenantId: user.tenantId,
            type: 'PURCHASE',
          },
          _sum: { amount: true },
        }),
      ]);

      monthlyUsage = Math.abs(usageResult._sum.amount || 0);
      recentTransactions = transactions;
      totalPurchased = purchaseResult._sum.amount || 0;
    } catch (txError) {
      // TokenTransaction table might not exist yet
      console.warn('TokenTransaction query failed:', txError);
    }

    return NextResponse.json({
      balance: tokenBalance,
      monthlyUsage,
      totalPurchased,
      recentTransactions,
      packages: TOKEN_PACKAGES,
      modelPricing: MODEL_PRICING,
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 });
  }
}
