"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IdeaGenerator } from "@/app/components/campaign-chatbot/IdeaGenerator";
import { CampaignIdeaRequest } from "@/lib/schemas/campaignChatbot";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";

export default function ModelCampaignChatbotPage() {
  // Only basic idea generation is available for models
  const basicIdeasMutation = trpc.campaignChatbot.generateCampaignIdeas.useMutation({
    onError: (error) => {
      toast.error(error.message || "Failed to generate campaign ideas");
    },
  });
  
  // Handler for idea generation
  const handleGenerate = async (input: CampaignIdeaRequest) => {
    const result = await basicIdeasMutation.mutateAsync(input);
    return result.ideas;
  };
  
  return (
    <div className="container py-10">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaign Ideas Generator</h1>
          <p className="text-muted-foreground">
            Get AI-powered campaign ideas to boost your content strategy.
          </p>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Campaign Ideas Generator</span>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/admin/campaign-chatbot'}>
                <Icons.crown className="h-4 w-4 mr-2 text-yellow-500" />
                Upgrade to Advanced
              </Button>
            </CardTitle>
            <CardDescription>
              Get simple campaign ideas to inspire your content strategy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-4">
              <p>
                With the basic generator, you can get up to 3 campaign ideas per generation.
                Upgrade to the advanced generator for:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>More detailed campaign ideas (5+ ideas per generation)</li>
                <li>Implementation strategies for each idea</li>
                <li>Advanced audience targeting options</li>
                <li>Budget-specific campaign suggestions</li>
                <li>Platform-optimized content strategies</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        
        <IdeaGenerator onGenerate={handleGenerate} />
      </div>
    </div>
  );
} 