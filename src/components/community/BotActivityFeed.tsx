'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Activity, 
  RefreshCw, 
  MessageSquare, 
  AlertTriangle, 
  Filter, 
  User, 
  UserPlus, 
  UserMinus, 
  Bot, 
  Heart, 
  FileBadge, 
  Command, 
  Search, 
  ArrowDown, 
  Clock
} from 'lucide-react';
import { GroupPlatform } from './GroupStatsCard';

// Activity types
export enum ActivityType {
  MESSAGE = 'message',
  JOIN = 'join',
  LEAVE = 'leave',
  COMMAND = 'command',
  KEYWORD = 'keyword',
  AUTO_RESPONSE = 'auto_response',
  FILE = 'file',
  REACTION = 'reaction',
  ALERT = 'alert',
  BOT_ACTION = 'bot_action',
}

// Activity filters
export enum ActivityFilter {
  ALL = 'all',
  MESSAGES = 'messages',
  JOINS = 'joins',
  LEAVES = 'leaves',
  COMMANDS = 'commands',
  KEYWORDS = 'keywords',
  AUTO_RESPONSES = 'auto_responses',
  FILES = 'files',
  REACTIONS = 'reactions',
  ALERTS = 'alerts',
  BOT_ACTIONS = 'bot_actions',
}

// Activity interface
export interface BotActivity {
  id: string;
  type: ActivityType;
  groupId: string;
  groupName: string;
  platform: GroupPlatform;
  timestamp: Date;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  content?: string;
  command?: string;
  keyword?: string;
  autoResponse?: string;
  fileType?: string;
  fileName?: string;
  fileSize?: number;
  fileUrl?: string;
  reactionEmoji?: string;
  reactionCount?: number;
  alertType?: 'spam' | 'toxicity' | 'excessive_mentions' | 'flood' | 'prohibited_content';
  alertSeverity?: 'low' | 'medium' | 'high';
  botActionType?: 'message_delete' | 'user_timeout' | 'user_ban' | 'message_pin' | 'response_sent';
  botActionResult?: 'success' | 'failed' | 'partial';
}

export interface BotActivityFeedProps {
  activities: BotActivity[];
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
  groups?: { id: string; name: string; platform: GroupPlatform }[];
  className?: string;
}

export function BotActivityFeed({
  activities = [],
  isLoading = false,
  onRefresh,
  groups = [],
  className,
}: BotActivityFeedProps) {
  const [activeFilter, setActiveFilter] = React.useState<ActivityFilter>(ActivityFilter.ALL);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  const [selectedGroup, setSelectedGroup] = React.useState<string>('all');
  const [timeSort, setTimeSort] = React.useState<'newest' | 'oldest'>('newest');
  
  // Handle refresh
  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    try {
      setIsRefreshing(true);
      await onRefresh();
    } catch (error) {
      console.error('Failed to refresh activity feed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Filter activities based on selected filter and group
  const filteredActivities = React.useMemo(() => {
    let filtered = [...activities];
    
    // Filter by group
    if (selectedGroup !== 'all') {
      filtered = filtered.filter(activity => activity.groupId === selectedGroup);
    }
    
    // Filter by activity type
    if (activeFilter !== ActivityFilter.ALL) {
      switch (activeFilter) {
        case ActivityFilter.MESSAGES:
          filtered = filtered.filter(activity => activity.type === ActivityType.MESSAGE);
          break;
        case ActivityFilter.JOINS:
          filtered = filtered.filter(activity => activity.type === ActivityType.JOIN);
          break;
        case ActivityFilter.LEAVES:
          filtered = filtered.filter(activity => activity.type === ActivityType.LEAVE);
          break;
        case ActivityFilter.COMMANDS:
          filtered = filtered.filter(activity => activity.type === ActivityType.COMMAND);
          break;
        case ActivityFilter.KEYWORDS:
          filtered = filtered.filter(activity => activity.type === ActivityType.KEYWORD);
          break;
        case ActivityFilter.AUTO_RESPONSES:
          filtered = filtered.filter(activity => activity.type === ActivityType.AUTO_RESPONSE);
          break;
        case ActivityFilter.FILES:
          filtered = filtered.filter(activity => activity.type === ActivityType.FILE);
          break;
        case ActivityFilter.REACTIONS:
          filtered = filtered.filter(activity => activity.type === ActivityType.REACTION);
          break;
        case ActivityFilter.ALERTS:
          filtered = filtered.filter(activity => activity.type === ActivityType.ALERT);
          break;
        case ActivityFilter.BOT_ACTIONS:
          filtered = filtered.filter(activity => activity.type === ActivityType.BOT_ACTION);
          break;
      }
    }
    
    // Sort by timestamp
    filtered.sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime();
      const bTime = new Date(b.timestamp).getTime();
      return timeSort === 'newest' ? bTime - aTime : aTime - bTime;
    });
    
    return filtered;
  }, [activities, activeFilter, selectedGroup, timeSort]);
  
  // Get icon for activity type
  const getActivityIcon = (activity: BotActivity) => {
    switch (activity.type) {
      case ActivityType.MESSAGE:
        return <MessageSquare className="h-4 w-4" />;
      case ActivityType.JOIN:
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case ActivityType.LEAVE:
        return <UserMinus className="h-4 w-4 text-red-500" />;
      case ActivityType.COMMAND:
        return <Command className="h-4 w-4 text-blue-500" />;
      case ActivityType.KEYWORD:
        return <Search className="h-4 w-4 text-purple-500" />;
      case ActivityType.AUTO_RESPONSE:
        return <Bot className="h-4 w-4 text-indigo-500" />;
      case ActivityType.FILE:
        return <FileBadge className="h-4 w-4 text-cyan-500" />;
      case ActivityType.REACTION:
        return <Heart className="h-4 w-4 text-pink-500" />;
      case ActivityType.ALERT:
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case ActivityType.BOT_ACTION:
        return <Bot className="h-4 w-4 text-teal-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };
  
  // Get platform badge
  const getPlatformBadge = (platform: GroupPlatform) => {
    return (
      <Badge 
        variant={platform === GroupPlatform.DISCORD ? 'secondary' : 'default'} 
        className="ml-2 text-xs capitalize"
      >
        {platform.toLowerCase()}
      </Badge>
    );
  };
  
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  // Get severity badge for alerts
  const getSeverityBadge = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">Low</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">Medium</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800">High</Badge>;
      default:
        return null;
    }
  };
  
  // Get action result badge
  const getActionResultBadge = (result: 'success' | 'failed' | 'partial') => {
    switch (result) {
      case 'success':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">Success</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800">Failed</Badge>;
      case 'partial':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">Partial</Badge>;
      default:
        return null;
    }
  };
  
  // Get activity description based on type
  const getActivityDescription = (activity: BotActivity) => {
    switch (activity.type) {
      case ActivityType.MESSAGE:
        return (
          <div className="flex flex-col gap-1">
            <p className="text-sm">
              <span className="font-medium">{activity.user?.name}</span> sent a message in{' '}
              <span className="font-medium">{activity.groupName}</span>
            </p>
            {activity.content && (
              <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">
                {activity.content.length > 120 
                  ? `${activity.content.substring(0, 120)}...` 
                  : activity.content}
              </p>
            )}
          </div>
        );
      case ActivityType.JOIN:
        return (
          <p className="text-sm">
            <span className="font-medium">{activity.user?.name}</span> joined{' '}
            <span className="font-medium">{activity.groupName}</span>
          </p>
        );
      case ActivityType.LEAVE:
        return (
          <p className="text-sm">
            <span className="font-medium">{activity.user?.name}</span> left{' '}
            <span className="font-medium">{activity.groupName}</span>
          </p>
        );
      case ActivityType.COMMAND:
        return (
          <div className="flex flex-col gap-1">
            <p className="text-sm">
              <span className="font-medium">{activity.user?.name}</span> used command{' '}
              <code className="bg-muted/50 px-1 py-0.5 rounded font-mono text-xs">
                {activity.command}
              </code>{' '}
              in <span className="font-medium">{activity.groupName}</span>
            </p>
          </div>
        );
      case ActivityType.KEYWORD:
        return (
          <div className="flex flex-col gap-1">
            <p className="text-sm">
              <span className="font-medium">{activity.user?.name}</span> mentioned keyword{' '}
              <Badge variant="outline" className="font-normal text-xs">
                {activity.keyword}
              </Badge>{' '}
              in <span className="font-medium">{activity.groupName}</span>
            </p>
            {activity.content && (
              <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">
                {activity.content.length > 120 
                  ? `${activity.content.substring(0, 120)}...` 
                  : activity.content}
              </p>
            )}
          </div>
        );
      case ActivityType.AUTO_RESPONSE:
        return (
          <div className="flex flex-col gap-1">
            <p className="text-sm">
              Bot auto-responded to{' '}
              <span className="font-medium">{activity.user?.name}</span> in{' '}
              <span className="font-medium">{activity.groupName}</span>
            </p>
            {activity.autoResponse && (
              <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">
                {activity.autoResponse.length > 120 
                  ? `${activity.autoResponse.substring(0, 120)}...` 
                  : activity.autoResponse}
              </p>
            )}
          </div>
        );
      case ActivityType.FILE:
        return (
          <p className="text-sm">
            <span className="font-medium">{activity.user?.name}</span> shared a file{' '}
            {activity.fileName && (
              <span className="font-mono text-xs">
                {activity.fileName} ({activity.fileSize && formatFileSize(activity.fileSize)})
              </span>
            )}{' '}
            in <span className="font-medium">{activity.groupName}</span>
          </p>
        );
      case ActivityType.REACTION:
        return (
          <p className="text-sm">
            <span className="font-medium">{activity.user?.name}</span> reacted with{' '}
            <span className="text-base">{activity.reactionEmoji}</span>{' '}
            {activity.reactionCount && activity.reactionCount > 1 && (
              <span className="text-xs text-muted-foreground">
                ({activity.reactionCount} times)
              </span>
            )}{' '}
            in <span className="font-medium">{activity.groupName}</span>
          </p>
        );
      case ActivityType.ALERT:
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <p className="text-sm">
                <span className="font-medium">{activity.alertType?.replace('_', ' ')}</span> alert triggered by{' '}
                <span className="font-medium">{activity.user?.name}</span> in{' '}
                <span className="font-medium">{activity.groupName}</span>
              </p>
              {activity.alertSeverity && getSeverityBadge(activity.alertSeverity)}
            </div>
            {activity.content && (
              <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">
                {activity.content.length > 120 
                  ? `${activity.content.substring(0, 120)}...` 
                  : activity.content}
              </p>
            )}
          </div>
        );
      case ActivityType.BOT_ACTION:
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <p className="text-sm">
                Bot performed{' '}
                <span className="font-medium">{activity.botActionType?.replace('_', ' ')}</span>{' '}
                {activity.user && (
                  <>
                    on <span className="font-medium">{activity.user.name}</span>
                  </>
                )}{' '}
                in <span className="font-medium">{activity.groupName}</span>
              </p>
              {activity.botActionResult && getActionResultBadge(activity.botActionResult)}
            </div>
          </div>
        );
      default:
        return <p className="text-sm">Unknown activity</p>;
    }
  };
  
  // Render loading skeleton
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-6 w-40 bg-muted animate-pulse rounded" />
          </CardTitle>
          <CardDescription>
            <div className="h-4 w-60 bg-muted animate-pulse rounded" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-full bg-muted animate-pulse rounded mb-6" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render empty state
  if (activities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Feed
          </CardTitle>
          <CardDescription>
            Real-time community events and interactions
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Activity className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No activities yet</p>
          <p className="text-sm text-muted-foreground/80 max-w-md mt-1 mb-6">
            Activities will appear here once your bots start monitoring your communities
          </p>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Feed
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </CardTitle>
        <CardDescription>
          Real-time community events and interactions
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 pb-2">
          <Tabs 
            value={activeFilter} 
            onValueChange={(value) => setActiveFilter(value as ActivityFilter)}
            className="w-full"
          >
            <TabsList className="w-full h-9 grid grid-cols-5 mb-2 md:mb-0 md:w-auto">
              <TabsTrigger value={ActivityFilter.ALL} className="text-xs h-8">All</TabsTrigger>
              <TabsTrigger value={ActivityFilter.MESSAGES} className="text-xs h-8">Messages</TabsTrigger>
              <TabsTrigger value={ActivityFilter.KEYWORDS} className="text-xs h-8">Keywords</TabsTrigger>
              <TabsTrigger value={ActivityFilter.COMMANDS} className="text-xs h-8">Commands</TabsTrigger>
              <TabsTrigger value={ActivityFilter.ALERTS} className="text-xs h-8">Alerts</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex flex-row gap-2">
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="w-full md:w-[180px] h-9">
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {groups.map(group => (
                  <SelectItem key={group.id} value={group.id} className="flex items-center gap-2">
                    <span>{group.name}</span>
                    {getPlatformBadge(group.platform)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={timeSort} onValueChange={(value) => setTimeSort(value as 'newest' | 'oldest')}>
              <SelectTrigger className="w-[100px] h-9">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest" className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  Newest
                </SelectItem>
                <SelectItem value="oldest" className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  Oldest
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Activity Feed */}
        <ScrollArea className="h-[500px] pr-4">
          {filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Filter className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-muted-foreground text-sm">No activities match your filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity, index) => (
                <div key={activity.id} className="flex gap-4">
                  <div className="mt-0.5">
                    <div className="relative">
                      {activity.user ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                          <AvatarFallback>
                            {activity.user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="absolute -bottom-1 -right-1 bg-background p-0.5 rounded-full">
                        <div className="bg-primary/10 rounded-full w-4 h-4 flex items-center justify-center">
                          {getActivityIcon(activity)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-start">
                      {getActivityDescription(activity)}
                      <div className="flex items-center gap-1.5 mb-1 sm:mb-0 sm:ml-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </span>
                        {getPlatformBadge(activity.platform)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 