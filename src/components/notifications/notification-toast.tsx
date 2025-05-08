"use client";

import { useEffect, useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { Toast, ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { trpc } from "@/lib/trpc/client";
import pusherClient from "@/lib/pusher/client";
import { useAuth } from "@clerk/nextjs";
import { Notification } from "@prisma/client";

export function NotificationToast() {
  const { userId } = useAuth();
  const { toast } = useToast();
  const utils = trpc.useContext();
  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      // Invalidate notifications queries to refresh counts/lists
      utils.notifications.getUnreadCount.invalidate();
      utils.notifications.getNotifications.invalidate();
    },
  });

  useEffect(() => {
    if (!userId) return;

    // Subscribe to user's private channel for notifications
    const channel = pusherClient.subscribe(`private-user-${userId}`);

    // Handle new notifications
    channel.bind('notification', (notification: Notification) => {
      // Show toast notification
      toast({
        title: notification.title,
        description: notification.message,
        action: (
          <ToastAction 
            altText="Mark as read" 
            onClick={() => markAsRead.mutate({ ids: [notification.id] })}
          >
            <Check className="h-4 w-4" />
          </ToastAction>
        ),
        icon: <Bell className="h-4 w-4" />,
        duration: 5000,
      });
    });

    // Cleanup on unmount
    return () => {
      pusherClient.unsubscribe(`private-user-${userId}`);
    };
  }, [userId, toast, markAsRead, utils]);

  return null;
} 