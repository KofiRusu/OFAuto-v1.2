import { NextResponse } from 'next/server';
import { verifyWebhookPayload, handleWebhookEvent } from '@/integrations/kofi/kofi-webhook';
import { prisma } from '@/lib/prisma';

/**
 * POST handler for Ko-fi webhook events
 * This endpoint receives events from Ko-fi like donations, subscriptions, shop orders
 */
export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json();

    // Verify the webhook payload
    if (!verifyWebhookPayload(body)) {
      console.error('Invalid Ko-fi webhook payload');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get the platform ID from the query parameter
    const url = new URL(req.url);
    const platformId = url.searchParams.get('platformId');
    
    if (!platformId) {
      return new NextResponse('Missing platformId parameter', { status: 400 });
    }

    // Verify the platform exists
    const platform = await prisma.platform.findUnique({
      where: { id: platformId },
    });

    if (!platform) {
      return new NextResponse('Invalid platform ID', { status: 400 });
    }

    // Handle the webhook event
    const success = await handleWebhookEvent(body, platformId);

    if (!success) {
      return new NextResponse('Error processing webhook', { status: 500 });
    }

    // Return success
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Error processing Ko-fi webhook:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
} 