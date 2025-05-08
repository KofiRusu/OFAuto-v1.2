import crypto from 'crypto';
import { ActivityResult } from '../BasePlatformIntegration';
import { parseDonations, parseShopOrders } from './kofi-utils';

// Ko-fi webhook event types
export enum KofiWebhookEventType {
  DONATION = 'donation',
  SUBSCRIPTION = 'subscription',
  COMMISSION = 'commission',
  SHOP_ORDER = 'shop_order',
}

/**
 * Verify that a webhook request came from Ko-fi
 * Note: Ko-fi doesn't include a signature in their webhooks by default,
 * but we can implement basic verification based on expected data structure.
 * @param body Webhook payload
 * @returns Whether the webhook appears valid
 */
export function verifyWebhookPayload(body: any): boolean {
  try {
    // Basic validation of Ko-fi webhook structure
    if (!body || typeof body !== 'object') {
      return false;
    }

    // Ko-fi webhooks should include these fields
    if (!body.verification_token || !body.data || !body.type) {
      return false;
    }

    // Verify the token against our stored secret
    // In a real implementation, you'd configure a webhook verification token in Ko-fi
    // and store it in your .env file
    const kofiWebhookToken = process.env.KOFI_WEBHOOK_TOKEN;
    if (!kofiWebhookToken) {
      console.warn('Ko-fi webhook token not configured');
      return false;
    }

    // Compare tokens
    return body.verification_token === kofiWebhookToken;
  } catch (error) {
    console.error('Error verifying Ko-fi webhook payload:', error);
    return false;
  }
}

/**
 * Parse a Ko-fi webhook event into an ActivityResult
 * @param type Type of webhook event
 * @param data Event data
 * @returns Normalized ActivityResult
 */
export function parseWebhookEvent(body: any): ActivityResult | null {
  try {
    // Get event type and data
    const type = body.type;
    const data = body.data;
    
    // Default to 'other' activity type
    let activityType: ActivityResult['type'] = 'other';

    switch (type) {
      case KofiWebhookEventType.DONATION:
        activityType = 'new_pledge';
        break;
      case KofiWebhookEventType.SUBSCRIPTION:
        // New subscription or renewal
        activityType = data.is_first_subscription_payment 
          ? 'new_pledge' 
          : 'updated_pledge';
        break;
      case KofiWebhookEventType.COMMISSION:
        // Treat commissions as pledges
        activityType = 'new_pledge';
        break;
      case KofiWebhookEventType.SHOP_ORDER:
        // Shop orders aren't strictly pledges, but we'll use the same structure
        activityType = 'new_pledge';
        break;
    }

    // Parse the donation amount
    const amount = parseFloat(data.amount || '0');
    
    return {
      type: activityType,
      userId: data.kofi_transaction_id || `kofi-${Date.now()}`,
      username: data.from_name || 'Anonymous',
      amount,
      tierId: data.tier_name || '',
      tierName: data.tier_name || 'One-time donation',
      timestamp: new Date(),
      metadata: data,
    };
  } catch (error) {
    console.error('Error parsing Ko-fi webhook event:', error);
    return null;
  }
}

/**
 * Handles a Ko-fi webhook event and triggers appropriate actions
 * @param body Webhook payload
 * @param platformId Platform ID to associate the event with
 */
export async function handleWebhookEvent(
  body: any,
  platformId: string
): Promise<boolean> {
  try {
    // Parse event data
    const activity = parseWebhookEvent(body);
    if (!activity) {
      console.warn('Unable to parse Ko-fi webhook event');
      return false;
    }

    // Implementation for webhook event handling (replacing TODO)
    try {
      // 1. Store the activity in the database
      const { prisma } = await import('@/lib/db');
      
      // Create a record in the PlatformActivity table (assuming this table exists)
      const record = await prisma.platformActivity.create({
        data: {
          platformId,
          activityType: activity.type,
          userId: activity.userId,
          username: activity.username || '',
          amount: activity.amount || 0,
          tierId: activity.tierId,
          tierName: activity.tierName || '',
          timestamp: activity.timestamp,
          metadata: activity.metadata as any,
          raw: JSON.stringify(body),
          source: 'kofi',
        },
      });
      
      console.log(`Stored Ko-fi event in database with ID: ${record.id}`);
      
      // 2. Trigger relevant automation workflows
      // Import the workflow engine
      const { triggerOnActivityEvent } = await import('@/lib/orchestration/triggerEngine');
      
      // Trigger any workflows that should run when a new Ko-fi activity occurs
      await triggerOnActivityEvent(platformId, activity);
      
      // 3. Update analytics data
      // For Ko-fi events, we might need to track different things than for Patreon
      
      // If it's a subscription, update the user membership status
      if (body.type === KofiWebhookEventType.SUBSCRIPTION) {
        try {
          const data = body.data;
          const isFirstPayment = data.is_first_subscription_payment === true;
          
          await prisma.userMembership.upsert({
            where: {
              platformId_userId: {
                platformId,
                userId: activity.userId,
              },
            },
            update: {
              active: true,
              tierName: activity.tierName,
              tierId: activity.tierId,
              amount: activity.amount || 0,
              lastUpdated: new Date(),
              metadata: {
                subscriptionId: data.kofi_subscription_id,
                frequency: data.tier_frequency || 'monthly',
                email: data.email || null,
                renewDate: data.tier_expiry_date ? new Date(data.tier_expiry_date) : null,
                ...(!isFirstPayment ? { renewCount: { increment: 1 } } : {}),
              },
            },
            create: {
              platformId,
              userId: activity.userId,
              username: activity.username || '',
              active: true,
              tierName: activity.tierName,
              tierId: activity.tierId,
              amount: activity.amount || 0,
              lastUpdated: new Date(),
              metadata: {
                subscriptionId: data.kofi_subscription_id,
                frequency: data.tier_frequency || 'monthly',
                email: data.email || null,
                renewDate: data.tier_expiry_date ? new Date(data.tier_expiry_date) : null,
                renewCount: 0,
              },
            },
          });
          
          console.log(`Updated user membership for Ko-fi subscriber ${activity.username}`);
        } catch (membershipError) {
          console.error('Error updating Ko-fi user membership:', membershipError);
          // Continue processing despite this error
        }
      }
      
      // Update donation/sales metrics
      try {
        const statsToUpdate: Record<string, number> = {};
        
        switch (body.type) {
          case KofiWebhookEventType.DONATION:
            statsToUpdate.totalDonations = { increment: activity.amount || 0 };
            statsToUpdate.donationCount = { increment: 1 };
            break;
          case KofiWebhookEventType.SHOP_ORDER:
            statsToUpdate.totalSales = { increment: activity.amount || 0 };
            statsToUpdate.orderCount = { increment: 1 };
            break;
          case KofiWebhookEventType.COMMISSION:
            statsToUpdate.totalCommissions = { increment: activity.amount || 0 };
            statsToUpdate.commissionCount = { increment: 1 };
            break;
        }
        
        if (Object.keys(statsToUpdate).length > 0) {
          await prisma.platformStats.upsert({
            where: { platformId },
            update: statsToUpdate,
            create: {
              platformId,
              ...statsToUpdate,
              lastUpdated: new Date(),
            },
          });
          
          console.log(`Updated Ko-fi platform stats for ${body.type} event`);
        }
      } catch (statsError) {
        console.error('Error updating Ko-fi platform stats:', statsError);
        // Continue processing despite this error
      }
      
    } catch (processingError) {
      console.error('Error processing Ko-fi webhook activity:', processingError);
      // Still return true because we parsed the event successfully,
      // even if subsequent processing failed
    }
    
    console.log(`Processed Ko-fi webhook event for platform ${platformId}:`, activity);
    
    return true;
  } catch (error) {
    console.error('Error handling Ko-fi webhook event:', error);
    return false;
  }
} 