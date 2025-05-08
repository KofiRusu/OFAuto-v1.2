'use client';

import { useState, useEffect, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Inbox, Users, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { toast } from "react-hot-toast";
import apiClient from "@/lib/api-client";

import MessageThread, { Message } from './MessageThread';
import ManualMessageComposer, { MessageToSend } from './ManualMessageComposer';

// --- Types ---
interface FollowerStub {
  id: string;
  name: string;
  platform: 'onlyfans' | 'fansly' | 'patreon' | 'kofi' | 'instagram' | 'twitter';
  avatarUrl?: string;
  lastMessagePreview: string;
  lastMessageAt: Date;
  unreadCount: number;
}

// --- Component --- 
export default function MessageListPanel() {
  const [followers, setFollowers] = useState<FollowerStub[]>([]);
  const [selectedFollower, setSelectedFollower] = useState<FollowerStub | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Load follower list on mount
  useEffect(() => {
    async function loadFollowers() {
      setIsLoadingFollowers(true);
      try {
        // Use apiClient to fetch followers with messages
        const response = await apiClient.messages.list();
        
        if (response.success && response.data) {
          setFollowers(response.data);
          // Select the first follower by default if list is not empty
          if (response.data.length > 0) {
            handleSelectFollower(response.data[0]);
          }
        } else {
          throw new Error(response.error || "Failed to fetch followers");
        }
      } catch (error: any) {
        toast.error("Could not fetch follower list: " + (error.message || "Unknown error"));
        
        // Implement minimal retry logic
        if (retryCount < maxRetries) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 3000); // retry after 3 seconds
        }
      } finally {
        setIsLoadingFollowers(false);
      }
    }
    loadFollowers();
  }, [retryCount]); // Re-run when retryCount changes

  // Load messages when a follower is selected
  const handleSelectFollower = async (follower: FollowerStub) => {
    setSelectedFollower(follower);
    setIsLoadingMessages(true);
    setMessages([]); // Clear previous messages
    try {
      // Use apiClient to fetch messages for a specific follower
      const response = await apiClient.messages.list(follower.platform, follower.id);
      
      if (response.success && response.data) {
        setMessages(response.data);
      } else {
        throw new Error(response.error || "Failed to fetch messages");
      }
    } catch (error: any) {
      toast.error(`Could not fetch messages for ${follower.name}: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Handle sending a manual message
  const handleSendMessage = async (messageToSend: MessageToSend): Promise<boolean> => {
    if (!selectedFollower) return false;
    setIsSending(true);
    try {
      // Use apiClient to send a message
      const messageData = {
        followerId: selectedFollower.id,
        platform: selectedFollower.platform,
        text: messageToSend.text,
        personaId: messageToSend.personaId
      };
      
      const response = await apiClient.messages.send(messageData);
      
      if (response.success && response.data) {
        setMessages(prev => [...prev, response.data]); // Add new message to thread
        toast.success("Message sent successfully");
        
        // Update the follower list preview
        setFollowers(prev => prev.map(f => 
          f.id === selectedFollower.id 
          ? { 
              ...f, 
              lastMessagePreview: `You: ${messageToSend.text.substring(0, 20)}${messageToSend.text.length > 20 ? '...' : ''}`, 
              lastMessageAt: new Date(), 
              unreadCount: 0 
            } 
          : f
        ));
        return true;
      } else {
        throw new Error(response.error || "Failed to send message");
      }
    } catch (error: any) {
      toast.error("Failed to send message: " + (error.message || "Unknown error"));
      return false;
    } finally {
      setIsSending(false);
    }
  }

  const filteredFollowers = useMemo(() => {
    if (!searchTerm) return followers;
    return followers.filter(f => 
      f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [followers, searchTerm]);

  return (
    <div className="flex h-[calc(100vh-var(--header-height,100px))] border rounded-lg overflow-hidden">
      {/* Left Panel: Follower List */}
      <div className="w-full sm:w-1/3 md:w-1/4 border-r flex flex-col bg-background">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Search followers..."
                className="pl-9 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {isLoadingFollowers ? (
             <div className="p-3 space-y-3">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1 flex-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
             </div>
          ) : filteredFollowers.length > 0 ? (
            filteredFollowers.map(follower => (
              <button
                key={follower.id}
                onClick={() => handleSelectFollower(follower)}
                className={cn(
                  "flex items-center gap-3 p-3 w-full text-left hover:bg-muted/50 transition-colors",
                  selectedFollower?.id === follower.id && "bg-muted"
                )}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={follower.avatarUrl} alt={follower.name} />
                  <AvatarFallback>{follower.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm truncate">{follower.name}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                       {formatDistanceToNow(new Date(follower.lastMessageAt), { addSuffix: true, includeSeconds: false })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground truncate">{follower.lastMessagePreview}</p>
                    {follower.unreadCount > 0 && (
                        <span className="flex items-center justify-center h-4 w-4 text-[10px] rounded-full bg-primary text-primary-foreground font-medium">
                            {follower.unreadCount}
                        </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          ) : (
             <div className="text-center py-10 px-4">
                <Users size={32} className="mx-auto text-muted-foreground mb-2"/>
                <p className="text-sm text-muted-foreground">
                   {searchTerm ? `No followers found matching "${searchTerm}"` : 'No conversations found.'}
                </p>
             </div>
          )}
        </ScrollArea>
      </div>

      {/* Right Panel: Message Thread & Composer */}
      <div className="flex-1 flex flex-col bg-muted/30">
        {selectedFollower ? (
          <>
            {/* Thread Header */}
            <div className="p-3 border-b flex items-center gap-3 bg-background">
               <Avatar className="h-9 w-9">
                  <AvatarImage src={selectedFollower.avatarUrl} alt={selectedFollower.name} />
                  <AvatarFallback>{selectedFollower.name.charAt(0).toUpperCase()}</AvatarFallback>
               </Avatar>
               <div>
                    <p className="font-semibold">{selectedFollower.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{selectedFollower.platform}</p>
               </div>
            </div>

            {/* Message Thread */}
            <MessageThread 
              messages={messages} 
              isLoading={isLoadingMessages} 
              userName={selectedFollower.name}
              userAvatarUrl={selectedFollower.avatarUrl}
              // systemAvatarUrl="/path/to/your/bot-avatar.png" // Optional
            />

            {/* Composer */}
            <ManualMessageComposer 
                onSendMessage={handleSendMessage} 
                disabled={isLoadingMessages || isSending}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <Inbox size={48} className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Select a follower to view messages.</p>
          </div>
        )}
      </div>
    </div>
  );
} 