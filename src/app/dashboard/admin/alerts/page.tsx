'use client';

import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Bell,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Filter,
  Mute,
  XCircle, 
  AlertTriangle,
  Info 
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, formatDistanceToNow } from 'date-fns';

interface Alert {
  id: string;
  name: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'firing' | 'resolved' | 'acknowledged';
  source: 'datadog' | 'cloudwatch' | 'synthetic';
  service: string;
  message: string;
  timestamp: Date;
  resolvedAt?: Date;
  acknowledgedBy?: string;
  escalation?: 'pagerduty' | 'slack' | 'email';
}

export default function AlertsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Sample alerts data - in a real app this would come from your monitoring system's API
  const alerts: Alert[] = [
    {
      id: 'alert-001',
      name: 'High API Error Rate',
      severity: 'critical',
      status: 'firing',
      source: 'datadog',
      service: 'api-gateway',
      message: 'Error rate exceeded 5% threshold (currently 7.2%)',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      escalation: 'pagerduty'
    },
    {
      id: 'alert-002',
      name: 'Database CPU High',
      severity: 'warning',
      status: 'acknowledged',
      source: 'cloudwatch',
      service: 'rds-postgres',
      message: 'CPU utilization exceeded 80% threshold (currently 87.5%)',
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      acknowledgedBy: 'Sarah Smith',
      escalation: 'slack'
    },
    {
      id: 'alert-003',
      name: 'Redis Cache Hit Ratio Low',
      severity: 'warning',
      status: 'firing',
      source: 'datadog',
      service: 'redis-cache',
      message: 'Cache hit ratio below 70% threshold (currently 65.3%)',
      timestamp: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
      escalation: 'slack'
    },
    {
      id: 'alert-004',
      name: 'Auth Service Latency',
      severity: 'warning',
      status: 'resolved',
      source: 'datadog',
      service: 'auth-service',
      message: 'P95 latency exceeded 500ms threshold (peaked at 780ms)',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: 'alert-005',
      name: 'ECS Memory Utilization',
      severity: 'info',
      status: 'resolved',
      source: 'cloudwatch',
      service: 'ecs-cluster',
      message: 'Memory utilization exceeded 75% threshold (peaked at 82%)',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      resolvedAt: new Date(Date.now() - 4.5 * 60 * 60 * 1000), // 4.5 hours ago
    },
    {
      id: 'alert-006',
      name: 'Website Accessibility Check Failed',
      severity: 'critical',
      status: 'firing',
      source: 'synthetic',
      service: 'frontend-web',
      message: 'Synthetic test failed - homepage returned HTTP 503',
      timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      escalation: 'pagerduty'
    }
  ];
  
  // Filter alerts based on tab selection
  const activeAlerts = alerts.filter(alert => alert.status !== 'resolved');
  const resolvedAlerts = alerts.filter(alert => alert.status === 'resolved');
  
  // Handle refresh action
  const refreshAlerts = () => {
    setIsRefreshing(true);
    // In a real app, this would fetch fresh alert data
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };
  
  // Severity badge component
  const SeverityBadge = ({ severity }: { severity: Alert['severity'] }) => {
    switch (severity) {
      case 'critical':
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            <AlertCircle className="mr-1 h-3 w-3" /> Critical
          </Badge>
        );
      case 'warning':
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            <AlertTriangle className="mr-1 h-3 w-3" /> Warning
          </Badge>
        );
      case 'info':
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <Info className="mr-1 h-3 w-3" /> Info
          </Badge>
        );
      default:
        return <Badge>{severity}</Badge>;
    }
  };
  
  // Status badge component
  const StatusBadge = ({ status }: { status: Alert['status'] }) => {
    switch (status) {
      case 'firing':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" /> Firing
          </Badge>
        );
      case 'acknowledged':
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
            <Mute className="mr-1 h-3 w-3" /> Acknowledged
          </Badge>
        );
      case 'resolved':
        return (
          <Badge variant="outline" className="border-green-500 text-green-600">
            <CheckCircle className="mr-1 h-3 w-3" /> Resolved
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  // Source badge component
  const SourceBadge = ({ source }: { source: Alert['source'] }) => {
    switch (source) {
      case 'datadog':
        return <Badge variant="outline">Datadog</Badge>;
      case 'cloudwatch':
        return <Badge variant="outline">CloudWatch</Badge>;
      case 'synthetic':
        return <Badge variant="outline">Synthetic</Badge>;
      default:
        return <Badge variant="outline">{source}</Badge>;
    }
  };
  
  // Escalation badge component
  const EscalationBadge = ({ escalation }: { escalation?: Alert['escalation'] }) => {
    if (!escalation) return null;
    
    switch (escalation) {
      case 'pagerduty':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge className="bg-purple-500 hover:bg-purple-600">PagerDuty</Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Incident created in PagerDuty</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case 'slack':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge className="bg-blue-500 hover:bg-blue-600">Slack</Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Notification sent to Slack</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case 'email':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge className="bg-gray-500 hover:bg-gray-600">Email</Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Alert sent via email</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      default:
        return <Badge>{escalation}</Badge>;
    }
  };
  
  // Format time for display
  const formatTime = (date: Date) => {
    return format(date, 'MMM d, h:mm a');
  };
  
  // Format relative time
  const getRelativeTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Alert Management</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAlerts}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-1 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {alerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length}
            </div>
            <p className="text-sm text-muted-foreground">Active critical alerts</p>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
              Warning Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {alerts.filter(a => a.severity === 'warning' && a.status !== 'resolved').length}
            </div>
            <p className="text-sm text-muted-foreground">Active warning alerts</p>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              Resolved Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {resolvedAlerts.length}
            </div>
            <p className="text-sm text-muted-foreground">Alerts resolved today</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="active">
        <TabsList className="mb-4">
          <TabsTrigger value="active" className="relative">
            Active Alerts
            {activeAlerts.length > 0 && (
              <Badge className="ml-2 bg-red-500">{activeAlerts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved Alerts
          </TabsTrigger>
          <TabsTrigger value="all">All Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>
                Currently active alerts requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Alert</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Escalation</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeAlerts.length > 0 ? (
                    activeAlerts.map(alert => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <SeverityBadge severity={alert.severity} />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{alert.name}</div>
                          <div className="text-sm text-muted-foreground">{alert.message}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span>{alert.service}</span>
                            <SourceBadge source={alert.source} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={alert.status} />
                          {alert.status === 'acknowledged' && (
                            <div className="text-xs text-muted-foreground mt-1">
                              by {alert.acknowledgedBy}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="flex items-center text-sm text-muted-foreground">
                                <Clock className="mr-1 h-3 w-3" />
                                {getRelativeTime(alert.timestamp)}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{formatTime(alert.timestamp)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <EscalationBadge escalation={alert.escalation} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                        No active alerts. Everything is running smoothly!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resolved">
          <Card>
            <CardHeader>
              <CardTitle>Resolved Alerts</CardTitle>
              <CardDescription>
                Recently resolved alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Alert</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Resolved</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resolvedAlerts.map(alert => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <SeverityBadge severity={alert.severity} />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{alert.name}</div>
                        <div className="text-sm text-muted-foreground">{alert.message}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>{alert.service}</span>
                          <SourceBadge source={alert.source} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={alert.status} />
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="flex items-center text-sm text-muted-foreground">
                              {getRelativeTime(alert.timestamp)}
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{formatTime(alert.timestamp)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        {alert.resolvedAt && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="flex items-center text-sm text-muted-foreground">
                                {getRelativeTime(alert.resolvedAt)}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{formatTime(alert.resolvedAt)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {alert.resolvedAt && 
                          formatDistanceToNow(alert.timestamp, {
                            includeSeconds: true,
                            addSuffix: false,
                          })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Alerts</CardTitle>
              <CardDescription>
                Complete history of all alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Showing all alerts from the last 24 hours
                  </span>
                </div>
                <Button variant="outline" size="sm">
                  Export
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Alert</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...alerts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).map(alert => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <SeverityBadge severity={alert.severity} />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{alert.name}</div>
                        <div className="text-sm text-muted-foreground">{alert.message}</div>
                      </TableCell>
                      <TableCell>{alert.service}</TableCell>
                      <TableCell>
                        <StatusBadge status={alert.status} />
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="flex items-center text-sm text-muted-foreground">
                              <Clock className="mr-1 h-3 w-3" />
                              {getRelativeTime(alert.timestamp)}
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{formatTime(alert.timestamp)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <SourceBadge source={alert.source} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 