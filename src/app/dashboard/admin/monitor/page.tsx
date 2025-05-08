'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  AlertCircle, 
  Clock, 
  Database, 
  CheckCircle, 
  RefreshCw,
  Server,
  Cpu,
  HardDrive
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function MonitorPage() {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const fetchHealthData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/health');
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setHealthData(data);
      setLastUpdated(new Date());
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch health data');
      console.error('Health check error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchHealthData();
    
    // Set up polling every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Function to format the time since last update
  const getTimeSinceUpdate = () => {
    if (!lastUpdated) return 'Never';
    
    const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    return `${Math.floor(seconds / 3600)} hours ago`;
  };
  
  // Helper for status badges
  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'healthy' || status === 'connected') {
      return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="mr-1 h-3 w-3" /> {status}</Badge>;
    }
    if (status === 'degraded') {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600"><AlertCircle className="mr-1 h-3 w-3" /> {status}</Badge>;
    }
    return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" /> {status}</Badge>;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Service Health Monitoring</h2>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground flex items-center">
            <Clock className="mr-1 h-4 w-4" />
            Last updated: {getTimeSinceUpdate()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHealthData}
            disabled={loading}
          >
            <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      {error ? (
        <Card className="border-destructive">
          <CardHeader className="bg-destructive/10 text-destructive">
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Error Fetching Health Data
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={fetchHealthData} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="traces">Traces</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {/* System Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* System Status Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <Server className="mr-2 h-4 w-4 text-primary" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      {healthData ? (
                        <StatusBadge status={healthData.status} />
                      ) : (
                        <Badge variant="outline">Loading...</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Environment</span>
                      <Badge variant="outline">{healthData?.environment || '---'}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Version</span>
                      <Badge variant="outline">{healthData?.version || '---'}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Uptime</span>
                      <span className="text-sm font-medium">
                        {healthData ? (
                          `${Math.floor(healthData.uptime / 60 / 60)} hours ${Math.floor((healthData.uptime / 60) % 60)} mins`
                        ) : (
                          '---'
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Database Status Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <Database className="mr-2 h-4 w-4 text-primary" />
                    Database Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Connection</span>
                      {healthData?.database ? (
                        <StatusBadge status={healthData.database.status} />
                      ) : (
                        <Badge variant="outline">Loading...</Badge>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">Status Message</span>
                      <div className="text-sm bg-muted p-2 rounded-md overflow-hidden text-ellipsis">
                        {healthData?.database?.message || '---'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Resource Usage Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <Cpu className="mr-2 h-4 w-4 text-primary" />
                    Resource Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Memory (RSS)</span>
                        <span className="text-sm font-medium">
                          {healthData?.memory?.rss ? `${healthData.memory.rss} MB` : '---'}
                        </span>
                      </div>
                      <Progress value={healthData?.memory?.rss ? Math.min((healthData.memory.rss / 1024) * 100, 100) : 0} />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Heap Used</span>
                        <span className="text-sm font-medium">
                          {healthData?.memory?.heapUsed ? `${healthData.memory.heapUsed} MB` : '---'}
                        </span>
                      </div>
                      <Progress 
                        value={
                          healthData?.memory?.heapUsed && healthData?.memory?.heapTotal
                            ? (healthData.memory.heapUsed / healthData.memory.heapTotal) * 100
                            : 0
                        } 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Additional system information can be added here */}
          </TabsContent>
          
          <TabsContent value="traces">
            <Card>
              <CardHeader>
                <CardTitle>OpenTelemetry Traces</CardTitle>
                <CardDescription>
                  Recent request traces and performance monitoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 text-center border rounded-md">
                  <p className="text-muted-foreground">
                    View detailed traces in your Datadog APM dashboard.
                  </p>
                  <div className="mt-4">
                    <Button variant="outline">
                      Open Datadog APM
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Application Logs</CardTitle>
                <CardDescription>
                  Structured logs from the application services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 text-center border rounded-md">
                  <p className="text-muted-foreground">
                    View detailed logs in your Datadog Logs dashboard.
                  </p>
                  <div className="mt-4">
                    <Button variant="outline">
                      Open Datadog Logs
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="metrics">
            <Card>
              <CardHeader>
                <CardTitle>System Metrics</CardTitle>
                <CardDescription>
                  Key performance indicators and resource utilization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 text-center border rounded-md">
                  <p className="text-muted-foreground">
                    View detailed metrics in your Datadog Metrics dashboard.
                  </p>
                  <div className="mt-4">
                    <Button variant="outline">
                      Open Datadog Metrics
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 