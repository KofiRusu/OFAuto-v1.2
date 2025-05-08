'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';
import { WebSocketDebugger } from '@/components/dev/WebSocketDebugger';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Activity,
  Calendar,
  MessageSquare,
  Bell,
  Search
} from 'lucide-react';
import { WebSocketEvents } from '@/server/websocket';
import { formatDistanceToNow } from '@/lib/utils';

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
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return null;
    }
  };
  
  return (
    <div className="flex items-start gap-4 py-3 border-b last:border-b-0">
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

// Status indicator component
const StatusIndicator = ({ 
  status, 
  count 
}: { 
  status: 'online' | 'offline' | 'issues'; 
  count: number;
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      case 'issues':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2.5 w-2.5 rounded-full ${getStatusColor()}`} />
      <span className="font-medium">{count}</span>
    </div>
  );
};

export default function MonitorPage() {
  const { isConnected, socket } = useWebSocketContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [realtimeActivities, setRealtimeActivities] = useState<any[]>([]);
  
  // Initial activities query
  const { 
    data: activities = [], 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      // Simulate API fetch
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return [
        {
          id: '1',
          type: 'Content Posted',
          description: 'Scheduled post published to OnlyFans',
          createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          status: 'success',
          platform: 'OnlyFans'
        },
        {
          id: '2',
          type: 'Platform Synced',
          description: 'Successfully synced data from Fansly',
          createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          status: 'success',
          platform: 'Fansly'
        },
        {
          id: '3',
          type: 'New Follower Interactions',
          description: '12 new followers from recent campaign',
          createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          status: 'success',
          platform: 'Instagram'
        },
        {
          id: '4',
          type: 'Post Scheduled',
          description: 'New content scheduled for tomorrow at 9:00 AM',
          createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
          status: 'pending',
          platform: 'Patreon'
        },
        {
          id: '5',
          type: 'API Connection Failed',
          description: 'Failed to connect to OnlyFans API. Retrying...',
          createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
          status: 'error',
          platform: 'OnlyFans'
        }
      ];
    }
  });
  
  // Listen for activity updates via WebSocket
  useEffect(() => {
    if (!socket) return;
    
    const handleActivityUpdate = (activity: any) => {
      setRealtimeActivities(prev => [activity, ...prev].slice(0, 50));
    };
    
    socket.on(WebSocketEvents.ACTIVITY_UPDATE, handleActivityUpdate);
    
    return () => {
      socket.off(WebSocketEvents.ACTIVITY_UPDATE, handleActivityUpdate);
    };
  }, [socket]);
  
  // Combined activities (WebSocket updates + initial data)
  const combinedActivities = [...realtimeActivities, ...activities];
  
  // Filter activities based on search term
  const filteredActivities = searchTerm
    ? combinedActivities.filter(
        activity => 
          activity.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (activity.platform && activity.platform.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : combinedActivities;
  
  // Platform stats
  const platformStats = {
    onlyfans: { online: 3, offline: 1, issues: 0 },
    fansly: { online: 2, offline: 0, issues: 1 },
    instagram: { online: 4, offline: 0, issues: 0 },
    twitter: { online: 1, offline: 0, issues: 1 },
    patreon: { online: 2, offline: 0, issues: 0 }
  };
  
  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Monitor</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of system activities and platform statuses
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge
            variant={isConnected ? "default" : "destructive"}
            className="h-6"
          >
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Platform Status Section */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Status</CardTitle>
          <CardDescription>
            Current status of connected platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(platformStats).map(([platform, stats]) => (
              <Card key={platform} className="overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base capitalize">{platform}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="space-y-1">
                      <StatusIndicator status="online" count={stats.online} />
                      <p className="text-xs text-muted-foreground">Online</p>
                    </div>
                    <div className="space-y-1">
                      <StatusIndicator status="issues" count={stats.issues} />
                      <p className="text-xs text-muted-foreground">Issues</p>
                    </div>
                    <div className="space-y-1">
                      <StatusIndicator status="offline" count={stats.offline} />
                      <p className="text-xs text-muted-foreground">Offline</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Activity Feed */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle>Activity Feed</CardTitle>
              <CardDescription>
                Real-time system activities and events
              </CardDescription>
            </div>
            
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs defaultValue="all">
            <div className="border-b px-4">
              <TabsList className="bg-transparent h-auto p-0">
                <TabsTrigger
                  value="all"
                  className="rounded-none px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="content"
                  className="rounded-none px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Content
                </TabsTrigger>
                <TabsTrigger
                  value="messages"
                  className="rounded-none px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Messages
                </TabsTrigger>
                <TabsTrigger
                  value="alerts"
                  className="rounded-none px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Alerts
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all" className="m-0">
              <ScrollArea className="h-[500px]">
                <div className="p-4">
                  {isLoading ? (
                    <div className="space-y-6">
                      {Array(5).fill(0).map((_, i) => (
                        <div key={i} className="flex items-start gap-4">
                          <Skeleton className="h-4 w-4 rounded-full mt-1" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <div className="flex gap-2 pt-1">
                              <Skeleton className="h-3 w-16" />
                              <Skeleton className="h-3 w-10" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredActivities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Activity className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                      <h3 className="text-lg font-medium">No activities found</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {searchTerm 
                          ? "Try adjusting your search term"
                          : "Activities will appear here as they occur"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-0 divide-y">
                      {filteredActivities.map((activity, index) => (
                        <ActivityItem
                          key={`${activity.id}-${index}`}
                          type={activity.type}
                          description={activity.description}
                          time={formatDistanceToNow(activity.createdAt)}
                          status={activity.status}
                          platform={activity.platform}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="content" className="m-0">
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium">Content Activity</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Filter implementation for content-related activities
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="messages" className="m-0">
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium">Message Activity</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Filter implementation for message-related activities
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="alerts" className="m-0">
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium">Alert Activity</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Filter implementation for system alerts and notifications
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* WebSocket debug panel in development */}
      {process.env.NODE_ENV === 'development' && <WebSocketDebugger />}
    </div>
  );
} 