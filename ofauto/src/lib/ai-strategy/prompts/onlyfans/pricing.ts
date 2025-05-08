export const onlyfansPricingPrompt = `
# OnlyFans Pricing Strategy Consultant Task

## Client Data
Client Name: {{client.name}}
Platform: OnlyFans
Username: {{client.platforms[0].username}}

## Analytics Summary
- Followers: {{metrics[metrics.length-1].engagement.totalFollowers}}
- New Followers (Last 30 Days): {{metrics[metrics.length-1].engagement.newFollowers}}
- Engagement Rate: {{metrics[metrics.length-1].engagement.engagementRate}}%
- Total Revenue: ${{metrics[metrics.length-1].financial.totalRevenue}}
- Subscription Revenue: ${{metrics[metrics.length-1].financial.subscriptionRevenue}} ({{(metrics[metrics.length-1].financial.subscriptionRevenue / metrics[metrics.length-1].financial.totalRevenue * 100).toFixed(1)}}% of total)
- Tip Revenue: ${{metrics[metrics.length-1].financial.tipRevenue}} ({{(metrics[metrics.length-1].financial.tipRevenue / metrics[metrics.length-1].financial.totalRevenue * 100).toFixed(1)}}% of total)
- PPV Content Revenue: ${{metrics[metrics.length-1].financial.ppvRevenue}} ({{(metrics[metrics.length-1].financial.ppvRevenue / metrics[metrics.length-1].financial.totalRevenue * 100).toFixed(1)}}% of total)
- Message Revenue: ${{metrics[metrics.length-1].financial.messageRevenue}} ({{(metrics[metrics.length-1].financial.messageRevenue / metrics[metrics.length-1].financial.totalRevenue * 100).toFixed(1)}}% of total)
- Average Order Value: ${{metrics[metrics.length-1].financial.averageOrderValue}}

## Revenue Trends (Last 30 Days)
{{revenue}}

## Your Task
You are an expert OnlyFans pricing strategy consultant. Based on the client data and revenue analytics provided, generate 2-3 strategic pricing recommendations to optimize the client's revenue.

Focus specifically on pricing strategies like:
- Subscription price adjustments
- Pay-per-view (PPV) content pricing
- Tiered subscription models
- Bundle offers
- Limited-time promotions
- Loyalty discounts

For each recommendation, provide:
1. A clear, specific title
2. A detailed description of the pricing strategy
3. The reasoning behind this recommendation based on revenue data
4. 3-5 specific actions to implement this pricing strategy
5. Expected impact (score 1-4, where 4 is highest)
6. Implementation difficulty (score 1-3, where 3 is most complex)
7. Expected ROI (numerical estimate as a percentage)
8. Current vs. projected metrics

## Important Considerations
- OnlyFans takes a 20% commission on all earnings
- Subscription price should balance volume vs. margin
- Consider the client's content quality and frequency
- Account for the target audience's price sensitivity

## Response Format
Respond in JSON format following this structure:
\`\`\`json
{
  "suggestions": [
    {
      "platformType": "onlyfans",
      "strategyType": "pricing_optimization",
      "specificStrategy": "subscription_price_adjustment",
      "title": "Strategic subscription price increase with grandfather clause",
      "description": "Increase base subscription from $9.99 to $12.99 for new subscribers while maintaining current price for existing subscribers for 3 months",
      "reasoning": "Revenue data shows high retention rate (82%) and low price sensitivity, suggesting room for price optimization for new subscribers",
      "suggestedActions": [
        "Announce price change 2 weeks in advance",
        "Offer 3-month price protection for existing subscribers",
        "Update subscription tier in OnlyFans settings",
        "Monitor subscriber growth rate after change"
      ],
      "impactScore": 3,
      "implementationDifficulty": 1,
      "expectedROI": 25,
      "metrics": [
        {
          "metricType": "subscription_revenue",
          "currentValue": 4500,
          "projectedValue": 5625
        },
        {
          "metricType": "subscriber_count",
          "currentValue": 450,
          "projectedValue": 432
        }
      ],
      "dataPoints": {
        "currentPrice": 9.99,
        "recommendedPrice": 12.99,
        "projectedRetentionRate": 0.78
      }
    }
  ]
}
\`\`\`
`; 