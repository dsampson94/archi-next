import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/app/lib/prisma';
import { sendBulkWhatsAppMessages } from '@/app/lib/twilio';

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

// Add customer phone numbers to a tenant
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const tenantId = user.tenantId;
    const body = await request.json();
    const { phoneNumbers, sendWelcome = false, welcomeMessage } = body;

    if (!phoneNumbers || !Array.isArray(phoneNumbers)) {
      return NextResponse.json(
        { error: 'phoneNumbers array is required' },
        { status: 400 }
      );
    }

    // Validate and normalize phone numbers
    const normalizedNumbers = phoneNumbers
      .map((num) => num.trim().replace(/\s+/g, ''))
      .filter((num) => num.startsWith('+') && num.length > 10);

    if (normalizedNumbers.length === 0) {
      return NextResponse.json(
        { error: 'No valid phone numbers provided. Numbers must start with + and include country code.' },
        { status: 400 }
      );
    }

    // Check customer limits
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { 
        name: true,
        plan: true,
        agents: { where: { isActive: true }, take: 1 },
      },
    });
    
    // Create customer contact records
    const created = await Promise.all(
      normalizedNumbers.map((phoneNumber) =>
        prisma.customerContact.upsert({
          where: {
            phoneNumber_tenantId: {
              phoneNumber,
              tenantId,
            },
          },
          update: {
            isActive: true,
            updatedAt: new Date(),
          },
          create: {
            phoneNumber,
            tenantId,
            isActive: true,
          },
        })
      )
    );

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'customers.bulk_add',
        entity: 'CustomerContact',
        entityId: created[0]?.id || 'bulk',
        newValues: { count: created.length, phoneNumbers: normalizedNumbers },
        tenantId,
        userId: user.userId,
      },
    });

    // Send welcome messages if requested
    let messageResults: Array<{ to: string; success: boolean; messageSid?: string; error?: string }> = [];
    if (sendWelcome && normalizedNumbers.length > 0) {
      const defaultMessage =
        welcomeMessage ||
        tenant?.agents[0]?.greetingMessage ||
        `👋 Hi! I'm your AI assistant from ${tenant?.name || 'our company'}. I'm here to help answer your questions. Feel free to ask me anything!`;

      try {
        messageResults = await sendBulkWhatsAppMessages(
          normalizedNumbers.map((phoneNumber) => ({
            to: phoneNumber,
            message: defaultMessage,
          })),
          tenantId // Pass tenantId for multi-tenant support
        );
        console.log(`[Customers] Sent ${messageResults.filter(r => r.success).length}/${normalizedNumbers.length} welcome messages for tenant ${tenantId}`);
      } catch (twilioError) {
        console.error('[Customers] WhatsApp send error:', twilioError);
        // Don't fail the whole request if WhatsApp isn't configured
        messageResults = normalizedNumbers.map(to => ({
          to,
          success: false,
          error: 'WhatsApp not configured for this tenant',
        }));
      }
    }

    return NextResponse.json({
      success: true,
      count: created.length,
      phoneNumbers: normalizedNumbers,
      messagesSent: sendWelcome ? messageResults.filter((r) => r.success).length : 0,
      messageResults: sendWelcome ? messageResults : undefined,
    });
  } catch (error) {
    console.error('[Customers] Create error:', error);
    return NextResponse.json(
      { error: 'Failed to add customers' },
      { status: 500 }
    );
  }
}

// Get all customers for a tenant
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    
    const where = {
      tenantId: user.tenantId,
      ...(search && {
        OR: [
          { phoneNumber: { contains: search } },
          { name: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [customers, total] = await Promise.all([
      prisma.customerContact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.customerContact.count({ where }),
    ]);

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Customers] List error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
