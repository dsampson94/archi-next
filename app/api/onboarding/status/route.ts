import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // TODO: Get actual tenant ID from session/auth
    const tenantId = '6ab88313-2227-45e8-b91f-f7b80f22131b'; // Demo tenant

    // Check if onboarding is complete
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        agents: true,
        documents: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ completed: false });
    }

    // Onboarding is complete if:
    // 1. Has at least one agent configured
    // 2. Has at least one document uploaded (optional)
    const hasAgent = tenant.agents.length > 0;
    const hasDocuments = tenant.documents.length > 0;

    const completed = hasAgent; // Documents are optional

    return NextResponse.json({
      completed,
      hasAgent,
      hasDocuments,
      agentCount: tenant.agents.length,
      documentCount: tenant.documents.length,
    });
  } catch (error) {
    console.error('[Onboarding] Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check onboarding status' },
      { status: 500 }
    );
  }
}
