import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/app/lib/prisma';
import { processDocument, extractTextFromBuffer } from '@/app/lib/document-processor';
import { uploadFile, generateFileKey, isStorageConfigured } from '@/app/lib/s3';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// File type mapping
const FILE_TYPE_MAP: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'text/plain': 'TXT',
  'text/markdown': 'MD',
  'text/html': 'HTML',
  'text/csv': 'CSV',
  'application/json': 'JSON',
};

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

/**
 * GET /api/documents - List all documents for the tenant
 */
export async function GET(request: NextRequest) {
  const auth = await validateAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const knowledgeBaseId = searchParams.get('knowledgeBaseId');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  
  try {
    const where: Record<string, unknown> = {
      tenantId: auth.tenantId,
    };
    
    if (status) {
      where.status = status;
    }
    
    if (knowledgeBaseId) {
      where.knowledgeBaseId = knowledgeBaseId;
    }
    
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          knowledgeBase: {
            select: { id: true, name: true },
          },
          uploadedBy: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.document.count({ where }),
    ]);
    
    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

/**
 * POST /api/documents - Upload a new document
 */
export async function POST(request: NextRequest) {
  const auth = await validateAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const contentType = request.headers.get('content-type') || '';
    
    // Handle multipart form data (file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const title = formData.get('title') as string | null;
      const description = formData.get('description') as string | null;
      const knowledgeBaseId = formData.get('knowledgeBaseId') as string | null;
      const tags = formData.get('tags') as string | null;
      
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }
      
      // Validate file type
      const fileType = FILE_TYPE_MAP[file.type];
      if (!fileType) {
        return NextResponse.json(
          { error: `Unsupported file type: ${file.type}. Supported types: PDF, DOCX, TXT, MD, HTML, CSV, JSON` },
          { status: 400 }
        );
      }
      
      // Check tenant limits
      const tenant = await prisma.tenant.findUnique({
        where: { id: auth.tenantId },
        select: { maxDocuments: true },
      });
      
      const documentCount = await prisma.document.count({
        where: { tenantId: auth.tenantId },
      });
      
      if (tenant && documentCount >= tenant.maxDocuments) {
        return NextResponse.json(
          { error: `Document limit reached (${tenant.maxDocuments}). Please upgrade your plan.` },
          { status: 403 }
        );
      }
      
      // Read file content
      const buffer = Buffer.from(await file.arrayBuffer());
      let rawContent: string | null = null;
      let fileUrl: string | null = null;
      
      // Try to extract text immediately for supported types
      try {
        rawContent = await extractTextFromBuffer(buffer, fileType);
      } catch {
        // Will be processed later from fileUrl
      }
      
      // Upload to S3 if configured, otherwise store content directly
      if (isStorageConfigured()) {
        try {
          const fileKey = generateFileKey(auth.tenantId, file.name, {
            type: 'documents',
          });
          const uploadResult = await uploadFile(buffer, fileKey, file.type);
          fileUrl = uploadResult.url;
        } catch (error) {
          console.error('S3 upload failed:', error);
          // Continue without file URL - we have the raw content
          if (!rawContent) {
            return NextResponse.json(
              { error: 'File upload failed and could not extract text content. Please check S3 configuration.' },
              { status: 500 }
            );
          }
        }
      } else {
        // No S3 configured - store as data URL for small files or just use raw content
        if (file.size < 5 * 1024 * 1024) { // 5MB limit for data URLs
          const base64 = buffer.toString('base64');
          fileUrl = `data:${file.type};base64,${base64}`;
        }
      }
      
      // Create document record
      const document = await prisma.document.create({
        data: {
          title: title || file.name.replace(/\.[^/.]+$/, ''),
          description,
          fileName: file.name,
          fileType: fileType as 'PDF' | 'DOCX' | 'TXT' | 'MD' | 'HTML' | 'CSV' | 'JSON',
          fileSize: file.size,
          fileUrl,
          rawContent,
          status: 'PENDING',
          tags: typeof tags === 'string' && tags ? tags.split(',').map((t) => t.trim()) : [],
          tenantId: auth.tenantId,
          knowledgeBaseId,
          uploadedById: auth.userId,
        },
      });
      
      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'document.upload',
          entity: 'Document',
          entityId: document.id,
          newValues: { title: document.title, fileName: document.fileName },
          tenantId: auth.tenantId,
          userId: auth.userId,
        },
      });
      
      // Start processing in background
      // In production, this should be a queue job
      processDocument(document.id).catch((error) => {
        console.error(`[Document] Background processing error for ${document.id}:`, error);
      });
      
      return NextResponse.json({
        success: true,
        document: {
          id: document.id,
          title: document.title,
          fileName: document.fileName,
          status: document.status,
        },
        message: 'Document uploaded successfully. Processing started.',
      });
    }
    
    // Handle JSON body (text content upload)
    const body = await request.json();
    const { title, content, description, knowledgeBaseId, tags } = body;
    
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }
    
    // Create document with raw content
    const document = await prisma.document.create({
      data: {
        title,
        description,
        fileName: `${title.toLowerCase().replace(/\s+/g, '-')}.txt`,
        fileType: 'TXT',
        fileSize: Buffer.byteLength(content, 'utf8'),
        rawContent: content,
        status: 'PENDING',
        tags: tags || [],
        tenantId: auth.tenantId,
        knowledgeBaseId,
        uploadedById: auth.userId,
      },
    });
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'document.create',
        entity: 'Document',
        entityId: document.id,
        newValues: { title: document.title },
        tenantId: auth.tenantId,
        userId: auth.userId,
      },
    });
    
    // Start processing
    processDocument(document.id).catch((error) => {
      console.error(`[Document] Background processing error for ${document.id}:`, error);
    });
    
    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        status: document.status,
      },
      message: 'Document created successfully. Processing started.',
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
