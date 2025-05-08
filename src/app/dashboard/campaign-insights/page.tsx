'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { CampaignInsightCard } from '@/components/dashboard/CampaignInsightCard';
import { InsightItem } from '@/lib/services/reasoningService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReloadIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardShell from '@/components/dashboard/DashboardShell';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

// Mock data - this would come from reasoningService in a real implementation
const mockInsights: (InsightItem & {
  kpiData?: any;
  severity?: 'critical' | 'warning' | 'info';
  actionType?: string;
})[] = [
  {
    id: '1',
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

export default function CampaignInsightsPage() {
  const { toast } = useToast();
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    // In a real implementation, this would fetch from an API
    const loadInsights = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setInsights(mockInsights);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load insights:', error);
        setLoading(false);
        toast({
          title: 'Error loading insights',
          description: 'Unable to load campaign insights. Please try again.',
          variant: 'destructive',
        });
      }
    };

    loadInsights();
  }, [toast]);

  const handleInsightAction = (insight: InsightItem, actionType: string) => {
    // In a real implementation, this would trigger the appropriate action based on the type
    toast({
      title: 'Action triggered',
      description: `Executing "${actionType}" for insight: ${insight.title}`,
    });
  };

  const refreshInsights = async () => {
    setLoading(true);
    // In a real implementation, this would refresh the data from the API
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    toast({
      title: 'Insights refreshed',
      description: 'Campaign insights have been updated with the latest data.',
    });
  };

  const filteredInsights = insights.filter(insight => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'critical') return insight.severity === 'critical';
    if (filterStatus === 'warning') return insight.severity === 'warning';
    if (filterStatus === 'info') return insight.severity === 'info';
    return true;
  });

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Campaign Insights"
        text="AI-powered insights and recommendations for your campaigns."
      >
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Insights</SelectItem>
              <SelectItem value="critical">Critical Issues</SelectItem>
              <SelectItem value="warning">Warnings</SelectItem>
              <SelectItem value="info">Opportunities</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={refreshInsights} variant="outline" disabled={loading}>
            {loading ? (
              <>
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              'Refresh Insights'
            )}
          </Button>
        </div>
      </DashboardHeader>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Insights</TabsTrigger>
          <TabsTrigger value="campaign-performance">Performance Issues</TabsTrigger>
          <TabsTrigger value="campaign-opportunity">Opportunities</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <ReloadIcon className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredInsights.length > 0 ? (
            <div className="grid gap-4">
              {filteredInsights.map(insight => (
                <CampaignInsightCard
                  key={insight.id}
                  insight={insight}
                  onAction={handleInsightAction}
                />
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">No insights found for the selected filter.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="campaign-performance" className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <ReloadIcon className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredInsights.filter(i => i.type === 'campaign-performance').length > 0 ? (
            <div className="grid gap-4">
              {filteredInsights
                .filter(i => i.type === 'campaign-performance')
                .map(insight => (
                  <CampaignInsightCard
                    key={insight.id}
                    insight={insight}
                    onAction={handleInsightAction}
                  />
                ))}
            </div>
          ) : (
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">No performance issues found.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="campaign-opportunity" className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <ReloadIcon className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredInsights.filter(i => i.type === 'campaign-opportunity').length > 0 ? (
            <div className="grid gap-4">
              {filteredInsights
                .filter(i => i.type === 'campaign-opportunity')
                .map(insight => (
                  <CampaignInsightCard
                    key={insight.id}
                    insight={insight}
                    onAction={handleInsightAction}
                  />
                ))}
            </div>
          ) : (
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">No opportunities found.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
} 