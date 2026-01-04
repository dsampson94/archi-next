import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  tenantName: string;
}

async function verifyAuth(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * POST /api/team/invite - Invite a new team member
 */
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin/owner can invite
    if (user.role !== 'admin' && user.role !== 'owner') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { email, name, role = 'member' } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['member', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be member or admin.' },
        { status: 400 }
      );
    }

    // Check if user already exists in tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        tenantId: user.tenantId,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists in your team' },
        { status: 400 }
      );
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        tenantId: user.tenantId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'team.invite',
        entity: 'User',
        entityId: newUser.id,
        newValues: { email, name, role, invitedBy: user.email },
        tenantId: user.tenantId,
        userId: user.userId,
      },
    });

    // TODO: Send invitation email with temp password
    // For now, return the temp password in development
    const isDev = process.env.NODE_ENV === 'development';

    return NextResponse.json({
      success: true,
      user: newUser,
      ...(isDev && { tempPassword }),
      message: isDev 
        ? `User invited successfully. Temporary password: ${tempPassword}`
        : 'User invited successfully. An email has been sent with login instructions.',
    });
  } catch (error) {
    console.error('Team invite error:', error);
    return NextResponse.json(
      { error: 'Failed to invite team member' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/team/invite - Remove a team member
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin/owner can remove members
    if (user.role !== 'admin' && user.role !== 'owner') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('id');

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    // Prevent self-removal
    if (memberId === user.userId) {
      return NextResponse.json(
        { error: 'You cannot remove yourself from the team' },
        { status: 400 }
      );
    }

    // Find the member
    const member = await prisma.user.findFirst({
      where: {
        id: memberId,
        tenantId: user.tenantId,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Prevent removing owners
    if (member.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot remove the account owner' },
        { status: 400 }
      );
    }

    // Deactivate the user (soft delete)
    await prisma.user.update({
      where: { id: memberId },
      data: { isActive: false },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'team.remove',
        entity: 'User',
        entityId: memberId,
        oldValues: { email: member.email, name: member.name },
        tenantId: user.tenantId,
        userId: user.userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Team member removed successfully',
    });
  } catch (error) {
    console.error('Team remove error:', error);
    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/team/invite - Update member role
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin/owner can update roles
    if (user.role !== 'admin' && user.role !== 'owner') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { memberId, role } = body;

    if (!memberId || !role) {
      return NextResponse.json(
        { error: 'Member ID and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['member', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be member or admin.' },
        { status: 400 }
      );
    }

    // Find the member
    const member = await prisma.user.findFirst({
      where: {
        id: memberId,
        tenantId: user.tenantId,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Prevent changing owner role
    if (member.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot change the role of the account owner' },
        { status: 400 }
      );
    }

    // Update role
    const updatedUser = await prisma.user.update({
      where: { id: memberId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'team.role_change',
        entity: 'User',
        entityId: memberId,
        oldValues: { role: member.role },
        newValues: { role },
        tenantId: user.tenantId,
        userId: user.userId,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Role updated successfully',
    });
  } catch (error) {
    console.error('Team role update error:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}
