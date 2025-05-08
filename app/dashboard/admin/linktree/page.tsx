"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Icons } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LinktreeEditor } from "@/app/components/LinktreeEditor";
import { LinkItem } from "@/lib/schemas/linktree";
import { UserRole } from "@prisma/client";

export default function LinktreeManagementPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId } = useAuth();
  const selectedUserId = searchParams.get("userId") || userId;
  
  const [selectedTab, setSelectedTab] = useState("edit");
  const [selectedUser, setSelectedUser] = useState<string | null>(selectedUserId);
  
  // Fetch users (for admin/manager to select which user's linktree to edit)
  const { data: users, isLoading: loadingUsers } = trpc.user.list.useQuery(
    { role: UserRole.MODEL },
    {
      enabled: true,
    }
  );
  
  // Fetch the selected user's linktree configuration
  const { 
    data: linktreeConfig, 
    isLoading: loadingConfig,
    refetch: refetchConfig
  } = trpc.linktree.getLinktreeConfig.useQuery(
    { userId: selectedUser || undefined },
    {
      enabled: !!selectedUser,
    }
  );
  
  // Update linktree mutation
  const updateLinktree = trpc.linktree.updateLinktreeConfig.useMutation({
    onSuccess: () => {
      toast({
        title: "Linktree updated",
        description: "The linktree configuration has been saved successfully.",
      });
      refetchConfig();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update linktree configuration",
        variant: "destructive",
      });
    },
  });
  
  // Generate suggestions mutation
  const generateSuggestions = trpc.linktree.generateLinktreeSuggestions.useMutation({
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate suggestions",
        variant: "destructive",
      });
    },
  });
  
  // Update URL when selected user changes
  useEffect(() => {
    if (selectedUser && selectedUser !== searchParams.get("userId")) {
      router.push(`/dashboard/admin/linktree?userId=${selectedUser}`);
    }
  }, [selectedUser, router, searchParams]);
  
  // Handler for saving linktree updates
  const handleSaveLinktree = async (data: { links: LinkItem[]; theme?: string }) => {
    updateLinktree.mutate(data);
  };
  
  // Handler for generating suggestions
  const handleGenerateSuggestions = async (): Promise<LinkItem[]> => {
    if (!selectedUser) {
      toast({
        title: "Error",
        description: "No user selected",
        variant: "destructive",
      });
      return [];
    }
    
    const result = await generateSuggestions.mutateAsync({ userId: selectedUser });
    return result.suggestions;
  };
  
  // Handler for user selection
  const handleUserChange = (userId: string) => {
    setSelectedUser(userId);
  };
  
  // Loading state
  if (loadingUsers) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center min-h-[400px]">
          <Icons.spinner className="h-10 w-10 animate-spin" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-10">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Linktree Management</h1>
        </div>
        
        {/* User selection for managers/admins */}
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Select User</CardTitle>
              <CardDescription>
                Choose which user's Linktree configuration to manage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedUser || undefined} onValueChange={handleUserChange}>
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email || user.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
        
        {selectedUser && (
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">Edit Linktree</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="edit" className="mt-6">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Linktree Configuration</CardTitle>
                  <CardDescription>
                    Configure the selected user's Linktree profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingConfig ? (
                    <div className="flex justify-center py-10">
                      <Icons.spinner className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    <LinktreeEditor
                      initialLinks={linktreeConfig?.links as LinkItem[] || []}
                      initialTheme={linktreeConfig?.theme}
                      onSave={handleSaveLinktree}
                      onRequestSuggestions={handleGenerateSuggestions}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="preview" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Linktree Preview</CardTitle>
                  <CardDescription>
                    Preview how the Linktree will look to visitors
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  {!linktreeConfig?.links || (linktreeConfig.links as LinkItem[]).length === 0 ? (
                    <Alert className="max-w-md">
                      <AlertTitle>No links configured</AlertTitle>
                      <AlertDescription>
                        This user doesn't have any links configured yet. Add links in the Edit tab.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="w-full max-w-md space-y-4 py-6">
                      <div className="flex flex-col items-center mb-8">
                        <div className="h-20 w-20 rounded-full bg-gray-200 mb-4" />
                        <h2 className="text-xl font-bold">
                          {users?.find(user => user.id === selectedUser)?.name || "User's Linktree"}
                        </h2>
                      </div>
                      
                      {/* Links preview */}
                      <div className="space-y-3">
                        {(linktreeConfig.links as LinkItem[]).map((link, index) => (
                          <Button 
                            key={index}
                            variant="outline" 
                            className="w-full py-6 text-lg"
                            onClick={() => window.open(link.url, "_blank")}
                          >
                            {link.title}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
} 