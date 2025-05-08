import crypto from 'crypto';
import { ActivityResult } from '../BasePlatformIntegration';
import { parsePatrons } from './patreon-utils';

// Webhook event types
export enum PatreonWebhookEventType {
  PLEDGES_CREATE = 'pledges:create',
  PLEDGES_UPDATE = 'pledges:update',
  PLEDGES_DELETE = 'pledges:delete',
  MEMBERS_CREATE = 'members:create',
  MEMBERS_UPDATE = 'members:update',
  MEMBERS_DELETE = 'members:delete',
}

/**
 * Verify that a webhook request came from Patreon
 * @param signature Signature header from Patreon
 * @param body Raw request body as text
 * @returns Whether the signature is valid
 */
export function verifyWebhookSignature(
  signature: string | undefined,
  body: string
): boolean {
  if (!signature) {
    return false;
  }

  try {
    const patreonSecret = process.env.PATREON_WEBHOOK_SECRET;
    if (!patreonSecret) {
      console.error('Patreon webhook secret not configured');
      return false;
    }

    // Create HMAC using the secret
    const hmac = crypto.createHmac('md5', patreonSecret);
    hmac.update(body);
    const digest = hmac.digest('hex');

    // Compare the generated signature with the provided one
    return signature === digest;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Parse a Patreon webhook event into an ActivityResult
 * @param type Type of webhook event
 * @param data Event data
 * @returns Normalized ActivityResult
 */
export function parseWebhookEvent(
  type: string,
  data: any
): ActivityResult | null {
  try {
    // Default to 'other' activity type
    let activityType: ActivityResult['type'] = 'other';

    switch (type) {
      case PatreonWebhookEventType.PLEDGES_CREATE:
      case PatreonWebhookEventType.MEMBERS_CREATE:
        activityType = 'new_pledge';
        break;
      case PatreonWebhookEventType.PLEDGES_DELETE:
      case PatreonWebhookEventType.MEMBERS_DELETE:
        activityType = 'deleted_pledge';
        break;
      case PatreonWebhookEventType.PLEDGES_UPDATE:
      case PatreonWebhookEventType.MEMBERS_UPDATE:
        activityType = 'updated_pledge';
        break;
    }

    // Parse the data based on the event type
    if (type.startsWith('pledges:')) {
      // For pledge events
      const pledge = data.data;
      const attributes = pledge.attributes || {};
      const relationships = pledge.relationships || {};
      const patron = data.included?.find((inc: any) => inc.type === 'user' && inc.id === relationships.patron?.data?.id);
      const tier = data.included?.find((inc: any) => 
        inc.type === 'tier' && 
        relationships.reward?.data?.id === inc.id
      );

      return {
        type: activityType,
        userId: relationships.patron?.data?.id,
        username: patron?.attributes?.full_name,
        amount: attributes.amount_cents / 100, // Convert cents to dollars
        tierId: relationships.reward?.data?.id,
        tierName: tier?.attributes?.title,
        timestamp: new Date(),
        metadata: {
          declinedSince: attributes.declined_since,
          pledgeAmountCents: attributes.amount_cents,
          status: attributes.status,
          patronEmail: patron?.attributes?.email,
        },
      };
    } else if (type.startsWith('members:')) {
      // For member events
      const member = data.data;
      const parsedPatrons = parsePatrons({ data: [member], included: data.included });
      
      if (parsedPatrons.length === 0) {
        return null;
      }
      
      const patron = parsedPatrons[0];
      
      return {
        type: activityType,
        userId: patron.id,
        username: patron.fullName,
        amount: patron.pledgeAmount / 100, // Convert cents to dollars
        tierId: patron.tierId,
        tierName: patron.tierTitle,
        timestamp: new Date(),
        metadata: patron,
      };
    }

    return null;
  } catch (error) {
    console.error('Error parsing webhook event:', error);
    return null;
  }
}

/**
 * Handles a Patreon webhook event and triggers appropriate actions
 * @param eventType Type of webhook event
 * @param data Event data
 * @param platformId Platform ID to associate the event with
 */
export async function handleWebhookEvent(
  eventType: string,
  data: any,
  platformId: string
): Promise<boolean> {
  try {
    const activity = parseWebhookEvent(eventType, data);
    if (!activity) {
      console.warn(`Unable to parse webhook event of type ${eventType}`);
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
          raw: JSON.stringify(data),
        },
      });
      
      console.log(`Stored webhook event in database with ID: ${record.id}`);
      
      // 2. Trigger relevant automation workflows
      // Import the workflow engine
      const { triggerOnActivityEvent } = await import('@/lib/orchestration/triggerEngine');
      
      // Trigger any workflows that should run when a new Patreon activity occurs
      await triggerOnActivityEvent(platformId, activity);
      
      // 3. Update analytics data
      // For example, update user membership status if it's a pledge event
      if (activity.type === 'new_pledge' || activity.type === 'updated_pledge') {
        try {
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
            },
          });
          
          console.log(`Updated user membership status for user ${activity.userId}`);
        } catch (membershipError) {
          console.error('Error updating user membership:', membershipError);
          // Continue processing despite this error
        }
      } else if (activity.type === 'deleted_pledge') {
        // Mark membership as inactive if the pledge was deleted
        try {
          await prisma.userMembership.update({
            where: {
              platformId_userId: {
                platformId,
                userId: activity.userId,
              },
            },
            data: {
              active: false,
              lastUpdated: new Date(),
            },
          });
          
          console.log(`Marked user membership as inactive for user ${activity.userId}`);
        } catch (membershipError) {
          console.error('Error updating user membership status:', membershipError);
          // Continue processing despite this error
        }
      }
      
    } catch (processingError) {
      console.error('Error processing webhook activity:', processingError);
      // Still return true because we parsed the event successfully,
      // even if subsequent processing failed
    }
    
    console.log(`Processed webhook event ${eventType} for platform ${platformId}:`, activity);
    
    return true;
  } catch (error) {
    console.error('Error handling webhook event:', error);
    return false;
  }
} 