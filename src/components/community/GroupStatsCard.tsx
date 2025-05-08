'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, MessageSquare, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, BarChart3, RefreshCw, UserPlus, UserMinus, Clock } from 'lucide-react';

export enum GroupPlatform {
  DISCORD = 'discord',
  TELEGRAM = 'telegram',
}

export enum TimeRange {
  DAY = '24h',
  WEEK = '7d',
  MONTH = '30d',
  QUARTER = '90d',
}

export interface GroupStats {
  id: string;
  name: string;
  platform: GroupPlatform;
  icon?: string;
  memberCount: number;
  memberChange: {
    count: number;
    percentage: number;
  };
  messageCount: number;
  messageChange: {
    count: number;
    percentage: number;
  };
  activeMembers: number;
  activeMembersChange: {
    count: number;
    percentage: number;
  };
  joinLeaveRatio: number;
  joinLeaveRatioChange: number;
  topUsers: {
    id: string;
    name: string;
    avatar?: string;
    messageCount: number;
  }[];
  activityData: {
    date: string;
    messages: number;
    members: number;
    active: number;
  }[];
}

export interface GroupStatsCardProps {
  groups: GroupStats[];
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
  onTimeRangeChange?: (range: TimeRange) => void;
  onGroupChange?: (groupId: string) => void;
  className?: string;
}

export function GroupStatsCard({
  groups = [],
  isLoading = false,
  onRefresh,
  onTimeRangeChange,
  onGroupChange,
  className,
}: GroupStatsCardProps) {
  const [activeGroup, setActiveGroup] = React.useState<GroupStats | null>(groups[0] || null);
  const [timeRange, setTimeRange] = React.useState<TimeRange>(TimeRange.WEEK);
  const [chartMetric, setChartMetric] = React.useState<'messages' | 'members' | 'active'>('messages');
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  
  // Update active group when groups prop changes
  React.useEffect(() => {
    if (groups.length > 0) {
      const currentActiveGroup = activeGroup ? groups.find(g => g.id === activeGroup.id) : null;
      setActiveGroup(currentActiveGroup || groups[0]);
    } else {
      setActiveGroup(null);
    }
  }, [groups, activeGroup]);
  
  // Handle group change
  const handleGroupChange = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setActiveGroup(group);
      onGroupChange?.(groupId);
    }
  };
  
  // Handle time range change
  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    onTimeRangeChange?.(range);
  };
  
  // Handle refresh
  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    try {
      setIsRefreshing(true);
      await onRefresh();
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Format number with K/M suffix
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md p-3 shadow-sm">
          <p className="font-medium text-sm">{label}</p>
          <p className="text-sm text-primary">
            {chartMetric === 'messages' ? 'Messages: ' : 
             chartMetric === 'members' ? 'Members: ' : 
             'Active Users: '}
            <span className="font-medium">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Render loading skeleton
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="h-6 w-40 bg-muted animate-pulse rounded mb-1" />
          <div className="h-4 w-60 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-10 w-full bg-muted animate-pulse rounded mb-6" />
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="h-24 bg-muted animate-pulse rounded" />
            <div className="h-24 bg-muted animate-pulse rounded" />
            <div className="h-24 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-[200px] bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }
  
  // If no groups
  if (groups.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Group Statistics
          </CardTitle>
          <CardDescription>
            Track metrics and performance for your community groups
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No community groups found</p>
          <p className="text-sm text-muted-foreground/80 max-w-md mt-1 mb-6">
            Add and configure community bots to start tracking group statistics
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
            <BarChart3 className="h-5 w-5" />
            Group Statistics
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
          Track metrics and performance for your community groups
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-5">
        {/* Group Selector */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <Select value={activeGroup?.id} onValueChange={handleGroupChange}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue placeholder="Select a group" />
            </SelectTrigger>
            <SelectContent>
              {groups.map(group => (
                <SelectItem key={group.id} value={group.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={group.icon} alt={group.name} />
                      <AvatarFallback className="bg-primary/10 text-xs">
                        {group.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{group.name}</span>
                    <Badge 
                      variant={group.platform === GroupPlatform.DISCORD ? 'secondary' : 'default'} 
                      className="ml-2 capitalize text-xs"
                    >
                      {group.platform}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={(value: TimeRange) => handleTimeRangeChange(value)}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TimeRange.DAY}>Last 24 Hours</SelectItem>
              <SelectItem value={TimeRange.WEEK}>Last 7 Days</SelectItem>
              <SelectItem value={TimeRange.MONTH}>Last 30 Days</SelectItem>
              <SelectItem value={TimeRange.QUARTER}>Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {activeGroup && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Members */}
              <div className="bg-card border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Members</p>
                    <h3 className="text-2xl font-semibold mt-1">
                      {formatNumber(activeGroup.memberCount)}
                    </h3>
                  </div>
                  <div className={`p-2 rounded-full ${activeGroup.memberChange.percentage >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <Users className={`h-5 w-5 ${activeGroup.memberChange.percentage >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  </div>
                </div>
                
                <div className="flex items-center gap-1 text-sm">
                  {activeGroup.memberChange.percentage >= 0 ? (
                    <>
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                      <span className="text-green-500 font-medium">
                        {activeGroup.memberChange.percentage.toFixed(1)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                      <span className="text-red-500 font-medium">
                        {Math.abs(activeGroup.memberChange.percentage).toFixed(1)}%
                      </span>
                    </>
                  )}
                  <span className="text-muted-foreground ml-1">{timeRange}</span>
                </div>
              </div>
              
              {/* Messages */}
              <div className="bg-card border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Messages</p>
                    <h3 className="text-2xl font-semibold mt-1">
                      {formatNumber(activeGroup.messageCount)}
                    </h3>
                  </div>
                  <div className={`p-2 rounded-full ${activeGroup.messageChange.percentage >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <MessageSquare className={`h-5 w-5 ${activeGroup.messageChange.percentage >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  </div>
                </div>
                
                <div className="flex items-center gap-1 text-sm">
                  {activeGroup.messageChange.percentage >= 0 ? (
                    <>
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                      <span className="text-green-500 font-medium">
                        {activeGroup.messageChange.percentage.toFixed(1)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                      <span className="text-red-500 font-medium">
                        {Math.abs(activeGroup.messageChange.percentage).toFixed(1)}%
                      </span>
                    </>
                  )}
                  <span className="text-muted-foreground ml-1">{timeRange}</span>
                </div>
              </div>
              
              {/* Active Members */}
              <div className="bg-card border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Members</p>
                    <h3 className="text-2xl font-semibold mt-1">
                      {formatNumber(activeGroup.activeMembers)}
                    </h3>
                  </div>
                  <div className={`p-2 rounded-full ${activeGroup.activeMembersChange.percentage >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <UserPlus className={`h-5 w-5 ${activeGroup.activeMembersChange.percentage >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  </div>
                </div>
                
                <div className="flex items-center gap-1 text-sm">
                  {activeGroup.activeMembersChange.percentage >= 0 ? (
                    <>
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                      <span className="text-green-500 font-medium">
                        {activeGroup.activeMembersChange.percentage.toFixed(1)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                      <span className="text-red-500 font-medium">
                        {Math.abs(activeGroup.activeMembersChange.percentage).toFixed(1)}%
                      </span>
                    </>
                  )}
                  <span className="text-muted-foreground ml-1">{timeRange}</span>
                </div>
              </div>
            </div>
            
            {/* Activity Graph */}
            <div className="pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium">Activity Trends</h3>
                <div className="flex gap-2">
                  <Button 
                    variant={chartMetric === 'messages' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setChartMetric('messages')}
                    className="h-8 text-xs px-3"
                  >
                    Messages
                  </Button>
                  <Button 
                    variant={chartMetric === 'members' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setChartMetric('members')}
                    className="h-8 text-xs px-3"
                  >
                    Members
                  </Button>
                  <Button 
                    variant={chartMetric === 'active' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setChartMetric('active')}
                    className="h-8 text-xs px-3"
                  >
                    Active Users
                  </Button>
                </div>
              </div>
              
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={activeGroup.activityData}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey={chartMetric}
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Top Contributors */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-3">Top Contributors</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeGroup.topUsers.slice(0, 4).map((user, index) => (
                  <div key={user.id} className="flex items-center p-2 border rounded-md">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span 
                          className="absolute -top-1 -right-1 bg-primary text-primary-foreground w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold"
                        >
                          {index + 1}
                        </span>
                      </div>
                      <div className="truncate">
                        <p className="font-medium truncate">{user.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {formatNumber(user.messageCount)} messages
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 