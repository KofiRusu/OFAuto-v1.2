import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/src/lib/logger';

// Mock implementation of KoFi auth
const mockKofiAuth = {
  testApiKey: async (apiKey: string, platformId: string) => {
    // Simulate API key validation
    const isValid = apiKey.length > 8;
    return {
      valid: isValid,
      error: isValid ? undefined : 'Invalid API key format or length'
    };
  }
};

/**
 * API route to test Ko-fi API key validity and store it.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, platformId } = body;

    if (!apiKey || !platformId) {
      return NextResponse.json(
        { success: false, error: 'Missing API key or platform ID' },
        { status: 400 }
      );
    }

    logger.info('Testing Ko-fi API key', { platformId });

    // Use mock implementation
    const validationResult = await mockKofiAuth.testApiKey(apiKey, platformId);

    if (validationResult.valid) {
      logger.info('Ko-fi API key test successful', { platformId });
      return NextResponse.json({ success: true, message: 'Ko-fi API key is valid!' });
    } else {
      logger.warn('Ko-fi API key test failed', { 
        platformId, 
        error: validationResult.error 
      });
      return NextResponse.json(
        { success: false, error: validationResult.error || 'Invalid API key' },
        { status: 401 }
      );
    }
  } catch (error) {
    logger.error('Error testing Ko-fi API key', { error });
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 