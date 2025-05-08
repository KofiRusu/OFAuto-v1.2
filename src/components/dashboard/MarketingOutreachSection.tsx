'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  Calendar,
  Clock,
  MessageSquare,
  Plus,
  Megaphone,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Trash2,
  ShoppingBag,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
} from "lucide-react";
import { formatDistanceToNow, format } from 'date-fns';
import { trpc } from "@/lib/trpc/client";
import { logger } from '@/lib/logger';
import PostSchedulerModal from './PostSchedulerModal';
import AutoDMSetupModal from './AutoDMSetupModal';

// Define types
interface Task {
  id: string;
  platformType: string;
  content: string;
  mediaUrl?: string;
  scheduledAt?: Date;
  status: 'scheduled' | 'posted' | 'failed';
  createdAt: Date;
  trigger?: string;
  isRecurring?: boolean;
}

interface MarketingOutreachSectionProps {
  clientId: string;
}

// Get platform icon based on platform type
const getPlatformIcon = (platformType: string) => {
  switch (platformType) {
    case 'twitter':
      return <TwitterIcon className="h-4 w-4 text-blue-500" />;
    case 'instagram':
      return <InstagramIcon className="h-4 w-4 text-purple-600" />;
    case 'gumroad':
      return <ShoppingBag className="h-4 w-4 text-pink-600" />;
    default:
      return null;
  }
};

// Get status badge
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'scheduled':
      return <Badge variant="outline" className="bg-gray-100 text-gray-800"><Clock className="h-3 w-3 mr-1" /> Scheduled</Badge>;
    case 'posted':
      return <Badge variant="success" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Posted</Badge>;
    case 'failed':
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
    default:
      return null;
  }
};

export default function MarketingOutreachSection({ clientId }: MarketingOutreachSectionProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("scheduled");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isDMModalOpen, setIsDMModalOpen] = useState(false);
  
  // Fetch data with tRPC
  const { 
    data: scheduledPosts, 
    isLoading: postsLoading, 
    error: postsError 
  } = trpc.marketing.getScheduledPosts.useQuery(
    { clientId },
    {
      staleTime: 1 * 60 * 1000, // 1 minute
      onError: (err) => {
        logger.error({ err, clientId }, "Failed to fetch scheduled posts");
        toast({ title: "Error", description: "Could not load scheduled posts.", variant: "destructive" });
      }
    }
  );
  
  const { 
    data: autoDMTasks, 
    isLoading: dmsLoading, 
    error: dmsError 
  } = trpc.marketing.getAutoDMTasks.useQuery(
    { clientId },
    {
      staleTime: 1 * 60 * 1000, // 1 minute
      onError: (err) => {
        logger.error({ err, clientId }, "Failed to fetch auto DM tasks");
        toast({ title: "Error", description: "Could not load automated DM tasks.", variant: "destructive" });
      }
    }
  );
  
  // Cancel task mutation
  const cancelTaskMutation = trpc.marketing.cancelTask.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Task has been cancelled." });
      // Invalidate queries to refetch data
      utils.marketing.getScheduledPosts.invalidate({ clientId });
      utils.marketing.getAutoDMTasks.invalidate({ clientId });
    },
    onError: (err) => {
      logger.error({ err, clientId }, "Failed to cancel task");
      toast({ title: "Error", description: `Failed to cancel task: ${err.message}`, variant: "destructive" });
    }
  });
  
  const utils = trpc.useContext();
  
  const handleCancelTask = (taskId: string, taskType: 'post' | 'dm') => {
    if (confirm("Are you sure you want to cancel this task? This action cannot be undone.")) {
      cancelTaskMutation.mutate({ 
        clientId, 
        taskId, 
        taskType 
      });
    }
  };
  
  const handlePostModalClose = () => {
    setIsPostModalOpen(false);
    // Invalidate queries to refetch data
    utils.marketing.getScheduledPosts.invalidate({ clientId });
  };
  
  const handleDMModalClose = () => {
    setIsDMModalOpen(false);
    // Invalidate queries to refetch data
    utils.marketing.getAutoDMTasks.invalidate({ clientId });
  };
  
  // Render loading state
  const renderLoading = () => (
    <div data-testid="loading-skeleton" className="space-y-4">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
  
  // Render error state
  const renderError = (error: any) => (
    <div className="p-4 rounded border border-red-200 bg-red-50 text-red-800">
      <AlertCircle className="h-5 w-5 mr-2 inline-block" />
      <span>Failed to load data: {error.message}</span>
    </div>
  );
  
  // Render scheduled posts list
  const renderScheduledPosts = () => {
    if (postsLoading) return renderLoading();
    if (postsError) return renderError(postsError);
    if (!scheduledPosts || scheduledPosts.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-10 w-10 mx-auto mb-2 opacity-20" />
          <p>No scheduled posts yet.</p>
          <Button 
            onClick={() => setIsPostModalOpen(true)}
            className="mt-4"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" /> Schedule your first post
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {scheduledPosts.map(post => (
          <div 
            key={post.id} 
            className="flex flex-col rounded-lg border p-4 dark:border-slate-700 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            data-testid={`post-${post.id}`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center">
                {getPlatformIcon(post.platformType)}
                <span className="ml-2 font-medium">{post.platformType.charAt(0).toUpperCase() + post.platformType.slice(1)}</span>
                <span className="mx-2 text-gray-400">•</span>
                {getStatusBadge(post.status)}
              </div>
              
              <div className="flex items-center space-x-2">
                {post.status === 'scheduled' && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 px-2 text-red-600"
                    onClick={() => handleCancelTask(post.id, 'post')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                {post.status === 'failed' && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 px-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <p className="line-clamp-2 text-sm text-gray-700 dark:text-gray-300 mb-2">
              {post.content}
            </p>
            
            {post.mediaUrl && (
              <div className="mt-2 mb-3">
                <span className="text-xs text-gray-500">
                  Media attached: {post.mediaUrl.split('/').pop()}
                </span>
              </div>
            )}
            
            <div className="mt-auto pt-2 flex justify-between items-center text-xs text-gray-500">
              <span>
                Created {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </span>
              
              {post.scheduledAt && (
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Scheduled for {format(new Date(post.scheduledAt), 'MMM d, yyyy h:mm a')}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render auto DM tasks list
  const renderAutoDMTasks = () => {
    if (dmsLoading) return renderLoading();
    if (dmsError) return renderError(dmsError);
    if (!autoDMTasks || autoDMTasks.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
          <p>No automated DM tasks set up yet.</p>
          <Button 
            onClick={() => setIsDMModalOpen(true)}
            className="mt-4"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" /> Set up your first auto-DM
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {autoDMTasks.map(task => (
          <div 
            key={task.id} 
            className="flex flex-col rounded-lg border p-4 dark:border-slate-700 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            data-testid={`dm-${task.id}`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center">
                {getPlatformIcon(task.platformType)}
                <span className="ml-2 font-medium">{task.platformType.charAt(0).toUpperCase() + task.platformType.slice(1)}</span>
                <span className="mx-2 text-gray-400">•</span>
                {getStatusBadge(task.status)}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 px-2 text-red-600"
                  onClick={() => handleCancelTask(task.id, 'dm')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="mb-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Trigger:</strong> {task.trigger?.replace('_', ' ')}
              </span>
              {task.isRecurring && (
                <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-800">
                  Recurring
                </Badge>
              )}
            </div>
            
            <p className="line-clamp-2 text-sm text-gray-700 dark:text-gray-300 mb-2">
              {task.content}
            </p>
            
            <div className="mt-auto pt-2 text-xs text-gray-500">
              Created {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render campaigns (stub for future implementation)
  const renderCampaigns = () => (
    <div className="text-center py-8 text-gray-500">
      <Megaphone className="h-10 w-10 mx-auto mb-2 opacity-20" />
      <p>Campaign management is coming soon!</p>
      <p className="text-sm mt-2">This feature will allow you to create multi-platform, multi-stage marketing campaigns.</p>
    </div>
  );

  return (
    <Card className="w-full dark:border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Megaphone className="mr-2 h-5 w-5" /> Marketing & Outreach
        </CardTitle>
        <CardDescription>
          Schedule posts, set up automated messages, and manage marketing campaigns.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="scheduled" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="scheduled" className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" /> Scheduled Posts
              </TabsTrigger>
              <TabsTrigger value="autodm" className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" /> Auto-DMs
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="flex items-center">
                <Megaphone className="h-4 w-4 mr-2" /> Campaigns
              </TabsTrigger>
            </TabsList>
            
            {activeTab === 'scheduled' && (
              <Button 
                size="sm" 
                onClick={() => setIsPostModalOpen(true)}
                data-testid="new-post-button"
              >
                <Plus className="h-4 w-4 mr-2" /> New Post
              </Button>
            )}
            
            {activeTab === 'autodm' && (
              <Button 
                size="sm" 
                onClick={() => setIsDMModalOpen(true)}
                data-testid="new-dm-button"
              >
                <Plus className="h-4 w-4 mr-2" /> New Auto-DM
              </Button>
            )}
          </div>
          
          <TabsContent value="scheduled" className="space-y-4">
            {renderScheduledPosts()}
          </TabsContent>
          
          <TabsContent value="autodm" className="space-y-4">
            {renderAutoDMTasks()}
          </TabsContent>
          
          <TabsContent value="campaigns" className="space-y-4">
            {renderCampaigns()}
          </TabsContent>
        </Tabs>
        
        {/* Modals */}
        <PostSchedulerModal 
          isOpen={isPostModalOpen}
          onClose={handlePostModalClose}
          clientId={clientId}
        />
        
        <AutoDMSetupModal 
          isOpen={isDMModalOpen}
          onClose={handleDMModalClose}
          clientId={clientId}
        />
      </CardContent>
    </Card>
  );
} 