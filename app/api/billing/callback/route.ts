import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/app/lib/prisma';
import { TOKEN_PACKAGES } from '@/app/lib/pricing';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';

const PAYPAL_API = PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

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

async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

// GET /api/billing/callback - Handle PayPal return
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.redirect(new URL('/auth?error=unauthorized', request.url));
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('token'); // PayPal returns order ID as 'token'

    if (!orderId) {
      return NextResponse.redirect(new URL('/dashboard/billing?error=no_order', request.url));
    }

    // Capture the payment
    const accessToken = await getPayPalAccessToken();
    
    const captureResponse = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const captureData = await captureResponse.json();

    if (captureData.status !== 'COMPLETED') {
      console.error('PayPal capture failed:', captureData);
      return NextResponse.redirect(new URL('/dashboard/billing?error=payment_failed', request.url));
    }

    // Get package info from purchase units
    const customId = captureData.purchase_units?.[0]?.custom_id;
    const pkg = TOKEN_PACKAGES.find(p => p.id === customId);

    if (!pkg) {
      console.error('Invalid package in PayPal order:', customId);
      return NextResponse.redirect(new URL('/dashboard/billing?error=invalid_package', request.url));
    }

    const totalTokens = pkg.tokens + pkg.bonus;

    // Credit tokens in a transaction
    await prisma.$transaction(async (tx) => {
      // Get current balance
      const tenant = await tx.tenant.findUnique({
        where: { id: user.tenantId },
        select: { tokenBalance: true },
      });

      const currentBalance = tenant?.tokenBalance || 0;
      const newBalance = currentBalance + totalTokens;

      // Update tenant balance
      await tx.tenant.update({
        where: { id: user.tenantId },
        data: { tokenBalance: newBalance },
      });

      // Record purchase transaction
      await tx.tokenTransaction.create({
        data: {
          tenantId: user.tenantId,
          type: 'PURCHASE',
          amount: totalTokens,
          balance: newBalance,
          paypalOrderId: orderId,
        },
      });

      // Record bonus if any
      if (pkg.bonus > 0) {
        await tx.tokenTransaction.create({
          data: {
            tenantId: user.tenantId,
            type: 'BONUS',
            amount: pkg.bonus,
            balance: newBalance,
          },
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: 'billing.purchase',
          entity: 'TokenTransaction',
          entityId: orderId,
          newValues: { 
            package: customId, 
            tokens: pkg.tokens, 
            bonus: pkg.bonus, 
            total: totalTokens 
          },
          tenantId: user.tenantId,
          userId: user.userId,
        },
      });
    });

    // Redirect to billing page with success
    return NextResponse.redirect(new URL('/dashboard/billing?success=true', request.url));
  } catch (error) {
    console.error('PayPal callback error:', error);
    return NextResponse.redirect(new URL('/dashboard/billing?error=server_error', request.url));
  }
}
