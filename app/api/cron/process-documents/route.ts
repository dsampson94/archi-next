import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { processDocument } from '@/app/lib/document-processor';

/**
 * Cron job to process pending documents
 * Vercel Cron: every 5 minutes
 * Or call manually: GET /api/cron/process-documents
 */
export async function GET(request: NextRequest) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Find pending documents (not older than 24 hours to avoid processing stuck ones forever)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const pendingDocuments = await prisma.document.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          gte: oneDayAgo,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 5, // Process 5 at a time to avoid timeout
    });
    
    console.log(`[Cron] Found ${pendingDocuments.length} pending documents to process`);
    
    const results = [];
    
    for (const doc of pendingDocuments) {
      console.log(`[Cron] Processing document ${doc.id}`);
      
      try {
        const result = await processDocument(doc.id);
        results.push({
          documentId: doc.id,
          success: result.success,
          chunkCount: result.chunkCount,
          error: result.error,
        });
      } catch (error) {
        console.error(`[Cron] Failed to process document ${doc.id}:`, error);
        results.push({
          documentId: doc.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('[Cron] Error in process-documents cron:', error);
    return NextResponse.json(
      { error: 'Failed to process documents' },
      { status: 500 }
    );
  }
}
