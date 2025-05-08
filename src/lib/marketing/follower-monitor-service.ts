import { PlatformType } from "@/lib/execution-agent/types";
import { prisma } from "@/lib/prisma";
import { ExecutionAgentService } from "@/lib/execution-agent/types";
import { TwitterAdapter } from "@/lib/execution-agent/adapters/twitter/twitter-adapter";
import { InstagramAdapter } from "@/lib/execution-agent/adapters/instagram/instagram-adapter";
import { TelegramAdapter } from "@/lib/execution-agent/adapters/telegram/telegram-bot";
import { generateChatbotPrompt, generateMessageVariants } from "@/lib/ai/prompt-engine/chatbot-prompt-generator";
import { ChatbotPersona } from "@prisma/client";

export interface PlatformFollower {
  id: string;
  name: string;
  username: string;
  joinedAt?: string;
}

export class FollowerMonitorService {
  private static instance: FollowerMonitorService;
  private executionAgent: ExecutionAgentService;
  private isRunning: boolean = false;

  private constructor(executionAgent: ExecutionAgentService) {
    this.executionAgent = executionAgent;
  }

  public static getInstance(executionAgent: ExecutionAgentService): FollowerMonitorService {
    if (!FollowerMonitorService.instance) {
      FollowerMonitorService.instance = new FollowerMonitorService(executionAgent);
    }
    return FollowerMonitorService.instance;
  }

  /**
   * Start periodic check for new followers across all platforms
   * @param intervalMinutes How often to check for new followers (in minutes)
   */
  public async startMonitoring(intervalMinutes: number = 60): Promise<void> {
    if (this.isRunning) {
      console.log("Follower monitoring is already running");
      return;
    }

    this.isRunning = true;
    
    // Run initial check
    await this.checkAllAccountsForNewFollowers();
    
    // Set up periodic checks
    setInterval(async () => {
      await this.checkAllAccountsForNewFollowers();
    }, intervalMinutes * 60 * 1000);
    
    console.log(`Follower monitoring started, checking every ${intervalMinutes} minutes`);
  }

  /**
   * Stop periodic follower checks
   */
  public stopMonitoring(): void {
    this.isRunning = false;
    console.log("Follower monitoring stopped");
  }

  /**
   * Check all connected platform accounts for new followers
   */
  private async checkAllAccountsForNewFollowers(): Promise<void> {
    try {
      // Get all active platforms
      const platforms = await prisma.platform.findMany({
        where: { isActive: true },
      });

      // Process each platform
      for (const platform of platforms) {
        await this.checkAccountForNewFollowers(platform.id);
      }
    } catch (error) {
      console.error("Error checking for new followers:", error);
    }
  }

  /**
   * Check a specific platform account for new followers
   * @param platformId The platform account ID to check
   */
  public async checkAccountForNewFollowers(platformId: string): Promise<void> {
    try {
      // Get platform details
      const platform = await prisma.platform.findUnique({
        where: { id: platformId },
        include: { client: true },
      });

      if (!platform) {
        console.error(`Platform with ID ${platformId} not found`);
        return;
      }

      const platformType = platform.platformType.toUpperCase() as PlatformType;
      const adapter = this.executionAgent.getPlatformAdapter(platformType);

      if (!adapter) {
        console.error(`No adapter found for platform type ${platformType}`);
        return;
      }

      // Check if platform adapter has fetchFollowers method
      if (!('fetchFollowers' in adapter)) {
        console.error(`Adapter for ${platformType} does not implement fetchFollowers`);
        return;
      }

      // Get current followers
      const followers = await (adapter as any).fetchFollowers(platformId);
      
      if (!Array.isArray(followers)) {
        console.error(`fetchFollowers for ${platformType} did not return an array`);
        return;
      }

      // Get last check time
      const lastCheckAt = platform.lastFollowerCheckAt || new Date(0);

      // Process new followers
      const newFollowersCount = await this.processNewFollowers(
        platform.id,
        platform.clientId,
        platformType,
        followers,
        lastCheckAt
      );

      // Update last check time
      await prisma.platform.update({
        where: { id: platformId },
        data: { lastFollowerCheckAt: new Date() },
      });

      console.log(`Checked ${platformType} account ${platform.username}: ${newFollowersCount} new followers processed`);
    } catch (error) {
      console.error(`Error checking for new followers for platform ${platformId}:`, error);
    }
  }

  /**
   * Process new followers and send welcome DMs
   * @param platformId Platform account ID
   * @param clientId Client ID
   * @param platformType Platform type (TWITTER, INSTAGRAM, etc)
   * @param followers Current list of followers
   * @param lastCheckAt Time of last follower check
   * @returns Number of new followers processed
   */
  private async processNewFollowers(
    platformId: string,
    clientId: string,
    platformType: PlatformType,
    followers: PlatformFollower[],
    lastCheckAt: Date
  ): Promise<number> {
    let newFollowersCount = 0;

    // Get existing interactions to avoid duplicate DMs
    const existingInteractions = await prisma.followerInteraction.findMany({
      where: {
        platformAccountId: platformId,
        platform: platformType,
      },
      select: {
        followerId: true,
      },
    });

    const processedFollowerIds = new Set(existingInteractions.map(i => i.followerId));

    // Get platform-specific chatbot persona or default
    const persona = await this.getPersonaForPlatform(clientId, platformId);
    
    // Process each follower
    for (const follower of followers) {
      // Skip already processed followers
      if (processedFollowerIds.has(follower.id)) {
        continue;
      }

      // If follower has a joinedAt date and it's after lastCheckAt, process them
      // Otherwise, assume they're new if we don't have a record for them
      const joinedAt = follower.joinedAt ? new Date(follower.joinedAt) : new Date();
      
      if (joinedAt > lastCheckAt || !processedFollowerIds.has(follower.id)) {
        // Get personalized message using the chatbot persona
        const message = await this.generatePersonalizedMessage(persona, follower);
        
        // Send DM via execution agent
        await this.executionAgent.executeTask({
          clientId,
          platformId,
          taskType: "SEND_DM",
          payload: {
            recipientId: follower.id,
            recipientUsername: follower.username,
            message,
          },
        });

        // Log the interaction
        await prisma.followerInteraction.create({
          data: {
            platform: platformType,
            platformAccountId: platformId,
            followerId: follower.id,
            followerUsername: follower.username,
            messageSentAt: new Date(),
            messageTemplateUsed: persona ? persona.name : "default",
          },
        });

        newFollowersCount++;
      }
    }

    return newFollowersCount;
  }

  /**
   * Get the appropriate chatbot persona for a platform
   * Looks for platform-specific, then client-specific, then user default, then system default
   */
  private async getPersonaForPlatform(clientId: string, platformId: string): Promise<ChatbotPersona | null> {
    // Try to find personas in this order: platform-specific, client-specific, any default
    const platform = await prisma.platform.findUnique({
      where: { id: platformId },
      include: { client: { include: { user: true } } },
    });

    if (!platform) {
      return null;
    }

    const userId = platform.client.user.id;

    // Look for platform-specific persona
    const platformPersona = await prisma.chatbotPersona.findFirst({
      where: {
        userId,
        platformId,
        isDefault: true,
      },
    });

    if (platformPersona) {
      return platformPersona;
    }

    // Look for client-specific persona
    const clientPersona = await prisma.chatbotPersona.findFirst({
      where: {
        userId,
        clientId,
        isDefault: true,
      },
    });

    if (clientPersona) {
      return clientPersona;
    }

    // Look for user default persona
    const userPersona = await prisma.chatbotPersona.findFirst({
      where: {
        userId,
        clientId: null,
        platformId: null,
        isDefault: true,
      },
    });

    if (userPersona) {
      return userPersona;
    }

    // Fallback to any user persona
    const anyPersona = await prisma.chatbotPersona.findFirst({
      where: {
        userId,
      },
    });

    return anyPersona;
  }

  /**
   * Generate a personalized message for a follower using the chatbot persona
   */
  private async generatePersonalizedMessage(
    persona: ChatbotPersona | null, 
    follower: PlatformFollower
  ): Promise<string> {
    // If no persona, use default message
    if (!persona) {
      return `Thanks for following! We're excited to connect with you.`;
    }

    // Generate context about the follower
    const context = `This is a new follower named ${follower.name} (username: ${follower.username}).`;

    // In a real implementation, this would call an LLM to generate a personalized message
    // based on the persona and follower context
    // For now, we'll use a simpler approach with predefined message variants
    
    const messageVariants = generateMessageVariants(persona, context);
    
    // Use first variant or default to a simple message
    return messageVariants[0] || `Thanks for following! We're excited to connect with you.`;
  }
} 