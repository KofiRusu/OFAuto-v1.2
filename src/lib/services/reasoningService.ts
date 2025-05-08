import { prisma } from "@/lib/db/prisma";
import { callLLM } from "@/lib/llm/callLLM";
import { getAnalyticsService } from "@/lib/analytics";
import { z } from "zod";
import { Campaign } from '@/lib/schema';

// Define the Insight type with Zod for validation
export const InsightSchema = z.object({
  title: z.string(),
  description: z.string(),
  actionLabel: z.string().optional(),
  actionType: z.enum(['schedule_post', 'edit_campaign', 'adjust_price']).optional(),
  recommendedValue: z.string().optional(),
  importance: z.number().optional().default(1), // 1-5 scale for importance
  category: z.enum(['revenue', 'engagement', 'growth', 'content']).optional(),
});

export type Insight = z.infer<typeof InsightSchema>;

// Add new types for campaign intelligence
export interface CampaignPerformanceMetrics {
  openRate: number;
  clickThroughRate: number;
  conversionRate: number;
  revenuePerImpression: number;
  engagement: number;
}

export interface CampaignInsight {
  id: string;
  experimentId: string;
  variantId: string;
  type: 'underperforming' | 'overperforming' | 'anomaly' | 'trend';
  metric: string;
  value: number;
  benchmark: number;
  deviation: number; // percentage deviation from benchmark
  suggestion: string;
  actionType: 'pause_variant' | 'reschedule' | 'duplicate_modify' | 'conclude_experiment' | 'increase_budget';
  isActioned: boolean;
  createdAt: Date;
}

// Add these new types to the existing type definitions
export type CampaignKPIMetric = {
  metricName: string;
  currentValue: number;
  previousValue: number;
  threshold: number;
  unit: string;
  timestamp: Date;
};

export type CampaignUnderperformanceCause = 
  | 'low_engagement'
  | 'high_cpc'
  | 'low_conversion'
  | 'audience_mismatch'
  | 'creative_fatigue'
  | 'budget_constraint'
  | 'seasonal_factors'
  | 'competition_increase'
  | 'unknown';

export type CampaignPerformanceData = {
  campaignId: string;
  campaignName: string;
  metrics: CampaignKPIMetric[];
  underperformanceCauses?: CampaignUnderperformanceCause[];
  recommendedActions?: string[];
  severity: 'critical' | 'warning' | 'info';
  lastChecked: Date;
};

export interface InsightItem {
  id: string;
  title: string;
  description: string;
  type: string;
  recommendation?: string;
  implementationSteps?: string[];
  actionLabel?: string;
  date: string;
}

export interface KPIData {
  metricName: string;
  currentValue: number;
  previousValue: number;
  threshold: number;
  unit: string;
}

export interface CampaignInsight extends InsightItem {
  campaignId: string;
  severity: 'critical' | 'warning' | 'info';
  kpiData?: KPIData;
  actionType?: string;
}

// KPI Threshold definitions
const KPI_THRESHOLDS = {
  ROAS: 3.0,      // Return on Ad Spend (3x minimum)
  CTR: 2.5,       // Click-through Rate (2.5% minimum)
  CPA: 15,        // Cost per Acquisition ($15 maximum)
  CPM: 12,        // Cost per Mille ($12 maximum)
  CVR: 3.0        // Conversion Rate (3% minimum)
};

// Add these new types for trigger automation
export type TriggerCondition = {
  metricName: string;
  operator: 'less_than' | 'greater_than' | 'equal_to';
  threshold: number;
  unit: string;
};

export type TriggerAction = {
  actionType: 'pause_campaign' | 'increase_budget' | 'decrease_budget' | 'change_targeting' | 'notify_team';
  actionParams?: Record<string, any>;
  priority: 'high' | 'medium' | 'low';
};

export type TriggerRule = {
  id: string;
  name: string;
  conditions: TriggerCondition[];
  action: TriggerAction;
  isActive: boolean;
  lastTriggered?: Date;
  cooldownPeriod?: number; // cooldown in hours
};

export type TriggerEvent = {
  id: string;
  ruleId: string;
  triggeredAt: Date;
  status: 'pending' | 'processed' | 'failed';
  actionResult?: string;
  campaignId: string;
};

/**
 * Generate revenue insights for a client based on their data
 * @param clientId The client ID to generate insights for
 * @returns Array of insights
 */
export async function generateRevenueInsights(clientId: string): Promise<Insight[]> {
  try {
    // Get data for insights generation
    const [
      scheduledPosts, 
      autoDmTasks, 
      metrics
    ] = await Promise.all([
      // Get scheduled posts
      prisma.scheduledPost.findMany({
        where: { clientId },
        orderBy: { scheduledFor: 'desc' },
        take: 20,
      }),
      // Get auto DM tasks
      prisma.autoDMTask.findMany({
        where: { clientId },
      }),
      // Get financial and engagement metrics
      getAnalyticsService().getDashboardMetrics({
        clientId,
        period: 'daily',
        // Last 30 days
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      }),
    ]);

    // Get platform data
    const platforms = await prisma.platform.findMany({
      where: { clientId },
      select: {
        id: true,
        platformType: true,
        username: true,
        lastMetricsUpdate: true,
      },
    });

    // Build prompt for LLM
    const prompt = buildPromptFromData(clientId, scheduledPosts, autoDmTasks, metrics, platforms);
    
    // Call LLM with prompt
    const response = await callLLM(prompt);
    
    // Parse response into insights
    const insights = parseInsights(response);
    
    return insights;
  } catch (error) {
    console.error("Error generating insights:", error);
    return [];
  }
}

/**
 * Build a prompt for the LLM based on client data
 */
function buildPromptFromData(
  clientId: string,
  scheduledPosts: any[],
  autoDmTasks: any[],
  metrics: any[],
  platforms: any[]
): string {
  // Format metrics for prompt
  const formattedMetrics = metrics.map(metric => ({
    date: metric.date.toISOString().split('T')[0],
    totalRevenue: metric.financial.totalRevenue,
    subscriptionRevenue: metric.financial.subscriptionRevenue,
    tipRevenue: metric.financial.tipRevenue,
    otherRevenue: metric.financial.otherRevenue,
    followers: metric.engagement.totalFollowers,
    newFollowers: metric.engagement.newFollowers,
    engagementRate: metric.engagement.engagementRate,
  }));

  // Calculate some derived metrics
  const totalRevenue = formattedMetrics.reduce((sum, m) => sum + m.totalRevenue, 0);
  const avgEngagementRate = formattedMetrics.reduce((sum, m) => sum + m.engagementRate, 0) / formattedMetrics.length;
  const followerGrowth = formattedMetrics.reduce((sum, m) => sum + m.newFollowers, 0);
  
  // Simplify scheduled posts
  const recentPosts = scheduledPosts.slice(0, 5).map(post => ({
    platform: post.platformType,
    scheduledFor: post.scheduledFor.toISOString(),
    contentType: post.contentType,
    status: post.status,
  }));

  // Format auto DM tasks
  const dmTasks = autoDmTasks.map(task => ({
    platform: task.platformType,
    triggerType: task.triggerType,
    active: task.active,
  }));

  // Format platforms
  const platformSummary = platforms.map(p => ({
    platform: p.platformType,
    username: p.username,
  }));

  // Build the prompt
  return `
You are an expert content creator monetization advisor. Analyze the following data about a creator's business and provide 3-5 actionable insights that could help them improve their revenue, engagement, or growth.

CLIENT DATA:
- Platforms: ${JSON.stringify(platformSummary)}
- Recent scheduled posts: ${JSON.stringify(recentPosts)}
- Automated DM tasks: ${JSON.stringify(dmTasks)}
- Last 30 day metrics: ${JSON.stringify(formattedMetrics.slice(0, 5))}

SUMMARY METRICS:
- Total 30-day revenue: $${totalRevenue.toFixed(2)}
- Average engagement rate: ${avgEngagementRate.toFixed(2)}%
- Follower growth: ${followerGrowth}

Based on this data, provide 3-5 strategic insights formatted as a JSON array of objects with these exact fields:
- title: A short, attention-grabbing title for the insight
- description: A detailed explanation of the insight and its importance (2-3 sentences)
- actionLabel: (optional) Text for a call-to-action button
- actionType: (optional) One of: 'schedule_post', 'edit_campaign', 'adjust_price'
- recommendedValue: (optional) A specific value recommendation if applicable
- importance: A number from 1-5 indicating how important this insight is (5 being most important)
- category: One of: 'revenue', 'engagement', 'growth', 'content'

FORMAT YOUR RESPONSE AS A VALID JSON ARRAY WITH NO OTHER TEXT BEFORE OR AFTER.
`;
}

/**
 * Parse the LLM response into an array of Insight objects
 */
function parseInsights(response: string): Insight[] {
  try {
    // Try to extract JSON from the response if it's wrapped in markdown or other text
    let jsonString = response;
    
    // Handle case where JSON is in a code block
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonString = jsonMatch[1];
    }
    
    // Parse JSON
    const parsed = JSON.parse(jsonString);
    
    // Validate with Zod
    const insights = Array.isArray(parsed) 
      ? parsed.map(item => InsightSchema.parse(item))
      : [];
    
    return insights;
  } catch (error) {
    console.error("Error parsing insights:", error);
    return [];
  }
}

export class ReasoningService {
  // ... existing code ...

  /**
   * Track campaign KPIs over time and identify underperforming variants
   */
  async analyzeCampaignPerformance(experimentId: string): Promise<CampaignInsight[]> {
    logger.info({ clientId: this.clientId, experimentId }, 'Analyzing campaign performance');
    
    try {
      // Get experiment data
      const experiment = await prisma.campaignExperiment.findUnique({
        where: { 
          id: experimentId,
          clientId: this.clientId,
        },
      });
      
      if (!experiment) {
        throw new Error('Experiment not found');
      }
      
      // Skip analysis if not enough data
      if (!experiment.performanceData) {
        logger.debug({ experimentId }, 'Not enough data for analysis');
        return [];
      }
      
      const performanceData = experiment.performanceData as Record<string, Record<string, any>>;
      const controlId = experiment.controlVariantId;
      const insights: CampaignInsight[] = [];
      
      // Get baseline metrics from control variant
      const controlMetrics = controlId ? performanceData[controlId] : null;
      
      // Analyze each variant against control or absolute thresholds
      for (const [variantId, metrics] of Object.entries(performanceData)) {
        // Skip control variant for comparison against itself
        if (variantId === controlId) continue;
        
        // Check conversion rate
        if (metrics.rate !== undefined) {
          const controlRate = controlMetrics?.rate || 0.05; // fallback to 5% if no control
          const deviation = ((metrics.rate - controlRate) / controlRate) * 100;
          
          // Significant underperformance (>15% worse than control)
          if (deviation < -15) {
            insights.push({
              id: `ins_${Date.now()}_${variantId}_conv`,
              experimentId,
              variantId,
              type: 'underperforming',
              metric: 'conversion_rate',
              value: metrics.rate,
              benchmark: controlRate,
              deviation,
              suggestion: `Variant ${variantId} is underperforming with a conversion rate of ${(metrics.rate * 100).toFixed(1)}% compared to the control's ${(controlRate * 100).toFixed(1)}%. Consider pausing this variant.`,
              actionType: 'pause_variant',
              isActioned: false,
              createdAt: new Date(),
            });
          }
          // Significant overperformance (>15% better than control)
          else if (deviation > 15) {
            insights.push({
              id: `ins_${Date.now()}_${variantId}_conv_pos`,
              experimentId,
              variantId,
              type: 'overperforming',
              metric: 'conversion_rate',
              value: metrics.rate,
              benchmark: controlRate,
              deviation,
              suggestion: `Variant ${variantId} is outperforming with a conversion rate of ${(metrics.rate * 100).toFixed(1)}% compared to the control's ${(controlRate * 100).toFixed(1)}%. Consider concluding the experiment and adopting this variant.`,
              actionType: 'conclude_experiment',
              isActioned: false,
              createdAt: new Date(),
            });
          }
        }
        
        // Check revenue (if available)
        if (metrics.revenue !== undefined && controlMetrics?.revenue !== undefined) {
          const deviation = ((metrics.revenue - controlMetrics.revenue) / controlMetrics.revenue) * 100;
          
          // Significant revenue difference
          if (Math.abs(deviation) > 10) {
            insights.push({
              id: `ins_${Date.now()}_${variantId}_rev`,
              experimentId,
              variantId,
              type: deviation < 0 ? 'underperforming' : 'overperforming',
              metric: 'revenue',
              value: metrics.revenue,
              benchmark: controlMetrics.revenue,
              deviation,
              suggestion: deviation < 0 
                ? `Variant ${variantId} is generating less revenue ($${metrics.revenue.toFixed(2)}) than the control ($${controlMetrics.revenue.toFixed(2)}). Consider modifying the pricing strategy.`
                : `Variant ${variantId} is generating more revenue ($${metrics.revenue.toFixed(2)}) than the control ($${controlMetrics.revenue.toFixed(2)}). Consider adopting this pricing strategy.`,
              actionType: deviation < 0 ? 'duplicate_modify' : 'conclude_experiment',
              isActioned: false,
              createdAt: new Date(),
            });
          }
        }
        
        // Check sample size adequacy
        if (metrics.visitors !== undefined && metrics.visitors < 100) {
          insights.push({
            id: `ins_${Date.now()}_${variantId}_sample`,
            experimentId,
            variantId,
            type: 'anomaly',
            metric: 'sample_size',
            value: metrics.visitors,
            benchmark: 100,
            deviation: ((metrics.visitors - 100) / 100) * 100,
            suggestion: `Variant ${variantId} has a small sample size (${metrics.visitors} visitors). Continue the experiment to gather more data.`,
            actionType: 'increase_budget',
            isActioned: false,
            createdAt: new Date(),
          });
        }
      }
      
      // Store insights in database (if needed)
      // This could be implemented with a new CampaignInsight model
      
      return insights;
    } catch (error) {
      logger.error({ error, clientId: this.clientId, experimentId }, 'Error analyzing campaign performance');
      throw new Error('Failed to analyze campaign performance');
    }
  }

  /**
   * Take action on a campaign insight
   */
  async executeCampaignAction(insightId: string, action: string): Promise<boolean> {
    logger.info({ clientId: this.clientId, insightId, action }, 'Executing campaign action');
    
    try {
      // Implementation would depend on the specific action
      // For now, we'll just mark the insight as actioned
      
      // In a real implementation, this would:
      // - Pause a variant
      // - Reschedule content
      // - Duplicate and modify content
      // - Conclude an experiment
      // - Adjust budget or targeting

      return true;
    } catch (error) {
      logger.error({ error, clientId: this.clientId, insightId }, 'Error executing campaign action');
      throw new Error('Failed to execute campaign action');
    }
  }

  /**
   * Generate a daily report of campaign performance
   */
  async generateCampaignPerformanceReport(): Promise<string> {
    logger.info({ clientId: this.clientId }, 'Generating campaign performance report');
    
    try {
      // Get all active experiments
      const experiments = await prisma.campaignExperiment.findMany({
        where: { 
          clientId: this.clientId,
          status: 'running'
        },
      });
      
      if (experiments.length === 0) {
        return "No active campaigns to report.";
      }
      
      // Gather performance data
      const reportData = [];
      
      for (const experiment of experiments) {
        // Analyze the experiment
        const insights = await this.analyzeCampaignPerformance(experiment.id);
        
        reportData.push({
          name: experiment.name,
          status: experiment.status,
          insights: insights.length,
          criticalInsights: insights.filter(i => i.type === 'underperforming').length,
          positiveInsights: insights.filter(i => i.type === 'overperforming').length,
        });
      }
      
      // Generate report text using LLM
      const reportPrompt = `
        Based on the following campaign performance data, provide a concise daily summary:
        
        ${JSON.stringify(reportData)}
        
        Please include:
        1. Overall health assessment of the campaigns
        2. Key metrics to watch
        3. Top 1-2 recommended actions
        4. Any concerning trends
        
        Format as a short executive summary (2-3 paragraphs).
      `;
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a campaign performance analyst that provides concise, actionable summaries."
          },
          {
            role: "user",
            content: reportPrompt
          }
        ],
        temperature: 0.3,
      });
      
      return response.choices[0].message.content || "Unable to generate report.";
    } catch (error) {
      logger.error({ error, clientId: this.clientId }, 'Error generating campaign report');
      return "Error generating campaign report. Please try again later.";
    }
  }

  /**
   * Analyzes campaign performance by comparing current metrics against thresholds and historical data
   * @param campaignId The ID of the campaign to analyze
   * @returns Campaign performance data with insights
   */
  async analyzeCampaignPerformance(campaignId: string): Promise<CampaignPerformanceData> {
    try {
      // Get campaign data with metrics
      const campaignData = await this.getCampaignData(campaignId);
      if (!campaignData) {
        throw new Error(`Campaign with ID ${campaignId} not found`);
      }

      // Analyze metrics against thresholds
      const underperformingMetrics = campaignData.metrics.filter(
        metric => this.isMetricUnderperforming(metric)
      );

      // Determine severity based on number and magnitude of underperforming metrics
      const severity = this.determineCampaignSeverity(underperformingMetrics);

      // If no underperforming metrics, return basic performance data
      if (underperformingMetrics.length === 0) {
        return {
          campaignId,
          campaignName: campaignData.campaignName,
          metrics: campaignData.metrics,
          severity: 'info',
          lastChecked: new Date(),
        };
      }

      // Generate AI insights for underperformance causes and recommendations
      const context = await this.gatherCampaignContext(campaignId, underperformingMetrics);
      const prompt = this.generateCampaignAnalysisPrompt(context, underperformingMetrics);
      const aiResponse = await this.callAI(prompt);
      const { causes, actions } = this.processCampaignAIResponse(aiResponse);

      return {
        campaignId,
        campaignName: campaignData.campaignName,
        metrics: campaignData.metrics,
        underperformanceCauses: causes,
        recommendedActions: actions,
        severity,
        lastChecked: new Date(),
      };
    } catch (error) {
      console.error('Error analyzing campaign performance:', error);
      throw error;
    }
  }

  /**
   * Generates campaign insights based on performance analysis
   * @param campaignPerformance The campaign performance data
   * @returns An insight item for the dashboard
   */
  generateCampaignInsight(campaignPerformance: CampaignPerformanceData): InsightItem {
    // Generate a title based on severity and main underperformance cause
    const title = this.generateCampaignInsightTitle(campaignPerformance);
    
    // Generate description that summarizes the metrics and causes
    const description = this.generateCampaignInsightDescription(campaignPerformance);
    
    // Generate actionable recommendation
    const recommendation = campaignPerformance.recommendedActions?.length 
      ? campaignPerformance.recommendedActions[0] 
      : 'Review campaign settings and consider optimization.';
    
    // Determine the most appropriate action type based on causes
    const actionType = this.determineCampaignActionType(campaignPerformance);
    
    // Generate implementation steps
    const implementationSteps = this.generateCampaignImplementationSteps(
      campaignPerformance, 
      actionType
    );

    // Create the insight item
    const insight: InsightItem & {
      kpiData?: CampaignKPIMetric;
      severity?: 'critical' | 'warning' | 'info';
      actionType?: string;
    } = {
      id: `campaign-${campaignPerformance.campaignId}-${Date.now()}`,
      title,
      description,
      type: 'campaign-performance',
      recommendation,
      implementationSteps,
      timestamp: new Date().toISOString(),
      kpiData: campaignPerformance.metrics[0], // Include the primary metric
      severity: campaignPerformance.severity,
      actionType,
      actionLabel: this.getActionLabel(actionType),
    };

    return insight;
  }

  /**
   * Helper method to check if a metric is underperforming
   */
  private isMetricUnderperforming(metric: CampaignKPIMetric): boolean {
    // For metrics where higher is better (revenue, conversions, etc.)
    if (
      metric.metricName.includes('revenue') || 
      metric.metricName.includes('conversion') ||
      metric.metricName.includes('engagement')
    ) {
      return metric.currentValue < metric.threshold;
    }
    
    // For metrics where lower is better (CPC, bounce rate, etc.)
    return metric.currentValue > metric.threshold;
  }

  /**
   * Determine severity of campaign performance issues
   */
  private determineCampaignSeverity(underperformingMetrics: CampaignKPIMetric[]): 'critical' | 'warning' | 'info' {
    if (underperformingMetrics.length === 0) return 'info';
    
    // Check for critical metrics like revenue or ROAS
    const hasCriticalMetric = underperformingMetrics.some(m => 
      (m.metricName.includes('revenue') || m.metricName.includes('ROAS')) && 
      Math.abs((m.currentValue - m.threshold) / m.threshold) > 0.25
    );
    
    if (hasCriticalMetric) return 'critical';
    if (underperformingMetrics.length >= 2) return 'warning';
    return 'info';
  }

  /**
   * Mock method to get campaign data - would be replaced by actual data fetching
   */
  private async getCampaignData(campaignId: string): Promise<{
    campaignId: string;
    campaignName: string;
    metrics: CampaignKPIMetric[];
  }> {
    // In production, this would fetch data from a database or API
    // For now, return mock data for demonstration
    return {
      campaignId,
      campaignName: `Campaign ${campaignId}`,
      metrics: [
        {
          metricName: 'Return on Ad Spend (ROAS)',
          currentValue: 1.8,
          previousValue: 2.5,
          threshold: 2.0,
          unit: 'x',
          timestamp: new Date(),
        },
        {
          metricName: 'Conversion Rate',
          currentValue: 1.2,
          previousValue: 2.1,
          threshold: 2.0,
          unit: '%',
          timestamp: new Date(),
        },
        {
          metricName: 'Cost Per Click (CPC)',
          currentValue: 1.75,
          previousValue: 1.25,
          threshold: 1.5,
          unit: '$',
          timestamp: new Date(),
        }
      ]
    };
  }

  /**
   * Gather campaign context for AI analysis
   */
  private async gatherCampaignContext(
    campaignId: string, 
    underperformingMetrics: CampaignKPIMetric[]
  ): Promise<string> {
    // In production, gather detailed campaign data for context
    return `
Campaign ID: ${campaignId}
Underperforming Metrics:
${underperformingMetrics.map(m => `- ${m.metricName}: ${m.currentValue}${m.unit} (Threshold: ${m.threshold}${m.unit})`).join('\n')}
    `;
  }

  /**
   * Generate a prompt for AI to analyze campaign underperformance
   */
  private generateCampaignAnalysisPrompt(
    context: string, 
    metrics: CampaignKPIMetric[]
  ): string {
    return `
Analyze the following advertising campaign that is underperforming:

${context}

Based on these metrics, identify:
1. The most likely causes of underperformance (pick up to 3)
2. Recommended actions to improve performance (provide 1-3 specific actions)

Format your response as JSON:
{
  "causes": ["cause1", "cause2"],
  "actions": ["specific action 1", "specific action 2"]
}
    `;
  }

  /**
   * Process AI response for campaign analysis
   */
  private processCampaignAIResponse(
    aiResponse: string
  ): { causes: CampaignUnderperformanceCause[], actions: string[] } {
    try {
      // Extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from AI response');
      }
      
      const parsedResponse = JSON.parse(jsonMatch[0]);
      
      return {
        causes: parsedResponse.causes || [],
        actions: parsedResponse.actions || []
      };
    } catch (error) {
      console.error('Error processing AI response for campaign analysis:', error);
      return { causes: ['unknown'], actions: [] };
    }
  }

  /**
   * Generate a title for the campaign insight based on performance data
   */
  private generateCampaignInsightTitle(campaignPerformance: CampaignPerformanceData): string {
    const { severity, underperformanceCauses } = campaignPerformance;
    
    if (severity === 'critical') {
      return `Critical Performance Issue: ${campaignPerformance.campaignName}`;
    }
    
    if (severity === 'warning') {
      const cause = underperformanceCauses?.[0] || 'performance issue';
      return `Campaign Needs Attention: ${this.formatUnderperformanceCause(cause)}`;
    }
    
    return `Campaign Performance Update: ${campaignPerformance.campaignName}`;
  }

  /**
   * Format underperformance cause for display
   */
  private formatUnderperformanceCause(cause: CampaignUnderperformanceCause): string {
    const formattedCauses: Record<CampaignUnderperformanceCause, string> = {
      low_engagement: 'Low Engagement',
      high_cpc: 'High Cost Per Click',
      low_conversion: 'Low Conversion Rate',
      audience_mismatch: 'Audience Targeting Issue',
      creative_fatigue: 'Creative Fatigue',
      budget_constraint: 'Budget Limitations',
      seasonal_factors: 'Seasonal Factors',
      competition_increase: 'Increased Competition',
      unknown: 'Unknown Issue'
    };
    
    return formattedCauses[cause] || cause;
  }

  /**
   * Generate description for campaign insight
   */
  private generateCampaignInsightDescription(campaignPerformance: CampaignPerformanceData): string {
    const { metrics, underperformanceCauses } = campaignPerformance;
    
    let description = `Campaign "${campaignPerformance.campaignName}" `;
    
    // Add metric information
    const underperformingMetrics = metrics.filter(m => this.isMetricUnderperforming(m));
    if (underperformingMetrics.length > 0) {
      const metricSummary = underperformingMetrics
        .map(m => `${m.metricName} at ${m.currentValue}${m.unit} (below threshold of ${m.threshold}${m.unit})`)
        .join(', ');
      
      description += `is showing underperformance in: ${metricSummary}. `;
    } else {
      description += 'is currently meeting performance targets. ';
    }
    
    // Add cause information if available
    if (underperformanceCauses && underperformanceCauses.length > 0) {
      const causeSummary = underperformanceCauses
        .slice(0, 2)
        .map(c => this.formatUnderperformanceCause(c))
        .join(' and ');
      
      description += `Analysis indicates this is likely due to ${causeSummary}.`;
    }
    
    return description;
  }

  /**
   * Determine appropriate action type based on campaign performance data
   */
  private determineCampaignActionType(
    campaignPerformance: CampaignPerformanceData
  ): string {
    const { severity, underperformanceCauses } = campaignPerformance;
    
    if (severity === 'critical') {
      // For critical issues, may need to pause the campaign
      const hasSeriousCause = underperformanceCauses?.some(
        c => ['high_cpc', 'budget_constraint'].includes(c)
      );
      
      if (hasSeriousCause) return 'pause_campaign';
    }
    
    // Determine by cause
    if (underperformanceCauses?.includes('creative_fatigue')) {
      return 'ab_test';
    }
    
    if (underperformanceCauses?.includes('audience_mismatch')) {
      return 'optimize_campaign';
    }
    
    if (underperformanceCauses?.includes('budget_constraint')) {
      return 'increase_budget';
    }
    
    // Default action
    return 'optimize_campaign';
  }

  /**
   * Generate action label based on action type
   */
  private getActionLabel(actionType: string): string {
    const actionLabels: Record<string, string> = {
      'optimize_campaign': 'Optimize Campaign',
      'pause_campaign': 'Pause Campaign',
      'increase_budget': 'Increase Budget',
      'ab_test': 'Create A/B Test',
    };
    
    return actionLabels[actionType] || 'Take Action';
  }

  /**
   * Generate implementation steps based on campaign performance and action type
   */
  private generateCampaignImplementationSteps(
    campaignPerformance: CampaignPerformanceData, 
    actionType: string
  ): string[] {
    const baseSteps: Record<string, string[]> = {
      'optimize_campaign': [
        'Review campaign targeting settings',
        'Analyze top-performing ad creatives',
        'Adjust bid strategy based on performance data'
      ],
      'pause_campaign': [
        'Pause the campaign temporarily',
        'Review complete campaign performance data',
        'Develop revised campaign strategy'
      ],
      'increase_budget': [
        'Calculate optimal budget increase',
        'Adjust daily/lifetime budget settings',
        'Monitor performance closely for 48 hours'
      ],
      'ab_test': [
        'Create a duplicate campaign version',
        'Modify one key variable (audience, creative, etc.)',
        'Split budget equally between variants',
        'Set up performance tracking for comparison'
      ]
    };
    
    return baseSteps[actionType] || [
      'Review campaign performance data',
      'Identify optimization opportunities',
      'Implement changes and monitor results'
    ];
  }

  /**
   * Process all pending trigger events based on campaign performance
   * @returns Array of processed trigger events
   */
  async processTriggers(): Promise<TriggerEvent[]> {
    logger.info({ clientId: this.clientId }, 'Processing automation triggers');
    
    try {
      // Get all active campaigns
      const campaigns = await prisma.campaign.findMany({
        where: { 
          clientId: this.clientId,
          status: 'active'
        },
      });
      
      if (campaigns.length === 0) {
        logger.debug('No active campaigns found');
        return [];
      }
      
      // Get all trigger rules for this client
      const triggerRules = await this.getTriggerRules();
      
      if (triggerRules.length === 0) {
        logger.debug('No trigger rules defined');
        return [];
      }
      
      const processedEvents: TriggerEvent[] = [];
      
      // Check each campaign against all rules
      for (const campaign of campaigns) {
        // Get latest campaign performance data
        const performanceData = await this.analyzeCampaignPerformance(campaign.id);
        
        // Check each rule against performance data
        for (const rule of triggerRules) {
          // Skip inactive rules
          if (!rule.isActive) continue;
          
          // Skip rules in cooldown period
          if (rule.lastTriggered && rule.cooldownPeriod) {
            const cooldownEnds = new Date(rule.lastTriggered);
            cooldownEnds.setHours(cooldownEnds.getHours() + rule.cooldownPeriod);
            
            if (new Date() < cooldownEnds) {
              logger.debug({ ruleId: rule.id }, 'Rule in cooldown period');
              continue;
            }
          }
          
          // Check if all conditions match
          const conditionsMet = this.evaluateRuleConditions(rule.conditions, performanceData);
          
          if (conditionsMet) {
            // Create a trigger event
            const triggerEvent: TriggerEvent = {
              id: `trig_${Date.now()}_${campaign.id}`,
              ruleId: rule.id,
              triggeredAt: new Date(),
              status: 'pending',
              campaignId: campaign.id,
            };
            
            // Process the action
            try {
              const result = await this.executeRuleAction(rule.action, campaign.id);
              triggerEvent.status = 'processed';
              triggerEvent.actionResult = result;
              
              // Update rule's lastTriggered timestamp
              await this.updateTriggerRuleTimestamp(rule.id);
            } catch (error) {
              logger.error({ error, ruleId: rule.id, campaignId: campaign.id }, 'Error executing rule action');
              triggerEvent.status = 'failed';
              triggerEvent.actionResult = error.message;
            }
            
            // Save the trigger event
            await this.saveTriggerEvent(triggerEvent);
            
            processedEvents.push(triggerEvent);
          }
        }
      }
      
      return processedEvents;
    } catch (error) {
      logger.error({ error, clientId: this.clientId }, 'Error processing triggers');
      throw new Error('Failed to process automation triggers');
    }
  }

  /**
   * Evaluate if all conditions in a rule are met by campaign performance data
   */
  private evaluateRuleConditions(
    conditions: TriggerCondition[],
    performanceData: CampaignPerformanceData
  ): boolean {
    // All conditions must be met
    return conditions.every(condition => {
      // Find matching metric
      const metric = performanceData.metrics.find(m => m.metricName === condition.metricName);
      
      if (!metric) return false;
      
      // Check condition based on operator
      switch (condition.operator) {
        case 'less_than':
          return metric.currentValue < condition.threshold;
        case 'greater_than':
          return metric.currentValue > condition.threshold;
        case 'equal_to':
          return Math.abs(metric.currentValue - condition.threshold) < 0.001; // Approximate equality for floating point
        default:
          return false;
      }
    });
  }

  /**
   * Execute automation action based on trigger rule
   */
  private async executeRuleAction(
    action: TriggerAction,
    campaignId: string
  ): Promise<string> {
    logger.info({ actionType: action.actionType, campaignId }, 'Executing automation action');
    
    switch (action.actionType) {
      case 'pause_campaign':
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { status: 'paused' }
        });
        return `Campaign ${campaignId} paused successfully`;
        
      case 'increase_budget':
        const increaseAmount = action.actionParams?.amount || 0.1; // Default 10% increase
        
        const campaignToIncrease = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { budget: true }
        });
        
        if (!campaignToIncrease) {
          throw new Error('Campaign not found');
        }
        
        const newBudget = campaignToIncrease.budget * (1 + increaseAmount);
        
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { budget: newBudget }
        });
        
        return `Campaign budget increased to ${newBudget.toFixed(2)}`;
        
      case 'decrease_budget':
        const decreaseAmount = action.actionParams?.amount || 0.1; // Default 10% decrease
        
        const campaignToDecrease = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { budget: true }
        });
        
        if (!campaignToDecrease) {
          throw new Error('Campaign not found');
        }
        
        const reducedBudget = campaignToDecrease.budget * (1 - decreaseAmount);
        
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { budget: reducedBudget }
        });
        
        return `Campaign budget decreased to ${reducedBudget.toFixed(2)}`;
        
      case 'change_targeting':
        // Implementation would depend on targeting options
        return 'Targeting changes not implemented yet';
        
      case 'notify_team':
        // Send notification to team (email, Slack, etc.)
        const message = action.actionParams?.message || 
          `Automation alert: Campaign ${campaignId} triggered an alert requiring attention.`;
        
        // Here you would integrate with notification service
        // await notificationService.sendNotification(message);
        
        return `Notification sent: ${message}`;
        
      default:
        throw new Error(`Unsupported action type: ${action.actionType}`);
    }
  }

  /**
   * Get all trigger rules for current client 
   */
  private async getTriggerRules(): Promise<TriggerRule[]> {
    // In production, this would fetch from the database
    // For now, return some sample rules
    return [
      {
        id: 'rule_1',
        name: 'Low ROAS Alert',
        conditions: [
          {
            metricName: 'Return on Ad Spend (ROAS)',
            operator: 'less_than',
            threshold: 2.0,
            unit: 'x'
          }
        ],
        action: {
          actionType: 'notify_team',
          actionParams: {
            message: 'Low ROAS detected - please review campaign'
          },
          priority: 'high'
        },
        isActive: true,
        cooldownPeriod: 24 // Once per day
      },
      {
        id: 'rule_2',
        name: 'Auto-Decrease Budget on High CPC',
        conditions: [
          {
            metricName: 'Cost Per Click (CPC)',
            operator: 'greater_than',
            threshold: 1.5,
            unit: '$'
          }
        ],
        action: {
          actionType: 'decrease_budget',
          actionParams: {
            amount: 0.15 // 15% reduction
          },
          priority: 'medium'
        },
        isActive: true,
        cooldownPeriod: 48 // Once every two days
      },
      {
        id: 'rule_3',
        name: 'Pause Campaign on Critical Underperformance',
        conditions: [
          {
            metricName: 'Return on Ad Spend (ROAS)',
            operator: 'less_than',
            threshold: 1.0,
            unit: 'x'
          },
          {
            metricName: 'Conversion Rate',
            operator: 'less_than',
            threshold: 1.0,
            unit: '%'
          }
        ],
        action: {
          actionType: 'pause_campaign',
          priority: 'high'
        },
        isActive: true,
        lastTriggered: new Date(Date.now() - 72 * 60 * 60 * 1000) // 3 days ago
      }
    ];
  }

  /**
   * Update the lastTriggered timestamp of a rule
   */
  private async updateTriggerRuleTimestamp(ruleId: string): Promise<void> {
    // In production, this would update the database record
    logger.debug({ ruleId }, 'Updated rule last triggered timestamp');
  }

  /**
   * Save a trigger event to the database
   */
  private async saveTriggerEvent(event: TriggerEvent): Promise<void> {
    // In production, this would save to the database
    logger.debug({ event }, 'Saved trigger event');
  }
}

/**
 * Analyzes campaign performance and generates insights
 * @param campaign Campaign data to analyze
 * @param historicalData Historical campaign performance data
 * @returns Array of insights based on campaign performance
 */
export async function analyzeCampaignPerformance(
  campaign: Campaign,
  historicalData: any
): Promise<CampaignInsight[]> {
  const insights: CampaignInsight[] = [];
  
  // Analyze ROAS (Return on Ad Spend)
  if (historicalData.roas && historicalData.roas.current < KPI_THRESHOLDS.ROAS) {
    const roasDeclinePercent = ((KPI_THRESHOLDS.ROAS - historicalData.roas.current) / KPI_THRESHOLDS.ROAS) * 100;
    if (roasDeclinePercent > 25) {
      // Critical ROAS decline
      insights.push({
        id: `roas-critical-${campaign.id}`,
        campaignId: campaign.id,
        title: `Critical ROAS Decline in ${campaign.name}`,
        description: `Your ROAS has dropped ${roasDeclinePercent.toFixed(0)}% below target for the ${campaign.name} campaign over the last 7 days.`,
        type: 'campaign-performance',
        recommendation: 'Consider reallocating budget from underperforming ad groups to top performers. Review targeting parameters against successful historical campaigns.',
        implementationSteps: [
          'Pause the 3 worst-performing ad sets',
          'Increase budget by 20% for top-performing ad set',
          'Review audience overlap in targeting'
        ],
        actionLabel: 'Optimize Campaign',
        actionType: 'optimize_campaign',
        severity: 'critical',
        kpiData: {
          metricName: 'ROAS',
          currentValue: historicalData.roas.current,
          previousValue: historicalData.roas.previous,
          threshold: KPI_THRESHOLDS.ROAS,
          unit: 'x'
        },
        date: new Date().toISOString()
      });
    } else if (roasDeclinePercent > 10) {
      // Warning ROAS decline
      insights.push({
        id: `roas-warning-${campaign.id}`,
        campaignId: campaign.id,
        title: `Declining ROAS in ${campaign.name}`,
        description: `Your ROAS is trending downward in the ${campaign.name} campaign (${roasDeclinePercent.toFixed(0)}% below target).`,
        type: 'campaign-performance',
        recommendation: 'Review ad creative and audience targeting to identify underperforming elements.',
        implementationSteps: [
          'Analyze performance by ad creative',
          'Check audience engagement metrics',
          'Adjust bidding strategy as needed'
        ],
        actionLabel: 'Review Performance',
        actionType: 'review_performance',
        severity: 'warning',
        kpiData: {
          metricName: 'ROAS',
          currentValue: historicalData.roas.current,
          previousValue: historicalData.roas.previous,
          threshold: KPI_THRESHOLDS.ROAS,
          unit: 'x'
        },
        date: new Date().toISOString()
      });
    }
  }
  
  // Analyze CPM (Cost per Mille)
  if (historicalData.cpm && historicalData.cpm.current > KPI_THRESHOLDS.CPM) {
    const cpmIncreasePercent = ((historicalData.cpm.current - KPI_THRESHOLDS.CPM) / KPI_THRESHOLDS.CPM) * 100;
    if (cpmIncreasePercent > 25) {
      insights.push({
        id: `cpm-critical-${campaign.id}`,
        campaignId: campaign.id,
        title: `High CPM in ${campaign.name}`,
        description: `Your CPM has increased ${cpmIncreasePercent.toFixed(0)}% above target for the ${campaign.name} campaign.`,
        type: 'campaign-performance',
        recommendation: 'Review ad relevance scores and refresh creative to improve audience targeting efficiency.',
        implementationSteps: [
          'Create new ad variations with updated messaging',
          'Test different audience segments',
          'Adjust bidding strategy'
        ],
        actionLabel: 'Refresh Creative',
        actionType: 'refresh_creative',
        severity: 'critical',
        kpiData: {
          metricName: 'CPM',
          currentValue: historicalData.cpm.current,
          previousValue: historicalData.cpm.previous,
          threshold: KPI_THRESHOLDS.CPM,
          unit: '$'
        },
        date: new Date().toISOString()
      });
    } else if (cpmIncreasePercent > 10) {
      insights.push({
        id: `cpm-warning-${campaign.id}`,
        campaignId: campaign.id,
        title: `Increasing CPM in ${campaign.name}`,
        description: `CPM costs have increased ${cpmIncreasePercent.toFixed(0)}% over the past month while performance remains stable.`,
        type: 'campaign-performance',
        recommendation: 'Consider refreshing ad creative and testing new audience segments to improve relevance score.',
        implementationSteps: [
          'Create 3 new ad variations',
          'Test 2 new audience segments',
          'Implement A/B testing to measure impact'
        ],
        actionLabel: 'Create A/B Test',
        actionType: 'ab_test',
        severity: 'warning',
        kpiData: {
          metricName: 'CPM',
          currentValue: historicalData.cpm.current,
          previousValue: historicalData.cpm.previous,
          threshold: KPI_THRESHOLDS.CPM,
          unit: '$'
        },
        date: new Date().toISOString()
      });
    }
  }
  
  // Analyze CTR (Click-through Rate)
  if (historicalData.ctr && historicalData.ctr.current < KPI_THRESHOLDS.CTR) {
    const ctrDeclinePercent = ((KPI_THRESHOLDS.CTR - historicalData.ctr.current) / KPI_THRESHOLDS.CTR) * 100;
    if (ctrDeclinePercent > 30) {
      insights.push({
        id: `ctr-critical-${campaign.id}`,
        campaignId: campaign.id,
        title: `Low CTR in ${campaign.name}`,
        description: `Your click-through rate has dropped ${ctrDeclinePercent.toFixed(0)}% below target for ${campaign.name}.`,
        type: 'campaign-performance',
        recommendation: 'Urgent creative refresh needed. Current ad creatives are not resonating with the target audience.',
        implementationSteps: [
          'Develop 5 new ad variations with different value propositions',
          'Test different calls-to-action',
          'Analyze competitor messaging for inspiration'
        ],
        actionLabel: 'Creative Overhaul',
        actionType: 'creative_overhaul',
        severity: 'critical',
        kpiData: {
          metricName: 'CTR',
          currentValue: historicalData.ctr.current,
          previousValue: historicalData.ctr.previous,
          threshold: KPI_THRESHOLDS.CTR,
          unit: '%'
        },
        date: new Date().toISOString()
      });
    }
  }
  
  // Opportunity insights - high-performing campaigns
  if (historicalData.cvr && historicalData.cvr.current > KPI_THRESHOLDS.CVR * 1.3) {
    const cvrIncreasePercent = ((historicalData.cvr.current - KPI_THRESHOLDS.CVR) / KPI_THRESHOLDS.CVR) * 100;
    insights.push({
      id: `cvr-opportunity-${campaign.id}`,
      campaignId: campaign.id,
      title: `Opportunity: High Conversion in ${campaign.name}`,
      description: `Your ${campaign.name} campaign is showing exceptional conversion rates, ${cvrIncreasePercent.toFixed(0)}% higher than average.`,
      type: 'campaign-opportunity',
      recommendation: 'Consider increasing budget allocation to maximize results during this successful period.',
      implementationSteps: [
        'Increase daily budget by 30% for this campaign',
        'Extend campaign duration if time-limited',
        'Apply successful targeting parameters to other campaigns'
      ],
      actionLabel: 'Increase Budget',
      actionType: 'increase_budget',
      severity: 'info',
      kpiData: {
        metricName: 'Conversion Rate',
        currentValue: historicalData.cvr.current,
        previousValue: historicalData.cvr.previous,
        threshold: KPI_THRESHOLDS.CVR,
        unit: '%'
      },
      date: new Date().toISOString()
    });
  }
  
  return insights;
}

/**
 * Gets all campaign insights for a client
 * @param clientId The client ID
 * @returns Array of insights for all client campaigns
 */
export async function getCampaignInsights(clientId: string): Promise<CampaignInsight[]> {
  // In a real implementation, this would fetch campaign data from the database
  // and call analyzeCampaignPerformance for each campaign
  
  // For now, returning mock insights
  return [
    {
      id: '1',
      campaignId: 'campaign-1',
      title: 'Critical ROAS Decline in Summer Campaign',
      description: 'Your ROAS has dropped 28% below target for the Summer Sale campaign over the last 7 days.',
      type: 'campaign-performance',
      recommendation: 'Consider reallocating budget from underperforming ad groups to top performers. Review targeting parameters against successful historical campaigns.',
      implementationSteps: [
        'Pause the 3 worst-performing ad sets (ID: 1839, 2042, 1956)',
        'Increase budget by 20% for top-performing ad set (ID: 2105)',
        'Review audience overlap in targeting'
      ],
      actionLabel: 'Optimize Campaign',
      actionType: 'optimize_campaign',
      severity: 'critical',
      kpiData: {
        metricName: 'ROAS',
        currentValue: 2.1,
        previousValue: 3.4,
        threshold: 3.0,
        unit: 'x'
      },
      date: new Date().toISOString()
    },
    {
      id: '2',
      campaignId: 'campaign-2',
      title: 'Increasing CPM in Facebook Ads',
      description: 'Facebook ad costs have increased 15% over the past month while performance remains stable.',
      type: 'campaign-performance',
      recommendation: 'Consider refreshing ad creative and testing new audience segments to improve relevance score.',
      implementationSteps: [
        'Create 3 new ad variations with updated visuals',
        'Test 2 new audience segments based on recent purchaser data',
        'Implement A/B testing to measure impact'
      ],
      actionLabel: 'Create A/B Test',
      actionType: 'ab_test',
      severity: 'warning',
      kpiData: {
        metricName: 'CPM',
        currentValue: 12.75,
        previousValue: 11.1,
        threshold: 12.0,
        unit: '$'
      },
      date: new Date().toISOString()
    },
    {
      id: '3',
      campaignId: 'campaign-3',
      title: 'Opportunity: High Conversion in Weekend Campaign',
      description: 'Your weekend promotion campaign is showing exceptional conversion rates, 32% higher than average.',
      type: 'campaign-opportunity',
      recommendation: 'Consider increasing budget allocation to maximize results during this successful period.',
      implementationSteps: [
        'Increase daily budget by 30% for this campaign',
        'Extend campaign duration by an additional weekend',
        'Apply successful targeting parameters to other campaigns'
      ],
      actionLabel: 'Increase Budget',
      actionType: 'increase_budget',
      severity: 'info',
      kpiData: {
        metricName: 'Conversion Rate',
        currentValue: 4.2,
        previousValue: 3.2,
        threshold: 3.0,
        unit: '%'
      },
      date: new Date().toISOString()
    }
  ];
}

/**
 * Generates AI-powered experiment summaries
 * @param experimentId The experiment ID to summarize
 * @returns A summary of the experiment results
 */
export async function generateExperimentSummary(experimentId: string): Promise<string> {
  // In a real implementation, this would fetch experiment data and use AI to generate a summary
  
  // Mock implementation
  return `This A/B test compared two ad creative approaches: emotional storytelling vs. direct product promotion. The emotional storytelling variant achieved a 23% higher CTR and 15% better conversion rate, indicating that emotional appeals resonate better with this audience segment. Recommend implementing emotional storytelling approach across similar campaigns targeting this demographic.`;
} 