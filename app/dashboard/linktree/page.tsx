"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Icons } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { LinktreeEditor } from "@/app/components/LinktreeEditor";
import { LinkItem } from "@/lib/schemas/linktree";

export default function ModelLinktreePage() {
  const { userId } = useAuth();
  const [selectedTab, setSelectedTab] = useState("edit");
  
  // Fetch the user's linktree configuration
  const { 
    data: linktreeConfig, 
    isLoading: loadingConfig,
    refetch: refetchConfig
  } = trpc.linktree.getLinktreeConfig.useQuery(
    {},
    {
      enabled: !!userId,
    }
  );
  
  // Fetch the user's profile (for preview)
  const { data: userProfile } = trpc.user.getProfile.useQuery();
  
  // Update linktree mutation
  const updateLinktree = trpc.linktree.updateLinktreeConfig.useMutation({
    onSuccess: () => {
      toast.success("Linktree updated successfully");
      refetchConfig();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update linktree");
    },
  });
  
  // Generate suggestions mutation
  const generateSuggestions = trpc.linktree.generateLinktreeSuggestions.useMutation({
    onError: (error) => {
      toast.error(error.message || "Failed to generate suggestions");
    },
  });
  
  // Handler for saving linktree updates
  const handleSaveLinktree = async (data: { links: LinkItem[]; theme?: string }) => {
    if (!userId) return;
    updateLinktree.mutate(data);
  };
  
  // Handler for generating suggestions
  const handleGenerateSuggestions = async (): Promise<LinkItem[]> => {
    if (!userId) return [];
    
    const result = await generateSuggestions.mutateAsync({ userId });
    return result.suggestions;
  };
  
  // Generate shareable link
  const shareableLink = userId ? `${window.location.origin}/linktree/${userId}` : '';
  
  // Copy shareable link to clipboard
  const copyShareableLink = () => {
    if (shareableLink) {
      navigator.clipboard.writeText(shareableLink);
      toast.success("Link copied to clipboard");
    }
  };
  
  if (loadingConfig) {
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
          <h1 className="text-3xl font-bold tracking-tight">My Linktree</h1>
        </div>
        
        {/* Shareable link */}
        <Card>
          <CardHeader>
            <CardTitle>Share Your Linktree</CardTitle>
            <CardDescription>
              Share this link with your audience
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <div className="flex-1 truncate text-sm font-medium">
              {shareableLink}
            </div>
            <Button size="sm" onClick={copyShareableLink}>
              <Icons.copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </CardContent>
        </Card>
        
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
                  Configure your Linktree profile with links to your social media and other pages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LinktreeEditor
                  initialLinks={linktreeConfig?.links as LinkItem[] || []}
                  initialTheme={linktreeConfig?.theme}
                  onSave={handleSaveLinktree}
                  onRequestSuggestions={handleGenerateSuggestions}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preview" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Linktree Preview</CardTitle>
                <CardDescription>
                  Preview how your Linktree will look to visitors
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {!linktreeConfig?.links || (linktreeConfig.links as LinkItem[]).length === 0 ? (
                  <Alert className="max-w-md">
                    <AlertTitle>No links configured</AlertTitle>
                    <AlertDescription>
                      You don't have any links configured yet. Add links in the Edit tab.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="w-full max-w-md space-y-4 py-6">
                    <div className="flex flex-col items-center mb-8">
                      {userProfile?.avatar ? (
                        <img 
                          src={userProfile.avatar} 
                          alt={userProfile.name || "Profile"} 
                          className="h-20 w-20 rounded-full object-cover mb-4"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-full bg-gray-200 mb-4" />
                      )}
                      <h2 className="text-xl font-bold">
                        {userProfile?.name || "Your Linktree"}
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
      </div>
    </div>
  );
} 