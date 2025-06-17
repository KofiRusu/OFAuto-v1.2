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
import { MetricCard } from '@/components/ui/metric-card';
import { PlatformBadge } from '@/components/ui/platform-badge';
import { EmptyState, emptyStatePresets } from '@/components/ui/empty-state';
import { QuickAction, defaultQuickActions } from '@/components/ui/quick-action';
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
  ChevronRight,
  Plus
} from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

// Activity item component with PlatformBadge
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
    <div className="flex items-start gap-4 pb-4 last:pb-0 stagger-item">
      <div className="mt-1">{getStatusIcon()}</div>
      <div className="space-y-1 flex-1">
        <p className="text-sm font-medium leading-none">{type}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex items-center gap-2 pt-1">
          <p className="text-xs text-muted-foreground">{time}</p>
          {platform && (
            <PlatformBadge 
              platform={platform} 
              size="sm" 
              variant="default"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { isConnected } = useWebSocketContext();
  const router = useRouter();

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

  // Quick actions configuration
  const quickActions = [
    {
      id: 'create-post',
      label: 'Create Post',
      icon: Plus,
      description: 'Upload new content',
      onClick: () => router.push('/dashboard/posts/create'),
      color: 'bg-blue-500 hover:bg-blue-600 text-white',
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: Calendar,
      description: 'Plan your content',
      onClick: () => router.push('/dashboard/scheduler'),
      color: 'bg-purple-500 hover:bg-purple-600 text-white',
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageSquare,
      description: 'Check messages',
      onClick: () => router.push('/dashboard/messages'),
      color: 'bg-green-500 hover:bg-green-600 text-white',
    },
    {
      id: 'add-client',
      label: 'Add Client',
      icon: Users,
      description: 'New client',
      onClick: () => router.push('/dashboard/clients/new'),
      color: 'bg-orange-500 hover:bg-orange-600 text-white',
    },
  ];

  // Generate sample sparkline data for revenue
  const revenueSparkline = React.useMemo(() => {
    if (!stats?.revenue) return undefined;
    // Generate 7 days of sample data trending towards current value
    const current = stats.revenue.current;
    const change = stats.revenue.change / 100;
    return Array.from({ length: 7 }, (_, i) => {
      const factor = (i / 6);
      return current * (1 - change + (change * factor)) + (Math.random() - 0.5) * current * 0.1;
    });
  }, [stats?.revenue]);
  
  return (
    <div className="flex-1 space-y-6 p-6 page-transition-enter-active">
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
      
      {/* Statistics with new MetricCard */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Clients"
          value={stats?.clientCount ?? 0}
          description={`${stats?.activeClients ?? 0} currently active`}
          icon={Users}
          loading={statsLoading}
          variant="default"
        />
        <MetricCard
          title="Engagement Rate"
          value={`${stats?.engagementRate ?? 0}%`}
          description="Avg. interaction rate"
          icon={MessageSquare}
          loading={statsLoading}
          variant="default"
          badge={stats?.engagementRate && stats.engagementRate > 80 ? {
            label: 'Excellent',
            variant: 'default'
          } : undefined}
        />
        <MetricCard
          title="Scheduled Posts"
          value={stats?.scheduledPosts ?? 0}
          description="Next 7 days"
          icon={Calendar}
          loading={statsLoading}
          variant="default"
        />
        <MetricCard
          title="Monthly Revenue"
          value={(stats?.revenue.current ?? 0).toLocaleString()}
          prefix="$"
          icon={TrendingUp}
          trend={stats?.revenue ? { 
            value: stats.revenue.change, 
            type: stats.revenue.change > 0 ? 'positive' : stats.revenue.change < 0 ? 'negative' : 'neutral'
          } : undefined}
          loading={statsLoading}
          variant="gradient"
          sparkline={revenueSparkline}
        />
      </div>
      
      {statsError && (
        <Alert variant="destructive" className="animate-fade-in">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading statistics</AlertTitle>
          <AlertDescription>
            Unable to load dashboard statistics. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Activity and Tasks */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="col-span-1 card-lift">
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
              <EmptyState
                icon={AlertCircle}
                title="Error loading activities"
                description="Please try again"
                illustration="error"
                size="sm"
              />
            ) : !activities || activities.length === 0 ? (
              <EmptyState
                {...emptyStatePresets.noData}
                title="No recent activity"
                description="Activity will appear here once you start using the platform"
                size="sm"
              />
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
        
        <Card className="col-span-1 card-lift">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tasks</CardTitle>
                <CardDescription>
                  Monitor and manage your upcoming tasks
                </CardDescription>
              </div>
              <Button size="sm" asChild className="interactive-scale">
                <Link href="/dashboard/tasks/create">
                  <Plus className="h-4 w-4 mr-1" />
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
                  <EmptyState
                    icon={AlertCircle}
                    title="Error loading tasks"
                    description="Please try again"
                    illustration="error"
                    size="sm"
                  />
                ) : !tasks || tasks.filter(t => t.status === 'pending').length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title="No pending tasks"
                    description="Create a new task to get started"
                    size="sm"
                    action={{
                      label: 'Create Task',
                      onClick: () => router.push('/dashboard/tasks/create')
                    }}
                  />
                ) : (
                  <ScrollArea className="h-[250px] -mr-4 pr-4">
                    <div className="space-y-2">
                      {tasks.filter(t => t.status === 'pending').map(task => (
                        <Link 
                          key={task.id}
                          href={`/dashboard/tasks/${task.id}`}
                          className="block p-3 border rounded-lg hover:bg-accent/50 transition-colors card-lift"
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
                                  <PlatformBadge 
                                    platform={task.platform}
                                    size="sm"
                                    variant="outline"
                                  />
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
                  <Skeleton className="h-[250px] w-full skeleton-loading" />
                ) : tasksError ? (
                  <EmptyState
                    icon={AlertCircle}
                    title="Error loading tasks"
                    description="Please try again"
                    illustration="error"
                    size="sm"
                  />
                ) : !tasks || tasks.filter(t => t.status === 'in-progress').length === 0 ? (
                  <EmptyState
                    icon={Clock}
                    title="No tasks in progress"
                    description="Start working on a pending task"
                    size="sm"
                  />
                ) : (
                  <ScrollArea className="h-[250px] -mr-4 pr-4">
                    <div className="space-y-2">
                      {tasks.filter(t => t.status === 'in-progress').map(task => (
                        <Link 
                          key={task.id}
                          href={`/dashboard/tasks/${task.id}`}
                          className="block p-3 border rounded-lg hover:bg-accent/50 transition-colors card-lift"
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
                                  <PlatformBadge 
                                    platform={task.platform}
                                    size="sm"
                                    variant="outline"
                                  />
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
                  <Skeleton className="h-[250px] w-full skeleton-loading" />
                ) : tasksError ? (
                  <EmptyState
                    icon={AlertCircle}
                    title="Error loading tasks"
                    description="Please try again"
                    illustration="error"
                    size="sm"
                  />
                ) : !tasks || tasks.filter(t => t.status === 'completed').length === 0 ? (
                  <EmptyState
                    icon={CheckCircle}
                    title="No completed tasks"
                    description="Complete your first task to see it here"
                    size="sm"
                  />
                ) : (
                  <ScrollArea className="h-[250px] -mr-4 pr-4">
                    <div className="space-y-2">
                      {tasks.filter(t => t.status === 'completed').map(task => (
                        <Link 
                          key={task.id}
                          href={`/dashboard/tasks/${task.id}`}
                          className="block p-3 border rounded-lg hover:bg-accent/50 transition-colors card-lift"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-sm">{task.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-muted-foreground">
                                  Completed {formatDistanceToNow(task.dueDate)}
                                </p>
                                {task.platform && (
                                  <PlatformBadge 
                                    platform={task.platform}
                                    size="sm"
                                    variant="outline"
                                  />
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
        <Card className="md:col-span-2 card-lift">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>
              Monthly revenue across all platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-[200px] w-full skeleton-loading" />
            ) : (
              <div className="h-[200px] flex items-center justify-center border rounded-md">
                <EmptyState
                  {...emptyStatePresets.noAnalytics}
                  size="sm"
                  className="py-8"
                />
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-1 card-lift">
          <CardHeader>
            <CardTitle>Platform Breakdown</CardTitle>
            <CardDescription>
              Engagement by platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-[200px] w-full skeleton-loading" />
            ) : (
              <div className="h-[200px] flex items-center justify-center border rounded-md">
                <EmptyState
                  icon={PieChart}
                  title="Coming Soon"
                  description="Platform analytics"
                  size="sm"
                  className="py-8"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Action Menu */}
      <QuickAction items={quickActions} position="bottom-right" />
      
      {/* Debug panel - only visible in development */}
      {process.env.NODE_ENV === 'development' && <WebSocketDebugger />}
    </div>
  );
} 