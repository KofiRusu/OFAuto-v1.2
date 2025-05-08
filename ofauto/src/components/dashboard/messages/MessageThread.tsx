'use client';

import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import AutoPersonaTag from "@/components/dashboard/followers/AutoPersonaTag"; // Reusing this
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, User, MessageSquareText, ArrowDown, Check, CheckCheck, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface Message {
  id: string;
  from: 'system' | 'user'; // 'system' is the AI/automated, 'user' is the creator/manual reply
  text: string;
  personaUsed?: string | null;
  createdAt: Date;
  deliveryStatus?: 'sent' | 'delivered' | 'failed' | 'pending';
}

interface MessageThreadProps {
  messages: Message[];
  isLoading: boolean;
  userName: string; // Name of the follower/user being chatted with
  userAvatarUrl?: string;
  systemAvatarUrl?: string; // Optional: Avatar for the bot/system
}

// Helper component for the delivery status icon
const DeliveryStatusIcon = ({ status }: { status?: string }) => {
  switch (status) {
    case 'sent':
      return <Check size={12} />;
    case 'delivered':
      return <CheckCheck size={12} />;
    case 'pending':
      return <Clock size={12} className="animate-pulse" />;
    default:
      return null;
  }
};

export default function MessageThread({ 
  messages, 
  isLoading, 
  userName, 
  userAvatarUrl,
  systemAvatarUrl
}: MessageThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setIsAtBottom(true);
    }
  };

  // Handle scroll events to show/hide the button
  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
    
    setIsAtBottom(isBottom);
    setShowScrollButton(!isBottom && messages.length > 5);
  };

  useEffect(() => {
    // Scroll to bottom when messages load or new messages arrive
    scrollToBottom();
    
    // Add scroll event listener
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={cn("flex items-end gap-2", i % 2 === 0 ? "justify-start" : "justify-end")}>
            {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full" />}
            <Skeleton className="h-10 w-1/2 rounded-lg" />
            {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full" />}
          </div>
        ))}
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <MessageSquareText size={48} className="text-muted-foreground mb-4"/>
        <p className="text-muted-foreground">No messages yet with {userName}.</p>
        <p className="text-xs text-muted-foreground">Start the conversation below.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      <div 
        ref={scrollRef} 
        className="absolute inset-0 overflow-y-auto p-4 space-y-4 bg-muted/10"
        onScroll={handleScroll}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex items-end gap-3 mb-6",
              msg.from === 'system' 
                ? "justify-start mr-auto max-w-[75%]" 
                : "justify-end ml-auto flex-row-reverse max-w-[75%]"
            )}
          >
            {/* Avatar with better positioning */}
            <div className="flex-shrink-0">
              <Avatar className="h-8 w-8 border-2 border-background">
                <AvatarImage src={msg.from === 'system' ? systemAvatarUrl : userAvatarUrl} />
                <AvatarFallback className="bg-muted">
                  {msg.from === 'system' 
                    ? <Bot size={15}/> 
                    : userName?.charAt(0).toUpperCase() || <User size={15}/>}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Message Bubble with tail */}
            <div className="relative">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "rounded-xl px-4 py-2.5 text-sm shadow-sm relative",
                        msg.from === 'system'
                          ? "bg-card text-card-foreground border border-muted"
                          : "bg-primary text-primary-foreground"
                      )}
                    >
                      {/* Bubble Tail */}
                      <div 
                        className={cn(
                          "absolute bottom-2 w-2 h-2 rotate-45",
                          msg.from === 'system' 
                            ? "-left-1 bg-card border-l border-b border-muted" 
                            : "-right-1 bg-primary"
                        )}
                      />
                      
                      {/* Message Text */}
                      <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      
                      {/* Persona Tag & Delivery Status */}
                      <div className={cn(
                        "flex items-center gap-2 mt-1 text-[10px]",
                        msg.from === 'system' ? "text-muted-foreground" : "text-primary-foreground/80"
                      )}>
                        {msg.from === 'system' && msg.personaUsed && (
                          <AutoPersonaTag personaName={msg.personaUsed} />
                        )}
                        {msg.from === 'user' && (
                          <span className="flex items-center">
                            <DeliveryStatusIcon status={msg.deliveryStatus} />
                          </span>
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side={msg.from === 'system' ? 'left' : 'right'} className="text-xs">
                    {format(new Date(msg.createdAt), 'MMM d, yyyy · h:mm a')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ))}
      </div>
      
      {/* Scroll to bottom button */}
      <Button
        size="sm"
        variant="secondary"
        className={cn(
          "absolute bottom-4 right-4 shadow-md rounded-full transition-opacity duration-200 opacity-0 pointer-events-none",
          showScrollButton && "opacity-100 pointer-events-auto"
        )}
        onClick={scrollToBottom}
      >
        <ArrowDown size={16} className="mr-1" />
        Latest
      </Button>
    </div>
  );
} 