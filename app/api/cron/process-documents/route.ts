import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { processDocument } from '@/app/lib/document-processor';

/**
 * Cron job to process pending documents
 * Vercel Cron: every 5 minutes
 * Can also be called manually: GET /api/cron/process-documents
 * 
 * NOTE: Vercel Cron doesn't send Authorization header - it uses its own verification
 * For manual calls, optionally check CRON_SECRET
 */
export async function GET(request: NextRequest) {
  // For manual calls (not from Vercel cron), optionally check secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const userAgent = request.headers.get('user-agent') || '';
  const isVercelCron = userAgent.includes('vercel-cron');
  
  // Only check auth for non-Vercel-cron requests if CRON_SECRET is set
  if (cronSecret && !isVercelCron && authHeader !== `Bearer ${cronSecret}`) {
    console.log('[Cron] Unauthorized request - not from Vercel cron and missing/invalid secret');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  console.log(`[Cron] Document processing started (source: ${isVercelCron ? 'Vercel Cron' : 'Manual'})`);
  
  try {
    // Find pending documents (not older than 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    
    // Find documents that are:
    // 1. PENDING status (new uploads)
    // 2. PROCESSING status but updated more than 2 minutes ago (stuck documents)
    const pendingDocuments = await prisma.document.findMany({
      where: {
        OR: [
          {
            status: 'PENDING',
            createdAt: {
              gte: oneDayAgo,
            },
          },
          {
            status: 'PROCESSING',
            updatedAt: {
              lt: twoMinutesAgo,
            },
            createdAt: {
              gte: oneDayAgo,
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 2, // Process only 2 at a time to avoid 60s timeout
    });
    
    // Reset stuck PROCESSING documents back to PENDING
    for (const doc of pendingDocuments) {
      if (doc.status === 'PROCESSING') {
        console.log(`[Cron] Resetting stuck document ${doc.id} from PROCESSING to PENDING`);
        await prisma.document.update({
          where: { id: doc.id },
          data: { status: 'PENDING' },
        });
      }
    }
    
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
