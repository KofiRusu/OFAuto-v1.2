import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { buffer } from 'node:stream/consumers';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  try {
    // Get the raw request body for signature verification
    const rawBody = await buffer(req.body as ReadableStream);
    const body = rawBody.toString('utf8');
    
    // Get the signature from headers
    const signature = headers().get('stripe-signature');
    
    if (!signature) {
      logger.error('No Stripe signature found in request headers');
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err: any) {
      logger.error({ error: err.message }, 'Stripe webhook signature verification failed');
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    // Log the event type
    logger.info({ eventType: event.type }, 'Received Stripe webhook event');

    // Process supported event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        logger.info({ sessionId: session.id }, 'Checkout session completed');
        // Add additional processing here as needed
        break;
      }
      
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        logger.info({ invoiceId: invoice.id }, 'Invoice paid');
        // Add additional processing here as needed
        break;
      }
      
      default: {
        logger.warn({ eventType: event.type }, 'Unhandled Stripe webhook event type');
        return NextResponse.json(
          { error: 'Unhandled webhook event type' },
          { status: 400 }
        );
      }
    }

    // Return a 200 success response to acknowledge receipt of the event
    return NextResponse.json({ received: true });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error processing Stripe webhook');
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}

// Handler functions for different event types

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    // Get the customer ID and metadata from the session
    const customerId = session.customer as string;
    const userId = session.metadata?.userId;
    
    if (!userId) {
      logger.error({ sessionId: session.id }, 'No user ID found in session metadata');
      return;
    }

    // Update user subscription status in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeCustomerId: customerId,
        // Set other subscription-related fields
        subscriptionStatus: 'active',
        subscriptionTier: session.metadata?.tier || 'basic',
        subscriptionUpdatedAt: new Date(),
      },
    });

    // Log the successful subscription
    logger.info({ userId, sessionId: session.id }, 'User subscription activated');
  } catch (error: any) {
    logger.error({ error: error.message, sessionId: session.id }, 'Failed to process checkout completion');
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Log successful payment
    logger.info({ paymentIntentId: paymentIntent.id }, 'Payment succeeded');
    
    // Here you would typically:
    // 1. Update payment records in your database
    // 2. Grant access to purchased items/features
    // 3. Send confirmation email/notification
  } catch (error: any) {
    logger.error({ error: error.message, paymentIntentId: paymentIntent.id }, 'Failed to process payment success');
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = invoice.subscription as string;
    
    // Log invoice payment
    logger.info({ invoiceId: invoice.id, subscriptionId }, 'Invoice paid');
    
    // Extend subscription period in your database
    // Update subscription_valid_until date
  } catch (error: any) {
    logger.error({ error: error.message, invoiceId: invoice.id }, 'Failed to process invoice payment');
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    // Get the customer ID
    const customerId = subscription.customer as string;
    
    // Find the user with this Stripe customer ID
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });
    
    if (!user) {
      logger.error({ customerId }, 'No user found with this Stripe customer ID');
      return;
    }
    
    // Update the user's subscription status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: subscription.status,
        subscriptionUpdatedAt: new Date(),
      },
    });
    
    logger.info({ userId: user.id, subscriptionId: subscription.id }, 'Subscription updated');
  } catch (error: any) {
    logger.error({ error: error.message, subscriptionId: subscription.id }, 'Failed to process subscription update');
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    // Get the customer ID
    const customerId = subscription.customer as string;
    
    // Find the user with this Stripe customer ID
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });
    
    if (!user) {
      logger.error({ customerId }, 'No user found with this Stripe customer ID');
      return;
    }
    
    // Update the user's subscription status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'canceled',
        subscriptionUpdatedAt: new Date(),
      },
    });
    
    logger.info({ userId: user.id, subscriptionId: subscription.id }, 'Subscription canceled');
  } catch (error: any) {
    logger.error({ error: error.message, subscriptionId: subscription.id }, 'Failed to process subscription deletion');
  }
} 