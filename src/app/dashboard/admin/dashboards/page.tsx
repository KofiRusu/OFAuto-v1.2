'use client';

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  AreaChart, 
  LayoutDashboard, 
  RefreshCw,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export default function DashboardsPage() {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Function to handle dashboard refresh
  const refreshDashboards = () => {
    setIsRefreshing(true);
    
    // Simulate refresh delay
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 1500);
  };
  
  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  useEffect(() => {
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      refreshDashboards();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Dashboard components with iframes
  const ApiDashboard = () => (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>API Performance</CardTitle>
        <CardDescription>API latency (p95, error rate)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="aspect-[16/9] bg-muted/20 rounded-md border flex items-center justify-center p-6">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Datadog APM Dashboard</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              This panel will embed the Datadog APM dashboard showing API performance metrics. 
              Configure the iframe URL with your Datadog dashboard ID.
            </p>
            <div className="p-4 text-xs bg-muted/30 rounded-md inline-block">
              <code>{`<iframe src="https://app.datadoghq.com/dashboard/xyz?theme=dark" width="100%" height="100%"></iframe>`}</code>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  const DatabaseDashboard = () => (
    <Card>
      <CardHeader>
        <CardTitle>Database Performance</CardTitle>
        <CardDescription>DB pool usage and query durations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="aspect-[4/3] bg-muted/20 rounded-md border flex items-center justify-center p-6">
          <div className="text-center">
            <AreaChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Database Metrics</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Connect to your Datadog RDS dashboard to monitor database performance in real-time.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  const CacheDashboard = () => (
    <Card>
      <CardHeader>
        <CardTitle>Cache Performance</CardTitle>
        <CardDescription>Redis cache hit/miss ratios</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="aspect-[4/3] bg-muted/20 rounded-md border flex items-center justify-center p-6">
          <div className="text-center">
            <PieChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Cache Metrics</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Redis cache performance metrics showing hit/miss ratios and memory usage patterns.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  const InfrastructureDashboard = () => (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Infrastructure</CardTitle>
        <CardDescription>Server resources and scaling metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="aspect-[16/9] bg-muted/20 rounded-md border flex items-center justify-center p-6">
          <div className="text-center">
            <LineChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Infrastructure Overview</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Infrastructure metrics showing CPU, memory, and scaling activities across your deployment.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Performance Dashboards</h2>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            <Clock className="inline mr-1 h-4 w-4" />
            Last refreshed: {formatTime(lastUpdated)}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshDashboards}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-1 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="application">
        <TabsList className="mb-4">
          <TabsTrigger value="application">Application</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          <TabsTrigger value="business">Business Metrics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="application">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ApiDashboard />
            <div className="grid grid-cols-1 gap-4">
              <DatabaseDashboard />
              <CacheDashboard />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="infrastructure">
          <div className="grid grid-cols-1 gap-4">
            <InfrastructureDashboard />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Network Activity</CardTitle>
                  <CardDescription>Traffic and throughput metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[4/3] bg-muted/20 rounded-md border flex items-center justify-center">
                    <LayoutDashboard className="h-12 w-12 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Security Events</CardTitle>
                  <CardDescription>Authentication and security logs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[4/3] bg-muted/20 rounded-md border flex items-center justify-center">
                    <LayoutDashboard className="h-12 w-12 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="business">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>Daily active users and engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-[4/3] bg-muted/20 rounded-md border flex items-center justify-center">
                  <LayoutDashboard className="h-12 w-12 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Conversion Metrics</CardTitle>
                <CardDescription>Funnel performance and conversions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-[4/3] bg-muted/20 rounded-md border flex items-center justify-center">
                  <LayoutDashboard className="h-12 w-12 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle>Revenue & Growth</CardTitle>
                <CardDescription>Financial and growth metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-[16/9] bg-muted/20 rounded-md border flex items-center justify-center">
                  <LayoutDashboard className="h-12 w-12 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 