import { StrategyRecommendation, StrategyResponse, StrategyFeedback } from "./types";

export class ScoringService {
  private static instance: ScoringService;
  private weights = {
    revenue: 0.4,
    engagement: 0.3,
    growth: 0.3,
    implementationDifficulty: 0.2,
    expectedImpact: 0.3,
    historicalConversion: 0.2,
    feedbackScore: 0.15
  };

  private constructor() {}

  public static getInstance(): ScoringService {
    if (!ScoringService.instance) {
      ScoringService.instance = new ScoringService();
    }
    return ScoringService.instance;
  }

  public scoreStrategy(
    response: StrategyResponse,
    historicalData?: {
      conversionRates: Record<string, number>;
      implementationTimes: Record<string, number>;
      feedback: StrategyFeedback[];
    }
  ): StrategyResponse {
    const scoredRecommendations = response.recommendations
      .map(rec => ({
        ...rec,
        score: this.calculateRecommendationScore(rec, historicalData)
      }))
      .sort((a, b) => b.score - a.score);

    return {
      ...response,
      recommendations: scoredRecommendations
    };
  }

  private calculateRecommendationScore(
    recommendation: StrategyRecommendation,
    historicalData?: {
      conversionRates: Record<string, number>;
      implementationTimes: Record<string, number>;
      feedback: StrategyFeedback[];
    }
  ): number {
    const metricsScore = this.calculateMetricsScore(recommendation.projectedMetrics);
    const difficultyScore = this.calculateDifficultyScore(
      recommendation.implementationDifficulty,
      historicalData?.implementationTimes
    );
    const impactScore = this.calculateImpactScore(recommendation.expectedImpact);
    const historicalScore = this.calculateHistoricalScore(
      recommendation,
      historicalData?.conversionRates
    );
    const feedbackScore = this.calculateFeedbackScore(
      recommendation,
      historicalData?.feedback
    );

    return (
      metricsScore * (1 - this.weights.implementationDifficulty - this.weights.expectedImpact - this.weights.historicalConversion - this.weights.feedbackScore) +
      difficultyScore * this.weights.implementationDifficulty +
      impactScore * this.weights.expectedImpact +
      historicalScore * this.weights.historicalConversion +
      feedbackScore * this.weights.feedbackScore
    );
  }

  private calculateMetricsScore(metrics: { revenue: number; engagement: number; growth: number }): number {
    const { revenue, engagement, growth } = metrics;
    
    // Normalize each metric to a 0-1 scale
    const normalizedRevenue = this.normalizeMetric(revenue, 0, 10000); // Assuming max revenue of 10k
    const normalizedEngagement = this.normalizeMetric(engagement, 0, 100); // Assuming max engagement of 100%
    const normalizedGrowth = this.normalizeMetric(growth, 0, 100); // Assuming max growth of 100%

    return (
      normalizedRevenue * this.weights.revenue +
      normalizedEngagement * this.weights.engagement +
      normalizedGrowth * this.weights.growth
    );
  }

  private calculateDifficultyScore(
    difficulty: "LOW" | "MEDIUM" | "HIGH",
    historicalTimes?: Record<string, number>
  ): number {
    const baseScores = {
      LOW: 1,
      MEDIUM: 0.7,
      HIGH: 0.4
    };

    if (!historicalTimes) {
      return baseScores[difficulty];
    }

    // Adjust score based on historical implementation times
    const avgTime = Object.values(historicalTimes).reduce((a, b) => a + b, 0) / Object.keys(historicalTimes).length;
    const timeMultiplier = Math.min(1, 30 / avgTime); // Normalize to 30 minutes as baseline

    return baseScores[difficulty] * timeMultiplier;
  }

  private calculateImpactScore(impact: "LOW" | "MEDIUM" | "HIGH"): number {
    const scores = {
      LOW: 0.4,
      MEDIUM: 0.7,
      HIGH: 1
    };
    return scores[impact];
  }

  private calculateHistoricalScore(
    recommendation: StrategyRecommendation,
    conversionRates?: Record<string, number>
  ): number {
    if (!conversionRates) return 0.5; // Neutral score if no historical data

    // Find similar recommendations in history
    const similarRecommendations = Object.entries(conversionRates)
      .filter(([key]) => key.includes(recommendation.category || ""))
      .map(([_, rate]) => rate);

    if (similarRecommendations.length === 0) return 0.5;

    // Calculate average conversion rate for similar recommendations
    const avgRate = similarRecommendations.reduce((a, b) => a + b, 0) / similarRecommendations.length;
    return this.normalizeMetric(avgRate, 0, 100);
  }

  private calculateFeedbackScore(
    recommendation: StrategyRecommendation,
    feedback?: StrategyFeedback[]
  ): number {
    if (!feedback) return 0.5;

    // Filter feedback for similar recommendations
    const similarFeedback = feedback.filter(f => 
      f.strategyId.includes(recommendation.category || "")
    );

    if (similarFeedback.length === 0) return 0.5;

    // Calculate weighted score based on feedback type
    const scores = similarFeedback.map(f => {
      switch (f.type) {
        case "LIKE": return 1;
        case "IMPLEMENTED": return 0.8;
        case "DISLIKE": return 0.2;
        default: return 0.5;
      }
    });

    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  private normalizeMetric(value: number, min: number, max: number): number {
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  public calculateROI(recommendation: StrategyRecommendation): number {
    const { revenue, growth } = recommendation.projectedMetrics;
    const difficulty = this.calculateDifficultyScore(recommendation.implementationDifficulty);
    
    // ROI formula: (Projected Revenue * Growth Rate) / Implementation Difficulty
    return (revenue * (growth / 100)) / difficulty;
  }

  public getRecommendationInsights(recommendation: StrategyRecommendation): string[] {
    const insights: string[] = [];
    const roi = this.calculateROI(recommendation);

    // Revenue insights
    if (recommendation.projectedMetrics.revenue > 5000) {
      insights.push("High revenue potential");
    } else if (recommendation.projectedMetrics.revenue < 1000) {
      insights.push("Modest revenue potential");
    }

    // Growth insights
    if (recommendation.projectedMetrics.growth > 50) {
      insights.push("Exceptional growth potential");
    } else if (recommendation.projectedMetrics.growth < 20) {
      insights.push("Conservative growth projection");
    }

    // Implementation insights
    if (recommendation.implementationDifficulty === "LOW") {
      insights.push("Quick to implement");
    } else if (recommendation.implementationDifficulty === "HIGH") {
      insights.push("Complex implementation");
    }

    // ROI insights
    if (roi > 200) {
      insights.push("Very high ROI potential");
    } else if (roi < 50) {
      insights.push("Moderate ROI potential");
    }

    // Historical performance insights
    if (recommendation.category) {
      insights.push(`Based on ${recommendation.category} category performance`);
    }

    return insights;
  }
} 