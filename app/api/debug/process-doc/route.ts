import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { processDocument } from '@/app/lib/document-processor';

/**
 * Force process a document by ID (for debugging)
 * GET /api/debug/process-doc?id=xxx
 */
export async function GET(request: NextRequest) {
  const docId = request.nextUrl.searchParams.get('id');
  
  if (!docId) {
    // List all documents with their status
    const docs = await prisma.document.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        rawContent: true,
        chunkCount: true,
        errorMessage: true,
        createdAt: true,
      },
    });
    
    return NextResponse.json({
      message: 'Add ?id=xxx to process a specific document',
      documents: docs.map(d => ({
        ...d,
        rawContent: d.rawContent ? `${d.rawContent.length} chars` : null,
      })),
    });
  }
  
  // Reset to PENDING first
  await prisma.document.update({
    where: { id: docId },
    data: { status: 'PENDING', errorMessage: null },
  });
  
  console.log(`[Debug] Force processing document ${docId}`);
  
  try {
    const result = await processDocument(docId);
    
    return NextResponse.json({
      success: true,
      documentId: docId,
      result,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      documentId: docId,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
