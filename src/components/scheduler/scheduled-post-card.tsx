"use client";

import { format } from "date-fns";
import { MoreHorizontal, Edit, Trash2, Calendar, Globe, User } from "lucide-react";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScheduledPost } from "./create-scheduled-post-modal";
import { getPlatformConfig, getPlatformColor, getPlatformLabel, getPlatformIcon } from "@/constants/platforms";
import { UserAvatar } from "@/components/user-avatar";
import { PublishPostButton } from "./publish-post-button";

interface ScheduledPostCardProps {
  post: ScheduledPost;
  onEdit: () => void;
  onDelete: () => void;
}

// TODO: Replace with actual API call
const getAssigneeUser = async (userId: string): Promise<User | undefined> => {
  // Mock data - should be replaced with actual API call
  const users = [
    { id: "1", name: "John Doe", email: "john@example.com", avatar: "/avatars/01.png" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", avatar: "/avatars/02.png" },
    { id: "3", name: "Alex Johnson", email: "alex@example.com", avatar: "/avatars/03.png" },
    { id: "4", name: "Sam Williams", email: "sam@example.com", avatar: "/avatars/04.png" },
  ];
  return users.find(user => user.id === userId);
};

export function ScheduledPostCard({ post, onEdit, onDelete }: ScheduledPostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [assignee, setAssignee] = useState<User | undefined>(undefined);
  const isMultiPlatform = post.platforms && post.platforms.length > 1;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const loadAssignee = async () => {
      if (post.assignedToId) {
        const user = await getAssigneeUser(post.assignedToId);
        setAssignee(user);
      }
    };

    loadAssignee();
  }, [post.assignedToId]);

  const PlatformIcon = post.platform ? getPlatformConfig(post.platform).icon : null;

  // Get platform icons for display
  const getPlatformIcons = () => {
    const platforms = post.platforms || [post.platform];
    
    return platforms.map(platform => {
      const PlatformIcon = getPlatformIcon(platform);
      return (
        <Badge key={platform} variant="outline" className="bg-background">
          <PlatformIcon className="h-3.5 w-3.5 mr-1" />
          {platform.charAt(0).toUpperCase() + platform.slice(1)}
        </Badge>
      );
    });
  };
  
  // Get status badge color
  const getStatusBadge = () => {
    switch (post.status) {
      case 'published':
        return <Badge className="bg-green-500">Published</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-500">Processing</Badge>;
      default:
        return <Badge variant="secondary">Scheduled</Badge>;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      {post.imageUrl && (
        <div className="h-32 overflow-hidden">
          <img 
            src={post.imageUrl} 
            alt={post.title} 
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="line-clamp-1">{post.title}</CardTitle>
            <CardDescription>
              {format(post.scheduledDate, "MMMM d, yyyy 'at' h:mm a")}
            </CardDescription>
          </div>
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-4 flex-grow">
        <div className="flex items-center mb-3 flex-wrap gap-2">
          {isMultiPlatform ? (
            <>
              <Badge
                variant="secondary"
                className={`${getPlatformColor(post.platform)} text-white`}
              >
                <div className="flex items-center">
                  {PlatformIcon && <PlatformIcon className="h-3 w-3 mr-1" />}
                  {getPlatformLabel(post.platform)}
                </div>
              </Badge>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="cursor-help border-dashed">
                      +{post.platforms.length - 1} more
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Also scheduled for:</p>
                    <ul className="list-disc pl-4 mt-1">
                      {post.platforms.filter(p => p !== post.platform).map(platform => (
                        <li key={platform}>{getPlatformLabel(platform)}</li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          ) : (
            <Badge
              variant="secondary"
              className={`${getPlatformColor(post.platform)} text-white`}
            >
              <div className="flex items-center">
                {PlatformIcon && <PlatformIcon className="h-3 w-3 mr-1" />}
                {getPlatformLabel(post.platform)}
              </div>
            </Badge>
          )}

          {getStatusBadge()}

          {assignee && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="ml-auto">
                    <UserAvatar user={assignee} size="sm" showStatus status="online" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Assigned to: {assignee.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className={isExpanded ? "" : "line-clamp-3"}>
          <p className="text-sm text-muted-foreground">{post.content}</p>
        </div>
        {post.content.length > 150 && (
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto text-xs mt-1"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Show less" : "Show more"}
          </Button>
        )}
        {post.imageUrl && (
          <div className="mt-3 relative rounded-md overflow-hidden aspect-video">
            <img
              src={post.imageUrl}
              alt={post.title}
              className="object-cover w-full h-full"
            />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0 flex-col gap-2">
        <div className="flex justify-between items-center w-full text-xs text-muted-foreground">
          <div className="flex items-center">
            <Calendar className="mr-1 h-3.5 w-3.5" />
            {format(post.scheduledDate, "MMM d, h:mm a")}
          </div>
          
          {post.assignedToId && (
            <div className="flex items-center">
              <User className="mr-1 h-3.5 w-3.5" />
              Assigned
            </div>
          )}
        </div>
        
        {(post.status === 'scheduled' || post.status === 'failed') && (
          <div className="w-full">
            <PublishPostButton 
              postId={post.id} 
              small 
            />
          </div>
        )}
      </CardFooter>
    </Card>
  );
} 