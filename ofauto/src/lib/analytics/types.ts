import { TransactionType } from "@prisma/client";

// Period types for different time intervals
export type AnalyticsPeriod = "daily" | "weekly" | "monthly";

// Base interface for analytics events
export interface AnalyticsEvent {
  clientId: string;
  date: Date;
}

// Engagement event tracking
export interface EngagementEvent extends AnalyticsEvent {
  platformId: string;
  eventType: "follower" | "like" | "comment" | "share" | "view" | "message";
  count: number;
}

// Financial event tracking
export interface FinancialEvent extends AnalyticsEvent {
  transactionType: TransactionType;
  amount: number;
  currency: string;
  description?: string;
}

// Filter options for analytics queries
export interface AnalyticsFilterOptions {
  clientId: string;
  startDate?: Date;
  endDate?: Date;
  period?: AnalyticsPeriod;
  platformId?: string;
}

// Aggregated engagement metrics
export interface EngagementMetrics {
  totalFollowers: number;
  newFollowers: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalViews: number;
  totalMessages: number;
  engagementRate: number;
}

// Aggregated financial metrics
export interface FinancialMetrics {
  totalRevenue: number;
  subscriptionRevenue: number;
  tipRevenue: number;
  ppvRevenue: number;
  messageRevenue: number;
  otherRevenue: number;
  averageOrderValue: number;
}

// Combined metrics for dashboard display
export interface DashboardMetrics {
  period: AnalyticsPeriod;
  date: Date;
  engagement: EngagementMetrics;
  financial: FinancialMetrics;
}

// Time series data point
export interface TimeSeriesDataPoint {
  date: Date;
  value: number;
}

// Time series data for charts
export interface TimeSeriesData {
  label: string;
  data: TimeSeriesDataPoint[];
} 