import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/app/lib/prisma';
import { processDocument } from '@/app/lib/document-processor';
import { deleteDocumentVectors } from '@/app/lib/pinecone';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

async function validateAuth(request: NextRequest): Promise<JWTPayload | null> {
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

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/documents/[id] - Get a specific document
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await validateAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const document = await prisma.document.findFirst({
      where: {
        id: params.id,
        tenantId: auth.tenantId,
      },
      include: {
        knowledgeBase: {
          select: { id: true, name: true },
        },
        uploadedBy: {
          select: { id: true, name: true },
        },
        chunks: {
          select: {
            id: true,
            chunkIndex: true,
            pageNumber: true,
            content: true,
          },
          orderBy: { chunkIndex: 'asc' },
        },
      },
    });
    
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
}

/**
 * PATCH /api/documents/[id] - Update a document
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await validateAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { title, description, knowledgeBaseId, tags } = body;
    
    // Check document exists and belongs to tenant
    const existing = await prisma.document.findFirst({
      where: {
        id: params.id,
        tenantId: auth.tenantId,
      },
    });
    
    if (!existing) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    // Build update data
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (knowledgeBaseId !== undefined) updateData.knowledgeBaseId = knowledgeBaseId;
    if (tags !== undefined) updateData.tags = tags;
    
    const document = await prisma.document.update({
      where: { id: params.id },
      data: updateData,
    });
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'document.update',
        entity: 'Document',
        entityId: document.id,
        oldValues: { title: existing.title, description: existing.description },
        newValues: updateData as any,
        tenantId: auth.tenantId,
        userId: auth.userId,
      },
    });
    
    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}

/**
 * DELETE /api/documents/[id] - Delete a document
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await validateAuth(request);
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
    
    // Try to delete vectors from Pinecone (don't fail if they don't exist)
    try {
      await deleteDocumentVectors(auth.tenantId, params.id);
    } catch (error) {
      console.warn('Failed to delete vectors from Pinecone (may not exist):', error);
      // Continue with document deletion
    }
    
    // Delete chunks first
    await prisma.documentChunk.deleteMany({
      where: { documentId: params.id },
    });
    
    // Delete document
    await prisma.document.delete({
      where: { id: params.id },
    });
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'document.delete',
        entity: 'Document',
        entityId: params.id,
        oldValues: { title: document.title, fileName: document.fileName },
        tenantId: auth.tenantId,
        userId: auth.userId,
      },
    });
    
    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}

/**
 * POST /api/documents/[id]/reprocess - Reprocess a document
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await validateAuth(request);
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
    
    // Reset status to pending
    await prisma.document.update({
      where: { id: params.id },
      data: { 
        status: 'PENDING',
        errorMessage: null,
      },
    });
    
    // Start reprocessing
    processDocument(params.id).catch((error) => {
      console.error(`[Document] Reprocessing error for ${params.id}:`, error);
    });
    
    return NextResponse.json({
      success: true,
      message: 'Document reprocessing started',
    });
  } catch (error) {
    console.error('Error reprocessing document:', error);
    return NextResponse.json({ error: 'Failed to reprocess document' }, { status: 500 });
  }
}
