import { ScheduledPost } from "@/components/scheduler/create-scheduled-post-modal";

export interface PostResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

export interface StatsResult {
  success: boolean;
  metrics: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    engagement?: number;
    [key: string]: number | undefined;
  };
  error?: string;
}

export interface DMResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BasePlatformIntegration {
  platformType: string;
  supportsDMs: boolean;
  
  // Post scheduling and management
  schedulePost(post: ScheduledPost): Promise<PostResult>;
  deletePost(postId: string): Promise<{ success: boolean; error?: string }>;
  
  // Stats and metrics
  fetchStats(postId: string): Promise<StatsResult>;
  
  // Direct messaging (optional)
  sendDirectMessage?(
    recipient: string, 
    message: string, 
    attachments?: string[]
  ): Promise<DMResult>;
}

// Platform automation support status
export enum AutomationLevel {
  NONE = "none",
  PARTIAL = "partial",
  FULL = "full"
}

export interface PlatformAutomationInfo {
  platform: string;
  automationLevel: AutomationLevel;
  supportedFeatures: string[];
  requirements?: string[];
}

// Integration info for all supported platforms
export const PLATFORM_AUTOMATION: Record<string, PlatformAutomationInfo> = {
  twitter: {
    platform: "twitter",
    automationLevel: AutomationLevel.FULL,
    supportedFeatures: ["Posts", "DMs", "Stats", "Engagement Analytics"]
  },
  facebook: {
    platform: "facebook",
    automationLevel: AutomationLevel.FULL,
    supportedFeatures: ["Posts", "DMs", "Stats", "Page Management", "Engagement Analytics"]
  },
  instagram: {
    platform: "instagram",
    automationLevel: AutomationLevel.PARTIAL,
    supportedFeatures: ["Posts", "Stats"],
    requirements: ["Manual authentication every 60 days"]
  },
  linkedin: {
    platform: "linkedin",
    automationLevel: AutomationLevel.FULL,
    supportedFeatures: ["Posts", "DMs", "Stats", "Profile Engagement"]
  },
  youtube: {
    platform: "youtube",
    automationLevel: AutomationLevel.PARTIAL,
    supportedFeatures: ["Video Scheduling", "Comment Monitoring", "Analytics"],
    requirements: ["Video files must be uploaded separately"]
  },
  tiktok: {
    platform: "tiktok",
    automationLevel: AutomationLevel.PARTIAL,
    supportedFeatures: ["Post Scheduling", "Analytics"],
    requirements: ["Video files must be uploaded separately", "Manual authentication required"]
  },
  reddit: {
    platform: "reddit",
    automationLevel: AutomationLevel.FULL,
    supportedFeatures: ["Posts", "DMs", "Subreddit Monitoring", "Comment Analytics"]
  },
  threads: {
    platform: "threads",
    automationLevel: AutomationLevel.PARTIAL,
    supportedFeatures: ["Post Scheduling", "Basic Analytics"],
    requirements: ["Limited API access", "Manual authentication required"]
  },
  pinterest: {
    platform: "pinterest",
    automationLevel: AutomationLevel.FULL,
    supportedFeatures: ["Pin Scheduling", "Board Management", "Analytics", "Audience Insights"]
  }
}; 