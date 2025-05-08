import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/src/lib/logger';

// Mock implementation of OnlyFans auth
const mockOnlyFansAuth = {
  authenticateWithCookies: async (platformId: string, cookiesData: string) => {
    // Simulate cookies validation
    const isValid = cookiesData.length > 20;
    return {
      success: isValid,
      error: isValid ? undefined : 'Invalid cookie data format or length'
    };
  }
};

/**
 * API route to authenticate and store OnlyFans session cookies.
 * Expects JSON body with platformId and cookiesData (JSON string or file path - assumes already validated by client/test endpoint)
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let cookiesData;
    let platformId;

    if (contentType.includes('application/json')) {
      const body = await request.json();
      platformId = body.platformId;
      cookiesData = body.cookiesJson;
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported Content-Type, expected application/json' },
        { status: 415 }
      );
    }

    if (!cookiesData || !platformId) {
      return NextResponse.json(
        { success: false, error: 'Missing cookies data or platform ID' },
        { status: 400 }
      );
    }

    logger.info('Authenticating OnlyFans session', { platformId });

    // Use mock implementation
    const result = await mockOnlyFansAuth.authenticateWithCookies(platformId, cookiesData);

    if (result.success) {
      logger.info('OnlyFans authentication successful', { platformId });
      return NextResponse.json({
        success: true,
        message: 'OnlyFans session authenticated successfully!'
      });
    } else {
      logger.warn('OnlyFans authentication failed', {
        platformId,
        error: result.error
      });
      return NextResponse.json(
        { success: false, error: result.error || 'Authentication failed' },
        { status: 401 }
      );
    }
  } catch (error) {
    logger.error('Error authenticating OnlyFans session', { error });
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 