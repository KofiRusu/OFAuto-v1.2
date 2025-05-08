'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, formatDistanceToNow } from 'date-fns';
import { 
  ArrowDown, 
  ArrowUp, 
  BarChart2, 
  BarChart, 
  MessageCircle, 
  CheckCircle, 
  RefreshCw,
  Mail 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc/client';
import { DMPerformanceMetric } from '@/services/autoDMEngine';

interface CampaignPerformanceCardProps {
  campaignId: string;
  platformId?: string;
  className?: string;
  showTrends?: boolean;
  refreshInterval?: number; // In milliseconds
}

export function CampaignPerformanceCard({
  campaignId,
  platformId,
  className = '',
  showTrends = true,
  refreshInterval = 0  // Default to no auto-refresh
}: CampaignPerformanceCardProps) {
  const [refreshCount, setRefreshCount] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Query for metrics data
  const metricsQuery = trpc.dmCampaigns.getCampaignMetrics.useQuery(
    { campaignId, platformId },
    { 
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true
    }
  );
  
  // Set up auto-refresh if interval is provided
  useEffect(() => {
    if (refreshInterval <= 0) return;
    
    const intervalId = setInterval(() => {
      metricsQuery.refetch();
      setRefreshCount(prev => prev + 1);
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval, metricsQuery]);
  
  // Handle manual refresh
  const handleRefresh = () => {
    metricsQuery.refetch();
    setRefreshCount(prev => prev + 1);
  };
  
  // Calculate metrics
  const metrics = metricsQuery.data;
  const isLoading = metricsQuery.isLoading;
  const lastUpdated = metrics?.lastUpdated 
    ? formatDistanceToNow(new Date(metrics.lastUpdated), { addSuffix: true })
    : 'Never';
  
  // Calculate rates
  const openRate = metrics?.impressions ? Math.round((metrics.opens / metrics.impressions) * 100) : 0;
  const responseRate = metrics?.opens ? Math.round((metrics.responses / metrics.opens) * 100) : 0;
  const conversionRate = metrics?.responses ? Math.round((metrics.conversions / metrics.responses) * 100) : 0;
  
  return (
    <Card className={`${className} overflow-hidden`}>
      <CardHeader className="px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Performance Metrics</CardTitle>
            <CardDescription>
              {platformId 
                ? `${platformId.charAt(0).toUpperCase() + platformId.slice(1)} platform metrics` 
                : 'All platforms combined'}
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="px-6">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
            <TabsTrigger value="rates" className="flex-1">Rates</TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="p-6 pt-4">
          <div className="text-xs text-muted-foreground mb-4">
            Last updated: {lastUpdated}
          </div>
          
          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricItem
                label="Impressions"
                value={metrics?.impressions || 0}
                icon={<Mail className="h-4 w-4" />}
                trend={0}
                showTrend={showTrends}
              />
              <MetricItem
                label="Opens"
                value={metrics?.opens || 0}
                icon={<BarChart2 className="h-4 w-4" />}
                trend={5}
                showTrend={showTrends}
              />
              <MetricItem
                label="Responses"
                value={metrics?.responses || 0}
                icon={<MessageCircle className="h-4 w-4" />}
                trend={-2}
                showTrend={showTrends}
              />
              <MetricItem
                label="Conversions"
                value={metrics?.conversions || 0}
                icon={<CheckCircle className="h-4 w-4" />}
                trend={8}
                showTrend={showTrends}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="rates" className="mt-0">
            <div className="space-y-6">
              <RateItem 
                label="Open Rate" 
                rate={openRate} 
                description={`${metrics?.opens || 0} opens from ${metrics?.impressions || 0} sends`}
              />
              <RateItem 
                label="Response Rate" 
                rate={responseRate} 
                description={`${metrics?.responses || 0} responses from ${metrics?.opens || 0} opens`}
              />
              <RateItem 
                label="Conversion Rate" 
                rate={conversionRate} 
                description={`${metrics?.conversions || 0} conversions from ${metrics?.responses || 0} responses`}
              />
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}

interface MetricItemProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  trend?: number;
  showTrend?: boolean;
}

function MetricItem({ label, value, icon, trend = 0, showTrend = true }: MetricItemProps) {
  return (
    <div className="bg-muted/30 rounded-lg p-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {showTrend && (
        <div className="flex items-center mt-1">
          {trend > 0 ? (
            <Badge variant="success" className="text-[10px] h-5 px-1 font-normal">
              <ArrowUp className="h-3 w-3 mr-1" />
              {trend}%
            </Badge>
          ) : trend < 0 ? (
            <Badge variant="destructive" className="text-[10px] h-5 px-1 font-normal">
              <ArrowDown className="h-3 w-3 mr-1" />
              {Math.abs(trend)}%
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] h-5 px-1 font-normal">
              No change
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

interface RateItemProps {
  label: string;
  rate: number;
  description: string;
}

function RateItem({ label, rate, description }: RateItemProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold">{rate}%</span>
      </div>
      <Progress value={rate} className="h-2" />
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );
} 