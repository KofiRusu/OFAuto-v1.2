"use client";

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { CampaignIdeaRequestSchema, CampaignIdeaRequest, CampaignIdea } from '@/lib/schemas/campaignChatbot';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Icons } from '@/components/ui/icons';
import { IdeaCard } from './IdeaCard';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface IdeaGeneratorProps {
  onGenerate: (input: CampaignIdeaRequest) => Promise<CampaignIdea[]>;
  isAdvanced?: boolean;
}

export function IdeaGenerator({ onGenerate, isAdvanced = false }: IdeaGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState<CampaignIdea[]>([]);
  
  const form = useForm<CampaignIdeaRequest>({
    resolver: zodResolver(CampaignIdeaRequestSchema),
    defaultValues: {
      context: '',
      platform: undefined,
      targetAudience: undefined,
      budget: undefined,
      goals: undefined,
    },
  });
  
  const onSubmit = async (data: CampaignIdeaRequest) => {
    try {
      setIsGenerating(true);
      setIdeas([]);
      
      const generatedIdeas = await onGenerate(data);
      setIdeas(generatedIdeas);
    } catch (error) {
      console.error('Error generating ideas:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleRemoveIdea = (index: number) => {
    setIdeas(current => current.filter((_, i) => i !== index));
  };

  // Common platforms for content creators
  const platforms = [
    'Instagram',
    'TikTok',
    'Twitter',
    'OnlyFans',
    'YouTube',
    'Twitch',
  ];
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{isAdvanced ? 'Advanced Campaign Idea Generator' : 'Campaign Idea Generator'}</CardTitle>
          <CardDescription>
            {isAdvanced 
              ? 'Generate detailed campaign ideas with implementation strategies tailored to your needs.' 
              : 'Describe your campaign needs and get AI-generated ideas to inspire your next campaign.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="context"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Context</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what type of campaign you're looking for. Include details about your content style, audience, goals, etc."
                        {...field}
                        rows={5}
                      />
                    </FormControl>
                    <FormDescription>
                      The more details you provide, the better the generated ideas will be.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform (Optional)</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a platform" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {platforms.map((platform) => (
                            <SelectItem key={platform} value={platform}>
                              {platform}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Platform to focus the campaign on
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {isAdvanced && (
                  <FormField
                    control={form.control}
                    name="targetAudience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Audience (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 18-35 year old males interested in fitness"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Describe your target audience
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              {isAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 500"
                            onChange={(e) => {
                              const value = e.target.value ? Number(e.target.value) : undefined;
                              field.onChange(value);
                            }}
                            value={field.value?.toString() || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Approximate budget in USD
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="goals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Goals (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., increase subscribers by 20%"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          What you hope to achieve
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isGenerating}
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Generating Ideas...
                  </>
                ) : (
                  <>
                    <Icons.sparkles className="mr-2 h-4 w-4" />
                    Generate Campaign Ideas
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {ideas.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">Generated Ideas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ideas.map((idea, index) => (
              <IdeaCard
                key={index}
                title={idea.title}
                description={idea.description}
                onDiscard={() => handleRemoveIdea(index)}
                onSave={() => {}}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 