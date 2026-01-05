import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/app/lib/prisma';

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

/**
 * GET /api/onboarding/status - Get onboarding completion status
 * Returns what setup steps have been completed for self-service tracking
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all relevant data in parallel for performance
    const [tenant, agent, documents, completedDocs, customers, whatsappNumber] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: user.tenantId },
        select: {
          id: true,
          name: true,
          plan: true,
          status: true,
          trialEndsAt: true,
          maxDocuments: true,
          maxMessages: true,
          createdAt: true,
        },
      }),
      prisma.agent.findFirst({
        where: { tenantId: user.tenantId, isActive: true },
        select: {
          id: true,
          name: true,
          systemPrompt: true,
          greetingMessage: true,
          greeting: true,
        },
      }),
      prisma.document.count({
        where: { tenantId: user.tenantId },
      }),
      prisma.document.count({
        where: { tenantId: user.tenantId, status: 'COMPLETED' },
      }),
      prisma.customerContact.count({
        where: { tenantId: user.tenantId, isActive: true },
      }),
      prisma.whatsappNumber.findFirst({
        where: { tenantId: user.tenantId, isActive: true },
        select: { id: true, phoneNumber: true, isVerified: true },
      }),
    ]);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Calculate days remaining in trial
    const trialDaysRemaining = tenant.trialEndsAt
      ? Math.max(0, Math.ceil((new Date(tenant.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;

    // Determine onboarding completion
    const steps = {
      accountCreated: true, // If they're here, account exists
      agentConfigured: !!agent && !!agent.systemPrompt && agent.systemPrompt.length > 20,
      documentsUploaded: documents > 0,
      documentsProcessed: completedDocs > 0,
      customersAdded: customers > 0,
      whatsappConnected: !!whatsappNumber && whatsappNumber.isVerified,
    };

    // Core steps for basic functionality (excluding optional steps)
    const coreSteps = {
      agentConfigured: steps.agentConfigured,
      documentsUploaded: steps.documentsUploaded,
    };

    const completedCoreSteps = Object.values(coreSteps).filter(Boolean).length;
    const totalCoreSteps = Object.keys(coreSteps).length;
    const completionPercent = Math.round((completedCoreSteps / totalCoreSteps) * 100);

    // Determine what to show/hide in wizard
    const showOnboardingWizard = !steps.agentConfigured || !steps.documentsUploaded;
    
    // Suggestions for next steps
    const nextSteps: string[] = [];
    if (!steps.agentConfigured) nextSteps.push('Configure your AI agent\'s behavior and responses');
    if (!steps.documentsUploaded) nextSteps.push('Upload documents to create your knowledge base');
    if (!steps.whatsappConnected) nextSteps.push('Connect your WhatsApp Business number');
    if (!steps.customersAdded && steps.whatsappConnected) nextSteps.push('Add customer phone numbers');

    return NextResponse.json({
      // Legacy fields for backward compatibility
      completed: steps.agentConfigured,
      hasAgent: steps.agentConfigured,
      hasDocuments: steps.documentsUploaded,
      agentCount: agent ? 1 : 0,
      documentCount: documents,
      
      // New comprehensive onboarding status
      onboarding: {
        steps,
        completedSteps: completedCoreSteps,
        totalSteps: totalCoreSteps,
        completionPercent,
        showOnboardingWizard,
        nextSteps,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        plan: tenant.plan,
        status: tenant.status,
        trialDaysRemaining,
        createdAt: tenant.createdAt,
      },
      limits: {
        maxDocuments: tenant.maxDocuments,
        usedDocuments: documents,
        maxMessages: tenant.maxMessages,
        documentsRemaining: Math.max(0, tenant.maxDocuments - documents),
      },
      agent: agent ? {
        id: agent.id,
        name: agent.name,
        hasSystemPrompt: !!agent.systemPrompt,
        hasGreeting: !!(agent.greetingMessage || agent.greeting),
      } : null,
      stats: {
        documentCount: documents,
        processedDocuments: completedDocs,
        customerCount: customers,
        hasWhatsApp: !!whatsappNumber,
        whatsappVerified: whatsappNumber?.isVerified || false,
      },
    });
  } catch (error) {
    console.error('[Onboarding] Status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch onboarding status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/onboarding/complete - Mark onboarding as complete
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Log onboarding completion
    await prisma.auditLog.create({
      data: {
        action: 'onboarding.complete',
        entity: 'Tenant',
        entityId: user.tenantId,
        newValues: { completedAt: new Date().toISOString(), userId: user.userId },
        tenantId: user.tenantId,
        userId: user.userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Onboarding marked as complete',
    });
  } catch (error) {
    console.error('[Onboarding] Complete error:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
