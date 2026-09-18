import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// GET - Public check of whether sign-up is currently enabled
export async function GET() {
  try {
    const config = await prisma.lLMConfig.findFirst();
    // Default to enabled when no config row exists yet
    const enabled = config ? config.signupEnabled : true;
    return NextResponse.json({ enabled });
  } catch (error) {
    console.error('Error checking signup status:', error);
    // Fail open so a transient DB issue doesn't lock out registration
    return NextResponse.json({ enabled: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Block sign-up when disabled by the administrator
    const config = await prisma.lLMConfig.findFirst();
    if (config && !config.signupEnabled) {
      return NextResponse.json(
        { error: 'New account registration is currently disabled.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with isApproved: false (disabled by default)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        role: 'USER',
        isApproved: false
      }
    });

    return NextResponse.json({
      success: true,
      pendingApproval: true,
      message: 'Account created successfully. Your account is pending administrator approval.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
