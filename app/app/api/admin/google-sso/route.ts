import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await prisma.googleSSOConfig.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ 
      config: config ? {
        id: config.id,
        clientId: config.clientId,
        clientSecret: '********', // Mask the secret
        enabled: config.enabled
      } : null 
    });
  } catch (error) {
    console.error('Error fetching Google SSO config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clientId, clientSecret, enabled } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Check if config exists
    const existingConfig = await prisma.googleSSOConfig.findFirst();

    let config;
    if (existingConfig) {
      // Update existing config
      const updateData: any = {
        clientId,
        enabled: enabled ?? false
      };
      // Only update secret if it's not masked
      if (clientSecret && clientSecret !== '********') {
        updateData.clientSecret = clientSecret;
      }
      
      config = await prisma.googleSSOConfig.update({
        where: { id: existingConfig.id },
        data: updateData
      });
    } else {
      // Create new config
      if (!clientSecret || clientSecret === '********') {
        return NextResponse.json({ error: 'Client Secret is required for initial setup' }, { status: 400 });
      }
      
      config = await prisma.googleSSOConfig.create({
        data: {
          clientId,
          clientSecret,
          enabled: enabled ?? false
        }
      });
    }

    // Update environment variables for runtime
    if (config.enabled) {
      process.env.GOOGLE_CLIENT_ID = config.clientId;
      process.env.GOOGLE_CLIENT_SECRET = config.clientSecret;
    }

    return NextResponse.json({ 
      success: true,
      config: {
        id: config.id,
        clientId: config.clientId,
        clientSecret: '********',
        enabled: config.enabled
      }
    });
  } catch (error) {
    console.error('Error saving Google SSO config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
