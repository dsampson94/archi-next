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

// GET /api/whatsapp/config - Get WhatsApp configuration
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await prisma.whatsappNumber.findFirst({
      where: { tenantId: user.tenantId },
    });

    return NextResponse.json({
      config: config ? {
        id: config.id,
        phoneNumber: config.phoneNumber,
        displayName: config.displayName || '',
        isActive: config.isActive,
        verified: config.verifiedAt !== null,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching WhatsApp config:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

// POST /api/whatsapp/config - Save WhatsApp configuration
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { phoneNumber, displayName } = body;

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Clean phone number
    const cleanNumber = phoneNumber.replace(/\s+/g, '').replace(/^00/, '+');

    // Check if config exists
    const existing = await prisma.whatsappNumber.findFirst({
      where: { tenantId: user.tenantId },
    });

    let config;
    if (existing) {
      config = await prisma.whatsappNumber.update({
        where: { id: existing.id },
        data: {
          phoneNumber: cleanNumber,
          displayName,
          updatedAt: new Date(),
        },
      });
    } else {
      config = await prisma.whatsappNumber.create({
        data: {
          phoneNumber: cleanNumber,
          displayName,
          tenantId: user.tenantId,
          isActive: true,
        },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: existing ? 'whatsapp.config_update' : 'whatsapp.config_create',
        entity: 'WhatsappNumber',
        entityId: config.id,
        newValues: { phoneNumber: cleanNumber },
        tenantId: user.tenantId,
        userId: user.userId,
      },
    });

    return NextResponse.json({
      config: {
        id: config.id,
        phoneNumber: config.phoneNumber,
        displayName: config.displayName || '',
        isActive: config.isActive,
        verified: config.verifiedAt !== null,
      },
    });
  } catch (error) {
    console.error('Error saving WhatsApp config:', error);
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}
