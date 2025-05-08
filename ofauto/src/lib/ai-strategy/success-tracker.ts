'use client';

export interface SuccessStory {
  id: string;
  title: string;
  description: string;
  result: string;
  industry: string;
  strategyType: string;
  roi: number;
  imageUrl?: string;
  clientId?: string;
  isPublic: boolean;
  createdAt: string;
}

export class SuccessTracker {
  async getSuccessStories(clientId?: string): Promise<SuccessStory[]> {
    // Mock implementation
    return [
      {
        id: "success-1",
        title: "Subscription Price Optimization",
        description: "Increased subscription price based on audience demographics and content quality",
        result: "15% increase in revenue with minimal subscriber loss",
        industry: "Fitness",
        strategyType: "pricing_optimization",
        roi: 22.5,
        imageUrl: "/images/success-stories/fitness.jpg",
        isPublic: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "success-2",
        title: "Ad Creative A/B Testing",
        description: "Implemented dynamic creative testing with 4 variations to improve campaign performance",
        result: "37% higher click-through rate and 18% lower CPA",
        industry: "E-commerce",
        strategyType: "ab_testing",
        roi: 41.2,
        imageUrl: "/images/success-stories/ecommerce.jpg",
        isPublic: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "success-3",
        title: "Audience Targeting Refinement",
        description: "Analyzed conversion data to identify high-value customer segments and optimize targeting",
        result: "29% improvement in ROAS across campaigns",
        industry: "Finance",
        strategyType: "audience_optimization",
        roi: 35.8,
        imageUrl: "/images/success-stories/finance.jpg",
        isPublic: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "success-4",
        title: "Seasonal Campaign Automation",
        description: "Implemented automated budget shifting based on seasonal performance patterns",
        result: "22% increase in holiday sales with same ad spend",
        industry: "Retail",
        strategyType: "budget_automation",
        roi: 28.3,
        imageUrl: "/images/success-stories/retail.jpg",
        isPublic: true,
        createdAt: new Date().toISOString()
      }
    ];
  }
} 