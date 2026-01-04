import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import prisma from '@/app/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, companyName } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create tenant slug from company name
    const tenantName = companyName || `${name}'s Workspace`;
    const slug = tenantName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    // Create tenant and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          slug,
          plan: 'STARTER',
          status: 'TRIAL',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        },
      });

      // Create user as owner
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          name,
          role: 'OWNER',
          tenantId: tenant.id,
        },
      });

      // Create default knowledge base
      await tx.knowledgeBase.create({
        data: {
          name: 'General Knowledge',
          description: 'Default knowledge base for your documents',
          tenantId: tenant.id,
        },
      });

      // Create default agent
      await tx.agent.create({
        data: {
          name: 'Archi',
          description: 'Your AI assistant',
          systemPrompt: `You are Archi, a helpful AI assistant for ${tenantName}. You answer questions based only on the documents and knowledge provided to you. If you don't know something or can't find relevant information, say so honestly and offer to connect the user with a human team member.

Key behaviors:
- Be concise and clear
- Always cite sources when possible
- Admit uncertainty when appropriate
- Be professional but friendly
- Never make up information`,
          greetingMessage: `Hi! I'm Archi, your AI assistant. How can I help you today?`,
          tenantId: tenant.id,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: 'user.register',
          entity: 'User',
          entityId: user.id,
          newValues: { email: user.email, name: user.name },
          tenantId: tenant.id,
          userId: user.id,
        },
      });

      return { user, tenant };
    });

    // Create JWT token
    const token = await new SignJWT({
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      tenantId: result.tenant.id,
      tenantName: result.tenant.name,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        tenantId: result.tenant.id,
        tenantName: result.tenant.name,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
