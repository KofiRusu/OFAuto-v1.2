import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { getAnalyticsService } from "@/lib/analytics";
import { 
  ImpactScore, 
  ImplementationDifficulty,
  LLMConfig, 
  PlatformType, 
  SpecificStrategy, 
  StrategyMemory, 
  StrategyRequest, 
  StrategyResponse, 
  StrategySuggestion, 
  StrategyType,
  Strategy,
  StrategyStatus
} from "./types";
import { OpenAIService } from "./openai-service";
import { ScoringService } from "./scoring-service";
import { getPromptTemplate } from "./prompts";
import { openaiClient, anthropicClient } from "./clients";
import { onlyfansPricingPrompt } from "./prompts/onlyfans/pricing";

export class StrategyService {
  private prisma: PrismaClient;
  private openaiService: OpenAIService;
  private scoringService: ScoringService;
  private static instance: StrategyService;

  private constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.openaiService = OpenAIService.getInstance();
    this.scoringService = ScoringService.getInstance();
  }

  public static getInstance(prisma: PrismaClient): StrategyService {
    if (!StrategyService.instance) {
      StrategyService.instance = new StrategyService(prisma);
    }
    return StrategyService.instance;
  }

  /**
   * Generate strategy suggestions based on request parameters
   */
  async generateStrategies(request: StrategyRequest): Promise<StrategyResponse> {
    const startTime = Date.now();
    
    // Merge with default config
    const config = { ...this.defaultConfig, ...(request.config || {}) };
    
    try {
      // Gather context data
      const contextData = await this.gatherContextData(request);
      
      // Generate prompt from template
      const { prompt, promptTokens } = await this.generatePrompt(request, contextData, config);
      
      // Call LLM based on provider
      let suggestions: StrategySuggestion[];
      let completionTokens = 0;
      
      if (config.provider === "openai") {
        const result = await this.callOpenAI(prompt, config);
        suggestions = result.suggestions;
        completionTokens = result.completionTokens;
      } else {
        const result = await this.callAnthropic(prompt, config);
        suggestions = result.suggestions;
        completionTokens = result.completionTokens;
      }
      
      // Store suggestions in database
      const storedSuggestions = await this.storeSuggestions(suggestions, request.clientId);
      
      // Update memory with new suggestions
      await this.updateMemory(storedSuggestions, request.clientId, request.platformType);
      
      // Return strategy response
      return {
        suggestions: storedSuggestions,
        metadata: {
          modelUsed: config.model,
          tokensUsed: promptTokens + completionTokens,
          processingTimeMs: Date.now() - startTime,
          promptTokens,
          completionTokens
        }
      };
    } catch (error) {
      console.error("Strategy generation error:", error);
      throw new Error(`Failed to generate strategies: ${(error as Error).message}`);
    }
  }

  /**
   * Gather context data for strategy generation
   */
  private async gatherContextData(request: StrategyRequest): Promise<Record<string, any>> {
    const { clientId, platformType, strategyType, timeframe } = request;
    const data: Record<string, any> = {};
    
    // Get client info
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: {
        platforms: {
          where: platformType ? { platformType: platformType as string } : undefined
        }
      }
    });
    
    if (!client) {
      throw new Error(`Client not found: ${clientId}`);
    }
    
    data.client = client;
    
    // Get analytics data
    const analyticsService = getAnalyticsService();
    
    // Define default timeframe if not provided
    const startDate = timeframe?.startDate || (() => {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      return date;
    })();
    
    const endDate = timeframe?.endDate || new Date();
    
    // Get dashboard metrics
    const metrics = await analyticsService.getDashboardMetrics({
      clientId,
      startDate,
      endDate,
      period: "daily"
    });
    
    data.metrics = metrics;
    
    // Get revenue data
    const revenueData = await analyticsService.getRevenueTimeSeries({
      clientId,
      startDate,
      endDate,
      period: "daily"
    });
    
    data.revenue = revenueData;
    
    // Get engagement data
    const engagementData = await analyticsService.getEngagementTimeSeries({
      clientId,
      startDate,
      endDate,
      period: "daily"
    });
    
    data.engagement = engagementData;
    
    // Get past strategy memories
    const memories = await this.getRelevantMemories(clientId, platformType, strategyType);
    data.memories = memories;
    
    // Get previously successful strategies
    const pastSuccessfulStrategies = await this.prisma.strategySuggestion.findMany({
      where: {
        clientId,
        feedback: {
          path: ["liked"],
          equals: true
        }
      },
      take: 5,
      orderBy: { createdAt: "desc" }
    });
    
    data.pastSuccessfulStrategies = pastSuccessfulStrategies;
    
    return data;
  }

  /**
   * Generate prompt from template based on request
   */
  private async generatePrompt(
    request: StrategyRequest, 
    contextData: Record<string, any>,
    config: LLMConfig
  ): Promise<{ prompt: string; promptTokens: number }> {
    const { platformType, strategyType, specificStrategy, customPrompt } = request;
    
    // Get appropriate prompt template
    const template = getPromptTemplate(platformType, strategyType, specificStrategy);
    
    // Fill template with context data
    const filledTemplate = this.fillPromptTemplate(template, contextData);
    
    // Add custom prompt if provided
    const finalPrompt = customPrompt 
      ? `${filledTemplate}\n\nAdditional guidance: ${customPrompt}` 
      : filledTemplate;
    
    // Add system prompt
    const systemPrompt = config.systemPrompt;
    
    // Estimate token count (rough estimate, 4 chars ≈ 1 token)
    const promptTokens = Math.ceil((systemPrompt.length + finalPrompt.length) / 4);
    
    return { 
      prompt: finalPrompt,
      promptTokens 
    };
  }

  /**
   * Fill prompt template with context data
   */
  private fillPromptTemplate(template: string, contextData: Record<string, any>): string {
    let filledTemplate = template;
    
    // Replace placeholders with actual data
    for (const [key, value] of Object.entries(contextData)) {
      const placeholder = `{{${key}}}`;
      if (filledTemplate.includes(placeholder)) {
        const replacementValue = typeof value === 'object' 
          ? JSON.stringify(value, null, 2) 
          : String(value);
        filledTemplate = filledTemplate.replace(new RegExp(placeholder, 'g'), replacementValue);
      }
    }
    
    return filledTemplate;
  }

  /**
   * Call OpenAI API with prompt
   */
  private async callOpenAI(
    prompt: string, 
    config: LLMConfig
  ): Promise<{ suggestions: StrategySuggestion[]; completionTokens: number }> {
    try {
      const response = await openaiClient.chat.completions.create({
        model: config.model,
        messages: [
          { role: "system", content: config.systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        response_format: { type: "json_object" }
      });
      
      const content = response.choices[0]?.message?.content || '{"suggestions": []}';
      const result = JSON.parse(content);
      const completionTokens = response.usage?.completion_tokens || 0;
      
      // Parse and validate suggestions
      const suggestions = this.parseSuggestions(result.suggestions || []);
      
      return { suggestions, completionTokens };
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error(`OpenAI API error: ${(error as Error).message}`);
    }
  }

  /**
   * Call Anthropic API with prompt
   */
  private async callAnthropic(
    prompt: string, 
    config: LLMConfig
  ): Promise<{ suggestions: StrategySuggestion[]; completionTokens: number }> {
    try {
      const response = await anthropicClient.messages.create({
        model: config.model.startsWith('claude') ? config.model : 'claude-3-opus-20240229',
        system: config.systemPrompt,
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens
      });
      
      const content = response.content[0]?.text || '{"suggestions": []}';
      let result;
      
      try {
        // Extract JSON from text response
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                          content.match(/```\n([\s\S]*?)\n```/) ||
                          [null, content];
        const jsonText = jsonMatch[1];
        result = JSON.parse(jsonText);
      } catch (parseError) {
        console.error("Failed to parse JSON from Anthropic response:", parseError);
        result = { suggestions: [] };
      }
      
      // Estimate completion tokens (rough estimate)
      const completionTokens = Math.ceil(content.length / 4);
      
      // Parse and validate suggestions
      const suggestions = this.parseSuggestions(result.suggestions || []);
      
      return { suggestions, completionTokens };
    } catch (error) {
      console.error("Anthropic API error:", error);
      throw new Error(`Anthropic API error: ${(error as Error).message}`);
    }
  }

  /**
   * Parse and validate suggestion data
   */
  private parseSuggestions(rawSuggestions: any[]): StrategySuggestion[] {
    return rawSuggestions.map(raw => {
      // Generate an ID
      const id = uuidv4();
      
      // Validate and convert impact score
      let impactScore = ImpactScore.MEDIUM;
      if (raw.impactScore && Object.values(ImpactScore).includes(raw.impactScore)) {
        impactScore = raw.impactScore;
      } else if (typeof raw.impactScore === 'string') {
        const score = raw.impactScore.toUpperCase();
        if (score === 'LOW') impactScore = ImpactScore.LOW;
        if (score === 'MEDIUM') impactScore = ImpactScore.MEDIUM;
        if (score === 'HIGH') impactScore = ImpactScore.HIGH;
        if (score === 'VERY_HIGH') impactScore = ImpactScore.VERY_HIGH;
      }
      
      // Validate and convert difficulty
      let implementationDifficulty = ImplementationDifficulty.MODERATE;
      if (raw.implementationDifficulty && Object.values(ImplementationDifficulty).includes(raw.implementationDifficulty)) {
        implementationDifficulty = raw.implementationDifficulty;
      } else if (typeof raw.implementationDifficulty === 'string') {
        const difficulty = raw.implementationDifficulty.toUpperCase();
        if (difficulty === 'EASY') implementationDifficulty = ImplementationDifficulty.EASY;
        if (difficulty === 'MODERATE') implementationDifficulty = ImplementationDifficulty.MODERATE;
        if (difficulty === 'COMPLEX') implementationDifficulty = ImplementationDifficulty.COMPLEX;
      }
      
      return {
        id,
        clientId: raw.clientId || '',
        platformType: raw.platformType || 'onlyfans',
        strategyType: raw.strategyType || 'content_improvement',
        specificStrategy: raw.specificStrategy || 'caption_enhancement',
        title: raw.title || 'Untitled Strategy',
        description: raw.description || '',
        reasoning: raw.reasoning || '',
        impactScore,
        implementationDifficulty,
        expectedROI: raw.expectedROI || 0,
        suggestedActions: Array.isArray(raw.suggestedActions) ? raw.suggestedActions : [],
        metrics: Array.isArray(raw.metrics) ? raw.metrics : [],
        dataPoints: raw.dataPoints || {},
        createdAt: new Date(),
        feedback: {
          liked: false,
          implemented: false
        }
      };
    });
  }

  /**
   * Store suggestions in database
   */
  private async storeSuggestions(
    suggestions: StrategySuggestion[], 
    clientId: string
  ): Promise<StrategySuggestion[]> {
    const storedSuggestions: StrategySuggestion[] = [];
    
    for (const suggestion of suggestions) {
      // Ensure client ID is set
      suggestion.clientId = clientId;
      
      // Store in database
      const stored = await this.prisma.strategySuggestion.create({
        data: {
          id: suggestion.id,
          clientId,
          platformType: suggestion.platformType,
          strategyType: suggestion.strategyType,
          specificStrategy: suggestion.specificStrategy,
          title: suggestion.title,
          description: suggestion.description,
          reasoning: suggestion.reasoning,
          impactScore: suggestion.impactScore,
          implementationDifficulty: suggestion.implementationDifficulty,
          expectedROI: suggestion.expectedROI,
          suggestedActions: suggestion.suggestedActions,
          metrics: suggestion.metrics,
          dataPoints: suggestion.dataPoints,
          createdAt: suggestion.createdAt
        }
      });
      
      storedSuggestions.push(suggestion);
    }
    
    return storedSuggestions;
  }

  /**
   * Update memory with new suggestions
   */
  private async updateMemory(
    suggestions: StrategySuggestion[], 
    clientId: string,
    platformType: PlatformType
  ): Promise<void> {
    for (const suggestion of suggestions) {
      // Create memory entry for this suggestion
      await this.prisma.strategyMemory.create({
        data: {
          id: uuidv4(),
          clientId,
          platformType,
          contextType: 'past_suggestion',
          content: JSON.stringify(suggestion),
          metadata: {
            strategyType: suggestion.strategyType,
            specificStrategy: suggestion.specificStrategy,
            impactScore: suggestion.impactScore
          },
          relevanceScore: suggestion.impactScore, // Use impact score as initial relevance
          createdAt: new Date(),
          expiresAt: this.calculateExpiryDate()
        }
      });
    }
  }

  /**
   * Get relevant memories for strategy generation
   */
  private async getRelevantMemories(
    clientId: string,
    platformType: PlatformType,
    strategyType?: StrategyType
  ): Promise<StrategyMemory[]> {
    // Get memories from database
    const memories = await this.prisma.strategyMemory.findMany({
      where: {
        clientId,
        platformType,
        // Include only non-expired memories
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ],
        // Filter by strategy type if provided
        ...(strategyType ? {
          metadata: {
            path: ['strategyType'],
            equals: strategyType
          }
        } : {})
      },
      orderBy: [
        { relevanceScore: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 10
    });
    
    return memories;
  }

  /**
   * Calculate expiry date for memory (3 months by default)
   */
  private calculateExpiryDate(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return date;
  }

  /**
   * Update strategy feedback
   */
  async updateStrategyFeedback(
    strategyId: string,
    feedback: {
      liked?: boolean;
      implemented?: boolean;
      comments?: string;
      actualResults?: string;
    }
  ): Promise<StrategySuggestion> {
    // Get current strategy
    const strategy = await this.prisma.strategySuggestion.findUnique({
      where: { id: strategyId }
    });
    
    if (!strategy) {
      throw new Error(`Strategy not found: ${strategyId}`);
    }
    
    // Update strategy with feedback
    const updated = await this.prisma.strategySuggestion.update({
      where: { id: strategyId },
      data: {
        feedback: {
          ...strategy.feedback,
          ...feedback
        },
        implementedAt: feedback.implemented ? new Date() : strategy.implementedAt
      }
    });
    
    // If marked as implemented, update memory relevance
    if (feedback.implemented) {
      await this.updateMemoryRelevance(strategyId, strategy.clientId, true);
    }
    
    return updated;
  }

  /**
   * Update memory relevance based on feedback
   */
  private async updateMemoryRelevance(
    strategyId: string,
    clientId: string,
    increase: boolean
  ): Promise<void> {
    // Find memory for this strategy
    const memory = await this.prisma.strategyMemory.findFirst({
      where: {
        clientId,
        content: { contains: strategyId }
      }
    });
    
    if (!memory) return;
    
    // Update relevance score
    const newScore = increase 
      ? Math.min(10, memory.relevanceScore + 2) 
      : Math.max(1, memory.relevanceScore - 1);
    
    await this.prisma.strategyMemory.update({
      where: { id: memory.id },
      data: { relevanceScore: newScore }
    });
  }

  async generateStrategy(
    clientId: string,
    type: StrategyType,
    data: any
  ): Promise<Strategy> {
    // Get client data
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: {
        analytics: true,
        content: true,
        platforms: true
      },
    });

    if (!client) {
      throw new Error("Client not found");
    }

    // Prepare strategy request
    const request: StrategyRequest = {
      clientId,
      type,
      platformType: client.platforms[0]?.platformType as PlatformType || "onlyfans",
      data: {
        ...data,
        client: {
          name: client.name,
          platforms: client.platforms
        },
        analytics: client.analytics,
        content: client.content
      }
    };

    // Generate strategy using OpenAI
    const response = await this.openaiService.generateStrategy(request);

    // Score the strategy
    const scoredResponse = this.scoringService.scoreStrategy(response);

    // Create strategy record
    const strategy: Strategy = {
      id: uuidv4(),
      clientId,
      type,
      status: "PENDING",
      recommendations: scoredResponse.recommendations,
      reasoning: scoredResponse.reasoning,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save strategy to database
    return this.prisma.strategy.create({
      data: {
        ...strategy,
        client: { connect: { id: clientId } },
      },
    });
  }

  async getStrategies(clientId: string): Promise<Strategy[]> {
    return this.prisma.strategy.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateStrategyStatus(
    strategyId: string,
    status: StrategyStatus
  ): Promise<Strategy> {
    return this.prisma.strategy.update({
      where: { id: strategyId },
      data: { status },
    });
  }

  async deleteStrategy(strategyId: string): Promise<void> {
    await this.prisma.strategy.delete({
      where: { id: strategyId },
    });
  }

  async getStrategyInsights(strategyId: string): Promise<string[]> {
    const strategy = await this.prisma.strategy.findUnique({
      where: { id: strategyId },
    });

    if (!strategy) {
      throw new Error("Strategy not found");
    }

    const insights: string[] = [];
    
    // Get insights for each recommendation
    strategy.recommendations.forEach(rec => {
      insights.push(...this.scoringService.getRecommendationInsights(rec));
    });

    return [...new Set(insights)]; // Remove duplicates
  }

  async getStrategyROI(strategyId: string): Promise<number> {
    const strategy = await this.prisma.strategy.findUnique({
      where: { id: strategyId },
    });

    if (!strategy) {
      throw new Error("Strategy not found");
    }

    // Calculate average ROI across all recommendations
    const rois = strategy.recommendations.map(rec => 
      this.scoringService.calculateROI(rec)
    );

    return rois.reduce((a, b) => a + b, 0) / rois.length;
  }
} 