"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { format } from "date-fns";
import { useAuth } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Icons } from "@/components/ui/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Forbidden from "@/components/forbidden";
import { Spinner } from "@/components/spinner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export default function IndividualPerformancePage() {
  const { modelId } = useParams();
  const router = useRouter();
  const { userId, sessionClaims } = useAuth();
  
  // Get the user role from sessionClaims
  const userRole = sessionClaims?.userRole || "USER";
  
  // Check if the user has manager or admin access
  const hasAccess = userRole === "MANAGER" || userRole === "ADMIN";

  // State for date range filter
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("overview");

  // Query for model details
  const { data: userData, isLoading: isLoadingUser } = trpc.user.getById.useQuery(
    { id: modelId as string },
    { enabled: !!modelId && hasAccess }
  );

  // Query for performance reports
  const {
    data: reportsData,
    isLoading: isLoadingReports,
    refetch: refetchReports,
  } = trpc.performance.listReports.useQuery(
    {
      modelId: modelId as string,
      dateRange: startDate || endDate ? {
        start: startDate,
        end: endDate,
      } : undefined,
      limit: 50,
      offset: 0,
    },
    {
      enabled: !!modelId && hasAccess,
    }
  );

  // Function to transform reports data for charts
  const prepareChartData = () => {
    if (!reportsData?.reports || reportsData.reports.length === 0) return [];
    
    // Sort reports by date
    const sortedReports = [...reportsData.reports].sort(
      (a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime()
    );

    // Identify available metrics in the first report
    const metrics = Object.keys(sortedReports[0].metrics).filter(
      key => typeof sortedReports[0].metrics[key] === 'number'
    );

    // Create chart data points
    return sortedReports.map(report => ({
      date: format(new Date(report.periodStart), "MM/dd/yyyy"),
      ...Object.fromEntries(
        metrics.map(metric => [metric, report.metrics[metric]])
      ),
    }));
  };

  // Function to calculate performance trends
  const calculateTrends = () => {
    if (!reportsData?.reports || reportsData.reports.length < 2) return {};
    
    // Sort reports by date
    const sortedReports = [...reportsData.reports].sort(
      (a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime()
    );
    
    // Get the most recent and previous reports
    const latest = sortedReports[sortedReports.length - 1];
    const previous = sortedReports[sortedReports.length - 2];
    
    // Calculate percentage change for each metric
    const trends = {} as Record<string, { value: number; change: number; changePercent: number }>;
    
    Object.keys(latest.metrics).forEach(metric => {
      if (typeof latest.metrics[metric] === 'number' && typeof previous.metrics[metric] === 'number') {
        const currentValue = latest.metrics[metric] as number;
        const previousValue = previous.metrics[metric] as number;
        const change = currentValue - previousValue;
        const changePercent = previousValue !== 0 
          ? (change / previousValue) * 100 
          : currentValue > 0 ? 100 : 0;
          
        trends[metric] = {
          value: currentValue,
          change,
          changePercent,
        };
      }
    });
    
    return trends;
  };

  // Function to clear filters
  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  // If user has no access, show forbidden page
  if (!hasAccess) {
    return <Forbidden />;
  }

  const chartData = prepareChartData();
  const trends = calculateTrends();

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Performance Metrics</h1>
          {userData && (
            <p className="text-gray-500">
              {userData.name || "Unnamed"} ({userData.email || "No email"})
            </p>
          )}
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <Icons.arrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
          <CardDescription>Filter performance reports by date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    {startDate ? (
                      format(startDate, "PPP")
                    ) : (
                      <span className="text-muted-foreground">Pick a date</span>
                    )}
                    <Icons.calendar className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => endDate ? date > endDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    {endDate ? (
                      format(endDate, "PPP")
                    ) : (
                      <span className="text-muted-foreground">Pick a date</span>
                    )}
                    <Icons.calendar className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => startDate ? date < startDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={clearFilters}
              disabled={!startDate && !endDate}
            >
              Clear Filters
            </Button>
            <Button 
              onClick={() => refetchReports()}
              disabled={isLoadingReports}
            >
              {isLoadingReports ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Icons.refresh className="mr-2 h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoadingReports || isLoadingUser ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : reportsData?.reports && reportsData.reports.length > 0 ? (
        <>
          {Object.keys(trends).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {['earnings', 'posts', 'engagement', 'followers'].map(metricKey => (
                trends[metricKey] && (
                  <Card key={metricKey}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg capitalize">{metricKey.replace(/([A-Z])/g, ' $1')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline justify-between">
                        <div className="text-2xl font-bold">
                          {metricKey.includes('earning') ? 
                            `$${trends[metricKey].value.toFixed(2)}` : 
                            metricKey.includes('rate') ? 
                              `${trends[metricKey].value.toFixed(1)}%` : 
                              trends[metricKey].value.toLocaleString()}
                        </div>
                        <div className={`text-sm font-medium flex items-center ${
                          trends[metricKey].change > 0 ? 'text-green-600' : 
                          trends[metricKey].change < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {trends[metricKey].change > 0 ? (
                            <Icons.trendingUp className="mr-1 h-4 w-4" />
                          ) : trends[metricKey].change < 0 ? (
                            <Icons.trendingDown className="mr-1 h-4 w-4" />
                          ) : (
                            <Icons.minus className="mr-1 h-4 w-4" />
                          )}
                          {Math.abs(trends[metricKey].changePercent).toFixed(1)}%
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              ))}
            </div>
          )}

          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="earnings">Earnings</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                  <CardDescription>Key metrics over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {chartData.length > 0 && 
                          Object.keys(chartData[0])
                            .filter(key => key !== 'date' && 
                                          ['earnings', 'posts', 'followers', 'engagement']
                                            .includes(key))
                            .map((key, index) => (
                              <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={
                                  index === 0 ? "#8884d8" : 
                                  index === 1 ? "#82ca9d" : 
                                  index === 2 ? "#ffc658" : 
                                  "#ff8042"
                                }
                                activeDot={{ r: 8 }}
                              />
                            ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="earnings">
              <Card>
                <CardHeader>
                  <CardTitle>Earnings Analysis</CardTitle>
                  <CardDescription>Revenue performance over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="earnings" fill="#8884d8" name="Earnings" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="engagement">
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Metrics</CardTitle>
                  <CardDescription>Followers, likes, comments and shares</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {chartData.length > 0 && 
                          Object.keys(chartData[0])
                            .filter(key => key !== 'date' && 
                                          ['engagement', 'followers', 'likes', 'comments', 'shares', 'views']
                                            .includes(key))
                            .map((key, index) => (
                              <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={
                                  index === 0 ? "#8884d8" : 
                                  index === 1 ? "#82ca9d" : 
                                  index === 2 ? "#ffc658" : 
                                  index === 3 ? "#ff8042" :
                                  index === 4 ? "#0088fe" :
                                  "#00C49F"
                                }
                                activeDot={{ r: 8 }}
                              />
                            ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>Performance Reports</CardTitle>
              <CardDescription>
                {reportsData.total 
                  ? `Showing ${reportsData.reports.length} of ${reportsData.total} reports`
                  : "No reports found"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportsData.reports.map(report => (
                  <Card key={report.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        {format(new Date(report.periodStart), "MMM d")} - {format(new Date(report.periodEnd), "MMM d, yyyy")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(report.metrics)
                          .filter(([key]) => ['earnings', 'posts', 'engagement', 'followers'].includes(key))
                          .map(([key, value]) => (
                            <div key={key} className="bg-gray-50 p-2 rounded">
                              <div className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                              <div className="font-medium">
                                {typeof value === 'number' ? 
                                  (key.includes('earning') ? `$${value.toFixed(2)}` : 
                                  key.includes('rate') ? `${value.toFixed(1)}%` : 
                                  value.toLocaleString()) 
                                  : String(value)}
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Icons.inbox className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium">No performance reports found</h3>
            <p className="mt-1 text-gray-500">
              There are no performance reports for this model yet. Try adjusting your filters or create new reports.
            </p>
            <Button 
              onClick={() => router.push('/dashboard/admin/performance/collective')}
              className="mt-4"
            >
              View All Models
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 