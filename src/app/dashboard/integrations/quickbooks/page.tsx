"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { trpc } from "@/lib/trpc/client";
import { getAuthorizationUrl } from "@/lib/services/quickBooksService";
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { ConnectionStatusBadge } from "@/components/status-badges";

export default function QuickBooksIntegrationPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get the OAuth code and state from the URL if present (after redirect)
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  
  // Get available clients
  const { data: clients, isLoading: loadingClients } = trpc.client.getAll.useQuery();
  
  // Get QuickBooks status if a client is selected
  const { 
    data: quickBooksStatus, 
    isLoading: loadingStatus,
    refetch: refetchStatus 
  } = trpc.quickBooks.getQuickBooksStatus.useQuery(
    { clientId: selectedClientId },
    { enabled: !!selectedClientId }
  );

  // QuickBooks connection mutation
  const connectMutation = trpc.quickBooks.connectQuickBooks.useMutation({
    onSuccess: () => {
      setIsConnecting(false);
      toast({
        title: "QuickBooks connected successfully",
        description: "Your QuickBooks account is now connected.",
        variant: "default",
      });
      refetchStatus();
    },
    onError: (error) => {
      setIsConnecting(false);
      toast({
        title: "Failed to connect QuickBooks",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // QuickBooks token refresh mutation
  const refreshTokenMutation = trpc.quickBooks.refreshQuickBooksToken.useMutation({
    onSuccess: () => {
      setIsRefreshing(false);
      toast({
        title: "QuickBooks token refreshed",
        description: "Your QuickBooks tokens have been refreshed.",
        variant: "default",
      });
      refetchStatus();
    },
    onError: (error) => {
      setIsRefreshing(false);
      toast({
        title: "Failed to refresh QuickBooks token",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Effect to handle OAuth redirect with code
  useEffect(() => {
    if (code && selectedClientId) {
      // Exchange code for tokens
      setIsConnecting(true);
      connectMutation.mutate({
        clientId: selectedClientId,
        realmId: state || "", // In a real impl, realmId would come from the redirect
        accessToken: "", // These would come from the exchangeOAuthCode service
        refreshToken: "",
        expiresIn: 3600,
      });
      
      // Clear the URL params
      router.push("/dashboard/integrations/quickbooks");
    }
  }, [code, selectedClientId, connectMutation, router, state]);

  // Initiate QuickBooks connection
  const handleConnectQuickBooks = () => {
    if (!selectedClientId) {
      toast({
        title: "Please select a client",
        description: "You need to select a client before connecting to QuickBooks.",
        variant: "destructive",
      });
      return;
    }

    // In a real implementation, we would redirect to QuickBooks OAuth
    const authUrl = getAuthorizationUrl();
    window.location.href = authUrl;
  };

  // Refresh QuickBooks token
  const handleRefreshToken = () => {
    if (!selectedClientId || !quickBooksStatus) {
      toast({
        title: "No active connection",
        description: "There is no active QuickBooks connection to refresh.",
        variant: "destructive",
      });
      return;
    }

    setIsRefreshing(true);
    // In a real implementation, we would get the refresh token from the DB
    refreshTokenMutation.mutate({
      refreshToken: "sample-refresh-token", // This would come from the database
    });
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">QuickBooks Integration</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Select Client</CardTitle>
          <CardDescription>
            Choose which client you want to connect to QuickBooks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedClientId}
            onValueChange={setSelectedClientId}
            disabled={loadingClients}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {clients?.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedClientId && (
        <Card>
          <CardHeader>
            <CardTitle>QuickBooks Connection</CardTitle>
            <CardDescription>
              Manage your QuickBooks integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStatus ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Checking connection status...</span>
              </div>
            ) : quickBooksStatus ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Connection Status:</span>
                  <ConnectionStatusBadge status={quickBooksStatus.status} />
                </div>
                {quickBooksStatus.connectedAt && (
                  <div>
                    <span className="font-semibold">Connected since:</span>{" "}
                    {new Date(quickBooksStatus.connectedAt).toLocaleString()}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span>Not connected to QuickBooks</span>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              onClick={handleConnectQuickBooks}
              disabled={isConnecting || !selectedClientId}
            >
              {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {quickBooksStatus?.status === "CONNECTED"
                ? "Reconnect to QuickBooks"
                : "Connect to QuickBooks"}
            </Button>
            {quickBooksStatus?.status === "CONNECTED" && (
              <Button
                variant="outline"
                onClick={handleRefreshToken}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh Connection
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
} 