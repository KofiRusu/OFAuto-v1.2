"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/components/ui/icons";
import { TriggerTypeEnum, ActionTypeEnum } from "@/lib/schemas/chatbotAutomation";

export default function ChatbotAutomationFromPromptPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState("generate");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Query to get available personas
  const { data: personasData, isLoading: isLoadingPersonas } = 
    trpc.chatbotPersona.getPersonas.useQuery();

  // Mutation to create automation from prompt
  const createAutomationMutation = trpc.chatbotAutomation.createFromPrompt.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Automation created successfully!",
        description: `Created "${data.automation.name}" from your prompt.`,
      });
      router.push(`/dashboard/admin/chatbot-automation?id=${data.automation.id}`);
    },
    onError: (error) => {
      toast({
        title: "Failed to create automation",
        description: error.message,
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  // Query to get suggestions from prompt
  const { data: suggestionsData, refetch: refetchSuggestions, isLoading: isLoadingSuggestions } = 
    trpc.chatbotAutomation.listFromPrompt.useQuery(
      { prompt, count: 3 },
      { enabled: false }
    );

  // Handle prompt input change
  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  }, []);

  // Handle persona selection change
  const handlePersonaChange = useCallback((value: string) => {
    setSelectedPersonaId(value);
  }, []);

  // Handle generate suggestions button
  const handleGenerateSuggestions = useCallback(async () => {
    if (!prompt || prompt.trim().length < 10) {
      toast({
        title: "Prompt too short",
        description: "Please provide a more detailed prompt (at least 10 characters).",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    await refetchSuggestions();
    setActiveTab("suggestions");
    setIsGenerating(false);
  }, [prompt, refetchSuggestions, toast]);

  // Handle create automation button
  const handleCreateAutomation = useCallback(() => {
    if (!prompt || prompt.trim().length < 10) {
      toast({
        title: "Prompt too short",
        description: "Please provide a more detailed prompt (at least 10 characters).",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    createAutomationMutation.mutate({
      prompt,
      personaId: selectedPersonaId,
    });
  }, [prompt, selectedPersonaId, createAutomationMutation, toast]);

  // Handle using a suggestion
  const handleUseSuggestion = useCallback((suggestion: any) => {
    setPrompt((prevPrompt) => 
      `${prevPrompt}\n\nCreate a "${suggestion.name}" automation that ${suggestion.description} with trigger type ${suggestion.triggerType}.`
    );
    setActiveTab("generate");
  }, []);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Generate Chatbot Automation</h1>
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/admin/chatbot-automation')}
        >
          <Icons.arrowLeft className="mr-2 h-4 w-4" /> Back to Automations
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Natural Language Prompt</CardTitle>
              <CardDescription>
                Describe the automation you want to create in detail. Include the trigger conditions,
                actions, and any specific behaviors.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Example: Create an automation that sends a welcome message when a new user signs up, then follows up with platform tips 1 day later."
                value={prompt}
                onChange={handlePromptChange}
                rows={10}
                className="resize-none mb-4"
              />
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Persona (Optional)</label>
                  <Select 
                    value={selectedPersonaId} 
                    onValueChange={handlePersonaChange}
                    disabled={isLoadingPersonas}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a persona" />
                    </SelectTrigger>
                    <SelectContent>
                      {personasData?.personas?.map((persona) => (
                        <SelectItem key={persona.id} value={persona.id}>
                          {persona.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleGenerateSuggestions}
                disabled={isGenerating || isLoadingSuggestions || prompt.trim().length < 10}
              >
                {isGenerating || isLoadingSuggestions ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Generating Ideas...
                  </>
                ) : (
                  <>
                    <Icons.lightbulb className="mr-2 h-4 w-4" />
                    Generate Ideas
                  </>
                )}
              </Button>
              <Button
                onClick={handleCreateAutomation}
                disabled={isSaving || prompt.trim().length < 10}
              >
                {isSaving ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Icons.plus className="mr-2 h-4 w-4" />
                    Create Automation
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="generate">How It Works</TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            </TabsList>
            <TabsContent value="generate">
              <Card>
                <CardHeader>
                  <CardTitle>How to Generate Automations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Step 1: Describe Your Automation</h3>
                    <p className="text-sm text-muted-foreground">
                      Write a detailed prompt explaining what your automation should do.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Step 2: Choose a Persona (Optional)</h3>
                    <p className="text-sm text-muted-foreground">
                      Select a persona to associate with this automation.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Step 3: Generate & Create</h3>
                    <p className="text-sm text-muted-foreground">
                      Either create the automation directly or generate ideas first.
                    </p>
                  </div>
                  <div className="pt-4 border-t">
                    <h4 className="font-medium">Prompt Tips:</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      <li>Specify when the automation should trigger</li>
                      <li>Describe what actions it should take</li>
                      <li>Include any conditions or timing requirements</li>
                      <li>Mention personalization or dynamic content needs</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="suggestions">
              <Card>
                <CardHeader>
                  <CardTitle>Automation Suggestions</CardTitle>
                  <CardDescription>
                    Based on your prompt, here are some automation ideas.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingSuggestions ? (
                    <div className="py-8 flex justify-center">
                      <Icons.spinner className="h-8 w-8 animate-spin" />
                    </div>
                  ) : suggestionsData?.suggestions?.length ? (
                    <div className="space-y-4">
                      {suggestionsData.suggestions.map((suggestion, index) => (
                        <Card key={index} className="overflow-hidden">
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-md">{suggestion.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <p className="text-sm text-muted-foreground mb-2">
                              {suggestion.description}
                            </p>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <span className="bg-slate-100 px-2 py-1 rounded">
                                {suggestion.triggerType}
                              </span>
                            </div>
                          </CardContent>
                          <div className="bg-slate-50 p-3 border-t flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUseSuggestion(suggestion)}
                            >
                              Use This Idea
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <Icons.inbox className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                      <h3 className="mt-2 text-sm font-medium">No suggestions yet</h3>
                      <p className="text-xs text-muted-foreground">
                        Enter a detailed prompt and click "Generate Ideas"
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 