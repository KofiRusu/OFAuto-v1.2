'use client'

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { WebSocketDebugger } from '@/components/dev/WebSocketDebugger';
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';
import { 
  BarChart, 
  Users, 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  PieChart, 
  Layers, 
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Stat card component
const StatCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon,
  change,
  loading = false
}: { 
  title: string; 
  value: string | number; 
  description?: string;
  icon: React.ElementType;
  change?: { value: number; positive: boolean };
  loading?: boolean;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {loading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <div className="text-2xl font-bold">
          {value}
          {change && (
            <span className={`text-xs ml-2 font-normal ${change.positive ? 'text-green-500' : 'text-red-500'}`}>
              {change.positive ? '↑' : '↓'} {Math.abs(change.value)}%
            </span>
          )}
        </div>
      )}
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </CardContent>
  </Card>
);

// Activity item component
const ActivityItem = ({ 
  type, 
  description, 
  time, 
  status = 'success',
  platform
}: { 
  type: string;
  description: string;
  time: string;
  status?: 'success' | 'error' | 'pending';
  platform?: string;
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return null;
    }
  };
  
  return (
    <div className="flex items-start gap-4 pb-4 last:pb-0">
      <div className="mt-1">{getStatusIcon()}</div>
      <div className="space-y-1">
        <p className="text-sm font-medium leading-none">{type}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex items-center gap-2 pt-1">
          <p className="text-xs text-muted-foreground">{time}</p>
          {platform && (
            <Badge variant="outline" className="text-xs h-5">
              {platform}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { isConnected } = useWebSocketContext();

  // Statistics query
  const { 
    data: stats, 
    isLoading: statsLoading,
    isError: statsError
  } = trpc.dashboard.getStats.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Activities query
  const { 
    data: activities, 
    isLoading: activitiesLoading,
    isError: activitiesError
  } = trpc.activity.getRecent.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
  
  // Tasks query
  const { 
    data: tasks, 
    isLoading: tasksLoading,
    isError: tasksError
  } = trpc.tasks.getRecent.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Badge
            variant={isConnected ? "default" : "destructive"}
            className="capitalize h-6"
          >
            {isConnected ? "Connected" : "Offline"}
          </Badge>
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/monitor">
              Live Monitor
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Statistics */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clients"
          value={statsLoading ? 0 : stats?.clientCount ?? 0}
          description={`${statsLoading ? 0 : stats?.activeClients ?? 0} currently active`}
          icon={Users}
          loading={statsLoading}
        />
        <StatCard
          title="Engagement Rate"
          value={`${statsLoading ? 0 : stats?.engagementRate ?? 0}%`}
          description="Avg. interaction rate"
          icon={MessageSquare}
          loading={statsLoading}
        />
        <StatCard
          title="Scheduled Posts"
          value={statsLoading ? 0 : stats?.scheduledPosts ?? 0}
          description="Next 7 days"
          icon={Calendar}
          loading={statsLoading}
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${statsLoading ? 0 : (stats?.revenue.current ?? 0).toLocaleString()}`}
          icon={TrendingUp}
          change={statsLoading || !stats?.revenue ? undefined : { 
            value: stats.revenue.change, 
            positive: stats.revenue.change > 0 
          }}
          loading={statsLoading}
        />
      </div>
      
      {statsError && (
        <Alert variant="destructive">
          <AlertTitle>Error loading statistics</AlertTitle>
          <AlertDescription>
            Unable to load dashboard statistics. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Activity and Tasks */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest activity across your connected platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-4">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <Skeleton className="h-4 w-4 rounded-full mt-1" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-3 w-3/5" />
                      <Skeleton className="h-3 w-1/4 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activitiesError ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p>Error loading activities. Please try again.</p>
              </div>
            ) : !activities || activities.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No recent activity to display.
              </p>
            ) : (
              <ScrollArea className="h-[320px] -mr-4 pr-4">
                <div className="space-y-6">
                  {activities.map(activity => (
                    <ActivityItem
                      key={activity.id}
                      type={activity.type}
                      description={activity.description}
                      time={formatDistanceToNow(activity.createdAt)}
                      status={activity.status as 'success' | 'error' | 'pending'}
                      platform={activity.platform}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tasks</CardTitle>
                <CardDescription>
                  Monitor and manage your upcoming tasks
                </CardDescription>
              </div>
              <Button size="sm" asChild>
                <Link href="/dashboard/tasks/create">
                  New Task
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList className="mb-4">
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending" className="mt-0">
                {tasksLoading ? (
                  <div className="space-y-4">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="p-3 border rounded-lg">
                        <Skeleton className="h-4 w-4/5 mb-2" />
                        <div className="flex justify-between">
                          <Skeleton className="h-3 w-1/4" />
                          <Skeleton className="h-3 w-1/5" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : tasksError ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p>Error loading tasks. Please try again.</p>
                  </div>
                ) : !tasks || tasks.filter(t => t.status === 'pending').length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No pending tasks.
                  </p>
                ) : (
                  <ScrollArea className="h-[250px] -mr-4 pr-4">
                    <div className="space-y-2">
                      {tasks.filter(t => t.status === 'pending').map(task => (
                        <Link 
                          key={task.id}
                          href={`/dashboard/tasks/${task.id}`}
                          className="block p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-sm">{task.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-muted-foreground">
                                  Due {formatDistanceToNow(task.dueDate)}
                                </p>
                                {task.priority === 'high' && (
                                  <Badge variant="destructive" className="h-5 text-xs">High Priority</Badge>
                                )}
                                {task.platform && (
                                  <Badge variant="outline" className="h-5 text-xs">{task.platform}</Badge>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
              
              <TabsContent value="in-progress" className="mt-0">
                {tasksLoading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : tasksError ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p>Error loading tasks. Please try again.</p>
                  </div>
                ) : !tasks || tasks.filter(t => t.status === 'in-progress').length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No tasks in progress.
                  </p>
                ) : (
                  <ScrollArea className="h-[250px] -mr-4 pr-4">
                    <div className="space-y-2">
                      {tasks.filter(t => t.status === 'in-progress').map(task => (
                        <Link 
                          key={task.id}
                          href={`/dashboard/tasks/${task.id}`}
                          className="block p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-sm">{task.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-muted-foreground">
                                  Due {formatDistanceToNow(task.dueDate)}
                                </p>
                                {task.priority === 'high' && (
                                  <Badge variant="destructive" className="h-5 text-xs">High Priority</Badge>
                                )}
                                {task.platform && (
                                  <Badge variant="outline" className="h-5 text-xs">{task.platform}</Badge>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
              
              <TabsContent value="completed" className="mt-0">
                {tasksLoading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : tasksError ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p>Error loading tasks. Please try again.</p>
                  </div>
                ) : !tasks || tasks.filter(t => t.status === 'completed').length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No completed tasks.
                  </p>
                ) : (
                  <ScrollArea className="h-[250px] -mr-4 pr-4">
                    <div className="space-y-2">
                      {tasks.filter(t => t.status === 'completed').map(task => (
                        <Link 
                          key={task.id}
                          href={`/dashboard/tasks/${task.id}`}
                          className="block p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-sm">{task.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-muted-foreground">
                                  Completed {formatDistanceToNow(task.dueDate)}
                                </p>
                                {task.platform && (
                                  <Badge variant="outline" className="h-5 text-xs">{task.platform}</Badge>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Chart Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>
              Monthly revenue across all platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <div className="h-[200px] flex items-center justify-center border rounded-md">
                <div className="flex flex-col items-center text-muted-foreground">
                  <BarChart className="h-12 w-12 mb-2" />
                  <p>Revenue chart placeholder</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Platform Breakdown</CardTitle>
            <CardDescription>
              Engagement by platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <div className="h-[200px] flex items-center justify-center border rounded-md">
                <div className="flex flex-col items-center text-muted-foreground">
                  <PieChart className="h-12 w-12 mb-2" />
                  <p>Platforms chart placeholder</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Debug panel - only visible in development */}
      {process.env.NODE_ENV === 'development' && <WebSocketDebugger />}
    </div>
  );
} 