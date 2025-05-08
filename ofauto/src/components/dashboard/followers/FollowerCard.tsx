import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, Send, UserPlus, Bot, Clock, AlertTriangle, Info } from "lucide-react";
import { formatDistanceToNow, format } from 'date-fns';
import AutoPersonaTag from "./AutoPersonaTag";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface Follower {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  platform: 'onlyfans' | 'fansly' | 'patreon' | 'kofi' | 'instagram' | 'twitter';
  followedAt: Date;
  autoDMStatus: 'sent' | 'pending' | 'failed' | 'manual'; // 'manual' means no auto-DM was attempted
  personaUsed?: string | null;
  // Optional additional fields for the expanded view
  bio?: string;
  location?: string;
  subscribedSince?: Date;
  spentAmount?: number;
  engagementRate?: number;
}

interface FollowerCardProps {
  follower: Follower;
  onMarkHandled: (id: string) => void;
}

// Helper to get platform specific colors/icons
const platformConfig = {
  onlyfans: { 
    variant: 'info', 
    name: 'OnlyFans',
    icon: <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 19c-3.866 0-7-3.134-7-7s3.134-7 7-7 7 3.134 7 7-3.134 7-7 7z"/></svg>
  },
  fansly: { 
    variant: 'warning', 
    name: 'Fansly',
    icon: null 
  },
  patreon: { 
    variant: 'error', 
    name: 'Patreon',
    icon: null 
  },
  kofi: { 
    variant: 'info', 
    name: 'Ko-fi',
    icon: null 
  },
  instagram: { 
    variant: 'secondary', 
    name: 'Instagram',
    icon: null 
  },
  twitter: { 
    variant: 'secondary', 
    name: 'Twitter/X',
    icon: null 
  },
};

const dmStatusConfig = {
  sent: { 
    label: 'Auto-DM Sent', 
    variant: 'success',
    icon: <Bot size={12} className="mr-1" />
  },
  pending: { 
    label: 'Auto-DM Pending', 
    variant: 'warning',
    icon: <Clock size={12} className="mr-1" />
  },
  failed: { 
    label: 'Auto-DM Failed', 
    variant: 'error',
    icon: <AlertTriangle size={12} className="mr-1" />
  },
  manual: { 
    label: 'Manual Reply Needed', 
    variant: 'secondary',
    icon: <Info size={12} className="mr-1" />
  }
};

export default function FollowerCard({ follower, onMarkHandled }: FollowerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const platformInfo = platformConfig[follower.platform] || platformConfig.twitter;
  const dmStatus = dmStatusConfig[follower.autoDMStatus];

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-200 hover:shadow-md",
        isExpanded && "ring-2 ring-primary/30"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10 border-2 border-background">
            <AvatarImage src={follower.avatarUrl} alt={follower.name} />
            <AvatarFallback>{follower.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-grow space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm">{follower.name}</span>
              <Badge variant={platformInfo.variant as any}>
                {platformInfo.icon}
                {platformInfo.name}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              @{follower.username} · Followed {formatDistanceToNow(new Date(follower.followedAt), { addSuffix: true })}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant={dmStatus.variant as any}>
                {dmStatus.icon} {dmStatus.label}
              </Badge>
              {follower.personaUsed && (
                <AutoPersonaTag 
                  personaName={follower.personaUsed} 
                  showIcon={true}
                  truncate={true}
                />
              )}
            </div>
          </div>
        </div>
        
        {/* Expanded profile information (shows on hover) */}
        <div className={cn(
          "mt-3 pt-3 border-t text-xs grid gap-2 text-muted-foreground",
          isExpanded ? "block" : "hidden"
        )}>
          {follower.bio && (
            <p className="italic">{follower.bio}</p>
          )}
          
          <div className="grid grid-cols-2 gap-2">
            {follower.location && (
              <div>
                <span className="font-medium">Location:</span> {follower.location}
              </div>
            )}
            {follower.subscribedSince && (
              <div>
                <span className="font-medium">Subscribed:</span> {format(new Date(follower.subscribedSince), 'MMM d, yyyy')}
              </div>
            )}
            {follower.spentAmount !== undefined && (
              <div>
                <span className="font-medium">Total Spent:</span> ${follower.spentAmount.toFixed(2)}
              </div>
            )}
            {follower.engagementRate !== undefined && (
              <div>
                <span className="font-medium">Engagement:</span> {follower.engagementRate.toFixed(1)}%
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      {(follower.autoDMStatus === 'pending' || follower.autoDMStatus === 'failed' || follower.autoDMStatus === 'manual') && (
        <CardFooter className="bg-muted/50 p-2 flex justify-end">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8"
                  onClick={() => onMarkHandled(follower.id)}
                >
                  <Check size={14} className="mr-1.5" />
                  Mark as Handled
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Removes this follower from the action queue
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      )}
    </Card>
  );
} 