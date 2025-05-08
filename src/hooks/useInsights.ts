import { useState, useCallback } from 'react';

// Mock data for insights
const mockInsights = [
  {
    id: '1',
    title: 'High CPA in Campaign A',
    description: 'Your cost per acquisition is 25% higher than last month.',
    severity: 'high',
    timestamp: new Date().toISOString(),
    metrics: {
      cpa: '$45.20',
      spend: '$2,450',
      conversions: '54'
    },
    recommendedAction: {
      type: 'optimizeBudget',
      description: 'Reduce campaign budget by 15% and reallocate to better performing campaigns.'
    }
  },
  {
    id: '2',
    title: 'New Audience Opportunity',
    description: 'Analysis shows potential for engagement with demographic 25-34 in new regions.',
    severity: 'medium',
    timestamp: new Date().toISOString(),
    metrics: {
      reachPotential: '125K',
      estimatedCTR: '2.1%',
      avgEngagement: '4.5%'
    },
    recommendedAction: {
      type: 'expandAudience',
      description: 'Create a new targeting segment focused on this demographic in high-performing regions.'
    }
  },
  {
    id: '3',
    title: 'Subscription Revenue Growth',
    description: 'Your subscription revenue has increased by 32% compared to last quarter.',
    severity: 'positive',
    timestamp: new Date().toISOString(),
    metrics: {
      quarterlyGrowth: '+32%',
      retentionRate: '87%',
      newSubscribers: '143'
    },
    recommendedAction: {
      type: 'enhanceRetention',
      description: 'Consider implementing a loyalty program to further increase retention rates.'
    }
  }
];

// Mock type for insights
export interface InsightWithAction {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low' | 'positive';
  timestamp: string;
  metrics?: Record<string, string>;
  recommendedAction?: {
    type: string;
    description: string;
  };
  actionApplied?: boolean;
  actionTimestamp?: string;
  actionType?: string;
  dismissed?: boolean;
  campaignId?: string;
  type?: string;
}

/**
 * Simplified mock version of useInsights hook
 */
export function useInsights() {
  const [insights, setInsights] = useState<InsightWithAction[]>(mockInsights);
  const [selectedInsight, setSelectedInsight] = useState<InsightWithAction | null>(insights[0]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Refresh insights (mocked implementation)
   */
  const refreshInsights = useCallback(async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  /**
   * Apply an insight action (mocked implementation)
   */
  const applyInsightAction = useCallback((insightId: string, actionType: string) => {
    setInsights(prevInsights => 
      prevInsights.map(insight => 
        insight.id === insightId 
          ? {
              ...insight, 
              actionApplied: true, 
              actionTimestamp: new Date().toISOString(),
              actionType
            } 
          : insight
      )
    );

    // Update selected insight if it's the one being modified
    if (selectedInsight?.id === insightId) {
      setSelectedInsight(prev => 
        prev ? {
          ...prev,
          actionApplied: true,
          actionTimestamp: new Date().toISOString(),
          actionType
        } : null
      );
    }
  }, [selectedInsight]);

  /**
   * Dismiss an insight (mocked implementation)
   */
  const dismissInsight = useCallback((insightId: string) => {
    setInsights(prevInsights => 
      prevInsights.map(insight => 
        insight.id === insightId 
          ? {...insight, dismissed: true} 
          : insight
      )
    );

    // Update selected insight if it's the one being modified
    if (selectedInsight?.id === insightId) {
      setSelectedInsight(prev => 
        prev ? {...prev, dismissed: true} : null
      );
    }

    return true;
  }, [selectedInsight]);

  return {
    insights,
    selectedInsight,
    setSelectedInsight,
    isLoading,
    refreshInsights,
    applyInsightAction,
    dismissInsight
  };
} 