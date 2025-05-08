import { PlatformType } from '../types'

/**
 * DM Template for creating personalized messages
 */
export interface DMTemplate {
  id: string
  name: string
  content: string
  variables: string[]
  createdAt: Date
  updatedAt: Date
}

/**
 * Target user for DM
 */
export interface DMTarget {
  userId?: string
  username: string
  platformId?: string
  metadata?: Record<string, string>
}

/**
 * DM Message status types
 */
export type DMMessageStatus = 
  | 'PENDING'
  | 'SCHEDULED'
  | 'SENDING'
  | 'SENT'
  | 'FAILED'
  | 'CANCELLED'

/**
 * DM Message structure
 */
export interface DMMessage {
  id: string
  campaignId: string
  content: string
  status: DMMessageStatus
  error?: string
  targetId?: string
  platformId?: string
  scheduledFor: Date
  sentAt?: Date
  createdAt?: Date
}

/**
 * DM Campaign status types
 */
export type DMCampaignStatus = 
  | 'DRAFT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'

/**
 * Types of triggers for DM campaigns
 */
export type DMTriggerType = 
  | 'SCHEDULED'      // Sent at a scheduled time
  | 'EVENT_BASED'    // Triggered by user activity
  | 'SUBSCRIPTION'   // Subscription-related messages
  | 'ENGAGEMENT'     // Based on user engagement
  | 'RENEWAL'        // When subscription is up for renewal
  | 'WELCOME'        // New subscriber welcome
  | 'INACTIVE'       // Target inactive subscribers
  | 'PROMOTIONAL'    // Promotional content

/**
 * Performance metrics for DM campaigns
 */
export interface PerformanceMetrics {
  sent: number
  delivered: number
  read: number
  replied: number
  clicked: number
  converted: number
  bounced: number
  reported: number
}

/**
 * Personalization data type for template variables
 * Maps variable names to their values
 * 
 * Example:
 * {
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "offerCode": "SPECIAL25"
 * }
 */
export type PersonalizationData = Record<string, string> 