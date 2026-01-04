import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/app/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  userId: string;
  tenantId: string;
}

async function validateAuth(request: NextRequest): Promise<JWTPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * GET /api/knowledge-bases - List all knowledge bases
 */
export async function GET(request: NextRequest) {
  const auth = await validateAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const knowledgeBases = await prisma.knowledgeBase.findMany({
      where: { tenantId: auth.tenantId },
      include: {
        _count: {
          select: { documents: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json({ knowledgeBases });
  } catch (error) {
    console.error('Error fetching knowledge bases:', error);
    return NextResponse.json({ error: 'Failed to fetch knowledge bases' }, { status: 500 });
  }
}

/**
 * POST /api/knowledge-bases - Create a new knowledge base
 */
export async function POST(request: NextRequest) {
  const auth = await validateAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { name, description, isPublic } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    const knowledgeBase = await prisma.knowledgeBase.create({
      data: {
        name,
        description,
        isPublic: isPublic || false,
        tenantId: auth.tenantId,
      },
    });
    
    return NextResponse.json({ success: true, knowledgeBase });
  } catch (error) {
    console.error('Error creating knowledge base:', error);
    return NextResponse.json({ error: 'Failed to create knowledge base' }, { status: 500 });
  }
}
