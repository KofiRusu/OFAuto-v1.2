'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plug, 
  Power, 
  PowerOff, 
  Edit, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  ShoppingBag,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  DollarSign,
  Share2
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { trpc } from "@/lib/trpc/client";
import ConnectPlatformModal from './ConnectPlatformModal';
import { logger } from '@/lib/logger';
import { useToast } from "@/components/ui/use-toast";

// Define platform types and groupings
type PlatformGroup = 'monetization' | 'social' | 'other';

interface Platform {
  id: string;
  name: string;
  icon: string;
  requiresOAuth?: boolean;
  requiresApiKey?: boolean;
  requiresUserPass?: boolean;
  group: PlatformGroup;
}

// Define platform details with grouping
const PLATFORMS: Platform[] = [
  { id: 'patreon', name: 'Patreon', icon: 'patreon-icon.svg', requiresOAuth: true, group: 'monetization' },
  { id: 'kofi', name: 'Ko-fi', icon: 'kofi-icon.svg', requiresApiKey: true, group: 'monetization' },
  { id: 'fansly', name: 'Fansly', icon: 'fansly-icon.svg', requiresUserPass: true, group: 'monetization' },
  { id: 'onlyfans', name: 'OnlyFans', icon: 'onlyfans-icon.svg', requiresUserPass: true, group: 'monetization' },
  { id: 'gumroad', name: 'Gumroad', icon: 'gumroad-icon.svg', requiresApiKey: true, group: 'monetization' },
  { id: 'twitter', name: 'Twitter', icon: 'twitter-icon.svg', requiresOAuth: true, group: 'social' },
  { id: 'instagram', name: 'Instagram', icon: 'instagram-icon.svg', requiresOAuth: true, group: 'social' },
];

type PlatformId = typeof PLATFORMS[number]['id'];

// Gets the proper icon for the platform
const getPlatformIcon = (platformId: PlatformId) => {
  switch (platformId) {
    case 'gumroad':
      return <ShoppingBag className="h-6 w-6 text-pink-600 dark:text-pink-400" />;
    case 'twitter':
      return <TwitterIcon className="h-6 w-6 text-blue-500 dark:text-blue-400" />;
    case 'instagram':
      return <InstagramIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />;
    default:
      // For platforms without specific icons, use the first character
      return <span className="font-bold text-lg">{PLATFORMS.find(p => p.id === platformId)?.name.charAt(0) || '?'}</span>;
  }
};

interface ConnectedAccountsSectionProps {
  clientId: string; // Assumes the parent component knows the current client ID
}

export default function ConnectedAccountsSection({ clientId }: ConnectedAccountsSectionProps) {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedPlatform, setSelectedPlatform] = React.useState<PlatformId | null>(null);
  const [activeTab, setActiveTab] = React.useState<string>("all");
  
  const utils = trpc.useContext();

  // Fetch connection statuses
  const { data: statuses, isLoading, error } = trpc.platformConnections.getStatus.useQuery(
    { clientId },
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      onError: (err) => {
        logger.error({ err, clientId }, "Failed to fetch connection statuses");
        toast({ title: "Error", description: "Could not load connection statuses.", variant: "destructive" });
      }
    }
  );

  // Mutation for disconnecting
  const disconnectMutation = trpc.platformConnections.disconnectPlatform.useMutation({
    onSuccess: (data) => {
      toast({ title: "Success", description: `${PLATFORMS.find(p => p.id === data.platform)?.name} disconnected.` });
      utils.platformConnections.getStatus.invalidate({ clientId }); // Refetch statuses
    },
    onError: (err) => {
      logger.error({ err, clientId, platform: selectedPlatform }, "Failed to disconnect platform");
      toast({ title: "Error", description: `Failed to disconnect: ${err.message}`, variant: "destructive" });
    },
  });

  const handleConnectClick = (platformId: PlatformId) => {
    setSelectedPlatform(platformId);
    setIsModalOpen(true);
  };

  const handleDisconnectClick = (platformId: PlatformId) => {
    if (confirm(`Are you sure you want to disconnect ${PLATFORMS.find(p => p.id === platformId)?.name}? This will stop related automations.`)) {
        setSelectedPlatform(platformId); // Keep track for potential error messages
        disconnectMutation.mutate({ clientId, platformType: platformId });
    }
  };

  const onModalClose = () => {
    setIsModalOpen(false);
    setSelectedPlatform(null);
    // Invalidate query on modal close to refresh status after potential connection
    utils.platformConnections.getStatus.invalidate({ clientId }); 
  };

  // Group platforms for display
  const groupPlatforms = (group: PlatformGroup | 'all') => {
    return PLATFORMS.filter(platform => 
      group === 'all' ? true : platform.group === group
    );
  };

  // Get icon for group tab
  const getGroupIcon = (group: string) => {
    switch (group) {
      case 'monetization':
        return <DollarSign className="h-4 w-4 mr-2" />;
      case 'social':
        return <Share2 className="h-4 w-4 mr-2" />;
      default:
        return <Plug className="h-4 w-4 mr-2" />;
    }
  };

  // Render platform cards
  const renderPlatformCards = (platforms: Platform[]) => {
    if (isLoading) {
      return (
        <div data-testid="loading-skeleton">
          {platforms.map((_, index) => (
            <Skeleton key={index} className="h-16 w-full mb-4" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-red-600 flex items-center">
          <AlertCircle className="mr-2 h-4 w-4" /> Failed to load statuses.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms.map((platform) => {
          const status = statuses?.[platform.id];
          const isConnecting = disconnectMutation.isLoading && disconnectMutation.variables?.platformType === platform.id;
          
          return (
            <div 
              key={platform.id} 
              className="flex flex-col rounded-lg border p-4 dark:border-slate-700 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors shadow-sm hover:shadow-md" 
              data-cy="platform-item" 
              data-testid={`platform-${platform.id}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getPlatformIcon(platform.id as PlatformId)}
                  <div>
                    <p className="font-medium">{platform.name}</p>
                    {status?.connected ? (
                      <Badge variant="success" className="mt-1 badge-success">
                        <CheckCircle className="mr-1 h-3 w-3" /> Connected
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="mt-1">
                        <PowerOff className="mr-1 h-3 w-3" /> Not Connected
                      </Badge>
                    )}
                  </div>
                </div>
                {status?.connected && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Updated {status.lastUpdated ? formatDistanceToNow(status.lastUpdated, { addSuffix: true }) : 'N/A'}
                  </div>
                )}
              </div>
              
              <div className="flex mt-auto pt-2">
                {status?.connected ? (
                  <div className="flex space-x-2 w-full">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleConnectClick(platform.id as PlatformId)}
                      data-cy="update-button"
                      data-testid={`update-${platform.id}`}
                      className="flex-1 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                    >
                      <Edit className="mr-1.5 h-4 w-4" /> Update
                    </Button>
                    <Button 
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDisconnectClick(platform.id as PlatformId)}
                      disabled={isConnecting}
                      data-cy="disconnect-button"
                      data-testid={`disconnect-${platform.id}`}
                      className="flex-1"
                    >
                      {isConnecting ? 
                        <><Clock className="mr-1.5 h-4 w-4 animate-spin" /> Disconnecting...</> :
                        <><PowerOff className="mr-1.5 h-4 w-4" /> Disconnect</> 
                      }
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="default"
                    size="sm"
                    onClick={() => handleConnectClick(platform.id as PlatformId)}
                    data-cy="connect-button"
                    data-testid={`connect-${platform.id}`}
                    className="w-full"
                  >
                    <Power className="mr-1.5 h-4 w-4" /> Connect
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="w-full dark:border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Plug className="mr-2 h-5 w-5" /> Connected Accounts
        </CardTitle>
        <CardDescription>
          Connect your monetization platforms to enable automation features and analytics.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all" className="flex items-center">
              <Plug className="h-4 w-4 mr-2" /> All Platforms
            </TabsTrigger>
            <TabsTrigger value="monetization" className="flex items-center">
              {getGroupIcon('monetization')} Monetization
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center">
              {getGroupIcon('social')} Social
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {renderPlatformCards(PLATFORMS)}
          </TabsContent>
          
          <TabsContent value="monetization" className="space-y-4">
            {renderPlatformCards(groupPlatforms('monetization'))}
          </TabsContent>
          
          <TabsContent value="social" className="space-y-4">
            {renderPlatformCards(groupPlatforms('social'))}
          </TabsContent>
        </Tabs>
        
        {selectedPlatform && (
           <ConnectPlatformModal 
             isOpen={isModalOpen}
             onClose={onModalClose}
             platformType={selectedPlatform}
             clientId={clientId} 
             platformName={PLATFORMS.find(p => p.id === selectedPlatform)?.name || 'Platform'}
             data-testid="connect-platform-modal"
           />
        )}
      </CardContent>
    </Card>
  );
} 