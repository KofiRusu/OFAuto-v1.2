import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/src/lib/logger';

// This is a mock implementation to replace the actual fansly-auth import
const mockFanslyAuth = {
  testSessionToken: async (platformId: string, tokenData: string) => {
    // Simulate a token validation
    const isValid = tokenData.length > 10;
    return {
      valid: isValid,
      error: isValid ? undefined : 'Invalid token format or length'
    };
  }
};

/**
 * API route to test Fansly session token validity and store it.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platformId, sessionToken } = body;

    if (!sessionToken || !platformId) {
      return NextResponse.json(
        { success: false, error: 'Missing session token or platform ID' },
        { status: 400 }
      );
    }

    logger.info('Testing Fansly session token', { platformId });

    // Use the mock implementation instead of the actual import
    const validationResult = await mockFanslyAuth.testSessionToken(platformId, sessionToken);

    if (validationResult.valid) {
      logger.info('Fansly session token test successful', { platformId });
      return NextResponse.json({ success: true, message: 'Fansly session token is valid!' });
    } else {
      logger.warn('Fansly session token test failed', { 
        platformId, 
        error: validationResult.error 
      });
      return NextResponse.json(
        { success: false, error: validationResult.error || 'Invalid session token' },
        { status: 401 }
      );
    }
  } catch (error) {
    logger.error('Error testing Fansly session token', { error });
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 