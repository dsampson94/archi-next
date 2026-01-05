import twilio from 'twilio';
import prisma from './prisma';

// Default/fallback credentials from environment
const defaultAccountSid = process.env.TWILIO_ACCOUNT_SID;
const defaultAuthToken = process.env.TWILIO_AUTH_TOKEN;
const defaultWhatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

// Cache for tenant-specific Twilio clients
const clientCache = new Map<string, { client: twilio.Twilio; phoneNumber: string; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get Twilio client and phone number for a specific tenant
 * Falls back to environment variables if tenant has no config
 */
export async function getTwilioClientForTenant(tenantId: string): Promise<{
  client: twilio.Twilio;
  phoneNumber: string;
} | null> {
  // Check cache first
  const cached = clientCache.get(tenantId);
  if (cached && cached.expiresAt > Date.now()) {
    return { client: cached.client, phoneNumber: cached.phoneNumber };
  }

  // Fetch tenant's WhatsApp configuration
  const whatsappConfig = await prisma.whatsappNumber.findFirst({
    where: {
      tenantId,
      isActive: true,
    },
  });

  let accountSid: string | undefined;
  let authToken: string | undefined;
  let phoneNumber: string | undefined;

  if (whatsappConfig?.accountSid && whatsappConfig?.authToken) {
    // Use tenant-specific credentials
    accountSid = whatsappConfig.accountSid;
    authToken = whatsappConfig.authToken;
    phoneNumber = whatsappConfig.phoneNumber;
  } else if (whatsappConfig?.phoneNumber) {
    // Tenant has a number but no credentials - use default credentials
    // This allows platform operator to manage Twilio centrally
    accountSid = defaultAccountSid;
    authToken = defaultAuthToken;
    phoneNumber = whatsappConfig.phoneNumber;
  } else if (defaultAccountSid && defaultAuthToken && defaultWhatsappNumber) {
    // Fall back to environment defaults
    accountSid = defaultAccountSid;
    authToken = defaultAuthToken;
    phoneNumber = defaultWhatsappNumber;
  }

  if (!accountSid || !authToken || !phoneNumber) {
    console.warn(`[Twilio] No Twilio configuration for tenant ${tenantId}`);
    return null;
  }

  const client = twilio(accountSid, authToken);

  // Cache the client
  clientCache.set(tenantId, {
    client,
    phoneNumber,
    expiresAt: Date.now() + CACHE_TTL,
  });

  return { client, phoneNumber };
}

// Legacy function for backwards compatibility (uses env vars)
let defaultClient: twilio.Twilio | null = null;
function getTwilioClient() {
  if (!defaultClient && defaultAccountSid && defaultAuthToken) {
    defaultClient = twilio(defaultAccountSid, defaultAuthToken);
  }
  return defaultClient;
}

export interface SendWhatsAppMessageParams {
  to: string;
  message: string;
  mediaUrl?: string;
  tenantId?: string;
}

/**
 * Send a WhatsApp message via Twilio
 * Supports tenant-specific configuration when tenantId is provided
 */
export async function sendWhatsAppMessage({
  to,
  message,
  mediaUrl,
  tenantId,
}: SendWhatsAppMessageParams): Promise<{ success: boolean; messageSid?: string; error?: string }> {
  try {
    let client: twilio.Twilio | null;
    let fromNumber: string | undefined;

    if (tenantId) {
      // Use tenant-specific configuration
      const tenantConfig = await getTwilioClientForTenant(tenantId);
      if (!tenantConfig) {
        throw new Error('WhatsApp not configured for this account. Please set up WhatsApp in Settings.');
      }
      client = tenantConfig.client;
      fromNumber = tenantConfig.phoneNumber;
    } else {
      // Legacy: use default credentials
      client = getTwilioClient();
      fromNumber = defaultWhatsappNumber;
    }
    
    if (!client) {
      throw new Error('Twilio client not initialized. Check environment variables.');
    }

    if (!fromNumber) {
      throw new Error('WhatsApp number not configured');
    }

    // Ensure 'whatsapp:' prefix
    const formattedFrom = fromNumber.startsWith('whatsapp:')
      ? fromNumber
      : `whatsapp:${fromNumber}`;
    
    const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const messageData: Parameters<typeof client.messages.create>[0] = {
      from: formattedFrom,
      to: toNumber,
      body: message,
    };

    if (mediaUrl) {
      messageData.mediaUrl = [mediaUrl];
    }

    const result = await client.messages.create(messageData);

    console.log(`[Twilio] Message sent to ${to}, SID: ${result.sid}${tenantId ? ` (tenant: ${tenantId})` : ''}`);

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

export interface BulkMessageRecipient {
  to: string;
  message: string;
}

/**
 * Send bulk WhatsApp messages with tenant support
 */
export async function sendBulkWhatsAppMessages(
  recipients: BulkMessageRecipient[],
  tenantId?: string
): Promise<Array<{ to: string; success: boolean; messageSid?: string; error?: string }>> {
  const results = await Promise.all(
    recipients.map(async ({ to, message }) => {
      const result = await sendWhatsAppMessage({ to, message, tenantId });
      return { to, ...result };
    })
  );

  return results;
}

/**
 * Clear Twilio client cache for a tenant (use when credentials are updated)
 */
export function clearTwilioCache(tenantId?: string) {
  if (tenantId) {
    clientCache.delete(tenantId);
  } else {
    clientCache.clear();
  }
}
