import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

let twilioClient: twilio.Twilio | null = null;

function getTwilioClient() {
  if (!twilioClient && accountSid && authToken) {
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

export interface SendWhatsAppMessageParams {
  to: string;
  message: string;
  mediaUrl?: string;
}

/**
 * Send a WhatsApp message via Twilio
 */
export async function sendWhatsAppMessage({
  to,
  message,
  mediaUrl,
}: SendWhatsAppMessageParams): Promise<{ success: boolean; messageSid?: string; error?: string }> {
  try {
    const client = getTwilioClient();
    
    if (!client) {
      throw new Error('Twilio client not initialized. Check environment variables.');
    }

    if (!whatsappNumber) {
      throw new Error('TWILIO_WHATSAPP_NUMBER not configured');
    }

    // Ensure 'whatsapp:' prefix
    const fromNumber = whatsappNumber.startsWith('whatsapp:')
      ? whatsappNumber
      : `whatsapp:${whatsappNumber}`;
    
    const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const messageData: any = {
      from: fromNumber,
      to: toNumber,
      body: message,
    };

    if (mediaUrl) {
      messageData.mediaUrl = [mediaUrl];
    }

    const result = await client.messages.create(messageData);

    console.log(`[Twilio] Message sent to ${to}, SID: ${result.sid}`);

    return {
      success: true,
      messageSid: result.sid,
    };
  } catch (error: any) {
    console.error('[Twilio] Failed to send message:', error);
    return {
      success: false,
      error: error.message || 'Failed to send WhatsApp message',
    };
  }
}

/**
 * Send bulk WhatsApp messages
 */
export async function sendBulkWhatsAppMessages(
  recipients: Array<{ to: string; message: string }>
): Promise<Array<{ to: string; success: boolean; messageSid?: string; error?: string }>> {
  const results = await Promise.all(
    recipients.map(async ({ to, message }) => {
      const result = await sendWhatsAppMessage({ to, message });
      return { to, ...result };
    })
  );

  return results;
}
