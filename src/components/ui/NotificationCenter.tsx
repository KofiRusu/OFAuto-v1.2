'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  ChevronRight,
  Filter,
  X,
  Bot,
  Calendar,
  MessageSquare,
  DollarSign,
  AlertCircle,
  Clock,
  ExternalLink,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Notification types
type NotificationType = 'system' | 'activity' | 'alert';

// Notification model
interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  type: NotificationType;
  read: boolean;
  action?: {
    text: string;
    url: string;
  };
  icon?: React.ReactNode;
  source?: string;
}

// Mock notifications data - in a real app this would come from an API
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Scheduled Post Published',
    message: 'Your post has been successfully published to Instagram and Twitter',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    type: 'activity',
    read: false,
    action: {
      text: 'View Analytics',
      url: '/dashboard/insights'
    },
    icon: <Calendar className="h-5 w-5" />,
    source: 'Scheduler'
  },
  {
    id: '2',
    title: 'New Subscribers',
    message: 'You gained 5 new subscribers on OnlyFans in the last 24 hours',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    type: 'activity',
    read: false,
    action: {
      text: 'View Audience',
      url: '/dashboard/clients'
    },
    icon: <DollarSign className="h-5 w-5" />,
    source: 'OnlyFans'
  },
  {
    id: '3',
    title: 'Automation Completed',
    message: 'Your message sequence to inactive followers has completed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    type: 'activity',
    read: true,
    action: {
      text: 'View Results',
      url: '/dashboard/automation'
    },
    icon: <Bot className="h-5 w-5" />,
    source: 'Automation'
  },
  {
    id: '4',
    title: 'Instagram Token Expiring',
    message: 'Your Instagram API token will expire in 3 days. Please renew it to avoid service interruption.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    type: 'alert',
    read: false,
    action: {
      text: 'Renew Token',
      url: '/dashboard/credentials?platform=instagram'
    },
    icon: <AlertCircle className="h-5 w-5" />,
    source: 'System'
  },
  {
    id: '5',
    title: 'New AI Strategy Available',
    message: 'We\'ve generated a new content strategy based on your recent performance.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    type: 'system',
    read: true,
    action: {
      text: 'View Strategy',
      url: '/dashboard/strategies'
    },
    icon: <Bot className="h-5 w-5" />,
    source: 'AI Assistant'
  },
  {
    id: '6',
    title: 'Weekly Report Available',
    message: 'Your weekly performance report is now available to view',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    type: 'system',
    read: true,
    action: {
      text: 'View Report',
      url: '/dashboard/insights?report=weekly'
    },
    icon: <BarChart className="h-5 w-5" />,
    source: 'Analytics'
  }
];

// Format timestamp as relative time
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString();
};

// React component for notification center
export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Count unread notifications
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Filter notifications based on active tab and unread filter
  const filteredNotifications = notifications.filter(notification => {
    // Filter by tab
    if (activeTab !== 'all' && notification.type !== activeTab) {
      return false;
    }

    // Filter by read status
    if (showUnreadOnly && notification.read) {
      return false;
    }

    return true;
  });

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <div className="text-sm font-medium">Notifications</div>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              aria-label={showUnreadOnly ? "Show all" : "Show unread only"}
            >
              <Eye className={cn(
                "h-4 w-4",
                showUnreadOnly && "text-primary"
              )} />
            </Button>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-xs" 
                onClick={markAllAsRead}
              >
                <CheckCheck className="mr-1 h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger 
              value="all" 
              className="flex-1 rounded-none border-b-2 border-transparent px-3 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="flex-1 rounded-none border-b-2 border-transparent px-3 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Activity
            </TabsTrigger>
            <TabsTrigger 
              value="alert" 
              className="flex-1 rounded-none border-b-2 border-transparent px-3 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Alerts
            </TabsTrigger>
            <TabsTrigger 
              value="system" 
              className="flex-1 rounded-none border-b-2 border-transparent px-3 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              System
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[350px] pb-2">
            <div className="p-0">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <NotificationItem 
                    key={notification.id} 
                    notification={notification} 
                    onRead={() => markAsRead(notification.id)}
                    onOpenChange={setOpen}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium">No notifications</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {showUnreadOnly 
                      ? "You've read all your notifications" 
                      : activeTab === 'all' 
                        ? "You don't have any notifications yet" 
                        : `You don't have any ${activeTab} notifications`
                    }
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </Tabs>
        
        <div className="border-t p-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-center text-xs"
            onClick={() => {
              window.location.href = '/dashboard/notifications';
              setOpen(false);
            }}
          >
            View All Notifications
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onRead: () => void;
  onOpenChange: (open: boolean) => void;
}

function NotificationItem({ notification, onRead, onOpenChange }: NotificationItemProps) {
  // Color and icon mapping for notification types
  const getTypeStyles = (type: NotificationType) => {
    switch (type) {
      case 'alert':
        return {
          background: "bg-rose-50 dark:bg-rose-950/30",
          color: "text-rose-600 dark:text-rose-400",
          iconColor: "text-rose-500"
        };
      case 'activity':
        return {
          background: "bg-emerald-50 dark:bg-emerald-950/30",
          color: "text-emerald-600 dark:text-emerald-400",
          iconColor: "text-emerald-500"
        };
      case 'system':
        return {
          background: "bg-blue-50 dark:bg-blue-950/30",
          color: "text-blue-600 dark:text-blue-400",
          iconColor: "text-blue-500"
        };
      default:
        return {
          background: "bg-slate-50 dark:bg-slate-900/50",
          color: "text-slate-600 dark:text-slate-400",
          iconColor: "text-slate-500"
        };
    }
  };
  
  const typeStyles = getTypeStyles(notification.type);
  
  const handleClick = () => {
    onRead();
    if (notification.action) {
      window.location.href = notification.action.url;
      onOpenChange(false);
    }
  };
  
  return (
    <div 
      className={cn(
        "flex items-start gap-3 px-4 py-3 border-b last:border-0 transition-colors cursor-pointer hover:bg-muted/50",
        !notification.read && "bg-primary/5"
      )}
      onClick={handleClick}
    >
      <div className={cn(
        "mt-0.5 flex-shrink-0 rounded-full p-1.5", 
        typeStyles.background
      )}>
        {notification.icon || (
          notification.type === 'alert' ? <AlertCircle className={cn("h-4 w-4", typeStyles.iconColor)} /> :
          notification.type === 'activity' ? <Clock className={cn("h-4 w-4", typeStyles.iconColor)} /> :
          <Bell className={cn("h-4 w-4", typeStyles.iconColor)} />
        )}
      </div>
      
      <div className="flex-1 space-y-1 overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            "text-sm font-medium",
            !notification.read && "font-semibold"
          )}>
            {notification.title}
          </p>
          <span className="text-[10px] tabular-nums text-muted-foreground pt-1 whitespace-nowrap">
            {formatRelativeTime(notification.timestamp)}
          </span>
        </div>
        
        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        
        <div className="flex items-center justify-between mt-1.5">
          {notification.source && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground">
              {notification.source}
            </span>
          )}
          
          {notification.action && (
            <span className="text-xs font-medium text-primary flex items-center">
              {notification.action.text}
              <ExternalLink className="ml-0.5 h-3 w-3" />
            </span>
          )}
        </div>
      </div>
      
      {!notification.read && (
        <span className="flex-shrink-0 rounded-full h-2 w-2 bg-primary mt-1.5" />
      )}
    </div>
  );
}

// Missing BarChart icon
function BarChart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <line x1="12" y1="20" x2="12" y2="10"></line>
      <line x1="18" y1="20" x2="18" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="16"></line>
    </svg>
  );
} 