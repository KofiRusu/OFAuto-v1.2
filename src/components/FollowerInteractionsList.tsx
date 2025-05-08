"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageFeedback } from "@/components/ui/message-feedback";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, User } from "lucide-react";

interface FollowerInteraction {
  id: string;
  platform: string;
  platformAccountId: string;
  followerId: string;
  followerUsername: string;
  messageText: string;
  messageSentAt: string;
  messageTemplateUsed: string;
  createdAt: string;
}

interface FollowerInteractionsListProps {
  clientId?: string;
  platformId?: string;
  limit?: number;
}

export default function FollowerInteractionsList({ 
  clientId, 
  platformId,
  limit = 20
}: FollowerInteractionsListProps) {
  const [interactions, setInteractions] = useState<FollowerInteraction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [personaId, setPersonaId] = useState<string | null>(null);

  useEffect(() => {
    const fetchInteractions = async () => {
      setIsLoading(true);
      try {
        // Build the query parameters
        const params = new URLSearchParams();
        if (clientId) params.append("clientId", clientId);
        if (platformId) params.append("platformId", platformId);
        params.append("limit", limit.toString());
        
        const response = await fetch(`/api/marketing/follower-interactions?${params.toString()}`);
        
        if (response.ok) {
          const data = await response.json();
          setInteractions(data);
          
          // If we have interactions, fetch the persona for the first one
          if (data.length > 0 && data[0].messageTemplateUsed) {
            // In a real implementation, we'd look up the persona ID by name
            // For now, use a placeholder
            setPersonaId("placeholder-persona-id");
          }
        } else {
          console.error("Failed to fetch interactions:", await response.text());
        }
      } catch (error) {
        console.error("Error fetching interactions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInteractions();
  }, [clientId, platformId, limit]);

  // Handle feedback given on a message
  const handleFeedback = (interactionId: string, feedbackType: string) => {
    console.log(`Feedback ${feedbackType} given for message ${interactionId}`);
    // In a real implementation, we'd update the UI to reflect the feedback
  };

  // Get platform icon based on platform type
  const getPlatformBadge = (platform: string) => {
    const platformLower = platform.toLowerCase();
    let color = "bg-gray-500";
    let label = platformLower;
    
    if (platformLower === "twitter") {
      color = "bg-blue-400";
      label = "Twitter";
    } else if (platformLower === "instagram") {
      color = "bg-pink-500";
      label = "Instagram";
    } else if (platformLower === "telegram") {
      color = "bg-blue-500";
      label = "Telegram";
    } else if (platformLower === "onlyfans") {
      color = "bg-[#00AFF0]";
      label = "OnlyFans";
    }
    
    return (
      <Badge 
        className={`${color} text-white`}
        variant="secondary"
      >
        {label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Follower Interactions</CardTitle>
          <CardDescription>
            Recent messages sent to followers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-gray-500">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            Loading interactions...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (interactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Follower Interactions</CardTitle>
          <CardDescription>
            Recent messages sent to followers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 opacity-20 mx-auto mb-4" />
            <p>No follower interactions found</p>
            <p className="text-sm mt-2">
              Messages sent to new followers will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Follower Interactions</CardTitle>
        <CardDescription>
          Recent messages sent to followers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {interactions.map((interaction) => (
            <div 
              key={interaction.id}
              className="flex gap-4 p-4 rounded-lg border"
            >
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-gray-200">
                  <User className="w-5 h-5 text-gray-500" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium">
                    @{interaction.followerUsername}
                  </div>
                  <div className="flex items-center gap-2">
                    {getPlatformBadge(interaction.platform)}
                    <span className="text-xs text-gray-500">
                      {new Date(interaction.messageSentAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="p-3 bg-blue-50 rounded-lg text-sm">
                    {interaction.messageText || "Thanks for following! We're excited to connect with you."}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Template: {interaction.messageTemplateUsed}
                  </div>
                </div>
                
                {/* Add feedback UI */}
                {personaId && (
                  <div className="flex justify-end">
                    <MessageFeedback 
                      messageId={interaction.id}
                      personaId={personaId}
                      messageText={interaction.messageText || ""}
                      size="sm"
                      onFeedbackGiven={(type) => handleFeedback(interaction.id, type)}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 