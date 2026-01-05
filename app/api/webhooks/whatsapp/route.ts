import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { queryAgent, getDefaultAgent } from '@/app/lib/agent-rag';
import { transcribeAudio } from '@/app/lib/openai';
import crypto from 'crypto';

// Twilio signature validation
function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>,
  authToken: string
): boolean {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
  
  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(Buffer.from(sortedParams, 'utf-8'))
    .digest('base64');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const body: Record<string, string> = {};
    formData.forEach((value: FormDataEntryValue, key: string) => {
      body[key] = value.toString();
    });

    // Extract message details
    const {
      From: from,
      To: to,
      Body: messageBody,
      MessageSid: messageSid,
      ProfileName: profileName,
      NumMedia: numMedia,
      MediaContentType0: mediaType,
      MediaUrl0: mediaUrl,
    } = body;

    // Clean phone numbers
    const fromNumber = from?.replace('whatsapp:', '') || '';
    const toNumber = to?.replace('whatsapp:', '') || '';

    console.log(`[WhatsApp] Incoming message from ${fromNumber}: ${messageBody}`);

    // Find the WhatsApp number configuration
    const whatsappConfig = await prisma.whatsappNumber.findFirst({
      where: { phoneNumber: toNumber, isActive: true },
      include: { tenant: true },
    });

    if (!whatsappConfig) {
      console.error(`[WhatsApp] No configuration found for number: ${toNumber}`);
      return new NextResponse('Number not configured', { status: 404 });
    }

    // Check if this customer is mapped to a specific tenant
    // Otherwise use the default tenant from the WhatsApp number config
    const customerContact = await prisma.customerContact.findFirst({
      where: { phoneNumber: fromNumber, isActive: true },
    });

    const tenantId = customerContact?.tenantId || whatsappConfig.tenantId;
    
    console.log(`[WhatsApp] Routing to tenant: ${tenantId} ${customerContact ? '(via customer mapping)' : '(default)'}`);

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        tenantId,
        externalUserId: fromNumber,
        status: { in: ['ACTIVE', 'HANDED_OFF'] },
      },
      include: { agent: true },
    });

    if (!conversation) {
      // Get default agent
      const defaultAgent = await prisma.agent.findFirst({
        where: { tenantId, isActive: true },
      });

      conversation = await prisma.conversation.create({
        data: {
          tenantId,
          externalUserId: fromNumber,
          externalUserName: profileName || undefined,
          whatsappNumberId: whatsappConfig.id,
          agentId: defaultAgent?.id,
          status: 'ACTIVE',
        },
        include: { agent: true },
      });
    }

    // Determine content type
    const isVoiceNote = mediaType?.includes('audio') || false;
    let processedContent = messageBody || '';
    let transcription: string | null = null;

    // Handle voice notes with Whisper transcription
    if (isVoiceNote && mediaUrl) {
      try {
        console.log(`[WhatsApp] Transcribing voice note from ${mediaUrl}`);
        const audioResponse = await fetch(mediaUrl);
        const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
        transcription = await transcribeAudio(audioBuffer);
        processedContent = transcription;
        console.log(`[WhatsApp] Transcription: ${transcription}`);
      } catch (error) {
        console.error('[WhatsApp] Voice transcription error:', error);
        processedContent = '[Voice message received - transcription failed]';
      }
    }

    // Store the incoming message
    const incomingMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: processedContent,
        contentType: isVoiceNote ? 'VOICE' : 'TEXT',
        direction: 'INBOUND',
        senderType: 'USER',
        audioUrl: mediaUrl || undefined,
        transcription,
      },
    });

    // Get agent configuration (prefer conversation's agent, otherwise tenant default)
    const agentId = conversation.agentId || (await getDefaultAgent(conversation.tenantId))?.id;
    
    if (!agentId) {
      console.error(`[WhatsApp] No agent configured for tenant ${conversation.tenantId}`);
      return new NextResponse('No agent configured', { status: 500 });
    }

    // Generate AI response using agent-aware RAG pipeline
    // This will:
    // 1. Use only the agent's linked knowledge bases
    // 2. Use the agent's configured LLM model
    // 3. Save the conversation for future learning
    const aiResponse = await queryAgent(
      conversation.tenantId,
      agentId,
      processedContent,
      conversation.id
    );

    // Store the AI response
    const outgoingMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: aiResponse.content,
        contentType: 'TEXT',
        direction: 'OUTBOUND',
        senderType: 'AI',
        confidence: aiResponse.confidence,
        tokensUsed: aiResponse.tokensUsed,
        latencyMs: aiResponse.latencyMs,
      },
    });

    // Check if we need to hand off to human
    if (aiResponse.shouldHandoff) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          status: 'HANDED_OFF',
          isHandedOff: true,
          handedOffAt: new Date(),
        },
      });

      // Note: Handoff message is now included in the agent's response via agent-rag.ts
    }

    // Send response via Twilio
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(aiResponse.content)}</Message>
</Response>`;

    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('[WhatsApp] Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Handle GET for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'WhatsApp webhook is active' });
}
