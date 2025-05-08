import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { format } from 'date-fns';
import { CampaignItem } from '@/lib/trpc/routers/campaignPlanner';
import { cn } from '@/lib/utils';
import { Calendar, Clock, Edit, ExternalLink, Image, Mail, MessageSquare, MoreHorizontal, Pencil, Send, ShoppingBag, Star, Trash2, Users } from 'lucide-react';

interface CampaignCardProps {
  item: CampaignItem;
  className?: string;
  onClick?: (item: CampaignItem) => void;
  onEdit?: (item: CampaignItem) => void;
  onDelete?: (item: CampaignItem) => void;
  onReschedule?: (item: CampaignItem) => void;
  compact?: boolean;
}

export const CampaignCard = ({
  item,
  className,
  onClick,
  onEdit,
  onDelete,
  onReschedule,
  compact = false,
}: CampaignCardProps) => {
  // Platform icons/colors
  const getPlatformDetails = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'onlyfans':
        return { 
          icon: <ShoppingBag className="h-4 w-4" />, 
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
        };
      case 'fansly':
        return { 
          icon: <Star className="h-4 w-4" />, 
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' 
        };
      case 'patreon':
        return { 
          icon: <Users className="h-4 w-4" />, 
          color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' 
        };
      case 'instagram':
        return { 
          icon: <Image className="h-4 w-4" />, 
          color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300' 
        };
      default:
        return { 
          icon: <MessageSquare className="h-4 w-4" />, 
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' 
        };
    }
  };

  // Type icons/colors
  const getTypeDetails = (type: 'post' | 'dm' | 'experiment') => {
    switch (type) {
      case 'post':
        return { 
          icon: <Send className="h-4 w-4" />, 
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
          label: 'Post'
        };
      case 'dm':
        return { 
          icon: <Mail className="h-4 w-4" />, 
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
          label: 'DM'
        };
      case 'experiment':
        return { 
          icon: <Star className="h-4 w-4" />, 
          color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
          label: 'Experiment'
        };
    }
  };

  // Status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">Scheduled</Badge>;
      case 'sending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">Sending</Badge>;
      case 'sent':
        return <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">Sent</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300">Failed</Badge>;
      case 'draft':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const platformDetails = getPlatformDetails(item.platform);
  const typeDetails = getTypeDetails(item.type);
  
  // Format time as 10:30 AM
  const formattedTime = format(item.scheduledFor, 'h:mm a');
  
  // Format date as Jan 1 or Today/Tomorrow
  const formattedDate = format(item.scheduledFor, 'MMM d');
  
  return (
    <Card 
      className={cn(
        'transition-all hover:shadow-md group relative overflow-hidden border',
        item.status === 'sent' ? 'opacity-80' : '',
        className
      )}
      onClick={() => onClick?.(item)}
    >
      {/* Card top status bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/80 to-primary/40"></div>
      
      <CardContent className={cn(
        "flex flex-col p-4", 
        compact ? "gap-1" : "gap-2"
      )}>
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex gap-2 items-center">
            <Badge 
              variant="secondary" 
              className={cn("flex items-center gap-1", platformDetails.color)}
            >
              {platformDetails.icon}
              <span className={compact ? 'sr-only' : ''}>{item.platform}</span>
            </Badge>
            
            <Badge 
              variant="secondary" 
              className={cn("flex items-center gap-1", typeDetails.color)}
            >
              {typeDetails.icon}
              <span className={compact ? 'sr-only' : ''}>{typeDetails.label}</span>
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {getStatusBadge(item.status)}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { 
                  e.stopPropagation(); 
                  onEdit?.(item); 
                }}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { 
                  e.stopPropagation(); 
                  onReschedule?.(item); 
                }}>
                  <Calendar className="mr-2 h-4 w-4" /> Reschedule
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onDelete?.(item); 
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Title */}
        <h3 className={cn(
          "font-medium line-clamp-2",
          compact ? "text-sm" : "text-base"
        )}>
          {item.title}
        </h3>
        
        {/* Content preview - only if not compact */}
        {!compact && item.content && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.content}
          </p>
        )}
        
        {/* Footer */}
        <div className="flex justify-between items-center mt-auto">
          <div className="flex items-center text-xs text-muted-foreground gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{formattedTime}</span>
            <span className="mx-1">•</span>
            <span>{formattedDate}</span>
          </div>
          
          {!compact && (
            <div className="flex gap-2">
              {item.mediaUrls && item.mediaUrls.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="h-6 flex items-center gap-1">
                        <Image className="h-3 w-3" />
                        <span>{item.mediaUrls.length}</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      {item.mediaUrls.length} media attachment{item.mediaUrls.length !== 1 ? 's' : ''}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {item.recipientCount !== undefined && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="h-6 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{item.recipientCount}</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      {item.recipientCount} recipient{item.recipientCount !== 1 ? 's' : ''}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 