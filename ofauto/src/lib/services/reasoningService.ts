'use server';

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import OpenAI from 'openai';

// Define the types of insights the reasoning model can generate
export enum InsightType {
  CONTENT_STRATEGY = 'content-strategy',
  PRICING_OPTIMIZATION = 'pricing-optimization',
  POSTING_SCHEDULE = 'posting-schedule',
  PLATFORM_STRATEGY = 'platform-strategy',
  ENGAGEMENT_TACTICS = 'engagement-tactics',
  REVENUE_GROWTH = 'revenue-growth',
  AB_TESTING = 'ab-testing',
  PERSONALIZATION = 'personalization',
}

export interface InsightItem {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  recommendation: string;
  confidence: number; // 0-1 score
  relevantMetrics?: Record<string, any>;
  createdAt: Date;
  implementationSteps?: string[];
  platforms?: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'implemented';
  actionType?: string;
  actionLabel?: string;
  recommendedValue?: string;
}

export interface InsightContext {
  contentPerformance?: {
    topPerforming: any[];
    recentTrends: any[];
  };
  subscriberMetrics?: {
    growth: number;
    churn: number;
    engagementRate: number;
  };
  financialMetrics?: {
    revenue: number;
    averageRevenue: number;
    topRevenueSources: any[];
  };
  platformMetrics?: Record<string, {
    subscribers: number;
    engagement: number;
    revenue: number;
  }>;
}

// Add new types in the appropriate place
export interface CampaignExperimentData {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  status: 'running' | 'paused' | 'completed' | 'archived';
  variants: CampaignVariant[];
  controlVariantId?: string;
  goalMetric: string;
  performanceData?: Record<string, Record<string, any>>;
  conclusion?: string;
  createdAt: Date;
}

export interface CampaignVariant {
  id: string;
  description: string;
  content?: string;
  audience?: string;
  pricingModel?: string;
  scheduleTimes?: string[];
}

export interface ClientPersonaData {
  id: string;
  targetAudience?: string;
  brandVoice?: string;
  preferences?: Record<string, any>;
  engagementPatterns?: Record<string, any>;
  createdAt: Date;
}

/**
 * The ReasoningService provides AI-powered insights and recommendations
 * based on the user's platform data and performance metrics.
 */
export class ReasoningService {
  private openai: OpenAI;
  private clientId: string;

  constructor(clientId: string) {
    this.clientId = clientId;
    
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Gather context data for generating insights
   */
  private async gatherContext(): Promise<InsightContext> {
    logger.debug({ clientId: this.clientId }, 'Gathering context for reasoning model');
    
    try {
      // Fetch relevant data from database
      // For a real implementation, this would include queries for:
      // - Content performance data
      // - Subscriber metrics
      // - Financial data
      // - Platform-specific metrics
      
      // For now, we'll return mock data
      const mockContext: InsightContext = {
        contentPerformance: {
          topPerforming: [
            { type: 'video', title: 'Behind the scenes', engagement: 0.25 },
            { type: 'image', title: 'Product showcase', engagement: 0.18 },
            { type: 'text', title: 'Personal story', engagement: 0.15 },
          ],
          recentTrends: [
            { trend: 'Increasing engagement with video content', confidence: 0.8 },
            { trend: 'Higher conversion on weekends', confidence: 0.65 },
          ],
        },
        subscriberMetrics: {
          growth: 0.12, // 12% growth
          churn: 0.08, // 8% churn
          engagementRate: 0.22, // 22% engagement
        },
        financialMetrics: {
          revenue: 5200,
          averageRevenue: 15.75,
          topRevenueSources: [
            { platform: 'OnlyFans', percentage: 0.65 },
            { platform: 'Fansly', percentage: 0.20 },
            { platform: 'Patreon', percentage: 0.15 },
          ],
        },
        platformMetrics: {
          onlyfans: {
            subscribers: 320,
            engagement: 0.25,
            revenue: 3380,
          },
          fansly: {
            subscribers: 120,
            engagement: 0.18,
            revenue: 1040,
          },
          patreon: {
            subscribers: 85,
            engagement: 0.22,
            revenue: 780,
          },
        },
      };
      
      // In a real implementation, we would fetch actual data from the database
      // const revenueData = await prisma.revenue.findMany({
      //   where: { clientId: this.clientId },
      //   orderBy: { date: 'desc' },
      //   take: 30,
      // });
      
      return mockContext;
    } catch (error) {
      logger.error({ error, clientId: this.clientId }, 'Error gathering context for reasoning model');
      throw new Error('Failed to gather context data for reasoning');
    }
  }

  /**
   * Generate a prompt for the AI model based on the context data
   */
  private generatePrompt(context: InsightContext, insightType: InsightType): string {
    const prompts: Record<InsightType, string> = {
      [InsightType.CONTENT_STRATEGY]: `
        Based on the following content performance data, provide strategic recommendations for content creation:
        
        Top Performing Content:
        ${JSON.stringify(context.contentPerformance?.topPerforming || [])}
        
        Recent Trends:
        ${JSON.stringify(context.contentPerformance?.recentTrends || [])}
        
        Subscriber Metrics:
        - Growth Rate: ${context.subscriberMetrics?.growth || '?'}
        - Engagement Rate: ${context.subscriberMetrics?.engagementRate || '?'}
        
        Provide 3 specific content strategy recommendations, explaining the reasoning behind each recommendation. 
        Include specific content types, topics, formats, and frequency that are likely to increase engagement and revenue.
      `,
      
      [InsightType.PRICING_OPTIMIZATION]: `
        Based on the following financial and subscriber data, provide recommendations for pricing optimization:
        
        Financial Metrics:
        - Average Revenue Per User: $${context.financialMetrics?.averageRevenue || '?'}
        - Total Revenue: $${context.financialMetrics?.revenue || '?'}
        - Revenue Sources: ${JSON.stringify(context.financialMetrics?.topRevenueSources || [])}
        
        Subscriber Metrics:
        - Growth Rate: ${context.subscriberMetrics?.growth || '?'}
        - Churn Rate: ${context.subscriberMetrics?.churn || '?'}
        
        Platform Metrics:
        ${JSON.stringify(context.platformMetrics || {})}
        
        Provide 3 specific pricing optimization recommendations, explaining the reasoning behind each. 
        Include suggestions about subscription tiers, pricing points, special offers, and which platforms to prioritize.
      `,
      
      [InsightType.POSTING_SCHEDULE]: `
        Based on the following engagement data, provide recommendations for an optimal posting schedule:
        
        Subscriber Metrics:
        - Engagement Rate: ${context.subscriberMetrics?.engagementRate || '?'}
        
        Platform Metrics:
        ${JSON.stringify(context.platformMetrics || {})}
        
        Content Performance:
        ${JSON.stringify(context.contentPerformance || {})}
        
        Provide a specific posting schedule recommendation, including the best days of the week, times of day, 
        and frequency for different content types across each platform. Explain the reasoning behind the 
        recommendations and how they can be implemented.
      `,
      
      [InsightType.PLATFORM_STRATEGY]: `
        Based on the following platform performance data, provide strategic recommendations for platform prioritization:
        
        Platform Metrics:
        ${JSON.stringify(context.platformMetrics || {})}
        
        Financial Metrics:
        - Revenue Sources: ${JSON.stringify(context.financialMetrics?.topRevenueSources || [])}
        
        Provide 3 specific platform strategy recommendations, explaining which platforms should be prioritized, 
        which may need a different approach, and if any new platforms should be considered based on the current performance.
      `,
      
      [InsightType.ENGAGEMENT_TACTICS]: `
        Based on the following engagement and subscriber data, provide tactical recommendations to increase user engagement:
        
        Subscriber Metrics:
        - Growth Rate: ${context.subscriberMetrics?.growth || '?'}
        - Churn Rate: ${context.subscriberMetrics?.churn || '?'}
        - Engagement Rate: ${context.subscriberMetrics?.engagementRate || '?'}
        
        Content Performance:
        ${JSON.stringify(context.contentPerformance || {})}
        
        Provide 3 specific engagement tactics that can be implemented immediately, explaining how each tactic 
        would help increase user engagement, reduce churn, and potentially increase revenue. Include specific 
        actions for messaging, community building, and personalization.
      `,
      
      [InsightType.REVENUE_GROWTH]: `
        Based on the following financial and platform data, provide strategic recommendations for revenue growth:
        
        Financial Metrics:
        - Average Revenue Per User: $${context.financialMetrics?.averageRevenue || '?'}
        - Total Revenue: $${context.financialMetrics?.revenue || '?'}
        - Revenue Sources: ${JSON.stringify(context.financialMetrics?.topRevenueSources || [])}
        
        Platform Metrics:
        ${JSON.stringify(context.platformMetrics || {})}
        
        Subscriber Metrics:
        - Growth Rate: ${context.subscriberMetrics?.growth || '?'}
        - Churn Rate: ${context.subscriberMetrics?.churn || '?'}
        
        Provide 3 specific revenue growth strategies, explaining how each strategy would impact revenue, 
        the implementation steps required, and the expected outcome. Include diversification opportunities, 
        cross-platform promotion ideas, and subscriber retention tactics.
      `,
    };
    
    return prompts[insightType] || 'Please provide strategic recommendations based on the available data.';
  }

  /**
   * Process the AI model response into a structured insight
   */
  private processAIResponse(response: string, type: InsightType): Omit<InsightItem, 'id' | 'createdAt' | 'status'> {
    try {
      // For production, you would want to implement more robust parsing
      // For now, we'll do a simple split
      
      const lines = response.split('\n').filter(line => line.trim() !== '');
      
      // Extract title, description, and recommendation
      const title = lines[0] || `${type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')} Insight`;
      const description = lines.slice(1, 3).join('\n') || 'Based on your platform data, we have generated the following insight.';
      
      // Everything else is the recommendation
      const recommendation = lines.slice(3).join('\n') || 'No specific recommendation available.';
      
      // Implementation steps (in a real system, we'd use better parsing)
      const implementationStepsMatch = recommendation.match(/steps?:(.+?)(?=(recommendation|conclusion|$))/si);
      const implementationSteps = implementationStepsMatch 
        ? implementationStepsMatch[1].split(/\d+\./).filter(Boolean).map(s => s.trim())
        : undefined;
      
      // Relevant platforms
      const platforms = ['onlyfans', 'fansly', 'patreon', 'kofi', 'gumroad', 'twitter', 'instagram']
        .filter(platform => response.toLowerCase().includes(platform));
      
      // Add special handling for A/B testing and personalization insights
      let actionType, actionLabel, recommendedValue;
      
      if (type === InsightType.AB_TESTING) {
        actionType = 'create_experiment';
        actionLabel = 'Setup A/B Test';
        
        // Try to extract experiment details
        const experimentMatch = recommendation.match(/experiment:(.+?)(?=(variant|$))/si);
        recommendedValue = experimentMatch 
          ? experimentMatch[1].trim()
          : 'Create a new A/B test for this recommendation';
      } else if (type === InsightType.PERSONALIZATION) {
        actionType = 'update_persona';
        actionLabel = 'Update Persona';
        
        // Try to extract persona details
        const personaMatch = recommendation.match(/persona:(.+?)(?=(recommendation|$))/si);
        recommendedValue = personaMatch 
          ? personaMatch[1].trim()
          : 'Update client persona with these recommendations';
      }
      
      return {
        type,
        title,
        description,
        recommendation,
        confidence: 0.85, // Would be determined by the AI model in a real system
        implementationSteps,
        platforms: platforms.length > 0 ? platforms : undefined,
        actionType,
        actionLabel,
        recommendedValue,
      };
    } catch (error) {
      logger.error({ error, type }, 'Error processing AI response');
      
      // Return a fallback insight if processing fails
      return {
        type,
        title: `${type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')} Recommendation`,
        description: 'We have analyzed your platform data and generated insights to help improve your performance.',
        recommendation: response || 'No specific recommendation available.',
        confidence: 0.7,
      };
    }
  }

  /**
   * Generate an insight using the AI model
   */
  async generateInsight(type: InsightType): Promise<InsightItem> {
    logger.info({ clientId: this.clientId, insightType: type }, 'Generating insight');
    
    try {
      // Get context data
      const context = await this.gatherContext();
      
      // Generate prompt
      const prompt = this.generatePrompt(context, type);
      
      // Call OpenAI
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a data-driven content strategy advisor for creators on platforms like OnlyFans, Patreon, and Fansly. 
            You provide specific, actionable insights based on performance data. Format your response as a title followed by 
            concise, clear recommendations. Be practical, business-focused, and direct.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });
      
      const response = completion.choices[0]?.message?.content || '';
      
      // Process the response
      const insightData = this.processAIResponse(response, type);
      
      // Save to database
      const insight = await prisma.insight.create({
        data: {
          clientId: this.clientId,
          type,
          title: insightData.title,
          description: insightData.description,
          recommendation: insightData.recommendation,
          confidence: insightData.confidence,
          status: 'pending',
          metadata: {
            implementationSteps: insightData.implementationSteps,
            platforms: insightData.platforms,
            relevantMetrics: insightData.relevantMetrics,
          },
        },
      });
      
      logger.info({ insightId: insight.id, clientId: this.clientId }, 'Successfully generated and stored insight');
      
      return {
        id: insight.id,
        type: insight.type as InsightType,
        title: insight.title,
        description: insight.description,
        recommendation: insight.recommendation,
        confidence: insight.confidence,
        implementationSteps: insightData.implementationSteps,
        platforms: insightData.platforms,
        createdAt: insight.createdAt,
        status: insight.status as 'pending' | 'accepted' | 'rejected' | 'implemented',
        actionType: insightData.actionType,
        actionLabel: insightData.actionLabel,
        recommendedValue: insightData.recommendedValue,
      };
    } catch (error) {
      logger.error({ error, clientId: this.clientId, insightType: type }, 'Error generating insight');
      throw new Error(`Failed to generate ${type} insight: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all insights for the client
   */
  async getInsights(): Promise<InsightItem[]> {
    logger.debug({ clientId: this.clientId }, 'Fetching insights');
    
    try {
      const insights = await prisma.insight.findMany({
        where: { clientId: this.clientId },
        orderBy: { createdAt: 'desc' },
      });
      
      return insights.map(insight => ({
        id: insight.id,
        type: insight.type as InsightType,
        title: insight.title,
        description: insight.description,
        recommendation: insight.recommendation,
        confidence: insight.confidence,
        implementationSteps: insight.metadata?.implementationSteps,
        platforms: insight.metadata?.platforms,
        relevantMetrics: insight.metadata?.relevantMetrics,
        createdAt: insight.createdAt,
        status: insight.status as 'pending' | 'accepted' | 'rejected' | 'implemented',
        actionType: insight.metadata?.actionType,
        actionLabel: insight.metadata?.actionLabel,
        recommendedValue: insight.metadata?.recommendedValue,
      }));
    } catch (error) {
      logger.error({ error, clientId: this.clientId }, 'Error fetching insights');
      throw new Error('Failed to fetch insights');
    }
  }

  /**
   * Update the status of an insight
   */
  async updateInsightStatus(insightId: string, status: 'pending' | 'accepted' | 'rejected' | 'implemented'): Promise<InsightItem> {
    logger.debug({ clientId: this.clientId, insightId, status }, 'Updating insight status');
    
    try {
      const insight = await prisma.insight.update({
        where: { 
          id: insightId,
          clientId: this.clientId, // Ensure the insight belongs to this client
        },
        data: { status },
      });
      
      return {
        id: insight.id,
        type: insight.type as InsightType,
        title: insight.title,
        description: insight.description,
        recommendation: insight.recommendation,
        confidence: insight.confidence,
        implementationSteps: insight.metadata?.implementationSteps,
        platforms: insight.metadata?.platforms,
        relevantMetrics: insight.metadata?.relevantMetrics,
        createdAt: insight.createdAt,
        status: insight.status as 'pending' | 'accepted' | 'rejected' | 'implemented',
        actionType: insight.metadata?.actionType,
        actionLabel: insight.metadata?.actionLabel,
        recommendedValue: insight.metadata?.recommendedValue,
      };
    } catch (error) {
      logger.error({ error, clientId: this.clientId, insightId }, 'Error updating insight status');
      throw new Error('Failed to update insight status');
    }
  }

  /**
   * Create a new A/B testing campaign experiment
   */
  async createCampaignExperiment(
    name: string,
    description: string,
    variants: CampaignVariant[],
    goalMetric: string,
    controlVariantId?: string,
  ): Promise<CampaignExperimentData> {
    logger.info({ clientId: this.clientId, name }, 'Creating new campaign experiment');
    
    try {
      // Create campaign experiment in the database
      const experiment = await prisma.campaignExperiment.create({
        data: {
          clientId: this.clientId,
          name,
          description,
          variants: variants as any,
          goalMetric,
          controlVariantId,
          status: 'running',
        },
      });
      
      return {
        id: experiment.id,
        name: experiment.name,
        description: experiment.description || undefined,
        startDate: experiment.startDate,
        endDate: experiment.endDate || undefined,
        status: experiment.status as 'running' | 'paused' | 'completed' | 'archived',
        variants: experiment.variants as CampaignVariant[],
        controlVariantId: experiment.controlVariantId || undefined,
        goalMetric: experiment.goalMetric,
        performanceData: experiment.performanceData as Record<string, Record<string, any>> || undefined,
        conclusion: experiment.conclusion || undefined,
        createdAt: experiment.createdAt,
      };
    } catch (error) {
      logger.error({ error, clientId: this.clientId }, 'Error creating campaign experiment');
      throw new Error('Failed to create campaign experiment');
    }
  }

  /**
   * Get all A/B testing experiments for the client
   */
  async getCampaignExperiments(): Promise<CampaignExperimentData[]> {
    logger.debug({ clientId: this.clientId }, 'Fetching campaign experiments');
    
    try {
      const experiments = await prisma.campaignExperiment.findMany({
        where: { clientId: this.clientId },
        orderBy: { createdAt: 'desc' },
      });
      
      return experiments.map(experiment => ({
        id: experiment.id,
        name: experiment.name,
        description: experiment.description || undefined,
        startDate: experiment.startDate,
        endDate: experiment.endDate || undefined,
        status: experiment.status as 'running' | 'paused' | 'completed' | 'archived',
        variants: experiment.variants as CampaignVariant[],
        controlVariantId: experiment.controlVariantId || undefined,
        goalMetric: experiment.goalMetric,
        performanceData: experiment.performanceData as Record<string, Record<string, any>> || undefined,
        conclusion: experiment.conclusion || undefined,
        createdAt: experiment.createdAt,
      }));
    } catch (error) {
      logger.error({ error, clientId: this.clientId }, 'Error fetching campaign experiments');
      throw new Error('Failed to fetch campaign experiments');
    }
  }

  /**
   * Update an existing campaign experiment
   */
  async updateCampaignExperiment(
    experimentId: string,
    data: Partial<Omit<CampaignExperimentData, 'id' | 'clientId' | 'createdAt'>>
  ): Promise<CampaignExperimentData> {
    logger.debug({ clientId: this.clientId, experimentId }, 'Updating campaign experiment');
    
    try {
      const experiment = await prisma.campaignExperiment.update({
        where: { 
          id: experimentId,
          clientId: this.clientId,
        },
        data,
      });
      
      return {
        id: experiment.id,
        name: experiment.name,
        description: experiment.description || undefined,
        startDate: experiment.startDate,
        endDate: experiment.endDate || undefined,
        status: experiment.status as 'running' | 'paused' | 'completed' | 'archived',
        variants: experiment.variants as CampaignVariant[],
        controlVariantId: experiment.controlVariantId || undefined,
        goalMetric: experiment.goalMetric,
        performanceData: experiment.performanceData as Record<string, Record<string, any>> || undefined,
        conclusion: experiment.conclusion || undefined,
        createdAt: experiment.createdAt,
      };
    } catch (error) {
      logger.error({ error, clientId: this.clientId, experimentId }, 'Error updating campaign experiment');
      throw new Error('Failed to update campaign experiment');
    }
  }

  /**
   * Generate an AI-powered conclusion for an experiment
   */
  async generateExperimentConclusion(experimentId: string): Promise<string> {
    logger.info({ clientId: this.clientId, experimentId }, 'Generating experiment conclusion');
    
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
      
      // Only generate conclusion if we have performance data
      if (!experiment.performanceData) {
        throw new Error('Cannot generate conclusion: No performance data available');
      }
      
      // Generate prompt for the AI model
      const prompt = `
        Based on the following A/B test experiment data, provide a conclusion and recommendation:
        
        Experiment Name: ${experiment.name}
        Description: ${experiment.description || 'N/A'}
        Goal Metric: ${experiment.goalMetric}
        
        Variants:
        ${JSON.stringify(experiment.variants)}
        
        Performance Data:
        ${JSON.stringify(experiment.performanceData)}
        
        Please provide:
        1. A clear conclusion about which variant performed better
        2. The percentage improvement of the winning variant
        3. Specific recommendations for implementing the winning approach
        4. Any insights about why the winning variant was more successful
      `;
      
      // Call LLM to generate conclusion
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert marketing analyst that provides clear conclusions from A/B testing experiments. Your responses should be data-driven, insightful, and actionable."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
      });
      
      const conclusion = response.choices[0].message.content;
      
      // Update the experiment with the conclusion
      await prisma.campaignExperiment.update({
        where: { id: experimentId },
        data: { conclusion },
      });
      
      return conclusion;
    } catch (error) {
      logger.error({ error, clientId: this.clientId, experimentId }, 'Error generating experiment conclusion');
      throw new Error('Failed to generate experiment conclusion');
    }
  }

  /**
   * Get client persona data or create a default one if it doesn't exist
   */
  async getClientPersona(): Promise<ClientPersonaData> {
    logger.debug({ clientId: this.clientId }, 'Fetching client persona');
    
    try {
      // Try to get existing persona
      let persona = await prisma.clientPersona.findUnique({
        where: { clientId: this.clientId },
      });
      
      // If no persona exists, create a default one
      if (!persona) {
        persona = await prisma.clientPersona.create({
          data: {
            clientId: this.clientId,
            preferences: {
              preferredPostTimes: ['morning', 'evening'],
              contentThemes: ['lifestyle', 'behind-the-scenes'],
            },
          },
        });
      }
      
      return {
        id: persona.id,
        targetAudience: persona.targetAudience || undefined,
        brandVoice: persona.brandVoice || undefined,
        preferences: persona.preferences as Record<string, any> || undefined,
        engagementPatterns: persona.engagementPatterns as Record<string, any> || undefined,
        createdAt: persona.createdAt,
      };
    } catch (error) {
      logger.error({ error, clientId: this.clientId }, 'Error fetching client persona');
      throw new Error('Failed to fetch client persona');
    }
  }

  /**
   * Update the client persona
   */
  async updateClientPersona(
    data: Partial<Omit<ClientPersonaData, 'id' | 'clientId' | 'createdAt'>>
  ): Promise<ClientPersonaData> {
    logger.debug({ clientId: this.clientId }, 'Updating client persona');
    
    try {
      // First check if persona exists
      const existingPersona = await prisma.clientPersona.findUnique({
        where: { clientId: this.clientId },
      });
      
      let persona;
      
      // Create or update the persona
      if (existingPersona) {
        persona = await prisma.clientPersona.update({
          where: { clientId: this.clientId },
          data,
        });
      } else {
        persona = await prisma.clientPersona.create({
          data: {
            clientId: this.clientId,
            ...data,
          },
        });
      }
      
      return {
        id: persona.id,
        targetAudience: persona.targetAudience || undefined,
        brandVoice: persona.brandVoice || undefined,
        preferences: persona.preferences as Record<string, any> || undefined,
        engagementPatterns: persona.engagementPatterns as Record<string, any> || undefined,
        createdAt: persona.createdAt,
      };
    } catch (error) {
      logger.error({ error, clientId: this.clientId }, 'Error updating client persona');
      throw new Error('Failed to update client persona');
    }
  }

  /**
   * Generate personalized recommendations based on client persona
   */
  async generatePersonalizedInsights(): Promise<InsightItem[]> {
    logger.info({ clientId: this.clientId }, 'Generating personalized insights');
    
    try {
      // Get client persona
      const persona = await this.getClientPersona();
      
      // Get context data
      const context = await this.gatherContext();
      
      // Generate prompt for personalized insights
      const prompt = `
        Based on the following client persona and platform data, provide highly personalized content and engagement recommendations:
        
        Client Persona:
        ${JSON.stringify(persona)}
        
        Platform Data:
        ${JSON.stringify(context)}
        
        Please provide 3 personalized recommendations that take into account:
        1. The client's target audience and brand voice
        2. The client's content preferences and engagement patterns
        3. The performance data from their platforms
        
        Format each recommendation with:
        - A clear, specific title
        - A brief description of why this is recommended
        - Specific implementation steps
        - Expected outcome or benefit
      `;
      
      // Call LLM to generate personalized insights
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert content marketing advisor that provides highly personalized recommendations based on user data and preferences. Your insights should be tailored, actionable, and specific to the client's unique situation."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.4,
      });
      
      const recommendation = response.choices[0].message.content;
      
      // Process the response into multiple insights
      const insightTexts = recommendation.split(/Recommendation \d+:|Insight \d+:/i).filter(Boolean);
      
      // Create and save insights
      const insights: InsightItem[] = [];
      
      for (const insightText of insightTexts) {
        const metadata = {
          personalized: true,
          persona: {
            targetAudience: persona.targetAudience,
            brandVoice: persona.brandVoice,
          },
        };
        
        const insightData = this.processAIResponse(insightText, InsightType.PERSONALIZATION);
        
        const insight = await prisma.insight.create({
          data: {
            clientId: this.clientId,
            type: InsightType.PERSONALIZATION,
            title: insightData.title,
            description: insightData.description,
            recommendation: insightData.recommendation,
            confidence: insightData.confidence,
            status: 'pending',
            metadata: {
              ...metadata,
              implementationSteps: insightData.implementationSteps,
              platforms: insightData.platforms,
              actionType: insightData.actionType,
              actionLabel: insightData.actionLabel,
              recommendedValue: insightData.recommendedValue,
            },
          },
        });
        
        insights.push({
          id: insight.id,
          type: insight.type as InsightType,
          title: insight.title,
          description: insight.description,
          recommendation: insight.recommendation,
          confidence: insight.confidence,
          implementationSteps: insightData.implementationSteps,
          platforms: insightData.platforms,
          actionType: insightData.actionType,
          actionLabel: insightData.actionLabel,
          recommendedValue: insightData.recommendedValue,
          createdAt: insight.createdAt,
          status: insight.status as 'pending' | 'accepted' | 'rejected' | 'implemented',
        });
      }
      
      return insights;
    } catch (error) {
      logger.error({ error, clientId: this.clientId }, 'Error generating personalized insights');
      throw new Error('Failed to generate personalized insights');
    }
  }
} 