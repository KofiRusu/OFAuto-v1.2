"use client";

import { trpc } from "@/lib/trpc/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IdeaGenerator } from "@/app/components/campaign-chatbot/IdeaGenerator";
import { useState } from "react";
import { CampaignIdeaRequest } from "@/lib/schemas/campaignChatbot";
import { toast } from "sonner";

export default function CampaignChatbotPage() {
  const [activeTab, setActiveTab] = useState("basic");
  
  // Basic idea generation mutation
  const basicIdeasMutation = trpc.campaignChatbot.generateCampaignIdeas.useMutation({
    onError: (error) => {
      toast.error(error.message || "Failed to generate campaign ideas");
    },
  });
  
  // Advanced idea generation mutation (manager only)
  const advancedIdeasMutation = trpc.campaignChatbot.generateAdvancedCampaignIdeas.useMutation({
    onError: (error) => {
      toast.error(error.message || "Failed to generate advanced campaign ideas");
    },
  });
  
  // Handler for basic idea generation
  const handleBasicGenerate = async (input: CampaignIdeaRequest) => {
    const result = await basicIdeasMutation.mutateAsync(input);
    return result.ideas;
  };
  
  // Handler for advanced idea generation
  const handleAdvancedGenerate = async (input: CampaignIdeaRequest) => {
    const result = await advancedIdeasMutation.mutateAsync(input);
    return result.ideas;
  };
  
  return (
    <div className="container py-10">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaign Chatbot</h1>
          <p className="text-muted-foreground">
            Generate creative campaign ideas for your content creators using AI.
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Generator</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Generator</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="mt-6">
            <IdeaGenerator onGenerate={handleBasicGenerate} />
          </TabsContent>
          
          <TabsContent value="advanced" className="mt-6">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Advanced Campaign Generator</CardTitle>
                <CardDescription>
                  Our advanced generator provides more detailed campaign ideas with implementation strategies,
                  competitive analysis, and budget considerations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Use the advanced fields below to get highly tailored campaign ideas for your content creators.
                  The more detailed your input, the better the generated ideas will be.
                </p>
              </CardContent>
            </Card>
            
            <IdeaGenerator 
              onGenerate={handleAdvancedGenerate} 
              isAdvanced={true} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 