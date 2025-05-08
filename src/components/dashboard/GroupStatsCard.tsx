import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  RefreshCw, 
  Users, 
  MessagesSquare, 
  ArrowUpRight, 
  Clock, 
  Activity,
  UserPlus,
  MessageSquare,
  ChevronRight,
  PieChart,
  BarChart3,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { format } from 'date-fns';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Platform = 'discord' | 'telegram';

interface GroupMetric {
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface GroupData {
  id: string;
  name: string;
  avatar?: string;
  platform: Platform;
  memberCount: number;
  activeUsers: number;
  messageCount: number;
  commandUsage: number;
  growthRate: number;
  engagementRate: number;
  activityScore: number;
  lastActive: Date;
  topChannels?: Array<{
    id: string;
    name: string;
    messageCount: number;
    userCount: number;
  }>;
  metrics: Record<string, GroupMetric>;
  isOnline: boolean;
  url?: string;
}

interface GroupStatsCardProps {
  groups: GroupData[];
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
  onViewDetails?: (groupId: string) => void;
  timeRange?: 'day' | 'week' | 'month';
  onTimeRangeChange?: (range: 'day' | 'week' | 'month') => void;
}

export function GroupStatsCard({
  groups = [],
  isLoading = false,
  onRefresh,
  onViewDetails,
  timeRange = 'week',
  onTimeRangeChange
}: GroupStatsCardProps) {
  const [activePlatform, setActivePlatform] = React.useState<Platform>('discord');
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Filter groups by platform
  const platformGroups = React.useMemo(() => {
    return groups.filter(group => group.platform === activePlatform);
  }, [groups, activePlatform]);

  // Get currently selected group
  const selectedGroup = React.useMemo(() => {
    if (!selectedGroupId && platformGroups.length > 0) {
      // Auto-select first group if none selected
      return platformGroups[0];
    }
    return platformGroups.find(group => group.id === selectedGroupId) || null;
  }, [platformGroups, selectedGroupId]);

  // Handle platform change
  const handlePlatformChange = (value: string) => {
    setActivePlatform(value as Platform);
    setSelectedGroupId(null); // Reset selected group when changing platforms
  };

  // Handle group selection
  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error("Failed to refresh group stats:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle time range change
  const handleTimeRangeChange = (range: 'day' | 'week' | 'month') => {
    onTimeRangeChange && onTimeRangeChange(range);
  };

  // Format trend indicator
  const formatTrend = (trend?: 'up' | 'down' | 'stable', changePercent?: number) => {
    if (!trend || !changePercent) return null;
    
    switch (trend) {
      case 'up':
        return (
          <span className="flex items-center text-emerald-500 gap-0.5">
            <ArrowUp className="h-3 w-3" />
            <span>{changePercent.toFixed(1)}%</span>
          </span>
        );
      case 'down':
        return (
          <span className="flex items-center text-rose-500 gap-0.5">
            <ArrowDown className="h-3 w-3" />
            <span>{Math.abs(changePercent).toFixed(1)}%</span>
          </span>
        );
      case 'stable':
        return (
          <span className="flex items-center text-muted-foreground gap-0.5">
            <span>~</span>
            <span>0%</span>
          </span>
        );
      default:
        return null;
    }
  };

  // Render group list item
  const renderGroupListItem = (group: GroupData) => {
    const isSelected = group.id === selectedGroup?.id;
    
    return (
      <div 
        key={group.id}
        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
          isSelected ? 'bg-muted' : 'hover:bg-muted/50'
        }`}
        onClick={() => handleGroupSelect(group.id)}
      >
        <Avatar className="h-9 w-9">
          {group.avatar ? (
            <AvatarImage src={group.avatar} alt={group.name} />
          ) : (
            <AvatarFallback>
              {group.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm truncate">{group.name}</h4>
            {isSelected && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {group.memberCount}
            </span>
            <span className="flex items-center gap-1">
              <MessagesSquare className="h-3 w-3" /> {group.messageCount}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Render no groups message
  const renderNoGroups = () => (
    <div className="text-center p-6">
      <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
      <h3 className="text-lg font-medium mb-1">No {activePlatform === 'discord' ? 'Discord Servers' : 'Telegram Groups'}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Connect your {activePlatform === 'discord' ? 'Discord' : 'Telegram'} bot to start monitoring groups.
      </p>
      <Button asChild>
        <a href="/dashboard/community/settings">
          Configure Bots
        </a>
      </Button>
    </div>
  );

  // Render loading state
  const renderLoadingState = () => (
    <div className="flex items-center justify-center py-12">
      <RefreshCw className="h-10 w-10 animate-spin text-muted-foreground" />
    </div>
  );

  // Render group details
  const renderGroupDetails = (group: GroupData) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            {group.avatar ? (
              <AvatarImage src={group.avatar} alt={group.name} />
            ) : (
              <AvatarFallback>
                {group.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          
          <div>
            <h3 className="font-semibold text-xl">{group.name}</h3>
            <p className="text-sm text-muted-foreground">
              Last active {formatDistanceToNow(group.lastActive, { addSuffix: true })}
            </p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onViewDetails?.(group.id)}
          className="gap-1"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span>Details</span>
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-muted/50 p-3 rounded-md">
          <p className="text-sm text-muted-foreground mb-1">Members</p>
          <div className="flex items-baseline justify-between">
            <h4 className="text-2xl font-medium">{group.memberCount}</h4>
            {formatTrend(group.metrics.members?.trend, group.metrics.members?.changePercent)}
          </div>
        </div>
        
        <div className="bg-muted/50 p-3 rounded-md">
          <p className="text-sm text-muted-foreground mb-1">Active Users</p>
          <div className="flex items-baseline justify-between">
            <h4 className="text-2xl font-medium">{group.activeUsers}</h4>
            {formatTrend(group.metrics.activeUsers?.trend, group.metrics.activeUsers?.changePercent)}
          </div>
        </div>
        
        <div className="bg-muted/50 p-3 rounded-md">
          <p className="text-sm text-muted-foreground mb-1">Messages</p>
          <div className="flex items-baseline justify-between">
            <h4 className="text-2xl font-medium">{group.messageCount}</h4>
            {formatTrend(group.metrics.messages?.trend, group.metrics.messages?.changePercent)}
          </div>
        </div>
        
        <div className="bg-muted/50 p-3 rounded-md">
          <p className="text-sm text-muted-foreground mb-1">Commands</p>
          <div className="flex items-baseline justify-between">
            <h4 className="text-2xl font-medium">{group.commandUsage}</h4>
            {formatTrend(group.metrics.commands?.trend, group.metrics.commands?.changePercent)}
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Engagement Metrics</h4>
        
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>Daily Active Users</span>
              <span className="font-medium">{(group.engagementRate * 100).toFixed(1)}%</span>
            </div>
            <Progress value={group.engagementRate * 100} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {Math.round(group.activeUsers)} out of {group.memberCount} members active
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>Growth Rate</span>
              <span className="font-medium">{(group.growthRate * 100).toFixed(1)}%</span>
            </div>
            <Progress value={(group.growthRate + 0.1) * 100} max={20} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {group.growthRate >= 0 ? 'Growing' : 'Shrinking'} by {Math.abs(Math.round(group.growthRate * group.memberCount))} members per {timeRange}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>Activity Score</span>
              <span className="font-medium">{Math.round(group.activityScore)}/100</span>
            </div>
            <Progress value={group.activityScore} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Based on message volume, reaction rate, and user engagement
            </p>
          </div>
        </div>
      </div>
      
      {group.topChannels && group.topChannels.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Top Channels</h4>
          
          <div className="space-y-2">
            {group.topChannels.map(channel => (
              <div key={channel.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span>{channel.name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{channel.messageCount} msgs</span>
                  <span className="text-muted-foreground">{channel.userCount} users</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Get platform icon and color
  const getPlatformBadge = (platform: Platform) => {
    return (
      <Badge 
        variant="outline" 
        className={`${platform === 'discord' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}
      >
        {platform === 'discord' ? 'Discord' : 'Telegram'}
      </Badge>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Community Groups</CardTitle>
          </div>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8" 
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>
          Monitor stats from your Discord and Telegram groups
        </CardDescription>
      </CardHeader>
      
      <div className="px-6 pb-2">
        <Tabs defaultValue="all" onValueChange={(value) => setActivePlatform(value as Platform)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="all" className="text-xs">
              All Groups
            </TabsTrigger>
            <TabsTrigger value="discord" className="text-xs">
              Discord
            </TabsTrigger>
            <TabsTrigger value="telegram" className="text-xs">
              Telegram
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <CardContent className="flex-grow overflow-hidden p-0 pt-2 px-6 pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center">
              <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground mt-2">Loading group stats...</p>
            </div>
          </div>
        ) : platformGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Users className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium">No Groups Connected</h3>
            <p className="text-sm text-muted-foreground max-w-md mt-1 mb-4">
              Connect your Discord servers or Telegram groups to monitor community activity
            </p>
            <Button variant="outline" className="gap-2" asChild>
              <a href="/dashboard/community/settings" className="flex items-center">
                <Users className="h-4 w-4" />
                <span>Connect Groups</span>
              </a>
            </Button>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-muted/50 rounded-lg p-3 flex flex-col">
                <span className="text-xs text-muted-foreground mb-1">Total Groups</span>
                <span className="text-2xl font-bold">{platformGroups.length}</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 flex flex-col">
                <span className="text-xs text-muted-foreground mb-1">Total Members</span>
                <span className="text-2xl font-bold">{platformGroups.reduce((acc, group) => acc + group.memberCount, 0).toLocaleString()}</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 flex flex-col">
                <span className="text-xs text-muted-foreground mb-1">Active Members</span>
                <span className="text-2xl font-bold">{platformGroups.reduce((acc, group) => acc + group.activeUsers, 0).toLocaleString()}</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 flex flex-col">
                <span className="text-xs text-muted-foreground mb-1">Avg. Engagement</span>
                <span className="text-2xl font-bold">{(platformGroups.reduce((acc, group) => acc + group.engagementRate, 0) / platformGroups.length * 100).toFixed(1)}%</span>
              </div>
            </div>
            
            {/* Group list */}
            <ScrollArea className="h-[calc(100%-96px)] pr-4">
              <div className="space-y-3">
                {platformGroups.map((group) => (
                  <div
                    key={group.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-3 bg-muted/30">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            {group.avatar ? (
                              <img src={group.avatar} alt={group.name} className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                              <Users className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ${group.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm">{group.name}</h3>
                            {getPlatformBadge(group.platform)}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Last active {formatTimeAgo(group.lastActive)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {group.url && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                  <a href={group.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Open group</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8"
                          onClick={() => onViewDetails && onViewDetails(group.id)}
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-3">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Members</span>
                          <span className="text-sm font-medium">{group.memberCount.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Active</span>
                          <span className="text-sm font-medium">{group.activeUsers.toLocaleString()} ({Math.round(group.activeUsers / group.memberCount * 100)}%)</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Messages Today</span>
                          <span className="text-sm font-medium">{group.messageCount.today.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Engagement</span>
                          <span className="font-medium">{(group.engagementRate * 100).toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={group.engagementRate * 100} 
                          className="h-1.5" 
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Messages this week: {group.messageCount.week.toLocaleString()}</span>
                          <span>This month: {group.messageCount.month.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
} 