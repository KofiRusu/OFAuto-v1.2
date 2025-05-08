import { createFanslyApiClient } from './fansly-utils';
import { getValidSession } from './fansly-auth';
import { logger } from '@/lib/logger';
import { ActivityResult } from '../BasePlatformIntegration';

// Fansly endpoints for activity polling
const ACTIVITY_ENDPOINTS = {
  SUBSCRIPTIONS: '/subscriptions',
  TRANSACTIONS: '/transactions',
  MESSAGES: '/messages',
};

// Store the last poll timestamp for each platform
const lastPollTimestamps: Record<string, Date> = {};

/**
 * Since Fansly doesn't have an official webhook system,
 * we simulate webhooks by polling for new activity
 */
export const pollFanslyActivity = async (
  platformId: string,
  customThreshold?: Date
): Promise<ActivityResult[]> => {
  try {
    // Get the timestamp from the last poll or use a default (5 minutes ago)
    const lastPoll = lastPollTimestamps[platformId] || new Date(Date.now() - 5 * 60 * 1000);
    const threshold = customThreshold || lastPoll;
    
    // Update the last poll timestamp
    lastPollTimestamps[platformId] = new Date();
    
    // Get a valid session token
    const sessionToken = await getValidSession(platformId);
    if (!sessionToken) {
      throw new Error('No valid session token available');
    }
    
    // Create API client
    const client = createFanslyApiClient(sessionToken);
    
    // Poll for new subscriptions, transactions and messages
    const [subscriptionsResponse, transactionsResponse] = await Promise.all([
      client.get(`${ACTIVITY_ENDPOINTS.SUBSCRIPTIONS}?since=${threshold.toISOString()}`),
      client.get(`${ACTIVITY_ENDPOINTS.TRANSACTIONS}?since=${threshold.toISOString()}`),
    ]);
    
    // Process the results
    const activities: ActivityResult[] = [];
    
    // Parse new subscriptions
    const newSubscriptions = subscriptionsResponse.data?.subscriptions || [];
    for (const sub of newSubscriptions) {
      activities.push({
        type: 'new_pledge',
        userId: sub.userId,
        username: sub.username,
        amount: sub.price,
        tierId: sub.tierId,
        tierName: sub.tierName,
        timestamp: new Date(sub.createdAt),
        metadata: { subscriptionId: sub.id }
      });
    }
    
    // Parse transactions
    const transactions = transactionsResponse.data?.transactions || [];
    for (const tx of transactions) {
      activities.push({
        type: tx.type === 'tip' ? 'other' : 'new_pledge',
        userId: tx.userId,
        username: tx.username,
        amount: tx.amount,
        timestamp: new Date(tx.createdAt),
        metadata: { transactionId: tx.id, transactionType: tx.type }
      });
    }
    
    // Log activity count
    logger.info(`Polled Fansly activity: found ${activities.length} new events`, { 
      platformId, 
      subscriptions: newSubscriptions.length, 
      transactions: transactions.length 
    });
    
    return activities;
  } catch (error) {
    logger.error('Failed to poll Fansly activity', { error, platformId });
    return [];
  }
};

/**
 * Process webhook-like notification
 * This is a placeholder for custom notification processing logic
 */
export const processNotification = async (
  platformId: string,
  notificationData: any
): Promise<ActivityResult | null> => {
  try {
    // In a real implementation, this would parse a notification payload
    // and convert it to an ActivityResult
    
    logger.info('Processing Fansly notification', { platformId });
    
    // Example: parse a tip notification
    if (notificationData.type === 'tip') {
      return {
        type: 'other',
        userId: notificationData.userId,
        username: notificationData.username,
        amount: notificationData.amount,
        timestamp: new Date(notificationData.timestamp),
        metadata: { source: 'notification', ...notificationData }
      };
    }
    
    // Example: parse a new subscriber notification
    if (notificationData.type === 'new_subscriber') {
      return {
        type: 'new_pledge',
        userId: notificationData.userId,
        username: notificationData.username,
        amount: notificationData.tierPrice,
        tierId: notificationData.tierId,
        tierName: notificationData.tierName,
        timestamp: new Date(notificationData.timestamp),
        metadata: { source: 'notification', ...notificationData }
      };
    }
    
    return null;
  } catch (error) {
    logger.error('Failed to process Fansly notification', { error, platformId });
    return null;
  }
}; 