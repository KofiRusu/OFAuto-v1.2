import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlatformConnectionForm } from "./PlatformConnectionForm";

const PLATFORMS = [
  { id: "onlyfans", name: "OnlyFans", icon: "💸" },
  { id: "patreon", name: "Patreon", icon: "🎭" },
  { id: "fansly", name: "Fansly", icon: "👑" },
  { id: "kofi", name: "Ko-fi", icon: "☕" },
];

interface PlatformConnectionsProps {
  clientId: string;
}

export function PlatformConnections({ clientId }: PlatformConnectionsProps) {
  const { toast } = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Get tRPC utils for cache invalidation
  const utils = trpc.useUtils();

  // Query platform connection statuses
  const { 
    data: statuses, 
    isLoading: statusesLoading,
    error: statusesError 
  } = trpc.platform.getStatus.useQuery(
    { 
      clientId 
    },
    {
      // Don't refetch on window focus to avoid flickering
      refetchOnWindowFocus: false,
      // But do refetch if the component remounts
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );

  // Delete platform connection mutation
  const deletePlatform = trpc.platform.delete.useMutation({
    onSuccess: () => {
      // Invalidate the status query to refetch the data
      utils.platform.getStatus.invalidate({ clientId });
      toast({
        title: "Platform disconnected",
        description: "The platform has been successfully disconnected.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error disconnecting platform",
        description: error.message || "An error occurred while disconnecting the platform.",
        variant: "destructive",
      });
    },
  });

  const handleDisconnect = (platformType: string) => {
    if (window.confirm(`Are you sure you want to disconnect ${platformType}?`)) {
      deletePlatform.mutate({ 
        clientId,
        platformType,
      });
    }
  };

  const openConnectModal = (platformId: string) => {
    setSelectedPlatform(platformId);
    setIsOpen(true);
  };

  const handleConnectSuccess = () => {
    setIsOpen(false);
    utils.platform.getStatus.invalidate({ clientId });
    toast({
      title: "Platform connected",
      description: "The platform has been successfully connected.",
    });
  };

  if (statusesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Platforms</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (statusesError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Platforms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 text-red-600 p-4 rounded-md">
            Error loading platform connections: {statusesError.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Platforms</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORMS.map((platform) => {
            const status = statuses?.[platform.id];
            const isConnected = status?.status === "connected";

            return (
              <div 
                key={platform.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{platform.icon}</div>
                  <div>
                    <div className="font-medium">{platform.name}</div>
                    <div className="text-sm text-gray-500">
                      {isConnected ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Connected
                        </span>
                      ) : (
                        <span className="flex items-center text-gray-500">
                          <XCircle className="h-4 w-4 mr-1" />
                          Not connected
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isConnected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={deletePlatform.isPending}
                    onClick={() => handleDisconnect(platform.id)}
                  >
                    {deletePlatform.isPending && platform.id === deletePlatform.variables?.platformType ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : null}
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openConnectModal(platform.id)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Connect
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Connect {PLATFORMS.find(p => p.id === selectedPlatform)?.name || "Platform"}
              </DialogTitle>
            </DialogHeader>
            {selectedPlatform && (
              <PlatformConnectionForm
                clientId={clientId}
                platformType={selectedPlatform}
                onSuccess={handleConnectSuccess}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
} 