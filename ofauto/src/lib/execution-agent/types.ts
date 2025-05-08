import { Strategy, StrategyRecommendation } from "../ai-strategy/types";

export type PlatformType = "ONLYFANS" | "INSTAGRAM" | "TWITTER" | "TELEGRAM" | "EMAIL";

export interface ExecutionResult {
  success: boolean;
  platformType: PlatformType;
  taskType: TaskType;
  entityId?: string;
  error?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export type TaskType = 
  | "POST_CONTENT" 
  | "SEND_DM" 
  | "ADJUST_PRICING" 
  | "SCHEDULE_POST" 
  | "FETCH_METRICS";

export interface TaskPayload {
  platformId: string;
  clientId: string;
  strategyId?: string;
  recommendationId?: string;
  taskType: TaskType;
  content?: string;
  mediaUrls?: string[];
  scheduledFor?: Date;
  recipients?: string[];
  pricingData?: {
    itemId?: string;
    newPrice?: number;
    subscriptionTiers?: Array<{
      tierId: string;
      price: number;
      benefits: string[];
    }>;
  };
  metadata?: Record<string, any>;
}

export interface ExecutionTask {
  id: string;
  taskPayload: TaskPayload;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  result?: ExecutionResult;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface PlatformAdapterConfig {
  platformId: string;
  clientId: string;
  credentials: Record<string, string>;
  settings?: Record<string, any>;
}

export interface PlatformAdapter {
  platformType: PlatformType;
  
  // Required methods every adapter must implement
  initialize(config: PlatformAdapterConfig): Promise<boolean>;
  postContent(task: TaskPayload): Promise<ExecutionResult>;
  sendDM(task: TaskPayload): Promise<ExecutionResult>;
  adjustPricing(task: TaskPayload): Promise<ExecutionResult>;
  schedulePost(task: TaskPayload): Promise<ExecutionResult>;
  fetchMetrics(task: TaskPayload): Promise<ExecutionResult>;
  
  // Optional platform-specific methods
  getCredentialRequirements(): string[];
  validateCredentials(credentials: Record<string, string>): Promise<boolean>;
  isInitialized(): boolean;
}

export interface ExecutionAgentService {
  executeTask(task: TaskPayload): Promise<ExecutionResult>;
  executeStrategyRecommendation(
    strategyId: string, 
    recommendationId: string
  ): Promise<ExecutionResult[]>;
  
  getTaskHistory(
    clientId: string, 
    platformId?: string, 
    taskType?: TaskType
  ): Promise<ExecutionTask[]>;
  
  getPlatformAdapter(platformType: PlatformType): PlatformAdapter | null;
  registerPlatformAdapter(adapter: PlatformAdapter): void;
} 