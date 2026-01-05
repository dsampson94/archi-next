import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/app/lib/prisma';
import { TOKEN_PACKAGES } from '@/app/lib/pricing';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox'; // 'sandbox' or 'live'

const PAYPAL_API_URL = PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

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

// Get PayPal access token
async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * POST /api/billing/purchase - Create PayPal order for token purchase
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { packageId } = body;

    // Find the package
    const tokenPackage = TOKEN_PACKAGES.find(p => p.id === packageId);
    if (!tokenPackage) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    // Check if PayPal is configured
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Payment system not configured. Please contact support.' },
        { status: 503 }
      );
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Create PayPal order
    const orderResponse = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: `${user.tenantId}_${packageId}_${Date.now()}`,
          description: `Archi AI - ${tokenPackage.label}`,
          custom_id: packageId, // Store package ID for callback
          amount: {
            currency_code: 'USD',
            value: tokenPackage.price.toFixed(2),
          },
        }],
        application_context: {
          brand_name: 'Archi AI',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/billing/callback`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/billing?cancelled=true`,
        },
      }),
    });

    if (!orderResponse.ok) {
      const error = await orderResponse.json();
      console.error('PayPal order creation failed:', error);
      return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
    }

    const order = await orderResponse.json();

    // Find approval URL
    const approvalUrl = order.links?.find((link: { rel: string }) => link.rel === 'approve')?.href;

    return NextResponse.json({
      orderId: order.id,
      approvalUrl,
      package: tokenPackage,
    });
  } catch (error) {
    console.error('Error creating purchase:', error);
    return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 });
  }
}

/**
 * PUT /api/billing/purchase - Capture PayPal order after approval
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Capture the order
    const captureResponse = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!captureResponse.ok) {
      const error = await captureResponse.json();
      console.error('PayPal capture failed:', error);
      return NextResponse.json({ error: 'Payment capture failed' }, { status: 500 });
    }

    const capture = await captureResponse.json();

    // Verify payment was successful
    if (capture.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // Extract custom data
    const purchaseUnit = capture.purchase_units?.[0];
    const customData = JSON.parse(purchaseUnit?.payments?.captures?.[0]?.custom_id || purchaseUnit?.custom_id || '{}');

    // Verify tenant matches
    if (customData.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Invalid payment' }, { status: 400 });
    }

    const tokensToAdd = customData.tokens;
    const paymentAmount = parseFloat(purchaseUnit?.payments?.captures?.[0]?.amount?.value || '0');

    // Update token balance in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get current balance
      const tenant = await tx.tenant.findUnique({
        where: { id: user.tenantId },
        select: { tokenBalance: true },
      });

      const newBalance = (tenant?.tokenBalance || 0) + tokensToAdd;

      // Update balance
      await tx.tenant.update({
        where: { id: user.tenantId },
        data: { tokenBalance: newBalance },
      });

      // Create transaction record
      const transaction = await tx.tokenTransaction.create({
        data: {
          tenantId: user.tenantId,
          type: 'PURCHASE',
          amount: tokensToAdd,
          balance: newBalance,
          paypalOrderId: orderId,
          paypalPayerId: capture.payer?.payer_id,
          paymentAmount,
          tokenPackage: customData.packageId,
          description: `Purchased ${tokensToAdd.toLocaleString()} tokens`,
        },
      });

      return { newBalance, transaction };
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'billing.purchase',
        entity: 'TokenTransaction',
        entityId: result.transaction.id,
        newValues: { tokens: tokensToAdd, amount: paymentAmount },
        tenantId: user.tenantId,
        userId: user.userId,
      },
    });

    return NextResponse.json({
      success: true,
      tokensAdded: tokensToAdd,
      newBalance: result.newBalance,
      transaction: result.transaction,
    });
  } catch (error) {
    console.error('Error capturing purchase:', error);
    return NextResponse.json({ error: 'Failed to complete purchase' }, { status: 500 });
  }
}
