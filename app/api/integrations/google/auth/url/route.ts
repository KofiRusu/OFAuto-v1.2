import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/src/lib/logger';

// This is a mock implementation to replace the actual google-auth import
const mockGoogleAuth = {
  generateAuthUrl: (platformId: string, redirectUri?: string) => {
    // In a real implementation, this would generate a proper Google OAuth URL
    // with the correct scopes, state, and redirect URI
    
    // Create a mock state parameter with the platformId
    const state = JSON.stringify({ platformId });
    
    // Return a mock Google auth URL
    return `https://accounts.google.com/o/oauth2/v2/auth?state=${encodeURIComponent(state)}&scope=https://www.googleapis.com/auth/drive&redirect_uri=${encodeURIComponent(redirectUri || 'http://localhost:3000/api/integrations/google/auth/callback')}&response_type=code&client_id=mock-client-id&access_type=offline&prompt=consent`;
  }
};

/**
 * API route to get the Google OAuth2 authorization URL.
 */
export async function GET(request: NextRequest) {
    try {
        // Get the platformId from the query string
        const { searchParams } = new URL(request.url);
        const platformId = searchParams.get('platformId');
        
        if (!platformId) {
            logger.error('Missing platformId in Google auth URL request');
            return NextResponse.json(
                { success: false, error: 'Missing platformId parameter' },
                { status: 400 }
            );
        }
        
        logger.info('Generating Google OAuth URL', { platformId });
        
        // Get the redirect URI from the query parameters or use the default
        const redirectUri = searchParams.get('redirectUri') || undefined;
        
        // Generate the auth URL using our mock implementation
        const authUrl = mockGoogleAuth.generateAuthUrl(platformId, redirectUri);
        
        return NextResponse.json({ success: true, url: authUrl });
    } catch (error) {
        logger.error('Error generating Google auth URL', { error });
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
} 