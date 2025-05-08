"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc/client";
import { formatDistanceToNow } from "date-fns";
import { Spinner } from "@/components/spinner";
import { NotificationType } from "@/lib/schemas/notifications";

/**
 * Icons for different notification types
 */
const getNotificationIcon = (type: string) => {
  switch (type) {
    case NotificationType.enum.PERFORMANCE_REPORT:
      return "📊";
    case NotificationType.enum.PLATFORM_ACCESS_CHANGED:
      return "🔑";
    case NotificationType.enum.NEW_POST_SCHEDULED:
      return "📅";
    case NotificationType.enum.POST_PUBLISHED:
      return "📣";
    case NotificationType.enum.ACTIVITY_UPDATE:
      return "🔔";
    case NotificationType.enum.MANAGER_MESSAGE:
      return "💬";
    case NotificationType.enum.SYSTEM_ALERT:
      return "⚠️";
    default:
      return "📌";
  }
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  
  // Fetch unread notification count
  const { data: unreadData, isLoading: isLoadingCount } = trpc.notifications.getUnreadCount.useQuery(
    undefined,
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );
  
  // Fetch notifications when popover is opened
  const { data, isLoading } = trpc.notifications.getNotifications.useQuery(
    { limit: 5, filterUnread: true },
    {
      enabled: open,
      refetchOnWindowFocus: true,
    }
  );
  
  // Mark notifications as read
  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh counts
      utils.notifications.getUnreadCount.invalidate();
      utils.notifications.getNotifications.invalidate();
    }
  });
  
  const utils = trpc.useContext();
  
  // Mark a single notification as read
  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate({ ids: [id] });
  };
  
  // Mark all notifications as read
  const handleMarkAllAsRead = () => {
    if (data?.notifications && data.notifications.length > 0) {
      const ids = data.notifications.map(n => n.id);
      markAsRead.mutate({ ids });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {!isLoadingCount && unreadData?.count && unreadData.count > 0 ? (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full p-0"
            >
              {unreadData.count > 9 ? '9+' : unreadData.count}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {!isLoading && data?.notifications && data.notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAsRead.isLoading}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex justify-center items-center h-20">
              <Spinner size="md" />
            </div>
          ) : data?.notifications && data.notifications.length > 0 ? (
            <div className="divide-y">
              {data.notifications.map((notification) => (
                <div key={notification.id} className="p-4 hover:bg-muted/50">
                  <div className="flex items-start gap-3">
                    <div className="text-xl">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          Mark as read
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-20 p-4">
              <p className="text-muted-foreground">No unread notifications</p>
            </div>
          )}
        </ScrollArea>
        <div className="p-4 border-t">
          <Link
            href="/dashboard/notifications"
            className="block w-full text-center text-sm text-primary hover:underline"
            onClick={() => setOpen(false)}
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
} 