import { PrismaClient, TransactionType } from "@prisma/client";
import {
  AnalyticsFilterOptions,
  AnalyticsPeriod,
  DashboardMetrics,
  EngagementEvent,
  EngagementMetrics,
  FinancialEvent,
  FinancialMetrics,
  TimeSeriesData,
} from "./types";

export class AnalyticsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Process an engagement event and store it in the database
   */
  async trackEngagementEvent(event: EngagementEvent): Promise<void> {
    const { clientId, platformId, date, eventType, count } = event;

    // Format date to remove time part for daily aggregation
    const dateOnly = new Date(date.toISOString().split("T")[0]);

    // Find or create today's engagement metric record
    const existingMetric = await this.prisma.engagementMetric.findUnique({
      where: {
        clientId_platformId_date: {
          clientId,
          platformId,
          date: dateOnly,
        },
      },
    });

    if (existingMetric) {
      // Update existing metric
      const updateData: Record<string, number> = {};

      switch (eventType) {
        case "follower":
          updateData.followers = existingMetric.followers + count;
          updateData.followersGain = existingMetric.followersGain + count;
          break;
        case "like":
          updateData.likes = existingMetric.likes + count;
          break;
        case "comment":
          updateData.comments = existingMetric.comments + count;
          break;
        case "share":
          updateData.shares = existingMetric.shares + count;
          break;
        case "view":
          updateData.views = existingMetric.views + count;
          break;
        case "message":
          updateData.messages = existingMetric.messages + count;
          break;
      }

      await this.prisma.engagementMetric.update({
        where: { id: existingMetric.id },
        data: updateData,
      });
    } else {
      // Create new metric
      const data: Record<string, any> = {
        clientId,
        platformId,
        date: dateOnly,
      };

      switch (eventType) {
        case "follower":
          data.followers = count;
          data.followersGain = count;
          break;
        case "like":
          data.likes = count;
          break;
        case "comment":
          data.comments = count;
          break;
        case "share":
          data.shares = count;
          break;
        case "view":
          data.views = count;
          break;
        case "message":
          data.messages = count;
          break;
      }

      await this.prisma.engagementMetric.create({
        data,
      });
    }

    // Update aggregated dashboard metrics
    await this.updateDashboardMetrics(clientId, dateOnly);
  }

  /**
   * Process a financial event and store it in the database
   */
  async trackFinancialEvent(event: FinancialEvent): Promise<void> {
    const { clientId, date, transactionType, amount, currency, description } = event;

    // Format date to remove time part for daily aggregation
    const dateOnly = new Date(date.toISOString().split("T")[0]);

    // Store financial transaction
    await this.prisma.financialMetric.create({
      data: {
        clientId,
        date: dateOnly,
        transactionType,
        amount,
        currency,
        description,
      },
    });

    // Update aggregated dashboard metrics
    await this.updateDashboardMetrics(clientId, dateOnly);
  }

  /**
   * Update dashboard metrics for a specific client and date
   */
  private async updateDashboardMetrics(
    clientId: string,
    date: Date
  ): Promise<void> {
    // Daily aggregation
    await this.aggregateDashboardMetrics(clientId, date, "daily");

    // Weekly aggregation (current week)
    const startOfWeek = this.getStartOfWeek(date);
    await this.aggregateDashboardMetrics(clientId, startOfWeek, "weekly");

    // Monthly aggregation (current month)
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    await this.aggregateDashboardMetrics(clientId, startOfMonth, "monthly");
  }

  /**
   * Aggregate metrics for dashboard display
   */
  private async aggregateDashboardMetrics(
    clientId: string,
    date: Date,
    period: AnalyticsPeriod
  ): Promise<void> {
    // Calculate date range based on period
    const { startDate, endDate } = this.getDateRange(date, period);

    // Get engagement metrics
    const engagementMetrics = await this.getEngagementMetricsForPeriod(
      clientId,
      startDate,
      endDate
    );

    // Get financial metrics
    const financialMetrics = await this.getFinancialMetricsForPeriod(
      clientId,
      startDate,
      endDate
    );

    // Find or create dashboard metric record
    const existingMetric = await this.prisma.dashboardMetric.findUnique({
      where: {
        clientId_date_period: {
          clientId,
          date,
          period,
        },
      },
    });

    const dashboardData = {
      totalRevenue: financialMetrics.totalRevenue,
      subscriptionRevenue: financialMetrics.subscriptionRevenue,
      tipRevenue: financialMetrics.tipRevenue,
      ppvRevenue: financialMetrics.ppvRevenue,
      messageRevenue: financialMetrics.messageRevenue,
      otherRevenue: financialMetrics.otherRevenue,
      totalEngagement:
        engagementMetrics.totalLikes +
        engagementMetrics.totalComments +
        engagementMetrics.totalShares,
      newFollowers: engagementMetrics.newFollowers,
      totalFollowers: engagementMetrics.totalFollowers,
      engagementRate: engagementMetrics.engagementRate,
    };

    if (existingMetric) {
      // Update existing record
      await this.prisma.dashboardMetric.update({
        where: { id: existingMetric.id },
        data: dashboardData,
      });
    } else {
      // Create new record
      await this.prisma.dashboardMetric.create({
        data: {
          clientId,
          date,
          period,
          ...dashboardData,
        },
      });
    }
  }

  /**
   * Get dashboard metrics for a specific client and period
   */
  async getDashboardMetrics(
    options: AnalyticsFilterOptions
  ): Promise<DashboardMetrics[]> {
    const { clientId, startDate, endDate, period = "daily" } = options;

    // Fetch dashboard metrics from the database
    const metrics = await this.prisma.dashboardMetric.findMany({
      where: {
        clientId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        period,
      },
      orderBy: { date: "asc" },
    });

    // Map to DashboardMetrics interface
    return metrics.map((metric) => ({
      period: metric.period as AnalyticsPeriod,
      date: metric.date,
      engagement: {
        totalFollowers: metric.totalFollowers,
        newFollowers: metric.newFollowers,
        totalLikes: 0, // These are aggregated in totalEngagement
        totalComments: 0,
        totalShares: 0,
        totalViews: 0,
        totalMessages: 0,
        engagementRate: Number(metric.engagementRate),
      },
      financial: {
        totalRevenue: Number(metric.totalRevenue),
        subscriptionRevenue: Number(metric.subscriptionRevenue),
        tipRevenue: Number(metric.tipRevenue),
        ppvRevenue: Number(metric.ppvRevenue),
        messageRevenue: Number(metric.messageRevenue),
        otherRevenue: Number(metric.otherRevenue),
        averageOrderValue: Number(metric.totalRevenue) / (metric.totalEngagement || 1),
      },
    }));
  }

  /**
   * Get time series data for revenue by type
   */
  async getRevenueTimeSeries(
    options: AnalyticsFilterOptions
  ): Promise<TimeSeriesData[]> {
    const { clientId, startDate, endDate, period = "daily" } = options;

    // Fetch dashboard metrics
    const metrics = await this.prisma.dashboardMetric.findMany({
      where: {
        clientId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        period,
      },
      orderBy: { date: "asc" },
    });

    // Create time series for each revenue type
    return [
      {
        label: "Total Revenue",
        data: metrics.map((m) => ({
          date: m.date,
          value: Number(m.totalRevenue),
        })),
      },
      {
        label: "Subscription Revenue",
        data: metrics.map((m) => ({
          date: m.date,
          value: Number(m.subscriptionRevenue),
        })),
      },
      {
        label: "Tips",
        data: metrics.map((m) => ({
          date: m.date,
          value: Number(m.tipRevenue),
        })),
      },
      {
        label: "PPV Content",
        data: metrics.map((m) => ({
          date: m.date,
          value: Number(m.ppvRevenue),
        })),
      },
      {
        label: "Messages",
        data: metrics.map((m) => ({
          date: m.date,
          value: Number(m.messageRevenue),
        })),
      },
    ];
  }

  /**
   * Get time series data for followers and engagement
   */
  async getEngagementTimeSeries(
    options: AnalyticsFilterOptions
  ): Promise<TimeSeriesData[]> {
    const { clientId, startDate, endDate, period = "daily" } = options;

    // Fetch dashboard metrics
    const metrics = await this.prisma.dashboardMetric.findMany({
      where: {
        clientId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        period,
      },
      orderBy: { date: "asc" },
    });

    // Create time series
    return [
      {
        label: "Total Followers",
        data: metrics.map((m) => ({
          date: m.date,
          value: m.totalFollowers,
        })),
      },
      {
        label: "New Followers",
        data: metrics.map((m) => ({
          date: m.date,
          value: m.newFollowers,
        })),
      },
      {
        label: "Engagement Rate (%)",
        data: metrics.map((m) => ({
          date: m.date,
          value: Number(m.engagementRate),
        })),
      },
    ];
  }

  /**
   * Helper method to get engagement metrics for a specific period
   */
  private async getEngagementMetricsForPeriod(
    clientId: string,
    startDate: Date,
    endDate: Date
  ): Promise<EngagementMetrics> {
    // Get aggregated engagement metrics for the period
    const metrics = await this.prisma.engagementMetric.findMany({
      where: {
        clientId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    if (metrics.length === 0) {
      return {
        totalFollowers: 0,
        newFollowers: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalViews: 0,
        totalMessages: 0,
        engagementRate: 0,
      };
    }

    // Calculate totals
    const totalFollowers = Math.max(...metrics.map((m) => m.followers));
    const newFollowers = metrics.reduce((sum, m) => sum + m.followersGain, 0);
    const totalLikes = metrics.reduce((sum, m) => sum + m.likes, 0);
    const totalComments = metrics.reduce((sum, m) => sum + m.comments, 0);
    const totalShares = metrics.reduce((sum, m) => sum + m.shares, 0);
    const totalViews = metrics.reduce((sum, m) => sum + m.views, 0);
    const totalMessages = metrics.reduce((sum, m) => sum + m.messages, 0);

    // Calculate engagement rate (likes + comments + shares) / views * 100
    const engagementRate =
      totalViews > 0
        ? ((totalLikes + totalComments + totalShares) / totalViews) * 100
        : 0;

    return {
      totalFollowers,
      newFollowers,
      totalLikes,
      totalComments,
      totalShares,
      totalViews,
      totalMessages,
      engagementRate,
    };
  }

  /**
   * Helper method to get financial metrics for a specific period
   */
  private async getFinancialMetricsForPeriod(
    clientId: string,
    startDate: Date,
    endDate: Date
  ): Promise<FinancialMetrics> {
    // Get financial transactions for the period
    const transactions = await this.prisma.financialMetric.findMany({
      where: {
        clientId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    if (transactions.length === 0) {
      return {
        totalRevenue: 0,
        subscriptionRevenue: 0,
        tipRevenue: 0,
        ppvRevenue: 0,
        messageRevenue: 0,
        otherRevenue: 0,
        averageOrderValue: 0,
      };
    }

    // Calculate revenue by type
    let subscriptionRevenue = 0;
    let tipRevenue = 0;
    let ppvRevenue = 0;
    let messageRevenue = 0;
    let otherRevenue = 0;

    transactions.forEach((transaction) => {
      const amount = Number(transaction.amount);

      switch (transaction.transactionType) {
        case TransactionType.SUBSCRIPTION:
          subscriptionRevenue += amount;
          break;
        case TransactionType.TIP:
          tipRevenue += amount;
          break;
        case TransactionType.PPV_CONTENT:
          ppvRevenue += amount;
          break;
        case TransactionType.DIRECT_MESSAGE:
          messageRevenue += amount;
          break;
        case TransactionType.OTHER:
          otherRevenue += amount;
          break;
      }
    });

    const totalRevenue =
      subscriptionRevenue + tipRevenue + ppvRevenue + messageRevenue + otherRevenue;
    const averageOrderValue = totalRevenue / transactions.length;

    return {
      totalRevenue,
      subscriptionRevenue,
      tipRevenue,
      ppvRevenue,
      messageRevenue,
      otherRevenue,
      averageOrderValue,
    };
  }

  /**
   * Helper method to get date range based on period
   */
  private getDateRange(date: Date, period: AnalyticsPeriod): { startDate: Date; endDate: Date } {
    const endDate = new Date(date);
    let startDate: Date;

    switch (period) {
      case "daily":
        startDate = new Date(date);
        break;
      case "weekly":
        startDate = this.getStartOfWeek(date);
        endDate.setDate(startDate.getDate() + 6);
        break;
      case "monthly":
        startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        endDate.setMonth(date.getMonth() + 1);
        endDate.setDate(0); // Last day of the month
        break;
      default:
        startDate = new Date(date);
    }

    return { startDate, endDate };
  }

  /**
   * Helper method to get the start of the week (Sunday)
   */
  private getStartOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    result.setDate(result.getDate() - day); // Set to Sunday
    return result;
  }
} 