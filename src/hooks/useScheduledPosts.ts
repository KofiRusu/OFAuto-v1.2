import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';
import { useToast } from '@/components/ui/use-toast';
import { WebSocketEvents } from '@/server/websocket';

export interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  platforms: string[];
  scheduledFor: string;
  status: string;
  clientId: string;
  userId: string;
  mediaUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledPostFormData {
  title: string;
  content: string;
  platforms: string[];
  scheduledFor: string;
  status?: string;
  clientId: string;
  userId: string;
  mediaUrls?: string[];
}

interface ScheduledPostFilters {
  clientId?: string;
  platform?: string;
  fromDate?: string;
  status?: string;
}

export function useScheduledPosts(filters: ScheduledPostFilters = {}) {
  const { socket, isConnected } = useWebSocketContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notification, setNotification] = useState<{
    postId: string;
    status: string;
    title: string;
  } | null>(null);
  
  // Query key that includes filters
  const postsQueryKey = ['scheduledPosts', filters];
  
  // Fetch posts with filters
  const {
    data: posts = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: postsQueryKey,
    queryFn: async () => {
      // Build query string from filters
      const params = new URLSearchParams();
      if (filters.clientId) params.append('clientId', filters.clientId);
      if (filters.platform) params.append('platform', filters.platform);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.status) params.append('status', filters.status);
      
      const response = await fetch(`/api/scheduled-posts?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch scheduled posts');
      }
      
      return response.json() as Promise<ScheduledPost[]>;
    }
  });
  
  // Create post mutation
  const createPost = useMutation({
    mutationFn: async (postData: ScheduledPostFormData) => {
      const response = await fetch('/api/scheduled-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create scheduled post');
      }
      
      return response.json() as Promise<ScheduledPost>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledPosts'] });
      toast({
        title: 'Post Scheduled',
        description: 'Your post has been scheduled successfully.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to schedule post',
        variant: 'destructive'
      });
    }
  });
  
  // Update post mutation
  const updatePost = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ScheduledPostFormData> }) => {
      const response = await fetch(`/api/scheduled-posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update scheduled post');
      }
      
      return response.json() as Promise<ScheduledPost>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledPosts'] });
      toast({
        title: 'Post Updated',
        description: 'Your post has been updated successfully.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update post',
        variant: 'destructive'
      });
    }
  });
  
  // Delete post mutation
  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/scheduled-posts/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete scheduled post');
      }
      
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['scheduledPosts'] });
      
      // Update local cache by removing the deleted post
      queryClient.setQueryData(postsQueryKey, (oldData: ScheduledPost[] = []) => {
        return oldData.filter(post => post.id !== id);
      });
      
      toast({
        title: 'Post Deleted',
        description: 'Your scheduled post has been deleted.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete post',
        variant: 'destructive'
      });
    }
  });
  
  // Subscribe to post status updates via WebSocket
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    const handlePostStatusUpdate = (data: {
      postId: string;
      status: string;
      title: string;
    }) => {
      // Show notification
      setNotification(data);
      
      // Update post in cache
      queryClient.setQueryData(postsQueryKey, (oldData: ScheduledPost[] = []) => {
        return oldData.map(post => 
          post.id === data.postId 
            ? { ...post, status: data.status } 
            : post
        );
      });
      
      // Show toast
      const statusMessages: Record<string, string> = {
        published: 'has been published successfully',
        failed: 'failed to publish',
        scheduled: 'has been scheduled',
        processing: 'is being processed'
      };
      
      const message = statusMessages[data.status] || `status changed to ${data.status}`;
      
      toast({
        title: 'Post Status Update',
        description: `"${data.title}" ${message}`,
        variant: data.status === 'failed' ? 'destructive' : 'default'
      });
    };
    
    socket.on(WebSocketEvents.SCHEDULED_POST_UPDATE, handlePostStatusUpdate);
    
    return () => {
      socket.off(WebSocketEvents.SCHEDULED_POST_UPDATE, handlePostStatusUpdate);
    };
  }, [socket, isConnected, queryClient, toast, postsQueryKey]);
  
  // Dismiss notification
  const dismissNotification = useCallback(() => {
    setNotification(null);
  }, []);
  
  return {
    posts,
    isLoading,
    error,
    refetch,
    createPost,
    updatePost,
    deletePost,
    notification,
    dismissNotification
  };
} 