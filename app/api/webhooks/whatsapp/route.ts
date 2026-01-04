import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { queryRAG, getAgentConfig, logQuery } from '@/app/lib/rag';
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

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        tenantId: whatsappConfig.tenantId,
        externalUserId: fromNumber,
        status: { in: ['ACTIVE', 'HANDED_OFF'] },
      },
      include: { agent: true },
    });

    if (!conversation) {
      // Get default agent
      const defaultAgent = await prisma.agent.findFirst({
        where: { tenantId: whatsappConfig.tenantId, isActive: true },
      });

      conversation = await prisma.conversation.create({
        data: {
          tenantId: whatsappConfig.tenantId,
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

    // Get agent configuration
    const agentConfig = await getAgentConfig(conversation.tenantId);
    const systemPrompt = agentConfig?.systemPrompt || conversation.agent?.systemPrompt || 
      'You are a helpful assistant. Answer questions based on the provided context.';

    // Generate AI response using RAG pipeline
    const aiResponse = await queryRAG(
      conversation.tenantId,
      processedContent,
      systemPrompt,
      {
        confidenceThreshold: agentConfig?.confidenceThreshold || 0.7,
        temperature: agentConfig?.temperature || 0.7,
        model: agentConfig?.model || 'gpt-4-turbo-preview',
      }
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

      // Append handoff message if confidence is very low
      if (aiResponse.confidence < 0.5 && agentConfig?.fallbackMessage) {
        aiResponse.content += `\n\n${agentConfig.fallbackMessage}`;
      }
    }

    // Log query for analytics
    await logQuery(conversation.tenantId, conversation.id, processedContent, aiResponse);

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
