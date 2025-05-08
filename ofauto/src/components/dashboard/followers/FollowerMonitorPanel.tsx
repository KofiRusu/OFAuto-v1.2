'use client';

import { useState, useEffect, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FollowerCard, { Follower } from "./FollowerCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, UserX } from "lucide-react";
import { toast } from "react-hot-toast";
import apiClient from "@/lib/api-client";

// --- Component --- 
const platforms = ['all', 'onlyfans', 'fansly', 'patreon', 'instagram', 'twitter'];

// For referencing platform display names
const platformStyles: Record<string, { name: string }> = {
  onlyfans: { name: 'OnlyFans' },
  fansly: { name: 'Fansly' },
  patreon: { name: 'Patreon' },
  instagram: { name: 'Instagram' },
  twitter: { name: 'Twitter' },
  kofi: { name: 'Ko-fi' }
};

export default function FollowerMonitorPanel() {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    async function loadFollowers() {
      setIsLoading(true);
      try {
        // Use apiClient to fetch followers
        const params: Record<string, string> = {};
        if (selectedPlatform !== 'all') {
          params.platform = selectedPlatform;
        }
        
        const response = await apiClient.followers.list(params);
        
        if (response.success && response.data) {
          setFollowers(response.data);
        } else {
          throw new Error(response.error || "Failed to fetch followers");
        }
      } catch (error: any) {
        toast.error("Could not fetch followers: " + (error.message || "Unknown error"));
        
        // Implement minimal retry logic
        if (retryCount < maxRetries) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 3000); // retry after 3 seconds
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadFollowers();
  }, [selectedPlatform, retryCount]); // Reload when platform changes or on retry

  const handleMarkHandled = async (id: string) => {
    try {
      // Use apiClient to mark follower as handled
      const response = await apiClient.followers.update(id, { handled: true });
      
      if (response.success) {
        setFollowers(prev => prev.filter(f => f.id !== id)); // Remove from list
        toast.success("Follower has been marked as handled");
      } else {
        throw new Error(response.error || "Failed to mark follower as handled");
      }
    } catch (error: any) {
      toast.error("Could not mark follower as handled: " + (error.message || "Unknown error"));
    }
  };

  const filteredFollowers = useMemo(() => {
    if (!searchTerm) return followers;
    return followers.filter(f => 
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [followers, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Recent Followers & Engagement Status</h2>
          <p className="text-muted-foreground text-sm">Monitor new followers and track auto-DM engagement.</p>
        </div>
        <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Search by name or username..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* Platform Tabs */}
      <Tabs value={selectedPlatform} onValueChange={setSelectedPlatform}>
        <TabsList>
          {platforms.map(p => (
            <TabsTrigger key={p} value={p} className="capitalize">
              {p === 'all' ? 'All Platforms' : p}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Follower Grid (Content for all tabs) */}
        {platforms.map(p => (
            <TabsContent key={p} value={p} className="mt-4">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}
                    </div>
                ) : filteredFollowers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredFollowers.map(follower => (
                        <FollowerCard 
                            key={follower.id} 
                            follower={follower} 
                            onMarkHandled={handleMarkHandled} 
                        />
                    ))}
                    </div>
                ) : (
                    <div className="text-center py-16 border rounded-lg bg-muted/20">
                        <UserX className="mx-auto h-12 w-12 text-muted-foreground"/>
                        <p className="mt-4 text-muted-foreground">
                           {searchTerm ? `No followers found matching "${searchTerm}"` : `No new followers on ${selectedPlatform === 'all' ? 'any platform' : platformStyles[selectedPlatform as keyof typeof platformStyles]?.name}.`}
                        </p>
                    </div>
                )}
            </TabsContent>
        ))}
      </Tabs>
    </div>
  );
} 