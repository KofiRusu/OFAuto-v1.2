'use client';

import { useState, useEffect } from 'react';
import { subDays, startOfMonth, format } from 'date-fns';
import type { DateRange } from "react-day-picker";
import { toast } from "react-hot-toast";
import apiClient from "@/lib/api-client";

import AnalyticsSummaryCards, { AnalyticsSummary } from './AnalyticsSummaryCards';
import AnalyticsChartPanel, { ChartData } from './AnalyticsChartPanel';
import PlatformFilter from './PlatformFilter';
import DateRangePicker from './DateRangePicker';

// --- Main Component ---

export default function AnalyticsDashboardPanel() {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(subDays(new Date(), 35)), // Default to roughly last month
    to: new Date(),
  });
  const [summaryData, setSummaryData] = useState<AnalyticsSummary | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingSummary(true);
      setIsLoadingCharts(true);
      try {
        // Prepare params for API call
        const params: Record<string, string> = {};
        
        if (selectedPlatform !== 'all') {
          params.platform = selectedPlatform;
        }
        
        if (dateRange?.from) {
          params.startDate = dateRange.from.toISOString();
        }
        
        if (dateRange?.to) {
          params.endDate = dateRange.to.toISOString();
        }
        
        // Get analytics data from API
        const response = await apiClient.analytics.get(params);
        
        if (!response.success || !response.data) {
          throw new Error(response.error || "Failed to load analytics data");
        }
        
        const { metrics, summary, engagementMetrics } = response.data;
        
        // Transform API data to AnalyticsSummary format
        const transformedSummary: AnalyticsSummary = {
          totalFollowers: summary.totalFollowers || 0,
          followersChangePercent: 0, // Calculate from metrics if available
          monthlyEarnings: summary.totalRevenue || 0,
          earningsChangePercent: 0, // Calculate from metrics if available
          avgEngagementRate: summary.engagementRate || 0,
          engagementChangePercent: 0, // Calculate from metrics if available
        };
        
        // If we have metrics data, we can calculate changes
        if (metrics && metrics.length > 1) {
          // Sort metrics by date for calculations
          const sortedMetrics = [...metrics].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          
          // Calculate percentage changes if we have enough data
          if (sortedMetrics.length >= 2) {
            const oldestMetric = sortedMetrics[0];
            const newestMetric = sortedMetrics[sortedMetrics.length - 1];
            
            // Calculate followers change
            if (oldestMetric.totalFollowers > 0) {
              transformedSummary.followersChangePercent = 
                ((newestMetric.totalFollowers - oldestMetric.totalFollowers) / oldestMetric.totalFollowers) * 100;
            }
            
            // Calculate earnings change
            if (oldestMetric.totalRevenue > 0) {
              transformedSummary.earningsChangePercent = 
                ((newestMetric.totalRevenue - oldestMetric.totalRevenue) / oldestMetric.totalRevenue) * 100;
            }
            
            // Calculate engagement change
            if (oldestMetric.engagementRate > 0) {
              transformedSummary.engagementChangePercent = 
                ((newestMetric.engagementRate - oldestMetric.engagementRate) / oldestMetric.engagementRate) * 100;
            }
          }
        }
        
        // Transform API data to ChartData format
        const transformedChartData: ChartData = {
          earnings: metrics?.map(m => ({
            date: format(new Date(m.date), 'MMM d'),
            value: Number(m.totalRevenue) || 0,
          })) || [],
          
          followers: metrics?.map(m => ({
            date: format(new Date(m.date), 'MMM d'),
            value: m.totalFollowers || 0,
          })) || [],
          
          // Example engagement breakdown - would come from API in real implementation
          engagementBreakdown: [
            { label: 'Likes', value: summary.totalEngagement * 0.6 || 0 },
            { label: 'Comments', value: summary.totalEngagement * 0.2 || 0 },
            { label: 'Shares', value: summary.totalEngagement * 0.1 || 0 },
            { label: 'Saves', value: summary.totalEngagement * 0.1 || 0 },
          ],
          
          // Example revenue distribution - would come from API in real implementation
          revenueDistribution: [
            { label: 'Subscriptions', value: summary.totalRevenue * 0.6 || 0 },
            { label: 'Tips', value: summary.totalRevenue * 0.25 || 0 },
            { label: 'PPV DMs', value: summary.totalRevenue * 0.15 || 0 },
          ],
        };
        
        setSummaryData(transformedSummary);
        setChartData(transformedChartData);
      } catch (error: any) {
        console.error("Failed to load analytics data:", error);
        toast.error(error.message || "Could not fetch analytics data for the selected filters");
        
        // Provide fallback data for better UX
        if (!summaryData) {
          setSummaryData({
            totalFollowers: 0,
            followersChangePercent: 0,
            monthlyEarnings: 0,
            earningsChangePercent: 0,
            avgEngagementRate: 0,
            engagementChangePercent: 0,
          });
        }
        
        if (!chartData) {
          setChartData({
            earnings: [],
            followers: [],
            engagementBreakdown: [],
            revenueDistribution: [],
          });
        }
      } finally {
        setIsLoadingSummary(false);
        setIsLoadingCharts(false);
      }
    };

    loadData();
  }, [selectedPlatform, dateRange]); // Reload when filters change

  const isLoading = isLoadingSummary || isLoadingCharts;

  return (
    <div className="space-y-6">
       {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Performance insights across your platforms.</p>
        </div>
         <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <PlatformFilter 
                selectedPlatform={selectedPlatform} 
                onPlatformChange={setSelectedPlatform} 
                disabled={isLoading}
            />
            <DateRangePicker 
                dateRange={dateRange} 
                onDateChange={setDateRange} 
                disabled={isLoading}
            />
         </div>
      </div>
      
      {/* Summary Cards */}
      <AnalyticsSummaryCards summary={summaryData} isLoading={isLoadingSummary} />
      
      {/* Chart Panels */}
      <AnalyticsChartPanel chartData={chartData} isLoading={isLoadingCharts} />
      
    </div>
  );
} 