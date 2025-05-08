import { NextRequest, NextResponse } from 'next/server';
import loginAndSaveSession from '../../../../../packages/onlyfans-bot/loginAndSaveSession';
import { validateSession } from '../../../../../packages/onlyfans-bot/utils/session';
import { exec } from 'child_process';
import { promisify } from 'util';

// Promisify exec
const execPromise = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const { accountId } = await req.json();
    
    // Check if we already have a valid session
    const isValid = await validateSession(accountId);
    if (isValid) {
      return NextResponse.json({
        success: true,
        message: 'Session already valid, no login needed',
      });
    }
    
    // In a real production environment, this would be implemented differently
    // We spawn a separate process to handle the browser-based login
    // because the browser needs to be visible to the user
    
    const scriptPath = accountId 
      ? `node ../../../../../packages/onlyfans-bot/loginAndSaveSession.js ${accountId}` 
      : 'node ../../../../../packages/onlyfans-bot/loginAndSaveSession.js';
    
    // Execute the login script in a non-blocking way
    // In production, this would be handled through a job queue system
    exec(scriptPath, (error, stdout, stderr) => {
      if (error) {
        console.error(`Login script error: ${error}`);
        return;
      }
      
      console.log(`Login script output: ${stdout}`);
      
      if (stderr) {
        console.error(`Login script stderr: ${stderr}`);
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Login process initiated. Please complete login in the browser window.',
    });
  } catch (error) {
    console.error('Error in OnlyFans login API route:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}

// Handle preflight CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 