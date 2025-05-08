"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@clerk/nextjs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NotificationType } from "@/lib/schemas/notifications";
import { formatDistanceToNow } from "date-fns";
import { Spinner } from "@/components/spinner";
import { Bell, Check, CheckCheck, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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

export default function NotificationsPage() {
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [limit] = useState(10);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  
  // Determine filter parameters based on active tab
  const filterParams = {
    limit,
    cursor,
    filterUnread: activeTab === "unread" ? true : undefined,
    type: typeFilter as NotificationType | undefined,
  };
  
  // Fetch notifications
  const { data, isLoading, isFetching } = trpc.notifications.getNotifications.useQuery(
    filterParams,
    {
      enabled: !!userId,
      refetchOnWindowFocus: true,
    }
  );
  
  // Mark notifications as read
  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh
      utils.notifications.getNotifications.invalidate();
      utils.notifications.getUnreadCount.invalidate();
    },
  });
  
  // Mark all as read
  const markAllAsRead = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh
      utils.notifications.getNotifications.invalidate();
      utils.notifications.getUnreadCount.invalidate();
    },
  });
  
  const utils = trpc.useContext();
  
  // Handle marking a notification as read
  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate({ ids: [id] });
  };
  
  // Handle marking all notifications as read
  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate({});
  };
  
  // Handle changing the notification type filter
  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value === "all" ? undefined : value);
    setCursor(undefined); // Reset pagination when changing filters
  };
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as "all" | "unread");
    setCursor(undefined); // Reset pagination when changing tabs
  };
  
  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            View and manage your notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isLoading || !data?.notifications?.length}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-[300px]">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={typeFilter || "all"} onValueChange={handleTypeFilterChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {Object.values(NotificationType.enum).map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Spinner size="lg" />
        </div>
      ) : data?.notifications && data.notifications.length > 0 ? (
        <div className="space-y-4">
          {data.notifications.map((notification) => (
            <Card key={notification.id} className={notification.readAt ? "opacity-75" : ""}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                    <CardTitle>{notification.title}</CardTitle>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
                <CardDescription className="text-xs uppercase">
                  {notification.type.replace(/_/g, " ")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>{notification.message}</p>
              </CardContent>
              {!notification.readAt && (
                <CardFooter className="pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    onClick={() => handleMarkAsRead(notification.id)}
                    disabled={markAsRead.isLoading}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Mark as read
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
          
          {/* Pagination */}
          {(data.nextCursor || cursor) && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      // For simplicity, just reset to first page
                      // In a real app, you'd maintain previous cursors
                      setCursor(undefined);
                    }}
                    disabled={!cursor}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (data.nextCursor) {
                        setCursor(data.nextCursor);
                      }
                    }}
                    disabled={!data.nextCursor || isFetching}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40">
            <Bell className="w-8 h-8 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No notifications found</p>
            <p className="text-sm text-muted-foreground">
              {activeTab === "all"
                ? "You don't have any notifications yet"
                : "You don't have any unread notifications"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 