import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/app/lib/prisma';
import twilio from 'twilio';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

interface JWTPayload {
  userId: string;
  email: string;
  tenantId: string;
  role: string;
  name: string;
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

// Initialize Twilio client
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }
  
  return twilio(accountSid, authToken);
}

// POST /api/conversations/[id]/reply - Send human reply via WhatsApp
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Verify conversation belongs to tenant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
      include: {
        whatsappNumber: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Store the outgoing message in database
    const outgoingMessage = await prisma.message.create({
      data: {
        conversationId: id,
        content: message.trim(),
        contentType: 'TEXT',
        direction: 'OUTBOUND',
        senderType: 'HUMAN',
        humanAgentId: user.userId,
      },
    });

    // Update conversation status - human took over
    await prisma.conversation.update({
      where: { id },
      data: {
        isHandedOff: false, // Human has responded, no longer waiting
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });

    // Send via Twilio WhatsApp API
    try {
      const client = getTwilioClient();
      const fromNumber = conversation.whatsappNumber?.phoneNumber || process.env.TWILIO_WHATSAPP_NUMBER;
      
      if (!fromNumber) {
        throw new Error('No WhatsApp number configured');
      }

      await client.messages.create({
        from: `whatsapp:${fromNumber}`,
        to: `whatsapp:${conversation.externalUserId}`,
        body: message.trim(),
      });

      // Update message status to sent
      await prisma.message.update({
        where: { id: outgoingMessage.id },
        data: { metadata: { sent: true, sentAt: new Date().toISOString() } },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'message.human_reply',
          entity: 'Message',
          entityId: outgoingMessage.id,
          newValues: { conversationId: id, messageLength: message.length },
          tenantId: user.tenantId,
          userId: user.userId,
        },
      });

      return NextResponse.json({
        success: true,
        message: {
          id: outgoingMessage.id,
          content: outgoingMessage.content,
          createdAt: outgoingMessage.createdAt.toISOString(),
        },
      });
    } catch (twilioError) {
      console.error('[WhatsApp] Failed to send message via Twilio:', twilioError);
      
      // Update message to show it failed
      await prisma.message.update({
        where: { id: outgoingMessage.id },
        data: { metadata: { sent: false, error: 'Failed to send via WhatsApp' } },
      });

      return NextResponse.json(
        { error: 'Message saved but failed to send via WhatsApp. Check Twilio configuration.' },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('Error sending reply:', error);
    return NextResponse.json(
      { error: 'Failed to send reply' },
      { status: 500 }
    );
  }
}

// PATCH /api/conversations/[id]/reply - Mark conversation as resolved
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // Verify conversation belongs to tenant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Update conversation status
    const updatedConversation = await prisma.conversation.update({
      where: { id },
      data: {
        status: status || 'RESOLVED',
        isHandedOff: false,
        resolvedAt: status === 'RESOLVED' ? new Date() : null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      conversation: {
        id: updatedConversation.id,
        status: updatedConversation.status,
      },
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}
