import { BasePlatformIntegration } from "@/integrations/base-platform";
import { RedditIntegration } from "@/integrations/reddit";
import { ThreadsIntegration } from "@/integrations/threads";
import { logger } from "@/lib/logger";
import { applyTemplate } from "@/lib/utils/template";
import { PlatformType } from '@/lib/types'
import { prisma } from '@/lib/db'
import type { 
  DMTemplate, 
  DMTarget, 
  DMMessage, 
  DMCampaignStatus,
  DMTriggerType,
  PerformanceMetrics,
  PersonalizationData,
} from '@/lib/types/dm'
import { getIntegrationForPlatform } from '@/integrations/factory'

// Mock integrations for platforms that support DMs
class TwitterIntegration implements BasePlatformIntegration {
  platformType = "twitter";
  supportsDMs = true;
  // Implementation details omitted for brevity
  async schedulePost(): Promise<any> { return { success: true }; }
  async deletePost(): Promise<any> { return { success: true }; }
  async fetchStats(): Promise<any> { return { success: true, metrics: {} }; }
  async sendDirectMessage(recipient: string, message: string): Promise<any> {
    return { success: true, messageId: `tw-dm-${Date.now()}` };
  }
}

class FacebookIntegration implements BasePlatformIntegration {
  platformType = "facebook";
  supportsDMs = true;
  // Implementation details omitted for brevity
  async schedulePost(): Promise<any> { return { success: true }; }
  async deletePost(): Promise<any> { return { success: true }; }
  async fetchStats(): Promise<any> { return { success: true, metrics: {} }; }
  async sendDirectMessage(recipient: string, message: string): Promise<any> {
    return { success: true, messageId: `fb-dm-${Date.now()}` };
  }
}

// DM Campaign types
export enum DMTriggerType {
  NEW_FOLLOWER = "new_follower",
  ENGAGEMENT = "engagement",
  SCHEDULED = "scheduled",
  WELCOME = "welcome",
  RENEWAL = "renewal"
}

export enum DMCampaignStatus {
  ACTIVE = "active",
  PAUSED = "paused",
  COMPLETED = "completed",
  DRAFT = "draft"
}

export interface DMTemplate {
  id: string;
  name: string;
  content: string;
  platformId: string;
  variables?: string[];
  personalizationVariables?: string[]; // Variables detected in the template
  variants?: string[]; // AI-generated variations of the template
}

export interface DMCampaign {
  id: string;
  name: string;
  platformIds: string[];
  templateId: string;
  triggerType: DMTriggerType;
  status: DMCampaignStatus;
  throttleRate?: number; // Max messages per hour
  audienceFilter?: Record<string, any>;
  personalization?: Record<string, string>;
  assignedToId?: string;
}

export interface DMTarget {
  id: string;
  platformId: string;
  userId: string;
  username: string;
  metadata?: Record<string, any>;
}

export interface DMMessage {
  id: string;
  campaignId: string;
  targetId: string;
  platformId?: string;
  content: string;
  status: "queued" | "sent" | "failed" | "responded" | "converted";
  scheduledFor?: Date;
  sentAt?: Date;
  openedAt?: Date;
  respondedAt?: Date;
  convertedAt?: Date;
  error?: string;
}

export interface DMPerformanceMetric {
  id: string;
  campaignId: string;
  platformId: string;
  opens: number;
  responses: number;
  conversions: number;
  impressions: number;
  lastUpdated: Date;
}

interface ScheduleDMParams {
  campaignId: string
  target: DMTarget
  scheduledDate?: Date
  personalization?: PersonalizationData // Add personalization data parameter
}

export class AutoDMEngine {
  private integrations: Map<string, BasePlatformIntegration> = new Map();
  private templates: DMTemplate[] = [];
  private campaigns: DMCampaign[] = [];
  private messages: DMMessage[] = [];
  private metrics: Map<string, DMPerformanceMetric> = new Map();
  private rateLimits: Map<string, { lastSent: Date; count: number }> = new Map();
  
  constructor() {
    // Initialize integrations for all platforms that support DMs
    this.registerIntegration(new TwitterIntegration());
    this.registerIntegration(new FacebookIntegration());
    this.registerIntegration(new RedditIntegration());
    this.registerIntegration(new ThreadsIntegration());
    
    // Load templates and campaigns (mock implementation)
    this.loadMockData();
  }
  
  // Register a platform integration
  registerIntegration(integration: BasePlatformIntegration): void {
    if (integration.supportsDMs) {
      this.integrations.set(integration.platformType, integration);
      logger.info(`Registered ${integration.platformType} for DM automation`);
    }
  }
  
  // Get all supported DM platforms
  getSupportedDMPlatforms(): string[] {
    return Array.from(this.integrations.keys());
  }
  
  // Create a new template
  createTemplate(template: Omit<DMTemplate, "id">): DMTemplate {
    const newTemplate = {
      id: `template-${Date.now()}`,
      ...template
    };
    
    this.templates.push(newTemplate);
    logger.info(`Created new DM template: ${newTemplate.name}`);
    
    return newTemplate;
  }
  
  // Create a new campaign
  createCampaign(campaign: Omit<DMCampaign, "id">): DMCampaign {
    // Validate platform support
    for (const platformId of campaign.platformIds) {
      const integration = this.integrations.get(platformId);
      if (!integration || !integration.supportsDMs) {
        throw new Error(`Platform ${platformId} does not support DMs`);
      }
    }
    
    const newCampaign = {
      id: `campaign-${Date.now()}`,
      ...campaign
    };
    
    this.campaigns.push(newCampaign);
    logger.info(`Created new DM campaign: ${newCampaign.name}`);
    
    return newCampaign;
  }
  
  // Schedule a DM for a specific target
  async scheduleDM({ campaignId, target, scheduledDate, personalization = {} }: ScheduleDMParams): Promise<DMMessage | null> {
    // Retrieve the campaign with its personalization data
    const campaign = await prisma.autoDMCampaign.findUnique({
      where: { id: campaignId },
      include: {
        platform: true,
      },
    })

    if (!campaign) {
      logger.error(`Campaign with ID ${campaignId} not found`)
      return null
    }

    if (campaign.status !== 'ACTIVE') {
      logger.warn(`Cannot schedule DM for inactive campaign: ${campaignId}`)
      return null
    }

    // Create the message record
    const message = await prisma.dMMessage.create({
      data: {
        content: campaign.messageTemplate,
        status: scheduledDate && scheduledDate > new Date() ? 'SCHEDULED' : 'PENDING',
        target: JSON.stringify(target),
        scheduledDate: scheduledDate || new Date(),
        personalization: personalization as any, // Store target-specific personalization
        AutoDMCampaign: {
          connect: { id: campaignId }
        }
      }
    })

    logger.info(`DM scheduled: ${message.id} for ${target.userId || target.username} on campaign ${campaignId}`)

    // If no future date is provided, send immediately
    if (!scheduledDate || scheduledDate <= new Date()) {
      await this.sendDM(message.id)
    }

    return message
  }
  
  // Process queued DMs that are due
  async processQueue(): Promise<void> {
    const now = new Date();
    const dueDMs = this.messages.filter(
      m => m.status === "queued" && (!m.scheduledFor || m.scheduledFor.getTime() <= now.getTime())
    );
    
    for (const message of dueDMs) {
      // Get target details
      const targetId = message.targetId;
      const target = { id: targetId, platformId: "unknown", userId: "unknown", username: "unknown" }; // Would fetch from database in real implementation
      
      // Throttle check
      if (!this.checkRateLimit(message.campaignId, target.platformId)) {
        logger.info(`Rate limited: Skipping DM to ${target.username} on ${target.platformId}`);
        continue;
      }
      
      await this.sendDM(message.id);
    }
  }
  
  // Send a DM to a target
  async sendDM(messageId: string): Promise<boolean> {
    const message = await prisma.dMMessage.findUnique({
      where: { id: messageId },
      include: {
        AutoDMCampaign: {
          include: {
            platform: true
          }
        }
      }
    })

    if (!message) {
      logger.error(`Message with ID ${messageId} not found`)
      return false
    }

    if (message.status === 'SENT') {
      logger.warn(`Message ${messageId} has already been sent`)
      return true
    }

    if (message.status === 'FAILED') {
      logger.warn(`Message ${messageId} previously failed and needs to be reset before sending`)
      return false
    }

    const campaign = message.AutoDMCampaign
    if (!campaign) {
      logger.error(`Campaign not found for message ${messageId}`)
      return false
    }

    const platform = campaign.platform
    const integration = getIntegrationForPlatform(platform.type as PlatformType, platform.id)
    
    if (!integration) {
      logger.error(`Could not get integration for platform ${platform.type}`)
      return false
    }

    // Parse target information
    const target: DMTarget = JSON.parse(message.target as string)

    // Extract personalization data with fallback chain
    // 1. Message-specific personalization has highest priority
    // 2. Campaign-level personalization acts as a fallback
    const messagePersonalization = (message.personalization as PersonalizationData) || {}
    const campaignPersonalization = (campaign.personalization as PersonalizationData) || {}
    
    // Merge personalization data prioritizing message-specific values
    const personalizedValues = {
      ...campaignPersonalization,
      ...messagePersonalization,
    }

    // Apply personalization to the template
    const personalizedContent = applyTemplate(campaign.messageTemplate, personalizedValues)

    try {
      // Update to SENDING status
      await prisma.dMMessage.update({
        where: { id: messageId },
        data: { 
          status: 'SENDING',
          sentAt: new Date(),
          content: personalizedContent, // Save the personalized content
        }
      })

      // Attempt to send the message
      const result = await integration.sendDirectMessage({
        userId: target.userId,
        username: target.username,
        message: personalizedContent,
        imageUrl: campaign.imageUrl
      })

      if (result.success) {
        // Update message to SENT status and store platform message ID
        await prisma.dMMessage.update({
          where: { id: messageId },
          data: {
            status: 'SENT',
            platformMessageId: result.messageId
          }
        })

        // Update campaign metrics
        await prisma.autoDMCampaign.update({
          where: { id: campaign.id },
          data: {
            sentMessages: {
              increment: 1
            }
          }
        })

        // Update rate limiting tracking
        this.messagesSentThisHour++
        
        logger.info(`DM sent successfully: ${messageId} to ${target.userId || target.username}`)
        return true
      } else {
        // Handle failed message
        await prisma.dMMessage.update({
          where: { id: messageId },
          data: {
            status: 'FAILED',
            error: result.error || 'Unknown error'
          }
        })
        
        logger.error(`Failed to send DM ${messageId}: ${result.error}`)
        return false
      }
    } catch (error) {
      logger.error(`Error sending DM ${messageId}: ${error}`)
      
      // Update message to FAILED status
      await prisma.dMMessage.update({
        where: { id: messageId },
        data: {
          status: 'FAILED',
          error: (error as Error).message
        }
      })
      return false
    }
  }
  
  // Check rate limits for a campaign on a platform
  private checkRateLimit(campaignId: string, platformId: string): boolean {
    const campaign = this.campaigns.find(c => c.id === campaignId);
    if (!campaign || !campaign.throttleRate) return true;
    
    const key = `${campaignId}:${platformId}`;
    const limit = this.rateLimits.get(key);
    
    if (!limit) return true;
    
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Reset counter if it's been more than an hour
    if (limit.lastSent < hourAgo) {
      this.rateLimits.set(key, { lastSent: now, count: 0 });
      return true;
    }
    
    return limit.count < campaign.throttleRate;
  }
  
  // Update rate limit counter after sending a message
  private updateRateLimit(campaignId: string, platformId: string): void {
    const campaign = this.campaigns.find(c => c.id === campaignId);
    if (!campaign || !campaign.throttleRate) return;
    
    const key = `${campaignId}:${platformId}`;
    const limit = this.rateLimits.get(key);
    
    if (limit) {
      this.rateLimits.set(key, {
        lastSent: new Date(),
        count: limit.count + 1
      });
    } else {
      this.rateLimits.set(key, {
        lastSent: new Date(),
        count: 1
      });
    }
  }
  
  // Load mock data for testing
  private loadMockData(): void {
    // Mock templates
    this.templates = [
      {
        id: "template-1",
        name: "New Follower Welcome",
        content: "Hi {{username}}! Thanks for following me on {{platform}}. I share new content every week, feel free to DM me with any questions!",
        platformId: "instagram",
        personalizationVariables: ["username", "platform"]
      },
      {
        id: "template-2",
        name: "Content Engagement",
        content: "Hey {{username}}, I noticed you engaged with my recent post! I'll be posting more {{content_type}} soon. Any specific topics you'd like to see?",
        platformId: "twitter",
        personalizationVariables: ["username", "content_type"]
      },
      {
        id: "template-3",
        name: "Renewal Reminder",
        content: "Hey {{username}}, your subscription ends on {{expiry_date}}. Renew now to keep enjoying exclusive content and a special {{discount}} off for loyal subscribers!",
        platformId: "onlyfans",
        personalizationVariables: ["username", "expiry_date", "discount"]
      }
    ];

    // Mock campaigns
    this.campaigns = [
      {
        id: "campaign-1",
        name: "Instagram Welcome Flow",
        platformIds: ["instagram"],
        templateId: "template-1",
        triggerType: DMTriggerType.NEW_FOLLOWER,
        status: DMCampaignStatus.ACTIVE,
        throttleRate: 10,
        personalization: {
          platform: "Instagram"
        }
      },
      {
        id: "campaign-2",
        name: "Twitter Engagement",
        platformIds: ["twitter"],
        templateId: "template-2",
        triggerType: DMTriggerType.ENGAGEMENT,
        status: DMCampaignStatus.PAUSED,
        throttleRate: 5,
        personalization: {
          content_type: "behind-the-scenes content"
        }
      },
      {
        id: "campaign-3",
        name: "OF Renewal Campaign",
        platformIds: ["onlyfans"],
        templateId: "template-3",
        triggerType: DMTriggerType.RENEWAL,
        status: DMCampaignStatus.DRAFT,
        throttleRate: 20,
        personalization: {
          discount: "20%"
        }
      }
    ];
  }
  
  // Helper methods for testing and monitoring
  
  getTemplates(): DMTemplate[] {
    return [...this.templates];
  }
  
  getCampaigns(): DMCampaign[] {
    return [...this.campaigns];
  }
  
  getMessages(
    filter?: { campaignId?: string; status?: string; platformId?: string }
  ): DMMessage[] {
    if (!filter) return [...this.messages];
    
    return this.messages.filter(m => {
      if (filter.campaignId && m.campaignId !== filter.campaignId) return false;
      if (filter.status && m.status !== filter.status) return false;
      // For platform filtering, we'd need to join with target data in a real implementation
      return true;
    });
  }

  async recordEvent(messageId: string, event: 'open' | 'response' | 'conversion'): Promise<boolean> {
    const message = this.messages.find(m => m.id === messageId);
    if (!message) {
      logger.error(`Message not found: ${messageId}`);
      return false;
    }

    const now = new Date();
    const campaign = this.campaigns.find(c => c.id === message.campaignId);
    
    if (!campaign) {
      logger.error(`Campaign not found for message: ${messageId}`);
      return false;
    }

    switch (event) {
      case 'open':
        if (!message.openedAt) {
          message.openedAt = now;
          this.updateMetrics(message.campaignId, message.platformId || '', 'opens');
        }
        break;
      
      case 'response':
        if (!message.respondedAt) {
          message.respondedAt = now;
          message.status = 'responded';
          this.updateMetrics(message.campaignId, message.platformId || '', 'responses');
        }
        break;
      
      case 'conversion':
        if (!message.convertedAt) {
          message.convertedAt = now;
          message.status = 'converted';
          this.updateMetrics(message.campaignId, message.platformId || '', 'conversions');
        }
        break;
    }

    logger.info(`Recorded ${event} event for message ${messageId}`);
    return true;
  }

  private updateMetrics(campaignId: string, platformId: string, metricType: 'opens' | 'responses' | 'conversions' | 'impressions'): void {
    const key = `${campaignId}:${platformId}`;
    let metric = this.metrics.get(key);
    
    if (!metric) {
      metric = {
        id: `metric-${Date.now()}`,
        campaignId,
        platformId,
        opens: 0,
        responses: 0,
        conversions: 0,
        impressions: 0,
        lastUpdated: new Date()
      };
    }
    
    metric[metricType]++;
    metric.lastUpdated = new Date();
    
    this.metrics.set(key, metric);
    
    logger.info(`Updated ${metricType} metric for campaign ${campaignId} on platform ${platformId}`);
  }

  getMetrics(campaignId?: string, platformId?: string): DMPerformanceMetric[] {
    const metrics: DMPerformanceMetric[] = [];
    
    for (const metric of this.metrics.values()) {
      if ((!campaignId || metric.campaignId === campaignId) && 
          (!platformId || metric.platformId === platformId)) {
        metrics.push({ ...metric });
      }
    }
    
    return metrics;
  }

  getCampaignMetrics(campaignId: string, platformId?: string): DMPerformanceMetric | null {
    const key = platformId ? `${campaignId}:${platformId}` : null;
    
    if (key) {
      return this.metrics.get(key) || null;
    }
    
    const campaignMetrics = this.getMetrics(campaignId);
    if (campaignMetrics.length === 0) return null;
    
    return campaignMetrics.reduce((combined, current) => {
      if (!combined) return { ...current };
      
      combined.opens += current.opens;
      combined.responses += current.responses;
      combined.conversions += current.conversions;
      combined.impressions += current.impressions;
      combined.lastUpdated = current.lastUpdated > combined.lastUpdated 
        ? current.lastUpdated 
        : combined.lastUpdated;
      
      return combined;
    }, null as DMPerformanceMetric | null);
  }
} 