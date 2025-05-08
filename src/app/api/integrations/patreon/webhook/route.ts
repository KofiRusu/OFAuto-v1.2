import { NextResponse } from 'next/server';
import { verifyWebhookSignature, handleWebhookEvent } from '@/integrations/patreon/patreon-webhook';
import { prisma } from '@/lib/prisma';

/**
 * POST handler for Patreon webhook events
 * This endpoint receives events from Patreon like new pledges, pledge changes, etc.
 */
export async function POST(req: Request) {
  try {
    // Get the raw body text for signature verification
    const bodyText = await req.text();

    // Get the signature from the header
    const signature = req.headers.get('x-patreon-signature') || undefined;

    // Verify the signature
    if (!verifyWebhookSignature(signature, bodyText)) {
      console.error('Invalid Patreon webhook signature');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse the body
    const data = JSON.parse(bodyText);
    
    // Get the trigger from the header (event type)
    const trigger = req.headers.get('x-patreon-event');
    if (!trigger) {
      return new NextResponse('Missing X-Patreon-Event header', { status: 400 });
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
    const success = await handleWebhookEvent(trigger, data, platformId);

    if (!success) {
      return new NextResponse('Error processing webhook', { status: 500 });
    }

    // Return success
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Error processing Patreon webhook:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
} 