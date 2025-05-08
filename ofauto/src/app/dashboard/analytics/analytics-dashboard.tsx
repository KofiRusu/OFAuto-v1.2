"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  BarChart4, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Heart, 
  MessageSquare,
  ChevronDown
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { AnalyticsPeriod } from "@/lib/analytics/types";
import { DateRangeSelector } from "@/components/analytics/date-range-selector";
import { StatCard } from "@/components/analytics/stat-card";
import { LineChart } from "@/components/analytics/line-chart";
import { BarChart } from "@/components/analytics/bar-chart";
import { PieChart } from "@/components/analytics/pie-chart";
import { TestDataGenerator } from "./test-data";

interface Client {
  id: string;
  name: string;
}

interface AnalyticsDashboardProps {
  initialClient: Client;
}

export function AnalyticsDashboard({ initialClient }: AnalyticsDashboardProps) {
  const router = useRouter();
  const [selectedClient, setSelectedClient] = useState<Client>(initialClient);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showTestDataGenerator, setShowTestDataGenerator] = useState(false);
  
  // Set up date range state
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<AnalyticsPeriod>("daily");

  // Fetch available clients
  const { data: clients = [] } = trpc.client.getAll.useQuery();
  
  // Fetch dashboard metrics
  const { data: dashboardMetrics, isLoading: isLoadingMetrics } = 
    trpc.analytics.getDashboardMetrics.useQuery({
      clientId: selectedClient.id,
      startDate,
      endDate,
      period,
    });
  
  // Fetch revenue time series
  const { data: revenueTimeSeries, isLoading: isLoadingRevenue } = 
    trpc.analytics.getRevenueTimeSeries.useQuery({
      clientId: selectedClient.id,
      startDate,
      endDate,
      period,
    });
  
  // Fetch engagement time series
  const { data: engagementTimeSeries, isLoading: isLoadingEngagement } = 
    trpc.analytics.getEngagementTimeSeries.useQuery({
      clientId: selectedClient.id,
      startDate,
      endDate,
      period,
    });
  
  // Handle client selection
  const handleClientChange = (client: Client) => {
    setSelectedClient(client);
    setShowClientDropdown(false);
  };
  
  // Handle date range change
  const handleDateRangeChange = (start: Date, end: Date, newPeriod: AnalyticsPeriod) => {
    setStartDate(start);
    setEndDate(end);
    setPeriod(newPeriod);
  };
  
  // Calculate revenue breakdown for pie chart
  const getRevenueBreakdown = () => {
    if (!dashboardMetrics || !dashboardMetrics.length) return [];
    
    // Get the latest metrics
    const latest = dashboardMetrics[dashboardMetrics.length - 1];
    
    return [
      { name: "Subscriptions", value: latest.financial.subscriptionRevenue },
      { name: "Tips", value: latest.financial.tipRevenue },
      { name: "PPV Content", value: latest.financial.ppvRevenue },
      { name: "Messages", value: latest.financial.messageRevenue },
      { name: "Other", value: latest.financial.otherRevenue },
    ].filter(item => item.value > 0);
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  // Check if we have any data
  const hasData = dashboardMetrics && dashboardMetrics.length > 0 && dashboardMetrics.some(
    metric => metric.financial.totalRevenue > 0 || metric.engagement.totalFollowers > 0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          {/* Client selector */}
          <div className="relative">
            <button
              onClick={() => setShowClientDropdown(!showClientDropdown)}
              className="flex justify-between items-center w-full md:w-48 px-4 py-2 border rounded-md bg-white hover:bg-gray-50 focus:outline-none"
            >
              <span className="truncate">{selectedClient.name}</span>
              <ChevronDown className="w-4 h-4 ml-2" />
            </button>
            
            {showClientDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none"
                    onClick={() => handleClientChange(client)}
                  >
                    {client.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Date range selector */}
          <DateRangeSelector
            startDate={startDate}
            endDate={endDate}
            period={period}
            onChange={handleDateRangeChange}
          />
        </div>
      </div>
      
      {!hasData && !isLoadingMetrics && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">No analytics data available</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            There is no analytics data for this client in the selected date range.
          </p>
          <button
            onClick={() => setShowTestDataGenerator(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Generate Test Data
          </button>
        </div>
      )}
      
      {(hasData || isLoadingMetrics) && (
        <>
          {/* Stats summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
              title="Total Revenue"
              value={dashboardMetrics?.[dashboardMetrics.length - 1]?.financial.totalRevenue || 0}
              icon={<DollarSign className="w-6 h-6" />}
              loading={isLoadingMetrics}
              format="currency"
              iconColor="green"
            />
            
            <StatCard
              title="Subscriptions"
              value={dashboardMetrics?.[dashboardMetrics.length - 1]?.financial.subscriptionRevenue || 0}
              icon={<Users className="w-6 h-6" />}
              loading={isLoadingMetrics}
              format="currency"
              iconColor="blue"
            />
            
            <StatCard
              title="Average Order"
              value={dashboardMetrics?.[dashboardMetrics.length - 1]?.financial.averageOrderValue || 0}
              icon={<DollarSign className="w-6 h-6" />}
              loading={isLoadingMetrics}
              format="currency"
              iconColor="purple"
            />
            
            <StatCard
              title="Total Followers"
              value={dashboardMetrics?.[dashboardMetrics.length - 1]?.engagement.totalFollowers || 0}
              icon={<Users className="w-6 h-6" />}
              loading={isLoadingMetrics}
              iconColor="indigo"
            />
            
            <StatCard
              title="New Followers"
              value={dashboardMetrics?.[dashboardMetrics.length - 1]?.engagement.newFollowers || 0}
              icon={<TrendingUp className="w-6 h-6" />}
              loading={isLoadingMetrics}
              iconColor="blue"
            />
            
            <StatCard
              title="Engagement Rate"
              value={dashboardMetrics?.[dashboardMetrics.length - 1]?.engagement.engagementRate || 0}
              icon={<Heart className="w-6 h-6" />}
              loading={isLoadingMetrics}
              format="percent"
              iconColor="red"
            />
          </div>
          
          {/* Charts - first row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LineChart
              data={revenueTimeSeries || []}
              title="Revenue Trends"
              loading={isLoadingRevenue}
              period={period}
              formatYAxis={formatCurrency}
              yAxisLabel="Revenue"
              emptyMessage="No revenue data available for the selected period"
            />
            
            <LineChart
              data={engagementTimeSeries || []}
              title="Engagement Trends"
              loading={isLoadingEngagement}
              period={period}
              yAxisLabel="Count"
              emptyMessage="No engagement data available for the selected period"
            />
          </div>
          
          {/* Charts - second row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BarChart
              data={revenueTimeSeries || []}
              title="Revenue by Type"
              loading={isLoadingRevenue}
              period={period}
              formatYAxis={formatCurrency}
              yAxisLabel="Revenue"
              stacked={true}
              emptyMessage="No revenue data available for the selected period"
            />
            
            <PieChart
              data={getRevenueBreakdown()}
              title="Revenue Distribution"
              loading={isLoadingMetrics}
              formatValue={formatCurrency}
              showLabel={true}
              emptyMessage="No revenue data available for the selected period"
            />
          </div>
          
          {/* Test data generator button */}
          {!showTestDataGenerator && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowTestDataGenerator(true)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
              >
                Generate More Test Data
              </button>
            </div>
          )}
        </>
      )}
      
      {/* Test data generator */}
      {showTestDataGenerator && (
        <TestDataGenerator clientId={selectedClient.id} />
      )}
    </div>
  );
} 