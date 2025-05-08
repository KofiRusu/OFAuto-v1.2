import { ScheduledPost } from "@/components/scheduler/create-scheduled-post-modal";
import { BasePlatformIntegration, PostResult } from "@/integrations/base-platform";
import { YouTubeIntegration } from "@/integrations/youtube";
import { TikTokIntegration } from "@/integrations/tiktok";
import { RedditIntegration } from "@/integrations/reddit";
import { ThreadsIntegration } from "@/integrations/threads";
import { PinterestIntegration } from "@/integrations/pinterest";
import { logger } from "@/lib/logger";

// Mock integrations for existing platforms
class TwitterIntegration implements BasePlatformIntegration {
  platformType = "twitter";
  supportsDMs = true;
  async schedulePost(post: ScheduledPost): Promise<PostResult> {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true, postId: `TW-${Date.now()}`, postUrl: "https://twitter.com/status/123" };
  }
  async deletePost(postId: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }
  async fetchStats(postId: string): Promise<any> {
    return { success: true, metrics: { likes: 100, retweets: 20 } };
  }
  async sendDirectMessage(recipient: string, message: string): Promise<any> {
    return { success: true, messageId: "dm-123" };
  }
}

class FacebookIntegration implements BasePlatformIntegration {
  platformType = "facebook";
  supportsDMs = true;
  async schedulePost(post: ScheduledPost): Promise<PostResult> {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true, postId: `FB-${Date.now()}`, postUrl: "https://facebook.com/posts/123" };
  }
  async deletePost(postId: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }
  async fetchStats(postId: string): Promise<any> {
    return { success: true, metrics: { likes: 50, comments: 10, shares: 5 } };
  }
  async sendDirectMessage(recipient: string, message: string): Promise<any> {
    return { success: true, messageId: "dm-456" };
  }
}

class InstagramIntegration implements BasePlatformIntegration {
  platformType = "instagram";
  supportsDMs = true;
  async schedulePost(post: ScheduledPost): Promise<PostResult> {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true, postId: `IG-${Date.now()}`, postUrl: "https://instagram.com/p/123" };
  }
  async deletePost(postId: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }
  async fetchStats(postId: string): Promise<any> {
    return { success: true, metrics: { likes: 200, comments: 30 } };
  }
  async sendDirectMessage(recipient: string, message: string): Promise<any> {
    return { success: true, messageId: "dm-789" };
  }
}

class LinkedInIntegration implements BasePlatformIntegration {
  platformType = "linkedin";
  supportsDMs = true;
  async schedulePost(post: ScheduledPost): Promise<PostResult> {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true, postId: `LI-${Date.now()}`, postUrl: "https://linkedin.com/posts/123" };
  }
  async deletePost(postId: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }
  async fetchStats(postId: string): Promise<any> {
    return { success: true, metrics: { impressions: 500, reactions: 50, comments: 10 } };
  }
  async sendDirectMessage(recipient: string, message: string): Promise<any> {
    return { success: true, messageId: "dm-101" };
  }
}

// Task status tracking
export enum TaskStatus {
  QUEUED = "queued",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled"
}

export interface SchedulerTask {
  id: string;
  type: "post" | "dm" | "delete" | "analytics";
  platformType: string;
  data: any; // Post or message data
  status: TaskStatus;
  result?: any;
  error?: string;
  scheduledFor: Date;
  createdAt: Date;
  assignedToId?: string; // User ID this task is assigned to
  clientId?: string;
}

export class TaskScheduler {
  private integrations: Map<string, BasePlatformIntegration> = new Map();
  private tasks: SchedulerTask[] = [];
  
  constructor() {
    // Initialize integrations for all platforms
    this.registerIntegration(new TwitterIntegration());
    this.registerIntegration(new FacebookIntegration());
    this.registerIntegration(new InstagramIntegration());
    this.registerIntegration(new LinkedInIntegration());
    this.registerIntegration(new YouTubeIntegration());
    this.registerIntegration(new TikTokIntegration());
    this.registerIntegration(new RedditIntegration());
    this.registerIntegration(new ThreadsIntegration());
    this.registerIntegration(new PinterestIntegration());
    
    // Start task processing
    this.processTaskQueue();
  }
  
  // Register a platform integration
  registerIntegration(integration: BasePlatformIntegration): void {
    this.integrations.set(integration.platformType, integration);
    logger.info(`Registered ${integration.platformType} integration`);
  }
  
  // Get integration for a specific platform
  getIntegration(platformType: string): BasePlatformIntegration | undefined {
    return this.integrations.get(platformType);
  }
  
  // Schedule a post across all specified platforms
  async schedulePost(
    post: ScheduledPost, 
    options: { dryRun?: boolean; retryCount?: number } = {}
  ): Promise<SchedulerTask[]> {
    const { dryRun = false, retryCount = 3 } = options;
    const tasks: SchedulerTask[] = [];
    const platforms = post.platforms && post.platforms.length > 0 
      ? post.platforms 
      : [post.platform];
    
    for (const platformType of platforms) {
      const integration = this.getIntegration(platformType);
      
      if (!integration) {
        logger.error(`No integration found for platform: ${platformType}`);
        continue;
      }
      
      const taskId = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const task: SchedulerTask = {
        id: taskId,
        type: "post",
        platformType,
        data: { ...post, platform: platformType },
        status: TaskStatus.QUEUED,
        scheduledFor: post.scheduledDate,
        createdAt: new Date(),
        assignedToId: post.assignedToId,
        clientId: undefined // Would come from actual client data
      };
      
      this.tasks.push(task);
      tasks.push(task);
      
      logger.info(`Scheduled post task ${taskId} for platform: ${platformType}`);
    }
    
    if (!dryRun) {
      // Trigger immediate processing for tasks that should run now
      this.processTaskQueue();
    }
    
    return tasks;
  }
  
  // Send a direct message via a specified platform
  async scheduleDM(
    platformType: string,
    recipient: string,
    message: string,
    attachments: string[] = [],
    scheduledFor: Date = new Date(),
    assignedToId?: string
  ): Promise<SchedulerTask | null> {
    const integration = this.getIntegration(platformType);
    
    if (!integration) {
      logger.error(`No integration found for platform: ${platformType}`);
      return null;
    }
    
    if (!integration.supportsDMs) {
      logger.error(`Platform ${platformType} does not support DMs`);
      return null;
    }
    
    const taskId = `dm-task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const task: SchedulerTask = {
      id: taskId,
      type: "dm",
      platformType,
      data: { recipient, message, attachments },
      status: TaskStatus.QUEUED,
      scheduledFor,
      createdAt: new Date(),
      assignedToId
    };
    
    this.tasks.push(task);
    logger.info(`Scheduled DM task ${taskId} for platform: ${platformType}`);
    
    // Check if this task should run immediately
    if (scheduledFor.getTime() <= new Date().getTime()) {
      this.processTask(task);
    }
    
    return task;
  }
  
  // Process all tasks that are due
  private async processTaskQueue(): Promise<void> {
    const now = new Date();
    const dueTasks = this.tasks.filter(
      task => task.status === TaskStatus.QUEUED && task.scheduledFor.getTime() <= now.getTime()
    );
    
    for (const task of dueTasks) {
      this.processTask(task);
    }
    
    // Set up next check
    setTimeout(() => this.processTaskQueue(), 30000); // Check every 30 seconds
  }
  
  // Process a single task with retries
  private async processTask(task: SchedulerTask, attempt: number = 1): Promise<void> {
    const maxAttempts = 3; // Maximum retry attempts
    
    try {
      // Update task status
      task.status = TaskStatus.PROCESSING;
      logger.info(`Processing task ${task.id} (${task.type}) for platform: ${task.platformType}`);
      
      const integration = this.getIntegration(task.platformType);
      
      if (!integration) {
        throw new Error(`No integration found for platform: ${task.platformType}`);
      }
      
      let result;
      
      switch (task.type) {
        case "post":
          result = await integration.schedulePost(task.data);
          break;
        case "dm":
          if (!integration.sendDirectMessage) {
            throw new Error(`Platform ${task.platformType} does not support DMs`);
          }
          result = await integration.sendDirectMessage(
            task.data.recipient,
            task.data.message,
            task.data.attachments || []
          );
          break;
        case "delete":
          result = await integration.deletePost(task.data.postId);
          break;
        case "analytics":
          result = await integration.fetchStats(task.data.postId);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
      
      // Update task with result
      task.status = TaskStatus.COMPLETED;
      task.result = result;
      logger.info(`Task ${task.id} completed successfully`);
      
    } catch (error) {
      logger.error(`Error processing task ${task.id}: ${error}`);
      
      // Retry logic
      if (attempt < maxAttempts) {
        const delayMs = 1000 * Math.pow(2, attempt); // Exponential backoff
        logger.info(`Retrying task ${task.id} in ${delayMs}ms (attempt ${attempt + 1}/${maxAttempts})`);
        
        setTimeout(() => this.processTask(task, attempt + 1), delayMs);
      } else {
        // Mark as failed after max attempts
        task.status = TaskStatus.FAILED;
        task.error = error instanceof Error ? error.message : String(error);
        logger.error(`Task ${task.id} failed after ${maxAttempts} attempts: ${task.error}`);
      }
    }
  }
  
  // Get all tasks (optionally filtered)
  getTasks(filter?: Partial<SchedulerTask>): SchedulerTask[] {
    if (!filter) {
      return [...this.tasks];
    }
    
    return this.tasks.filter(task => {
      for (const [key, value] of Object.entries(filter)) {
        if (task[key as keyof SchedulerTask] !== value) {
          return false;
        }
      }
      return true;
    });
  }
  
  // Cancel a scheduled task
  cancelTask(taskId: string): boolean {
    const task = this.tasks.find(t => t.id === taskId);
    
    if (!task) {
      logger.error(`Task ${taskId} not found`);
      return false;
    }
    
    if (task.status !== TaskStatus.QUEUED) {
      logger.error(`Cannot cancel task ${taskId} with status ${task.status}`);
      return false;
    }
    
    task.status = TaskStatus.CANCELLED;
    logger.info(`Task ${taskId} cancelled`);
    return true;
  }
} 