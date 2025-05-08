"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icons } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/spinner";
import { toast } from "@/components/ui/use-toast";
import Forbidden from "@/components/forbidden";

export default function PlatformAccessPage() {
  const router = useRouter();
  const { userId, sessionClaims } = useAuth();
  
  // Get the user role from sessionClaims
  const userRole = sessionClaims?.userRole || "USER";
  
  // Check if the user has manager or admin access
  const hasAccess = userRole === "MANAGER" || userRole === "ADMIN";

  // State for selected model (user)
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");

  // Query to get all models (users with MODEL role)
  const {
    data: modelsData,
    isLoading: isLoadingModels,
  } = trpc.user.getUsers.useQuery(
    {
      role: "MODEL",
    },
    {
      enabled: hasAccess,
    }
  );

  // Query to get platforms for the selected model
  const {
    data: platformsData,
    isLoading: isLoadingPlatforms,
    refetch: refetchPlatforms,
  } = trpc.platformAccess.getUserPlatforms.useQuery(
    {
      userId: selectedModelId,
      includeUnapproved: true,
    },
    {
      enabled: hasAccess && !!selectedModelId,
    }
  );

  // Mutation to set platform approval
  const setPlatformApprovalMutation = trpc.platformAccess.setPlatformApproval.useMutation({
    onSuccess: () => {
      refetchPlatforms();
      toast({
        title: "Platform access updated",
        description: "The platform access has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating platform access",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to initialize platform access for a user
  const initializePlatformAccessMutation = trpc.platformAccess.initializePlatformAccess.useMutation({
    onSuccess: () => {
      refetchPlatforms();
      toast({
        title: "Platform access initialized",
        description: "Platform access has been set up for this model.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error initializing platform access",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle toggling platform approval
  const handleToggleApproval = (platformId: string, userId: string, currentlyApproved: boolean) => {
    setPlatformApprovalMutation.mutate({
      platformId,
      userId,
      approved: !currentlyApproved,
    });
  };

  // Handle initializing platform access
  const handleInitializePlatformAccess = () => {
    if (!selectedModelId) return;
    
    initializePlatformAccessMutation.mutate({
      userId: selectedModelId,
      defaultApproval: false,
    });
  };

  // Filter models by search query
  const filteredModels = modelsData?.users.filter(model => 
    model.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // If user has no access, show forbidden page
  if (!hasAccess) {
    return <Forbidden />;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Platform Access Management</h1>
        <Button variant="outline" onClick={() => router.push('/dashboard/admin')}>
          <Icons.arrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Selection Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Models</CardTitle>
            <CardDescription>Select a model to manage platform access</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-2"
              />
            </div>
            
            {isLoadingModels ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : filteredModels && filteredModels.length > 0 ? (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {filteredModels.map(model => (
                  <div 
                    key={model.id} 
                    className={`p-3 rounded cursor-pointer transition-colors ${
                      selectedModelId === model.id ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted'
                    }`}
                    onClick={() => setSelectedModelId(model.id)}
                  >
                    <div className="font-medium">{model.name || "Unnamed"}</div>
                    <div className="text-sm opacity-80">{model.email}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No models found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Platform Access Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Platform Access</CardTitle>
                <CardDescription>
                  {selectedModelId ? "Manage which platforms this model can access" : "Select a model to manage platform access"}
                </CardDescription>
              </div>
              {selectedModelId && (
                <Button 
                  size="sm" 
                  onClick={handleInitializePlatformAccess}
                  disabled={initializePlatformAccessMutation.isLoading}
                >
                  {initializePlatformAccessMutation.isLoading ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <Icons.refresh className="mr-2 h-4 w-4" />
                      Initialize Access
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedModelId ? (
              <div className="text-center py-12 text-gray-500">
                <Icons.user className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium">No model selected</h3>
                <p className="mt-1">Select a model from the left panel to manage their platform access.</p>
              </div>
            ) : isLoadingPlatforms || setPlatformApprovalMutation.isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : platformsData?.platformAccess && platformsData.platformAccess.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Platform</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Access</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {platformsData.platformAccess.map(access => (
                    <TableRow key={access.id}>
                      <TableCell className="font-medium">
                        {access.platform?.name || "Unknown Platform"}
                        {access.platform?.username && (
                          <div className="text-xs text-muted-foreground">
                            @{access.platform.username}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {access.platform?.type || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            access.platform?.status === 'ACTIVE' ? 'success' :
                            access.platform?.status === 'ERROR' ? 'destructive' :
                            access.platform?.status === 'PENDING' ? 'warning' :
                            'outline'
                          }
                        >
                          {access.platform?.status || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={access.approved}
                          onCheckedChange={() => 
                            handleToggleApproval(access.platformId, access.userId, access.approved)
                          }
                          disabled={setPlatformApprovalMutation.isLoading}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Icons.inbox className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium">No platforms found</h3>
                <p className="mt-1">
                  This model doesn't have any platform access records. 
                  Click "Initialize Access" to set up platform access.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 