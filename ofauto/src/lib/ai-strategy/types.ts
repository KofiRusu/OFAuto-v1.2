import { TransactionType } from "@prisma/client";

// Platform types for OnlyFans and other social media
export type PlatformType = "onlyfans" | "instagram" | "twitter" | "tiktok" | "snapchat";

// Strategy categories
export type StrategyType = "PRICING" | "CONTENT" | "ENGAGEMENT" | "GROWTH";

// Strategy status
export type StrategyStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "FAILED";

// Specific strategies within each category
export type SpecificStrategy = 
  // Pricing optimization
  | "subscription_price_adjustment"
  | "ppv_content_pricing"
  | "tiered_subscription_model"
  // Content improvement
  | "caption_enhancement"
  | "content_theme_suggestion"
  | "content_variety_recommendation"
  // Engagement boost
  | "poll_creation"
  | "interactive_content"
  | "engagement_campaign"
  // Subscriber retention
  | "loyalty_program"
  | "personalized_messaging"
  | "exclusive_content_offer"
  // Upsell opportunity
  | "premium_content_promotion"
  | "bundle_offering"
  | "limited_time_offer"
  // Posting schedule
  | "optimal_posting_time"
  | "content_calendar"
  | "seasonal_strategy"
  // Messaging strategy
  | "message_template"
  | "conversation_starter"
  | "follow_up_sequence"
  // Cross promotion
  | "platform_cross_posting"
  | "collaboration_opportunity"
  | "traffic_redirection";

// Score for the strategy's potential impact
export enum ImpactScore {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  VERY_HIGH = 4
}

// Implementation difficulty
export enum ImplementationDifficulty {
  EASY = 1,
  MODERATE = 2,
  COMPLEX = 3
}

// Strategy suggestion record
export interface StrategySuggestion {
  id: string;
  title: string;
  description: string;
  type: StrategyType;
  priority: "LOW" | "MEDIUM" | "HIGH";
  expectedImpact: string;
  implementationDifficulty: "LOW" | "MEDIUM" | "HIGH";
  suggestedActions: string[];
  createdAt: Date;
}

// Memory record for strategy agent
export interface StrategyMemory {
  id: string;
  clientId: string;
  platformType: PlatformType;
  contextType: "past_suggestion" | "client_preference" | "performance_trend" | "seasonal_pattern";
  content: string;
  metadata: Record<string, any>;
  relevanceScore: number;
  createdAt: Date;
  expiresAt?: Date;
}

// Config for LLM API calls
export interface LLMConfig {
  model: string;
  provider: "openai" | "anthropic";
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

// Strategy request parameters
export interface StrategyRequest {
  clientId: string;
  platformType: PlatformType;
  strategyType?: StrategyType;
  specificStrategy?: SpecificStrategy;
  customPrompt?: string;
  contextData?: {
    timeframe?: {
      startDate: Date;
      endDate: Date;
    };
    metrics?: Record<string, any>;
    pastStrategies?: StrategySuggestion[];
    clientPreferences?: Record<string, any>;
  };
  config?: Partial<LLMConfig>;
}

// Strategy response from LLM
export interface StrategyResponse {
  recommendations: StrategyRecommendation[];
  reasoning: string;
  projectedMetrics: {
    revenue?: number;
    engagement?: number;
    growth?: number;
  };
}

// Strategy record
export interface Strategy {
  id: string;
  clientId: string;
  type: StrategyType;
  status: StrategyStatus;
  recommendations: StrategyRecommendation[];
  reasoning: string;
  createdAt: Date;
  updatedAt: Date;
}

// Strategy recommendation record
export interface StrategyRecommendation {
  id: string;
  title: string;
  description: string;
  expectedImpact: string;
  implementationDifficulty: "LOW" | "MEDIUM" | "HIGH";
  projectedMetrics: {
    revenue?: number;
    engagement?: number;
    growth?: number;
  };
  suggestedActions: string[];
} 