import { BasePlatformAdapter } from "../../base-adapter";
import {
  PlatformType,
  TaskPayload,
  ExecutionResult,
} from "../../types";
import axios from "axios";
import { PlatformFollower } from "@/lib/marketing/follower-monitor-service";
import { prisma } from "@/lib/prisma";

interface TelegramMessage {
  message_id: number;
  chat: {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    type: string;
  };
  from?: {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
  };
  date: number;
  text?: string;
  photo?: Array<{
    file_id: string;
    file_size: number;
    width: number;
    height: number;
  }>;
}

interface TelegramApiResponse {
  ok: boolean;
  result?: TelegramMessage | any;
  description?: string;
  error_code?: number;
}

export class TelegramAdapter extends BasePlatformAdapter {
  public readonly platformType: PlatformType = "TELEGRAM";
  private botToken: string | null = null;
  private apiBaseUrl: string | null = null;

  constructor() {
    super();
  }

  public getCredentialRequirements(): string[] {
    return ["botToken"];
  }

  public async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    if (!credentials.botToken) {
      return false;
    }

    try {
      // Test the credentials by getting bot info
      const response = await axios.get(
        `https://api.telegram.org/bot${credentials.botToken}/getMe`
      );
      
      const data = response.data as TelegramApiResponse;
      return data.ok === true;
    } catch (error) {
      console.error("Telegram credential validation error:", error);
      return false;
    }
  }

  public async initialize(config: any): Promise<boolean> {
    const result = await super.initialize(config);
    
    if (result) {
      this.botToken = config.credentials.botToken;
      this.apiBaseUrl = `https://api.telegram.org/bot${this.botToken}`;
    }
    
    return result;
  }

  public async postContent(task: TaskPayload): Promise<ExecutionResult> {
    const initError = this.checkInitialized("POST_CONTENT");
    if (initError) return initError;

    const validationError = this.validateTaskPayload(task, "POST_CONTENT", ["content"]);
    if (validationError) return validationError;

    try {
      // In Telegram, posting content to a channel requires a chat ID
      // We'll check if we have recipients (chat IDs)
      if (!task.recipients || task.recipients.length === 0) {
        return this.createErrorResult(
          "POST_CONTENT",
          "No chat IDs provided in recipients field"
        );
      }

      const results = await Promise.all(
        task.recipients.map(async (chatId) => {
          // If we have images, send them with optional caption
          if (task.mediaUrls && task.mediaUrls.length > 0) {
            return this.sendPhoto(chatId, task.mediaUrls[0], task.content);
          }
          // Otherwise just send text
          return this.sendMessage(chatId, task.content || "");
        })
      );

      // Check if any operations failed
      const failures = results.filter((r) => !r.ok);
      if (failures.length > 0) {
        return this.createErrorResult(
          "POST_CONTENT",
          `Failed to send to ${failures.length} out of ${results.length} recipients`,
          { details: failures }
        );
      }

      return this.createSuccessResult(
        "POST_CONTENT",
        results[0]?.result?.message_id?.toString(),
        { sentTo: task.recipients, results }
      );
    } catch (error) {
      return this.createErrorResult(
        "POST_CONTENT",
        error instanceof Error ? error.message : "Unknown error sending Telegram message"
      );
    }
  }

  public async sendDM(task: TaskPayload): Promise<ExecutionResult> {
    // In Telegram, sending a DM is the same as posting to a chat
    return this.postContent(task);
  }

  public async adjustPricing(task: TaskPayload): Promise<ExecutionResult> {
    // Not applicable for Telegram
    return this.createErrorResult(
      "ADJUST_PRICING",
      "Pricing adjustments are not supported on Telegram"
    );
  }

  public async schedulePost(task: TaskPayload): Promise<ExecutionResult> {
    // Telegram API doesn't support scheduling directly
    // But we could implement a custom scheduling system
    return this.createErrorResult(
      "SCHEDULE_POST",
      "Post scheduling not directly supported by Telegram API"
    );
  }

  public async fetchMetrics(task: TaskPayload): Promise<ExecutionResult> {
    // Limited metrics available through the bot API
    const initError = this.checkInitialized("FETCH_METRICS");
    if (initError) return initError;

    try {
      // We can get chat members count for groups/channels
      if (!task.recipients || task.recipients.length === 0) {
        return this.createErrorResult(
          "FETCH_METRICS",
          "No chat IDs provided in recipients field"
        );
      }

      const chatId = task.recipients[0];
      const response = await axios.get(
        `${this.apiBaseUrl}/getChatMembersCount`,
        {
          params: { chat_id: chatId }
        }
      );

      const data = response.data as TelegramApiResponse;
      if (!data.ok) {
        return this.createErrorResult(
          "FETCH_METRICS",
          `Failed to fetch chat metrics: ${data.description}`
        );
      }

      return this.createSuccessResult(
        "FETCH_METRICS",
        undefined,
        { chatId, memberCount: data.result }
      );
    } catch (error) {
      return this.createErrorResult(
        "FETCH_METRICS",
        error instanceof Error ? error.message : "Unknown error fetching Telegram metrics"
      );
    }
  }

  /**
   * Fetch followers/members of a Telegram channel or group
   * @param accountId The platform account ID
   * @returns Promise<PlatformFollower[]> List of followers/members
   */
  public async fetchFollowers(accountId: string): Promise<PlatformFollower[]> {
    try {
      const platform = await prisma.platform.findUnique({
        where: { id: accountId },
      });

      if (!platform) {
        throw new Error(`Platform with ID ${accountId} not found`);
      }

      // Initialize the adapter if needed
      if (!this.isInitialized()) {
        // Get credentials using the platform ID
        const credentials = await this.fetchCredentials(accountId);
        if (!credentials) {
          throw new Error(`Failed to fetch credentials for platform ${accountId}`);
        }
        
        const initialized = await this.initialize({
          platformId: accountId,
          clientId: platform.clientId,
          credentials,
        });
        
        if (!initialized) {
          throw new Error(`Failed to initialize Telegram adapter for platform ${accountId}`);
        }
      }

      // For Telegram, we need the chat ID to get members
      // This should be stored in the credentials
      const credentials = await this.fetchCredentials(accountId);
      const chatId = credentials.telegramChatId;
      
      if (!chatId) {
        throw new Error("Telegram chat ID not found in credentials");
      }

      // Telegram Bot API has restrictions on getting chat members
      // Bot must be an admin of the group/channel to get member list
      // Also, for large groups, there are pagination limitations
      
      // First, get basic chat info
      const chatResponse = await axios.get(
        `${this.apiBaseUrl}/getChat`,
        { params: { chat_id: chatId } }
      );

      if (!chatResponse.data.ok) {
        throw new Error(`Failed to get chat info: ${chatResponse.data.description}`);
      }

      const chat = chatResponse.data.result;
      
      // For channels and groups, we can get members count
      const countResponse = await axios.get(
        `${this.apiBaseUrl}/getChatMemberCount`,
        { params: { chat_id: chatId } }
      );

      if (!countResponse.data.ok) {
        throw new Error(`Failed to get member count: ${countResponse.data.description}`);
      }

      const memberCount = countResponse.data.result;
      
      // For channels, we cannot get the list of members via the Bot API
      // For groups, we can get admins but getting all members has limitations
      
      // We'll get at least the administrators to have some data
      const adminsResponse = await axios.get(
        `${this.apiBaseUrl}/getChatAdministrators`,
        { params: { chat_id: chatId } }
      );

      if (!adminsResponse.data.ok) {
        console.warn(`Could not get chat administrators: ${adminsResponse.data.description}`);
        // Return empty list and log warning
        console.warn(`Telegram API limitation: Cannot fetch complete member list. Chat has ${memberCount} members.`);
        return [];
      }

      // Map the admin data to our standard format
      const followers: PlatformFollower[] = adminsResponse.data.result.map((member: any) => {
        const user = member.user;
        return {
          id: user.id.toString(),
          name: [user.first_name, user.last_name].filter(Boolean).join(' '),
          username: user.username || '',
          joinedAt: new Date().toISOString(), // Telegram doesn't provide join date
        };
      });

      // Log API limitation
      console.warn(`Telegram API limitation: Only retrieved ${followers.length} admins out of ${memberCount} total members.`);
      
      return followers;
    } catch (error) {
      console.error("Error fetching Telegram followers:", error);
      return [];
    }
  }

  // Helper to fetch credentials for a platform
  private async fetchCredentials(platformId: string): Promise<Record<string, string>> {
    try {
      // Get credentials from the database (normally this would use CredentialService)
      const credentials = await prisma.platformCredential.findMany({
        where: { platformId },
      });

      // We should decrypt these values, but for simplicity we'll just return them
      // In production, use CredentialService to decrypt
      const result: Record<string, string> = {};
      for (const cred of credentials) {
        result[cred.key] = cred.value; // In reality, this would be decrypted
      }

      return result;
    } catch (error) {
      console.error("Error fetching credentials:", error);
      return {};
    }
  }

  // Helper methods
  private async sendMessage(
    chatId: string,
    text: string
  ): Promise<TelegramApiResponse> {
    const response = await axios.post(
      `${this.apiBaseUrl}/sendMessage`,
      {
        chat_id: chatId,
        text,
        parse_mode: "HTML"
      }
    );
    return response.data;
  }

  private async sendPhoto(
    chatId: string,
    photoUrl: string,
    caption?: string
  ): Promise<TelegramApiResponse> {
    const response = await axios.post(
      `${this.apiBaseUrl}/sendPhoto`,
      {
        chat_id: chatId,
        photo: photoUrl,
        caption,
        parse_mode: "HTML"
      }
    );
    return response.data;
  }
} 