"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { format } from "date-fns";
import { useAuth } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Icons } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import Forbidden from "@/components/forbidden";
import { Spinner } from "@/components/spinner";

export default function PerformanceCollectivePage() {
  const router = useRouter();
  const { userId, sessionClaims } = useAuth();
  
  // Get the user role from sessionClaims
  const userRole = sessionClaims?.userRole || "USER";
  
  // Check if the user has manager or admin access
  const hasAccess = userRole === "MANAGER" || userRole === "ADMIN";

  // State for date range filter
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);

  // Query for performance reports
  const {
    data: reportsData,
    isLoading,
    refetch,
  } = trpc.performance.listReports.useQuery(
    {
      dateRange: startDate || endDate ? {
        start: startDate,
        end: endDate,
      } : undefined,
      limit,
      offset,
    },
    {
      enabled: hasAccess,
    }
  );

  // Function to generate report card metrics
  const generateMetricSummary = (reports: any[]) => {
    if (!reports || reports.length === 0) return {};
    
    // Calculate total for each metric
    const summary = reports.reduce((acc, report) => {
      const metrics = report.metrics;
      Object.keys(metrics).forEach(key => {
        if (typeof metrics[key] === 'number') {
          acc[key] = (acc[key] || 0) + metrics[key];
        }
      });
      return acc;
    }, {});

    // Calculate averages
    const averages = Object.keys(summary).reduce((acc, key) => {
      acc[key] = summary[key] / reports.length;
      return acc;
    }, {});

    return {
      totals: summary,
      averages
    };
  };

  // Function to navigate to individual model report
  const viewModelReport = (modelId: string) => {
    router.push(`/dashboard/admin/performance/individual/${modelId}`);
  };

  // Function to clear filters
  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setOffset(0);
  };

  // Function to load more reports
  const loadMore = () => {
    setOffset(prev => prev + limit);
  };

  // If user has no access, show forbidden page
  if (!hasAccess) {
    return <Forbidden />;
  }

  const metricsData = reportsData ? generateMetricSummary(reportsData.reports) : undefined;

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Collective Performance Reports</h1>
        <Button variant="outline" onClick={() => router.push('/dashboard/admin')}>
          <Icons.arrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {metricsData && Object.keys(metricsData.totals).length > 0 && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Total Earnings</CardTitle>
                <CardDescription>All models combined</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${metricsData.totals.earnings ? metricsData.totals.earnings.toFixed(2) : 'N/A'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Total Posts</CardTitle>
                <CardDescription>All content activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {metricsData.totals.posts ? metricsData.totals.posts.toLocaleString() : 'N/A'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Avg. Engagement</CardTitle>
                <CardDescription>Per model average</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {metricsData.averages.engagement ? metricsData.averages.engagement.toFixed(1) : 'N/A'}%
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter reports by date range</CardDescription>
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
              onClick={() => refetch()}
              disabled={isLoading}
            >
              {isLoading ? (
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : reportsData?.reports && reportsData.reports.length > 0 ? (
          reportsData.reports.map(report => (
            <Card key={report.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{report.model?.name || "Unnamed Model"}</CardTitle>
                    <CardDescription>
                      {format(new Date(report.periodStart), "MMM d, yyyy")} - {format(new Date(report.periodEnd), "MMM d, yyyy")}
                    </CardDescription>
                  </div>
                  <Badge>
                    {new Date(report.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(report.metrics).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                      <div className="font-semibold">
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
              <CardFooter className="bg-gray-50 border-t">
                <Button 
                  variant="ghost" 
                  className="ml-auto"
                  onClick={() => viewModelReport(report.modelId)}
                >
                  View Details
                  <Icons.arrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Icons.inbox className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium">No reports found</h3>
            <p className="mt-1">Try adjusting your filters or create new performance reports.</p>
          </div>
        )}
      </div>

      {reportsData && reportsData.total > (offset + reportsData.reports.length) && (
        <div className="flex justify-center mt-8">
          <Button onClick={loadMore} variant="outline" disabled={isLoading}>
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>Load More</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
} 