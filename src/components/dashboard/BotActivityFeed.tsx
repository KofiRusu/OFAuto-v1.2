import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  AlertCircle, 
  ArrowRight, 
  Bot, 
  Clock, 
  ExternalLink, 
  Filter, 
  MessagesSquare, 
  RefreshCw, 
  Settings, 
  Shield, 
  User, 
  Users,
  MessageSquare,
  UserPlus,
  UserMinus,
  Pin,
  Image as ImageIcon
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from 'date-fns';

// Platform type
type Platform = 'discord' | 'telegram';

// Activity types
type ActivityType = 
  | 'message' 
  | 'join' 
  | 'leave' 
  | 'command' 
  | 'notification' 
  | 'moderation' 
  | 'error' 
  | 'system'
  | 'reaction'
  | 'pin'
  | 'media';

// Common activity item interface
interface ActivityItem {
  id: string;
  platform: Platform;
  type: ActivityType;
  groupId: string;
  groupName: string;
  timestamp: Date;
  content?: string;
  username?: string;
  userAvatar?: string;
  command?: string;
  args?: string[];
  eventName?: string;
  targetUser?: string;
  reason?: string;
  error?: string;
  metadata?: Record<string, any>;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

// User info for the activity feed display
interface UserInfo {
  id: string;
  name: string;
  avatar?: string;
  platform: Platform;
  role?: string;
}

// Group info for filtering
interface GroupInfo {
  id: string;
  name: string;
  platform: Platform;
  avatar?: string;
  memberCount?: number;
}

interface BotActivityFeedProps {
  activities: ActivityItem[];
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
  onFilterChange?: (platform: Platform, groupIds: string[], types: ActivityType[]) => void;
  onViewDetails?: (activity: ActivityItem) => void;
  groups?: GroupInfo[];
}

export function BotActivityFeed({
  activities = [],
  isLoading = false,
  onRefresh,
  onFilterChange,
  onViewDetails,
  groups = [],
}: BotActivityFeedProps) {
  const [activePlatform, setActivePlatform] = React.useState<Platform>('discord');
  const [selectedGroups, setSelectedGroups] = React.useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = React.useState<ActivityType[]>([]);
  const [showFilters, setShowFilters] = React.useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  
  // Filter activities by platform and other filters
  const filteredActivities = React.useMemo(() => {
    return activities
      .filter(activity => activity.platform === activePlatform)
      .filter(activity => selectedGroups.length === 0 || selectedGroups.includes(activity.groupId))
      .filter(activity => selectedTypes.length === 0 || selectedTypes.includes(activity.type))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [activities, activePlatform, selectedGroups, selectedTypes]);

  // Get platform-specific groups
  const platformGroups = React.useMemo(() => {
    return groups.filter(group => group.platform === activePlatform);
  }, [groups, activePlatform]);

  // Handle platform change
  const handlePlatformChange = (value: string) => {
    setActivePlatform(value as Platform);
    setSelectedGroups([]);
    applyFilters(value as Platform, [], selectedTypes);
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error("Failed to refresh activity feed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle group filter change
  const handleGroupFilterChange = (groupId: string) => {
    let newSelectedGroups: string[];
    
    if (selectedGroups.includes(groupId)) {
      newSelectedGroups = selectedGroups.filter(id => id !== groupId);
    } else {
      newSelectedGroups = [...selectedGroups, groupId];
    }
    
    setSelectedGroups(newSelectedGroups);
    applyFilters(activePlatform, newSelectedGroups, selectedTypes);
  };

  // Handle activity type filter change
  const handleTypeFilterChange = (type: ActivityType) => {
    let newSelectedTypes: ActivityType[];
    
    if (selectedTypes.includes(type)) {
      newSelectedTypes = selectedTypes.filter(t => t !== type);
    } else {
      newSelectedTypes = [...selectedTypes, type];
    }
    
    setSelectedTypes(newSelectedTypes);
    applyFilters(activePlatform, selectedGroups, newSelectedTypes);
  };

  // Apply filters
  const applyFilters = (platform: Platform, groupIds: string[], types: ActivityType[]) => {
    onFilterChange && onFilterChange(platform, groupIds, types);
  };

  // Get icon for activity type
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'join':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'leave':
        return <UserMinus className="h-4 w-4 text-red-500" />;
      case 'command':
        return <Bot className="h-4 w-4 text-blue-500" />;
      case 'notification':
        return <MessagesSquare className="h-4 w-4" />;
      case 'moderation':
        return <Shield className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
      case 'reaction':
        return <MessageSquare className="h-4 w-4" />;
      case 'pin':
        return <Pin className="h-4 w-4 text-amber-500" />;
      case 'media':
        return <ImageIcon className="h-4 w-4 text-purple-500" />;
      default:
        return <MessagesSquare className="h-4 w-4" />;
    }
  };

  // Get badge for activity type
  const getActivityBadge = (type: ActivityType) => {
    switch (type) {
      case 'message':
        return <Badge variant="outline" className="gap-1"><MessagesSquare className="h-3 w-3" /> Message</Badge>;
      case 'join':
        return <Badge className="bg-green-500 hover:bg-green-600 gap-1"><Users className="h-3 w-3" /> Join</Badge>;
      case 'leave':
        return <Badge variant="outline" className="text-muted-foreground gap-1"><ArrowRight className="h-3 w-3" /> Leave</Badge>;
      case 'command':
        return <Badge className="bg-blue-500 hover:bg-blue-600 gap-1"><Bot className="h-3 w-3" /> Command</Badge>;
      case 'notification':
        return <Badge className="gap-1"><MessagesSquare className="h-3 w-3" /> Notification</Badge>;
      case 'moderation':
        return <Badge className="bg-purple-500 hover:bg-purple-600 gap-1"><Shield className="h-3 w-3" /> Moderation</Badge>;
      case 'error':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Error</Badge>;
      case 'system':
        return <Badge className="bg-slate-500 hover:bg-slate-600 gap-1"><Settings className="h-3 w-3" /> System</Badge>;
      case 'reaction':
        return <Badge variant="outline" className="gap-1"><MessageSquare className="h-3 w-3" /> Reaction</Badge>;
      case 'pin':
        return <Badge variant="outline" className="gap-1"><Pin className="h-3 w-3" /> Pin</Badge>;
      case 'media':
        return <Badge variant="outline" className="gap-1"><ImageIcon className="h-3 w-3" /> Media</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Get platform badge
  const getPlatformBadge = (platform: Platform) => {
    return (
      <Badge 
        variant="outline" 
        className={`text-xs ${platform === 'discord' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}
      >
        {platform === 'discord' ? 'Discord' : 'Telegram'}
      </Badge>
    );
  };

  // Get timestamp text
  const getTimeText = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    // Less than a minute
    if (diff < 60000) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    }
    
    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }
    
    // More than a day
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  };

  // Get action text based on activity type
  const getActionText = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'message':
        return 'sent a message';
      case 'join':
        return 'joined the group';
      case 'leave':
        return 'left the group';
      case 'command':
        return `used command: ${activity.command}`;
      case 'notification':
        return 'triggered a notification';
      case 'moderation':
        return `was ${activity.eventName} ${activity.reason ? `for ${activity.reason}` : ''}`;
      case 'error':
        return 'triggered an error';
      case 'reaction':
        return 'reacted to a message';
      case 'pin':
        return 'pinned a message';
      case 'media':
        return 'shared media';
      default:
        return 'performed an action';
    }
  };

  // Render activity item
  const renderActivityItem = (activity: ActivityItem) => {
    return (
      <div key={activity.id} className="py-3">
        <div className="flex gap-3">
          <Avatar className="h-9 w-9">
            {activity.userAvatar ? (
              <AvatarImage src={activity.userAvatar} alt={activity.username || 'User'} />
            ) : (
              <AvatarFallback>
                {activity.type === 'system' || activity.type === 'error' ? (
                  <Bot className="h-5 w-5" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </AvatarFallback>
            )}
          </Avatar>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {activity.username || 'System'}
                </span>
                {getActivityBadge(activity.type)}
              </div>
              <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                <Clock className="h-3 w-3" /> 
                <span>{formatDistanceToNow(activity.timestamp, { addSuffix: true })}</span>
              </div>
            </div>
            
            <div>
              {activity.type === 'message' && activity.content && (
                <p className="text-sm">{activity.content}</p>
              )}
              
              {activity.type === 'join' && (
                <p className="text-sm">
                  <span className="font-medium">{activity.username}</span> joined the group {activity.groupName}
                </p>
              )}
              
              {activity.type === 'leave' && (
                <p className="text-sm">
                  <span className="font-medium">{activity.username}</span> left the group {activity.groupName}
                </p>
              )}
              
              {activity.type === 'command' && (
                <p className="text-sm">
                  <code className="px-1 py-0.5 bg-muted rounded text-xs">
                    {activity.command} {activity.args?.join(' ')}
                  </code>
                </p>
              )}
              
              {activity.type === 'notification' && (
                <p className="text-sm">
                  {activity.eventName}: {activity.content}
                </p>
              )}
              
              {activity.type === 'moderation' && (
                <p className="text-sm">
                  <span className="font-medium">{activity.targetUser}</span> was {activity.eventName} 
                  {activity.reason ? <span> for {activity.reason}</span> : null}
                </p>
              )}
              
              {activity.type === 'error' && (
                <p className="text-sm text-destructive">
                  {activity.error || 'An error occurred'}
                </p>
              )}
              
              {activity.type === 'system' && (
                <p className="text-sm text-muted-foreground">
                  {activity.content || 'System activity'}
                </p>
              )}
            </div>
            
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">
                {activity.groupName}
              </span>
              
              {onViewDetails && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => onViewDetails(activity)}
                >
                  Details
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <MessagesSquare className="h-12 w-12 text-muted-foreground mb-3" />
      <h3 className="font-medium mb-1">No Activity Yet</h3>
      <p className="text-sm text-muted-foreground mb-4">
        There's no recent activity for {activePlatform === 'discord' ? 'Discord' : 'Telegram'} 
        {selectedGroups.length > 0 ? ' in the selected groups' : ''} 
        {selectedTypes.length > 0 ? ' for the selected activity types' : ''}
      </p>
      <Button
        onClick={handleRefresh}
        disabled={isRefreshing || !onRefresh}
        variant="outline"
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        Refresh Activity
      </Button>
    </div>
  );

  // Render loading state
  const renderLoadingState = () => (
    <div className="flex items-center justify-center py-12">
      <RefreshCw className="h-10 w-10 animate-spin text-muted-foreground" />
    </div>
  );

  // Render filters
  const renderFilters = () => (
    <div className="p-3 space-y-4 border rounded-md mb-4">
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Filter by Group</h4>
        <div className="flex flex-wrap gap-2">
          {platformGroups.map((group) => (
            <Badge
              key={group.id}
              variant={selectedGroups.includes(group.id) ? "default" : "outline"}
              className="cursor-pointer hover:bg-secondary"
              onClick={() => handleGroupFilterChange(group.id)}
            >
              {group.name}
            </Badge>
          ))}
          {platformGroups.length === 0 && (
            <p className="text-xs text-muted-foreground">No groups available</p>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Filter by Type</h4>
        <div className="flex flex-wrap gap-2">
          {(['message', 'command', 'join', 'leave', 'notification', 'moderation', 'error', 'system', 'reaction', 'pin', 'media'] as ActivityType[]).map((type) => (
            <Badge
              key={type}
              variant={selectedTypes.includes(type) ? "default" : "outline"}
              className="cursor-pointer hover:bg-secondary"
              onClick={() => handleTypeFilterChange(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Badge>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedGroups([]);
            setSelectedTypes([]);
            applyFilters(activePlatform, [], []);
          }}
          className="text-xs h-7"
        >
          Clear Filters
        </Button>
        <Button
          variant="ghost" 
          size="sm"
          onClick={() => setShowFilters(false)}
          className="text-xs h-7"
        >
          Close
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessagesSquare className="h-5 w-5" />
            <CardTitle>Activity Feed</CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Filter activity</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`h-8 w-8 ${isRefreshing ? 'animate-spin' : ''}`}
                    onClick={handleRefresh}
                    disabled={isRefreshing || !onRefresh}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Refresh feed</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <CardDescription>
          Recent messages and events from your bots
        </CardDescription>
      </CardHeader>
      
      <div className="px-6">
        <Tabs defaultValue="discord" onValueChange={handlePlatformChange}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="discord" className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.393-.44.883-.608 1.27-.184-.028-3.65-.028-3.83 0-.169-.388-.4-.877-.61-1.27a.077.077 0 0 0-.079-.036c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055c1.903 1.392 3.754 2.23 5.563 2.79a.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106c-.605-.229-1.19-.504-1.746-.82a.077.077 0 0 1-.008-.128c.118-.088.236-.18.348-.272a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.112.093.23.184.347.272a.077.077 0 0 1-.006.127 9.49 9.49 0 0 1-1.747.82.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028c1.818-.56 3.67-1.399 5.573-2.79a.077.077 0 0 0 .031-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
              </svg>
              Discord
            </TabsTrigger>
            <TabsTrigger value="telegram" className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-2.88-1.92-2.88-1.92-2.88-1.92.85-.5 1.36-1.8 1.36-1.8.7-1.55-1.32.13-1.32.13l-4.3 2.63c-.65.38-1.3-.13-1.7-.58 2.46-1.88 4.9-3.75 7.38-5.63.6-.5 1.8-.94 2.53-.42.18.17.29.39.32.65z" />
              </svg>
              Telegram
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <CardContent className="mt-4">
        {showFilters && renderFilters()}
        
        {isLoading ? (
          renderLoadingState()
        ) : filteredActivities.length === 0 ? (
          renderEmptyState()
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-0">
              {filteredActivities.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  {renderActivityItem(activity)}
                  {index < filteredActivities.length - 1 && (
                    <Separator />
                  )}
                </React.Fragment>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button variant="outline" className="w-full gap-2" asChild>
          <a href="/dashboard/community/messages">
            <ExternalLink className="h-4 w-4" />
            View All Messages and Events
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
} 