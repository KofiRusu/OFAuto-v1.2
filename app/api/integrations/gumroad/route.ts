import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Gumroad integration API endpoint',
    integration: 'gumroad'
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Mock implementation of Gumroad integration
    return NextResponse.json({
      success: true,
      message: 'Gumroad integration API endpoint - POST',
      received: body
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 