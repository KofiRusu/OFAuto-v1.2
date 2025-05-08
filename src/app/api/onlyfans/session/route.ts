import { NextRequest, NextResponse } from 'next/server';
import {
  validateSession,
  sessionExists,
  isSessionExpired,
  loadSession,
  OnlyFansSession
} from '../../../../../packages/onlyfans-bot/utils/session';
import loginAndSaveSession from '../../../../../packages/onlyfans-bot/loginAndSaveSession';

// Get session status
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const accountId = searchParams.get('accountId') || undefined;
    
    // Check if session exists
    const exists = await sessionExists(accountId);
    if (!exists) {
      return NextResponse.json({
        exists: false,
        isValid: false,
        isExpired: true,
        message: 'No session found'
      });
    }
    
    // Check if session is expired
    const expired = await isSessionExpired(accountId);
    
    // Validate session
    const isValid = await validateSession(accountId);
    
    // If session exists, get more details
    const sessionData = isValid ? await loadSession(accountId) : null;
    const expiryDate = sessionData?.timestamp ? new Date(sessionData.timestamp + (30 * 24 * 60 * 60 * 1000)) : null;
    
    return NextResponse.json({
      exists,
      isValid,
      isExpired: expired,
      expiresAt: expiryDate,
      expiresIn: expiryDate ? getExpiryTimeString(expiryDate) : null,
      lastLogin: sessionData?.timestamp ? new Date(sessionData.timestamp).toISOString() : null
    });
  } catch (error) {
    console.error('Error checking session status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

// Initiate login session
export async function POST(req: NextRequest) {
  try {
    const { accountId } = await req.json();
    
    // Check if we already have a valid session
    const isValid = await validateSession(accountId);
    if (isValid) {
      return NextResponse.json({
        success: true,
        message: 'Session already valid',
        action: 'none'
      });
    }
    
    // Return instructions for client to open popup window for login
    return NextResponse.json({
      success: true,
      message: 'Manual login required',
      action: 'redirect',
      loginUrl: `/dashboard/automation/onlyfans/login${accountId ? `?accountId=${accountId}` : ''}`
    });
  } catch (error) {
    console.error('Error initiating login session:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

// Helper function to get a human-readable expiry time
function getExpiryTimeString(expiryDate: Date): string {
  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return 'Expired';
  }
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  } else {
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
  }
} 