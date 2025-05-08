'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  Calendar,
  Download,
  Filter,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/ui/use-toast";
import { format } from 'date-fns';
import { Chart } from './Chart';

// Platform icons and colors
const PLATFORMS = {
  all: { name: 'All Platforms', color: '#6366F1' },
  onlyfans: { name: 'OnlyFans', color: '#00AEEF' },
  fansly: { name: 'Fansly', color: '#9146FF' },
  patreon: { name: 'Patreon', color: '#F96854' },
  kofi: { name: 'Ko-fi', color: '#29ABE0' },
  gumroad: { name: 'Gumroad', color: '#FF70A6' },
  twitter: { name: 'Twitter', color: '#1DA1F2' },
  instagram: { name: 'Instagram', color: '#E1306C' },
};

// Date range options
const DATE_RANGES = [
  { id: '7d', name: 'Last 7 Days' },
  { id: '30d', name: 'Last 30 Days' },
  { id: '90d', name: 'Last 90 Days' },
  { id: 'ytd', name: 'Year to Date' },
  { id: 'custom', name: 'Custom Range' },
];

interface FinancialPerformanceSectionProps {
  clientId: string;
}

export default function FinancialPerformanceSection({ clientId }: FinancialPerformanceSectionProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("revenue");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [dateRange, setDateRange] = useState("30d");
  
  // Get financial metrics
  const { 
    data: financialData, 
    isLoading: isLoadingFinancials, 
    error: financialsError
  } = trpc.analytics.getFinancialMetrics.useQuery(
    { 
      clientId,
      dateRange,
      platformType: selectedPlatform !== 'all' ? selectedPlatform : undefined,
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (err) => {
        toast({ title: "Error", description: "Could not load financial metrics.", variant: "destructive" });
      }
    }
  );
  
  // Handle CSV export
  const handleExportCSV = () => {
    if (!financialData) return;
    
    // Convert data to CSV format
    const headers = ['Date', 'Platform', 'Revenue', 'Type'];
    const csvRows = [headers.join(',')];
    
    financialData.transactions.forEach(tx => {
      const row = [
        format(new Date(tx.date), 'yyyy-MM-dd'),
        tx.platformType,
        tx.amount.toString(),
        tx.transactionType
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    
    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ofauto-financial-data-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ 
      title: "Export Complete", 
      description: "Financial data has been exported to CSV."
    });
  };
  
  // Generate chart data for revenue by platform
  const getRevenueByPlatformData = () => {
    if (!financialData) return { labels: [], datasets: [] };
    
    const platformData = financialData.revenueByPlatform;
    const labels = Object.keys(platformData).map(key => PLATFORMS[key as keyof typeof PLATFORMS]?.name || key);
    const backgroundColor = Object.keys(platformData).map(key => PLATFORMS[key as keyof typeof PLATFORMS]?.color || '#888');
    
    return {
      labels,
      datasets: [
        {
          data: Object.values(platformData),
          backgroundColor,
          borderWidth: 1,
        }
      ]
    };
  };
  
  // Generate chart data for revenue over time
  const getRevenueOverTimeData = () => {
    if (!financialData) return { labels: [], datasets: [] };
    
    const timeData = financialData.revenueOverTime;
    const labels = Object.keys(timeData).map(date => format(new Date(date), 'MMM d'));
    
    return {
      labels,
      datasets: [
        {
          label: 'Revenue',
          data: Object.values(timeData),
          borderColor: '#6366F1',
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          tension: 0.3,
          fill: true,
        }
      ]
    };
  };
  
  // Generate chart data for revenue by type
  const getRevenueByTypeData = () => {
    if (!financialData) return { labels: [], datasets: [] };
    
    const typeData = financialData.revenueByType;
    const labels = Object.keys(typeData);
    const backgroundColor = [
      '#34D399', // Subscription
      '#60A5FA', // Tip
      '#F87171', // PPV Content
      '#FBBF24', // Direct Message
      '#A78BFA', // Other
    ];
    
    return {
      labels,
      datasets: [
        {
          data: Object.values(typeData),
          backgroundColor,
          borderWidth: 1,
        }
      ]
    };
  };
  
  // Generate subscription growth data
  const getSubscriptionGrowthData = () => {
    if (!financialData) return { labels: [], datasets: [] };
    
    const growthData = financialData.subscriptionGrowth;
    const labels = Object.keys(growthData).map(date => format(new Date(date), 'MMM d'));
    
    return {
      labels,
      datasets: [
        {
          label: 'New Subscriptions',
          data: growthData.map(d => d.new),
          backgroundColor: '#34D399',
          stack: 'Stack 0',
        },
        {
          label: 'Cancelled',
          data: growthData.map(d => -d.cancelled),
          backgroundColor: '#F87171',
          stack: 'Stack 0',
        },
        {
          label: 'Net Growth',
          data: growthData.map(d => d.new - d.cancelled),
          type: 'line',
          borderColor: '#6366F1',
          backgroundColor: 'transparent',
          tension: 0.3,
        }
      ]
    };
  };
  
  // Generate ROI by campaign data
  const getROIByCampaignData = () => {
    if (!financialData) return { labels: [], datasets: [] };
    
    const roiData = financialData.roiByCampaign || [];
    const labels = roiData.map(item => item.campaignName);
    
    return {
      labels,
      datasets: [
        {
          label: 'ROI %',
          data: roiData.map(item => item.roi),
          backgroundColor: roiData.map(item => item.roi >= 100 ? '#34D399' : '#F87171'),
          borderWidth: 1,
        }
      ]
    };
  };
  
  // Render loading state
  const renderLoading = () => (
    <div className="space-y-4">
      <Skeleton className="h-[300px] w-full" />
      <div className="flex gap-4">
        <Skeleton className="h-24 w-1/4" />
        <Skeleton className="h-24 w-1/4" />
        <Skeleton className="h-24 w-1/4" />
        <Skeleton className="h-24 w-1/4" />
      </div>
    </div>
  );
  
  // Render error state
  const renderError = () => (
    <div className="p-8 text-center text-red-500">
      <p>Error loading financial data. Please try again later.</p>
    </div>
  );
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };
  
  const getTrendIndicator = (value: number, reversed = false) => {
    if (value === 0) return null;
    
    const isPositive = reversed ? value < 0 : value > 0;
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
    const className = isPositive ? 'text-green-500' : 'text-red-500';
    
    return (
      <div className={`flex items-center ${className}`}>
        <Icon className="h-4 w-4 mr-1" />
        <span>{Math.abs(value)}%</span>
      </div>
    );
  };
  
  return (
    <Card className="w-full dark:border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl font-bold flex items-center">
            <DollarSign className="mr-2 h-5 w-5" /> Financial Performance
          </CardTitle>
          <CardDescription>
            Track revenue, growth, and ROI across all your platforms
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportCSV}
            disabled={!financialData || isLoadingFinancials}
          >
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="w-48">
            <Select 
              value={selectedPlatform} 
              onValueChange={setSelectedPlatform}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="onlyfans">OnlyFans</SelectItem>
                <SelectItem value="fansly">Fansly</SelectItem>
                <SelectItem value="patreon">Patreon</SelectItem>
                <SelectItem value="kofi">Ko-fi</SelectItem>
                <SelectItem value="gumroad">Gumroad</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-48">
            <Select 
              value={dateRange} 
              onValueChange={setDateRange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGES.map(range => (
                  <SelectItem key={range.id} value={range.id}>
                    {range.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Summary Cards */}
        {!isLoadingFinancials && financialData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-slate-50 dark:bg-slate-800">
              <CardContent className="pt-6">
                <div className="flex justify-between">
                  <div className="text-sm font-medium text-muted-foreground">Total Revenue</div>
                  {getTrendIndicator(financialData.trends.revenue)}
                </div>
                <div className="text-2xl font-bold mt-1">{formatCurrency(financialData.totalRevenue)}</div>
                <div className="text-xs text-muted-foreground mt-1">In selected period</div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-50 dark:bg-slate-800">
              <CardContent className="pt-6">
                <div className="flex justify-between">
                  <div className="text-sm font-medium text-muted-foreground">Subscription Revenue</div>
                  {getTrendIndicator(financialData.trends.subscriptions)}
                </div>
                <div className="text-2xl font-bold mt-1">{formatCurrency(financialData.subscriptionRevenue)}</div>
                <div className="text-xs text-muted-foreground mt-1">{financialData.subscriptionCount} active subscribers</div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-50 dark:bg-slate-800">
              <CardContent className="pt-6">
                <div className="flex justify-between">
                  <div className="text-sm font-medium text-muted-foreground">Ad Spend</div>
                  {getTrendIndicator(financialData.trends.adSpend, true)}
                </div>
                <div className="text-2xl font-bold mt-1">{formatCurrency(financialData.adSpend)}</div>
                <div className="text-xs text-muted-foreground mt-1">Across {financialData.activeCampaigns} campaigns</div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-50 dark:bg-slate-800">
              <CardContent className="pt-6">
                <div className="flex justify-between">
                  <div className="text-sm font-medium text-muted-foreground">Average ROI</div>
                  {getTrendIndicator(financialData.trends.roi)}
                </div>
                <div className="text-2xl font-bold mt-1">{financialData.averageROI}%</div>
                <div className="text-xs text-muted-foreground mt-1">Return on marketing investment</div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Tabs for different chart types */}
        <Tabs defaultValue="revenue" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="revenue" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" /> Revenue
            </TabsTrigger>
            <TabsTrigger value="platforms" className="flex items-center">
              <PieChart className="h-4 w-4 mr-2" /> Platforms
            </TabsTrigger>
            <TabsTrigger value="growth" className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" /> Subscription Growth
            </TabsTrigger>
            <TabsTrigger value="roi" className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2" /> Campaign ROI
            </TabsTrigger>
          </TabsList>
          
          {isLoadingFinancials && renderLoading()}
          {financialsError && renderError()}
          
          {!isLoadingFinancials && financialData && (
            <>
              <TabsContent value="revenue" className="space-y-4">
                <div className="h-[400px]">
                  <Chart 
                    type="line"
                    data={getRevenueOverTimeData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        title: { display: true, text: 'Revenue Over Time' },
                        legend: { display: false },
                        tooltip: { enabled: true }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: (value) => formatCurrency(value as number)
                          }
                        }
                      }
                    }}
                  />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-[300px]">
                    <Chart 
                      type="pie"
                      data={getRevenueByTypeData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          title: { display: true, text: 'Revenue by Type' },
                          tooltip: {
                            callbacks: {
                              label: (context) => {
                                const label = context.label || '';
                                const value = context.raw as number;
                                const total = (context.chart.data.datasets[0].data as number[]).reduce((a, b) => (a as number) + (b as number), 0);
                                const percentage = Math.round(value / (total as number) * 100);
                                return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium">Revenue Breakdown</h3>
                    <div className="space-y-2">
                      {Object.entries(financialData.revenueByType).map(([type, amount]) => (
                        <div key={type} className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-muted-foreground">{type}</span>
                          <span className="font-medium">{formatCurrency(amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="platforms" className="space-y-4">
                <div className="h-[400px]">
                  <Chart 
                    type="doughnut"
                    data={getRevenueByPlatformData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        title: { display: true, text: 'Revenue by Platform' },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const label = context.label || '';
                              const value = context.raw as number;
                              const total = (context.chart.data.datasets[0].data as number[]).reduce((a, b) => (a as number) + (b as number), 0);
                              const percentage = Math.round(value / (total as number) * 100);
                              return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium">Platform Performance</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(financialData.revenueByPlatform).map(([platform, amount]) => {
                      const platformInfo = PLATFORMS[platform as keyof typeof PLATFORMS];
                      return (
                        <div 
                          key={platform} 
                          className="p-4 rounded-lg border border-slate-200 dark:border-slate-700"
                          style={{ borderLeftColor: platformInfo?.color || '#888', borderLeftWidth: '4px' }}
                        >
                          <div className="text-sm font-medium">{platformInfo?.name || platform}</div>
                          <div className="text-xl font-bold mt-1">{formatCurrency(amount)}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {Math.round((amount / financialData.totalRevenue) * 100)}% of total revenue
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="growth" className="space-y-4">
                <div className="h-[400px]">
                  <Chart 
                    type="bar"
                    data={getSubscriptionGrowthData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        title: { display: true, text: 'Subscription Growth' },
                        tooltip: { enabled: true }
                      },
                      scales: {
                        y: { beginAtZero: true }
                      }
                    }}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="bg-slate-50 dark:bg-slate-800">
                    <CardContent className="pt-6">
                      <div className="text-sm font-medium text-muted-foreground">New Subscribers</div>
                      <div className="text-2xl font-bold mt-1">{financialData.newSubscribers}</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-slate-50 dark:bg-slate-800">
                    <CardContent className="pt-6">
                      <div className="text-sm font-medium text-muted-foreground">Cancelled</div>
                      <div className="text-2xl font-bold mt-1">{financialData.cancelledSubscribers}</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-slate-50 dark:bg-slate-800">
                    <CardContent className="pt-6">
                      <div className="text-sm font-medium text-muted-foreground">Retention Rate</div>
                      <div className="text-2xl font-bold mt-1">{financialData.retentionRate}%</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="roi" className="space-y-4">
                <div className="h-[400px]">
                  <Chart 
                    type="bar"
                    data={getROIByCampaignData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      indexAxis: 'y',
                      plugins: {
                        title: { display: true, text: 'ROI by Campaign' },
                        tooltip: { enabled: true }
                      },
                      scales: {
                        x: { 
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'ROI %'
                          }
                        }
                      }
                    }}
                  />
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium">Campaign Performance Details</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b dark:border-slate-700">
                          <th className="py-2 px-4 text-left font-medium">Campaign</th>
                          <th className="py-2 px-4 text-left font-medium">Platform</th>
                          <th className="py-2 px-4 text-right font-medium">Ad Spend</th>
                          <th className="py-2 px-4 text-right font-medium">Revenue</th>
                          <th className="py-2 px-4 text-right font-medium">ROI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {financialData.roiByCampaign?.map((campaign, index) => (
                          <tr key={index} className="border-b dark:border-slate-700">
                            <td className="py-2 px-4">{campaign.campaignName}</td>
                            <td className="py-2 px-4">{campaign.platform}</td>
                            <td className="py-2 px-4 text-right">{formatCurrency(campaign.spend)}</td>
                            <td className="py-2 px-4 text-right">{formatCurrency(campaign.revenue)}</td>
                            <td className={`py-2 px-4 text-right font-medium ${campaign.roi >= 100 ? 'text-green-500' : 'text-red-500'}`}>
                              {campaign.roi}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
} 