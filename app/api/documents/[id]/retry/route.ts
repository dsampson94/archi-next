import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/app/lib/prisma';
import { processDocument } from '@/app/lib/document-processor';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

async function validateAuth(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * POST /api/documents/[id]/retry - Retry processing a document SYNCHRONOUSLY
 * This waits for processing to complete and returns the result
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await validateAuth();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check document exists and belongs to tenant
    const document = await prisma.document.findFirst({
      where: {
        id: params.id,
        tenantId: auth.tenantId,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    console.log(`[Retry] Starting retry for document ${params.id}, current status: ${document.status}`);

    // Reset status to PENDING first
    await prisma.document.update({
      where: { id: params.id },
      data: {
        status: 'PENDING',
        errorMessage: null,
      },
    });

    // Process SYNCHRONOUSLY - wait for result
    const result = await processDocument(params.id);

    if (result.success) {
      console.log(`[Retry] Document ${params.id} processed successfully with ${result.chunkCount} chunks`);
      return NextResponse.json({
        success: true,
        message: 'Document processed successfully',
        chunkCount: result.chunkCount,
      });
    } else {
      console.error(`[Retry] Document ${params.id} processing failed: ${result.error}`);
      return NextResponse.json({
        success: false,
        error: result.error || 'Processing failed',
      }, { status: 500 });
    }
  } catch (error) {
    console.error(`[Retry] Error retrying document ${params.id}:`, error);
    
    // Make sure document status is updated on error
    try {
      await prisma.document.update({
        where: { id: params.id },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error during retry',
        },
      });
    } catch (updateError) {
      console.error('[Retry] Failed to update document status:', updateError);
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process document',
    }, { status: 500 });
  }
}
