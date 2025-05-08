import { StrategyTemplate } from "./types";

export const strategyTemplates: Record<string, StrategyTemplate> = {
  RETENTION: {
    type: "RETENTION",
    prompt: `You are an expert OnlyFans retention strategist. Analyze the following data and provide recommendations to improve subscriber retention and reduce churn.

Client Data:
{clientData}

Analytics:
{analytics}

Focus on:
1. Identifying patterns in subscriber drop-off
2. Suggesting loyalty programs and rewards
3. Creating re-engagement campaigns
4. Optimizing content frequency and timing
5. Personalizing subscriber interactions

Consider:
- Historical retention rates
- Subscriber engagement patterns
- Content performance metrics
- Message response rates
- Subscription renewal trends

Format your response as a JSON object with the following structure:
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
        "growth": number,
        "retention": number
      },
      "suggestedActions": ["string"],
      "category": "LOYALTY|REENGAGEMENT|CONTENT|INTERACTION",
      "priority": number,
      "estimatedTime": number,
      "requiredResources": ["string"],
      "dependencies": ["string"]
    }
  ],
  "reasoning": "string",
  "projectedMetrics": {
    "revenue": number,
    "engagement": number,
    "growth": number,
    "retention": number
  }
}`,
    requiredAnalytics: [
      "subscriberRetentionRate",
      "churnRate",
      "engagementMetrics",
      "contentPerformance",
      "messageResponseRate",
      "renewalRate"
    ],
    responseStructure: {
      recommendations: [{
        title: "string",
        description: "string",
        expectedImpact: "LOW|MEDIUM|HIGH",
        implementationDifficulty: "LOW|MEDIUM|HIGH",
        projectedMetrics: {
          revenue: "number",
          engagement: "number",
          growth: "number",
          retention: "number"
        },
        suggestedActions: ["string"],
        category: "LOYALTY|REENGAGEMENT|CONTENT|INTERACTION",
        priority: "number",
        estimatedTime: "number",
        requiredResources: ["string"],
        dependencies: ["string"]
      }],
      reasoning: "string",
      projectedMetrics: {
        revenue: "number",
        engagement: "number",
        growth: "number",
        retention: "number"
      }
    },
    scoringWeights: {
      revenue: 0.3,
      engagement: 0.2,
      growth: 0.2,
      retention: 0.3,
      implementationDifficulty: 0.2
    }
  },

  CROSS_PROMOTION: {
    type: "CROSS_PROMOTION",
    prompt: `You are an expert OnlyFans cross-promotion strategist. Analyze the following data and provide recommendations for effective cross-platform promotion and collaboration strategies.

Client Data:
{clientData}

Analytics:
{analytics}

Focus on:
1. Identifying optimal collaboration opportunities
2. Creating traffic funnels from social media
3. Optimizing content for cross-platform sharing
4. Developing platform-specific promotion strategies
5. Measuring cross-platform conversion rates

Consider:
- Social media follower growth
- Platform-specific engagement rates
- Content performance across platforms
- Traffic source analytics
- Conversion rates by platform

Format your response as a JSON object with the following structure:
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
        "growth": number,
        "conversion": number
      },
      "suggestedActions": ["string"],
      "category": "COLLABORATION|TRAFFIC|CONTENT|PLATFORM",
      "priority": number,
      "estimatedTime": number,
      "requiredResources": ["string"],
      "dependencies": ["string"]
    }
  ],
  "reasoning": "string",
  "projectedMetrics": {
    "revenue": number,
    "engagement": number,
    "growth": number,
    "conversion": number
  }
}`,
    requiredAnalytics: [
      "socialMediaFollowers",
      "platformEngagement",
      "trafficSources",
      "conversionRates",
      "contentPerformance",
      "audienceOverlap"
    ],
    responseStructure: {
      recommendations: [{
        title: "string",
        description: "string",
        expectedImpact: "LOW|MEDIUM|HIGH",
        implementationDifficulty: "LOW|MEDIUM|HIGH",
        projectedMetrics: {
          revenue: "number",
          engagement: "number",
          growth: "number",
          conversion: "number"
        },
        suggestedActions: ["string"],
        category: "COLLABORATION|TRAFFIC|CONTENT|PLATFORM",
        priority: "number",
        estimatedTime: "number",
        requiredResources: ["string"],
        dependencies: ["string"]
      }],
      reasoning: "string",
      projectedMetrics: {
        revenue: "number",
        engagement: "number",
        growth: "number",
        conversion: "number"
      }
    },
    scoringWeights: {
      revenue: 0.35,
      engagement: 0.25,
      growth: 0.25,
      conversion: 0.15,
      implementationDifficulty: 0.2
    }
  },

  AI_MESSAGE_TEMPLATES: {
    type: "AI_MESSAGE_TEMPLATES",
    prompt: `You are an expert OnlyFans message strategist. Analyze the following data and provide personalized message templates for various scenarios.

Client Data:
{clientData}

Analytics:
{analytics}

Focus on:
1. Creating engaging DM templates
2. Writing effective PPV content descriptions
3. Developing re-engagement messages
4. Crafting upsell propositions
5. Personalizing subscriber interactions

Consider:
- Message response rates
- Conversion rates by message type
- Subscriber engagement patterns
- Content performance
- Audience demographics

Format your response as a JSON object with the following structure:
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
        "growth": number,
        "conversion": number
      },
      "suggestedActions": ["string"],
      "category": "DM|PPV|REENGAGEMENT|UPSELL|PERSONALIZATION",
      "priority": number,
      "estimatedTime": number,
      "requiredResources": ["string"],
      "dependencies": ["string"],
      "templates": [
        {
          "type": "string",
          "content": "string",
          "variables": ["string"],
          "useCase": "string"
        }
      ]
    }
  ],
  "reasoning": "string",
  "projectedMetrics": {
    "revenue": number,
    "engagement": number,
    "growth": number,
    "conversion": number
  }
}`,
    requiredAnalytics: [
      "messageResponseRate",
      "conversionRate",
      "engagementMetrics",
      "contentPerformance",
      "audienceDemographics",
      "messageTypePerformance"
    ],
    responseStructure: {
      recommendations: [{
        title: "string",
        description: "string",
        expectedImpact: "LOW|MEDIUM|HIGH",
        implementationDifficulty: "LOW|MEDIUM|HIGH",
        projectedMetrics: {
          revenue: "number",
          engagement: "number",
          growth: "number",
          conversion: "number"
        },
        suggestedActions: ["string"],
        category: "DM|PPV|REENGAGEMENT|UPSELL|PERSONALIZATION",
        priority: "number",
        estimatedTime: "number",
        requiredResources: ["string"],
        dependencies: ["string"],
        templates: [{
          type: "string",
          content: "string",
          variables: ["string"],
          useCase: "string"
        }]
      }],
      reasoning: "string",
      projectedMetrics: {
        revenue: "number",
        engagement: "number",
        growth: "number",
        conversion: "number"
      }
    },
    scoringWeights: {
      revenue: 0.4,
      engagement: 0.3,
      growth: 0.2,
      conversion: 0.1,
      implementationDifficulty: 0.15
    }
  }
}; 