import OpenAI from "openai";
import { StrategyRequest, StrategyResponse } from "./types";

export class OpenAIService {
  private client: OpenAI;
  private static instance: OpenAIService;
  private rateLimitDelay: number = 1000; // 1 second between requests
  private lastRequestTime: number = 0;

  private constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => 
        setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
  }

  public async generateStrategy(request: StrategyRequest): Promise<StrategyResponse> {
    await this.enforceRateLimit();

    try {
      const completion = await this.client.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt(request.type)
          },
          {
            role: "user",
            content: this.buildPrompt(request)
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content received from OpenAI");
      }

      const response = JSON.parse(content);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error(`Failed to generate strategy: ${(error as Error).message}`);
    }
  }

  private getSystemPrompt(strategyType: string): string {
    const prompts: Record<string, string> = {
      PRICING: `You are an expert OnlyFans pricing strategist. Your goal is to optimize subscription and content pricing to maximize revenue while maintaining subscriber satisfaction.`,
      CONTENT: `You are an expert OnlyFans content strategist. Your goal is to provide actionable recommendations for content creation and optimization.`,
      ENGAGEMENT: `You are an expert OnlyFans engagement strategist. Your goal is to increase subscriber interaction and loyalty through targeted engagement strategies.`,
      GROWTH: `You are an expert OnlyFans growth strategist. Your goal is to develop strategies for sustainable subscriber growth and revenue expansion.`,
      RETENTION: `You are an expert OnlyFans retention strategist. Your goal is to improve subscriber retention and reduce churn through targeted initiatives.`,
      CROSS_PROMOTION: `You are an expert OnlyFans cross-promotion strategist. Your goal is to develop effective strategies for promoting content across different platforms.`
    };

    return prompts[strategyType] || prompts.GROWTH;
  }

  private buildPrompt(request: StrategyRequest): string {
    const { clientId, type, data } = request;
    
    return `
Generate a detailed strategy for the following OnlyFans creator:

Client ID: ${clientId}
Strategy Type: ${type}

Analytics Data:
${JSON.stringify(data, null, 2)}

Please provide a comprehensive strategy that includes:
1. Clear recommendations with specific actions
2. Data-driven reasoning for each recommendation
3. Expected impact and implementation difficulty
4. Projected metrics and ROI estimates

Format the response as a JSON object with the following structure:
{
  "recommendations": [
    {
      "title": "string",
      "description": "string",
      "expectedImpact": "LOW|MEDIUM|HIGH",
      "implementationDifficulty": "LOW|MEDIUM|HIGH",
      "projectedMetrics": {
        "revenue": number,
        "engagement": number,
        "growth": number
      },
      "suggestedActions": ["string"]
    }
  ],
  "reasoning": "string",
  "projectedMetrics": {
    "revenue": number,
    "engagement": number,
    "growth": number
  }
}`;
  }

  private validateAndFormatResponse(response: any): StrategyResponse {
    // Validate response structure
    if (!response.recommendations || !Array.isArray(response.recommendations)) {
      throw new Error("Invalid response format: missing or invalid recommendations");
    }

    // Validate each recommendation
    const recommendations = response.recommendations.map((rec: any) => ({
      id: crypto.randomUUID(),
      title: rec.title || "Untitled Recommendation",
      description: rec.description || "",
      expectedImpact: this.validateImpact(rec.expectedImpact),
      implementationDifficulty: this.validateDifficulty(rec.implementationDifficulty),
      projectedMetrics: this.validateMetrics(rec.projectedMetrics),
      suggestedActions: Array.isArray(rec.suggestedActions) ? rec.suggestedActions : []
    }));

    return {
      recommendations,
      reasoning: response.reasoning || "No reasoning provided",
      projectedMetrics: this.validateMetrics(response.projectedMetrics)
    };
  }

  private validateImpact(impact: string): "LOW" | "MEDIUM" | "HIGH" {
    const validImpacts = ["LOW", "MEDIUM", "HIGH"];
    return validImpacts.includes(impact?.toUpperCase()) ? impact.toUpperCase() as "LOW" | "MEDIUM" | "HIGH" : "MEDIUM";
  }

  private validateDifficulty(difficulty: string): "LOW" | "MEDIUM" | "HIGH" {
    const validDifficulties = ["LOW", "MEDIUM", "HIGH"];
    return validDifficulties.includes(difficulty?.toUpperCase()) ? difficulty.toUpperCase() as "LOW" | "MEDIUM" | "HIGH" : "MEDIUM";
  }

  private validateMetrics(metrics: any): { revenue: number; engagement: number; growth: number } {
    return {
      revenue: Number(metrics?.revenue) || 0,
      engagement: Number(metrics?.engagement) || 0,
      growth: Number(metrics?.growth) || 0
    };
  }
} 