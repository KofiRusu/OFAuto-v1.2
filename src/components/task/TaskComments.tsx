'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';
import { WebSocketEvents } from '@/server/websocket';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

interface TaskCommentsProps {
  taskId: string;
  taskTitle: string;
}

export const TaskComments: React.FC<TaskCommentsProps> = ({ taskId, taskTitle }) => {
  const [newComment, setNewComment] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { socket, isConnected, joinTask, leaveTask, startTyping, stopTyping, typingUsers } = useWebSocketContext();
  
  // Fetch comments
  const { data: comments = [], isLoading, error } = useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}/comments`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      return response.json() as Promise<Comment[]>;
    }
  });
  
  // Post comment mutation
  const mutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });
      
      if (!response.ok) {
        throw new Error('Failed to post comment');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
      toast({
        title: 'Comment added',
        description: 'Your comment was successfully added to the task.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to add comment',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      });
    }
  });
  
  // Join task room on mount
  useEffect(() => {
    joinTask(taskId);
    
    return () => {
      leaveTask(taskId);
    };
  }, [taskId, joinTask, leaveTask]);
  
  // Listen for new comments
  useEffect(() => {
    if (!socket) return;
    
    const handleNewComment = (comment: Comment) => {
      // Update comments
      queryClient.setQueryData(['task-comments', taskId], (old: Comment[] = []) => {
        // Check if comment already exists
        if (old.some(c => c.id === comment.id)) {
          return old;
        }
        
        return [...old, comment];
      });
    };
    
    socket.on(WebSocketEvents.TASK_COMMENT, handleNewComment);
    
    return () => {
      socket.off(WebSocketEvents.TASK_COMMENT, handleNewComment);
    };
  }, [socket, taskId, queryClient]);
  
  // Handle typing indicators
  const handleTypingStart = () => {
    if (!isTyping) {
      setIsTyping(true);
      startTyping(taskId);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator after 1.5 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping(taskId);
    }, 1500);
  };
  
  // Scroll to bottom when new comments are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);
  
  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value);
    handleTypingStart();
  };
  
  // Handle comment submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      stopTyping(taskId);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
    
    mutation.mutate(newComment);
  };
  
  // Filter typing users for this task
  const activeTypingUsers = Object.entries(typingUsers)
    .filter(([key]) => key.startsWith(`${taskId}-`))
    .map(([_, value]) => value);
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-xl">Comments for {taskTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto p-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Failed to load comments. Please try again.
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No comments yet. Be the first to add one!
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {comment.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{comment.user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(comment.createdAt)}
                      </span>
                    </div>
                    <div className="mt-1 text-sm">{comment.content}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
          
          {/* Typing indicators */}
          {activeTypingUsers.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground italic mt-2">
              <div className="flex space-x-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>.</span>
              </div>
              {activeTypingUsers.length === 1 ? (
                <span>{activeTypingUsers[0].userName} is typing</span>
              ) : (
                <span>Multiple people are typing</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex gap-2">
            <Textarea
              value={newComment}
              onChange={handleTextChange}
              placeholder="Write a comment..."
              className="flex-1 min-h-[60px]"
              disabled={mutation.isPending || !isConnected}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={mutation.isPending || !newComment.trim() || !isConnected}
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {!isConnected && (
            <p className="text-xs text-destructive mt-2">
              You are currently offline. Connect to post comments.
            </p>
          )}
        </form>
      </CardFooter>
    </Card>
  );
}; 