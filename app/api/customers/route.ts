import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { sendBulkWhatsAppMessages } from '@/app/lib/twilio';

// Add customer phone numbers to a tenant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumbers, sendWelcome = false, welcomeMessage } = body;

    // TODO: Get actual tenant ID from session/auth
    const tenantId = '6ab88313-2227-45e8-b91f-f7b80f22131b';

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
        { error: 'No valid phone numbers provided' },
        { status: 400 }
      );
    }

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
          },
          create: {
            phoneNumber,
            tenantId,
            isActive: true,
          },
        })
      )
    );

    // Send welcome messages if requested
    let messageResults = [];
    if (sendWelcome) {
      // Get tenant info for personalized message
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { agents: { where: { isActive: true }, take: 1 } },
      });

      const defaultMessage =
        welcomeMessage ||
        tenant?.agents[0]?.greetingMessage ||
        `👋 Hi! I'm your AI assistant from ${tenant?.name || 'our company'}. I'm here to help answer your questions. Feel free to ask me anything!`;

      messageResults = await sendBulkWhatsAppMessages(
        normalizedNumbers.map((phoneNumber) => ({
          to: phoneNumber,
          message: defaultMessage,
        }))
      );

      console.log(`[Customers] Sent ${messageResults.filter(r => r.success).length}/${normalizedNumbers.length} welcome messages`);
    }

    return NextResponse.json({
      success: true,
      created: created.length,
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
    // TODO: Get actual tenant ID from session/auth
    const tenantId = '6ab88313-2227-45e8-b91f-f7b80f22131b';

    const customers = await prisma.customerContact.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ customers });
  } catch (error) {
    console.error('[Customers] List error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
