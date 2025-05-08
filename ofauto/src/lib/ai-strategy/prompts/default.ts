export const strategyPrompt = `
You are an AI assistant for content creators on subscription platforms. Your goal is to analyze performance data and suggest optimizations.

## CURRENT PERFORMANCE METRICS
\`\`\`
Recent metrics:
- Followers: 1250
- New Followers (Last 30 Days): 75
- Engagement Rate: 8.5%
- Total Revenue: $3785.50
- Subscription Revenue: $2950.00
- Avg. Order Value: $12.95
\`\`\`

## REQUIREMENTS
Based on these metrics, create a content strategy recommendation that addresses:

1. Content Types: What content formats are likely to perform best given current metrics?
2. Posting Frequency: How often should content be posted?
3. Pricing Strategy: Any adjustments to subscription price or PPV content?
4. Engagement Strategy: How to boost follower interaction and retention?
5. Growth Opportunities: Areas with highest potential for revenue expansion

## RESPONSE FORMAT
Respond with a concise, actionable strategy with specific recommendations in each area.

Strategy:
`;

export const defaultMetricsTemplate = [
  {
    period: "current",
    engagement: {
      totalFollowers: 1250,
      newFollowers: 75,
      engagementRate: 8.5,
      messageResponseRate: 92,
      averageCommentsPerPost: 12
    },
    financial: {
      totalRevenue: 3785.50,
      subscriptionRevenue: 2950.00,
      tipsRevenue: 562.50,
      ppvRevenue: 273.00,
      averageOrderValue: 12.95
    },
    content: {
      totalPosts: 24,
      photoPostCount: 16,
      videoPostCount: 8,
      bestPerformingContentType: "short video"
    }
  }
]; 