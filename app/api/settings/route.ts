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

export async function GET() {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        primaryColor: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({
      name: tenant.name,
      slug: tenant.slug || '',
      logoUrl: tenant.logoUrl || '',
      primaryColor: tenant.primaryColor || '#14b8a6',
      timezone: 'Africa/Johannesburg',
      billingEmail: user.email,
      notifications: {
        emailOnHandoff: true,
        emailDailyDigest: false,
        emailWeeklyReport: true,
      },
      branding: {
        primaryColor: tenant.primaryColor || '#10B981',
        welcomeMessage: 'Hello! How can I help you today?',
      },
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin/owner can update settings
    if (user.role !== 'admin' && user.role !== 'owner') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, logoUrl, primaryColor } = body;

    // Check slug uniqueness if changed
    if (slug) {
      const existingTenant = await prisma.tenant.findFirst({
        where: {
          slug,
          NOT: { id: user.tenantId },
        },
      });
      if (existingTenant) {
        return NextResponse.json({ error: 'Slug already taken' }, { status: 400 });
      }
    }

    // Update tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id: user.tenantId },
      data: {
        name: name || undefined,
        slug: slug || undefined,
        logoUrl: logoUrl || undefined,
        primaryColor: primaryColor || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      tenant: {
        name: updatedTenant.name,
        slug: updatedTenant.slug,
        logoUrl: updatedTenant.logoUrl,
        primaryColor: updatedTenant.primaryColor,
      },
    });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
