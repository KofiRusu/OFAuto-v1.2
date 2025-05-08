import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/src/lib/logger';

// Mock implementation of OnlyFans auth
const mockOnlyFansAuth = {
  testSessionCookies: async (platformId: string, cookiesData: string) => {
    // Simulate cookies validation
    const isValid = cookiesData.length > 20;
    return {
      valid: isValid,
      error: isValid ? undefined : 'Invalid cookie data format or length'
    };
  }
};

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let platformId;
    let cookiesData;

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

    logger.info('Testing OnlyFans session cookies', { platformId });

    // Use the mock implementation
    const validationResult = await mockOnlyFansAuth.testSessionCookies(platformId, cookiesData);
    
    if (validationResult.valid) {
      logger.info('OnlyFans session cookie test successful', { platformId });
      return NextResponse.json({ success: true, message: 'OnlyFans session cookies are valid!' });
    } else {
      logger.warn('OnlyFans session cookie test failed', { 
        platformId, 
        error: validationResult.error 
      });
      return NextResponse.json(
        { success: false, error: validationResult.error || 'Invalid session cookies' },
        { status: 401 }
      );
    }
  } catch (error) {
    logger.error('Error testing OnlyFans cookies', { error });
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 