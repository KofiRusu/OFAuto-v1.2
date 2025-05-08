'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ArrowRightIcon, CheckCircle, XCircle, RefreshCw, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';

interface IntegrationCardProps {
  integration: {
    id: string;
    platform: string;
    status: string;
    username?: string;
    lastSynced?: string;
    clientId: string;
  };
  onConnect?: () => void;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({ 
  integration,
  onConnect
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Platform-specific details
  const platformDetails: Record<string, { name: string, icon: string, color: string }> = {
    'onlyfans': { 
      name: 'OnlyFans', 
      icon: '/images/platforms/onlyfans-icon.svg',
      color: 'bg-pink-500'
    },
    'patreon': { 
      name: 'Patreon', 
      icon: '/images/platforms/patreon-icon.svg',
      color: 'bg-orange-500'
    },
    'fansly': { 
      name: 'Fansly', 
      icon: '/images/platforms/fansly-icon.svg',
      color: 'bg-blue-500'
    },
    'instagram': { 
      name: 'Instagram', 
      icon: '/images/platforms/instagram-icon.svg',
      color: 'bg-purple-500'
    },
    'kofi': {
      name: 'Ko-fi',
      icon: '/images/platforms/kofi-icon.svg',
      color: 'bg-blue-400'
    }
  };
  
  const details = platformDetails[integration.platform] || {
    name: integration.platform,
    icon: '/images/platforms/default-icon.svg',
    color: 'bg-gray-500'
  };
  
  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/integrations/${integration.id}/sync`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync platform');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Platform synced',
        description: `${details.name} data has been successfully synced.`
      });
      queryClient.invalidateQueries({ queryKey: ['integrations', integration.clientId] });
    },
    onError: (error) => {
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Failed to sync platform data',
        variant: 'destructive'
      });
    }
  });
  
  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/integrations/${integration.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to disconnect platform');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Platform disconnected',
        description: `${details.name} has been successfully disconnected.`
      });
      queryClient.invalidateQueries({ queryKey: ['integrations', integration.clientId] });
    },
    onError: (error) => {
      toast({
        title: 'Disconnect failed',
        description: error instanceof Error ? error.message : 'Failed to disconnect platform',
        variant: 'destructive'
      });
    }
  });
  
  // Handle platform connection
  const handleConnect = () => {
    if (onConnect) {
      onConnect();
    } else {
      router.push(`/dashboard/platforms/connect?clientId=${integration.clientId}&platform=${integration.platform}`);
    }
  };
  
  // Handle sync
  const handleSync = () => {
    syncMutation.mutate();
  };
  
  // Handle disconnect
  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };
  
  const isConnected = integration.status === 'connected';
  
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${details.color}`}>
              {/* Replace with actual platform icon */}
              <span className="text-white font-bold">
                {details.name.charAt(0)}
              </span>
            </div>
            <CardTitle>{details.name}</CardTitle>
          </div>
          <Badge variant={isConnected ? "default" : "outline"}>
            {isConnected ? (
              <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-500" />
            ) : (
              <XCircle className="h-3.5 w-3.5 mr-1 text-red-500" />
            )}
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {integration.username && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Username:</span>
              <span className="font-medium">{integration.username}</span>
            </div>
          )}
          {isConnected && integration.lastSynced && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last synced:</span>
              <span>{formatDistanceToNow(integration.lastSynced)} ago</span>
            </div>
          )}
          {isConnected && !integration.lastSynced && (
            <div className="text-sm text-muted-foreground">
              Never synced before
            </div>
          )}
          {!isConnected && (
            <div className="text-sm text-muted-foreground">
              Connect to manage content on {details.name}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        {isConnected ? (
          <div className="flex space-x-2 w-full">
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1"
              onClick={handleSync}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sync
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 text-destructive hover:text-destructive"
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Disconnect
            </Button>
          </div>
        ) : (
          <Button 
            className="w-full" 
            onClick={handleConnect}
          >
            Connect
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}; 