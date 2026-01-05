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

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    // Tenant stats
    const [totalTenants, activeTenants, trialTenants, suspendedTenants, newTenantsThisMonth] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      prisma.tenant.count({ where: { status: 'TRIAL' } }),
      prisma.tenant.count({ where: { status: 'SUSPENDED' } }),
      prisma.tenant.count({ where: { createdAt: { gte: startOfMonth } } }),
    ]);

    // User stats
    const [totalUsers, activeUsersToday, newUsersThisWeek] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(now.setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
    ]);

    // Message stats
    const [totalMessages, messagesThisMonth] = await Promise.all([
      prisma.message.count(),
      prisma.message.count({ where: { createdAt: { gte: startOfMonth } } }),
    ]);

    const avgMessagesPerTenant = totalTenants > 0 ? Math.round(totalMessages / totalTenants) : 0;

    // Revenue calculation (based on plans)
    const planPrices = {
      STARTER: 1500,
      PROFESSIONAL: 2500,
      ENTERPRISE: 5000,
    };

    const tenantsWithPlans = await prisma.tenant.groupBy({
      by: ['plan'],
      where: { status: 'ACTIVE' },
      _count: true,
    });

    let mrr = 0;
    tenantsWithPlans.forEach((group) => {
      mrr += (planPrices[group.plan as keyof typeof planPrices] || 0) * group._count;
    });

    // Recent tenants
    const recentTenants = await prisma.tenant.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            documents: true,
            conversations: true,
          },
        },
        users: {
          where: { role: 'OWNER' },
          take: 1,
          select: { name: true, email: true },
        },
      },
    });

    // System alerts (could be expanded with actual monitoring)
    const alerts: any[] = [];

    // Check for tenants with high usage
    const highUsageTenants = await prisma.tenant.findMany({
      where: {
        conversations: {
          some: {
            createdAt: { gte: startOfMonth },
          },
        },
      },
      include: {
        _count: {
          select: { conversations: true },
        },
      },
      orderBy: {
        conversations: {
          _count: 'desc',
        },
      },
      take: 3,
    });

    // Add trial ending alerts
    const trialEndingSoon = await prisma.tenant.findMany({
      where: {
        status: 'TRIAL',
        trialEndsAt: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          gte: now,
        },
      },
    });

    trialEndingSoon.forEach((tenant) => {
      alerts.push({
        id: `trial-${tenant.id}`,
        type: 'warning',
        message: `Trial ending soon`,
        tenantName: tenant.name,
        createdAt: new Date().toISOString(),
      });
    });

    return NextResponse.json({
      tenants: {
        total: totalTenants,
        active: activeTenants,
        trial: trialTenants,
        churned: suspendedTenants,
        newThisMonth: newTenantsThisMonth,
      },
      users: {
        total: totalUsers,
        activeToday: activeUsersToday,
        newThisWeek: newUsersThisWeek,
      },
      messages: {
        total: totalMessages,
        thisMonth: messagesThisMonth,
        avgPerTenant: avgMessagesPerTenant,
      },
      revenue: {
        mrr,
        growth: 0, // Would need historical data to calculate
      },
      recentTenants: recentTenants.map((tenant) => ({
        id: tenant.id,
        name: tenant.name,
        plan: tenant.plan,
        status: tenant.status,
        usersCount: tenant._count.users,
        messagesCount: tenant._count.conversations,
        createdAt: tenant.createdAt.toISOString(),
        owner: tenant.users[0] || null,
      })),
      alerts,
    });
  } catch (error) {
    console.error('[Admin Stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
