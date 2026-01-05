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

// GET - List all tenants
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const plan = searchParams.get('plan');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (plan && plan !== 'all') {
      where.plan = plan.toUpperCase();
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { users: { some: { email: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              users: true,
              documents: true,
              conversations: true,
              agents: true,
            },
          },
          users: {
            where: { role: 'OWNER' },
            take: 1,
            select: { name: true, email: true },
          },
        },
      }),
      prisma.tenant.count({ where }),
    ]);

    return NextResponse.json({
      tenants: tenants.map((tenant) => ({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        status: tenant.status,
        createdAt: tenant.createdAt.toISOString(),
        trialEndsAt: tenant.trialEndsAt?.toISOString(),
        _count: tenant._count,
        owner: tenant.users[0] || null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Admin Tenants] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    );
  }
}

// POST - Create new tenant
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, slug, plan, ownerEmail, ownerName, ownerPassword } = body;

    if (!name || !slug || !ownerEmail || !ownerName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if slug is taken
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: 'Slug already taken' },
        { status: 400 }
      );
    }

    // Check if email is taken
    const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Create tenant with owner
    const bcrypt = require('bcrypt');
    const passwordHash = ownerPassword ? await bcrypt.hash(ownerPassword, 10) : null;

    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        plan: plan || 'STARTER',
        status: 'ACTIVE',
        users: {
          create: {
            email: ownerEmail,
            name: ownerName,
            passwordHash,
            role: 'OWNER',
          },
        },
      },
      include: {
        users: true,
      },
    });

    return NextResponse.json({ tenant }, { status: 201 });
  } catch (error) {
    console.error('[Admin Create Tenant] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    );
  }
}
