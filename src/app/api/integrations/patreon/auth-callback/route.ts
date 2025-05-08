import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';
import { PatreonIntegration } from '@/integrations/patreon/patreon-integration';

/**
 * GET handler for Patreon OAuth callback
 * This endpoint handles the callback from Patreon after a user authenticates
 */
export async function GET(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('Patreon auth error:', error);
      return NextResponse.redirect(
        new URL(`/dashboard/integrations?error=${encodeURIComponent(error)}`, req.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=missing_code', req.url)
      );
    }

    // Validate state to prevent CSRF attacks
    // In a real implementation, we'd verify state against a stored value
    // For this scaffold, we'll skip that

    // Find user ID in database
    const user = await prisma.user.findFirst({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=user_not_found', req.url)
      );
    }

    // Extract platformId from state or use default naming
    let platformId: string;
    let clientId: string;
    
    if (state) {
      try {
        const stateData = JSON.parse(atob(state));
        platformId = stateData.platformId;
        clientId = stateData.clientId;
      } catch (e) {
        return NextResponse.redirect(
          new URL('/dashboard/integrations?error=invalid_state', req.url)
        );
      }
    } else {
      // Create a new platform
      const client = await prisma.client.findFirst({
        where: { userId: user.id },
      });
      
      if (!client) {
        return NextResponse.redirect(
          new URL('/dashboard/integrations?error=no_client', req.url)
        );
      }
      
      clientId = client.id;
      
      // Create new platform for Patreon
      const newPlatform = await prisma.platform.create({
        data: {
          clientId,
          userId: user.id,
          platformType: 'patreon',
          username: 'patreon-user', // Will be updated later
          isActive: true,
        },
      });
      
      platformId = newPlatform.id;
    }

    // Get token from Patreon
    const integration = new PatreonIntegration(platformId);
    const result = await integration.authenticate(code);

    if (!result.successful) {
      return NextResponse.redirect(
        new URL(`/dashboard/integrations?error=${encodeURIComponent(result.error || 'auth_failed')}`, req.url)
      );
    }

    // Update the platform with the token
    await prisma.platform.update({
      where: { id: platformId },
      data: {
        accessToken: 'Stored securely via CredentialService',
        isActive: true,
        updatedAt: new Date(),
      },
    });

    // Redirect to dashboard
    return NextResponse.redirect(
      new URL('/dashboard/integrations?success=true', req.url)
    );
  } catch (error) {
    console.error('Error processing Patreon auth callback:', error);
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=server_error', req.url)
    );
  }
} 