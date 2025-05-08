'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Brain, 
  Sparkles, 
  CalendarDays, 
  ArrowUpDown, 
  DollarSign, 
  BarChart3,
  MessageSquare,
  Check, 
  X, 
  Clock, 
  Loader2,
  Plus,
  CheckCircle2,
  CircleX,
  CircleClock,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Flag
} from 'lucide-react';
import { trpc } from "@/lib/trpc/client";
import { formatDistanceToNow } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { InsightItem, InsightType } from '@/lib/services/reasoningService';

interface InsightsSectionProps {
  clientId: string;
}

export default function InsightsSection({ clientId }: InsightsSectionProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const [insightTypeToGenerate, setInsightTypeToGenerate] = useState<InsightType | null>(null);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  
  const utils = trpc.useContext();
  
  // Fetch insights
  const { data: insights, isLoading, error } = trpc.insights.getAll.useQuery(
    { clientId },
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      onError: (err) => {
        toast({ title: "Error", description: "Failed to fetch insights.", variant: "destructive" });
      }
    }
  );
  
  // Generate insight mutation
  const generateInsightMutation = trpc.insights.generate.useMutation({
    onSuccess: (data) => {
      toast({ title: "Success", description: `New ${data.type} insight generated.` });
      utils.insights.getAll.invalidate({ clientId });
      setIsGenerateDialogOpen(false);
    },
    onError: (err) => {
      toast({ title: "Error", description: `Failed to generate insight: ${err.message}`, variant: "destructive" });
    },
    onSettled: () => {
      setIsGenerating(false);
    }
  });
  
  // Update insight status mutation
  const updateStatusMutation = trpc.insights.updateStatus.useMutation({
    onSuccess: (data) => {
      toast({ title: "Success", description: `Insight status updated to ${data.status}.` });
      utils.insights.getAll.invalidate({ clientId });
    },
    onError: (err) => {
      toast({ title: "Error", description: `Failed to update insight status: ${err.message}`, variant: "destructive" });
    }
  });
  
  const handleGenerateInsight = (type: InsightType) => {
    setIsGenerating(true);
    setInsightTypeToGenerate(type);
    generateInsightMutation.mutate({ clientId, type });
  };
  
  const handleUpdateStatus = (insightId: string, status: 'pending' | 'accepted' | 'rejected' | 'implemented') => {
    updateStatusMutation.mutate({ clientId, insightId, status });
  };
  
  const toggleExpandInsight = (insightId: string) => {
    if (expandedInsight === insightId) {
      setExpandedInsight(null);
    } else {
      setExpandedInsight(insightId);
    }
  };
  
  const getFilteredInsights = () => {
    if (!insights) return [];
    
    if (activeTab === 'all') return insights;
    
    return insights.filter(insight => insight.type === activeTab);
  };
  
  // Get icon for insight type
  const getInsightTypeIcon = (type: InsightType) => {
    switch (type) {
      case InsightType.CONTENT_STRATEGY:
        return <Sparkles className="h-5 w-5 text-purple-500 dark:text-purple-400" />;
      case InsightType.PRICING_OPTIMIZATION:
        return <DollarSign className="h-5 w-5 text-green-500 dark:text-green-400" />;
      case InsightType.POSTING_SCHEDULE:
        return <CalendarDays className="h-5 w-5 text-blue-500 dark:text-blue-400" />;
      case InsightType.PLATFORM_STRATEGY:
        return <ArrowUpDown className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />;
      case InsightType.ENGAGEMENT_TACTICS:
        return <MessageSquare className="h-5 w-5 text-pink-500 dark:text-pink-400" />;
      case InsightType.REVENUE_GROWTH:
        return <BarChart3 className="h-5 w-5 text-amber-500 dark:text-amber-400" />;
      default:
        return <Lightbulb className="h-5 w-5 text-gray-500 dark:text-gray-400" />;
    }
  };
  
  // Get badge for insight status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'implemented':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Implemented
          </Badge>
        );
      case 'accepted':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            <Check className="mr-1 h-3 w-3" /> Accepted
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <CircleX className="mr-1 h-3 w-3" /> Rejected
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <CircleClock className="mr-1 h-3 w-3" /> Pending
          </Badge>
        );
    }
  };
  
  // Format insight type for display
  const formatInsightType = (type: string) => {
    return type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  
  const insightTypes = [
    { value: InsightType.CONTENT_STRATEGY, label: "Content Strategy", icon: <Sparkles className="h-4 w-4" /> },
    { value: InsightType.PRICING_OPTIMIZATION, label: "Pricing Optimization", icon: <DollarSign className="h-4 w-4" /> },
    { value: InsightType.POSTING_SCHEDULE, label: "Posting Schedule", icon: <CalendarDays className="h-4 w-4" /> },
    { value: InsightType.PLATFORM_STRATEGY, label: "Platform Strategy", icon: <ArrowUpDown className="h-4 w-4" /> },
    { value: InsightType.ENGAGEMENT_TACTICS, label: "Engagement Tactics", icon: <MessageSquare className="h-4 w-4" /> },
    { value: InsightType.REVENUE_GROWTH, label: "Revenue Growth", icon: <BarChart3 className="h-4 w-4" /> },
  ];
  
  const filteredInsights = getFilteredInsights();
  
  return (
    <Card className="w-full dark:border-slate-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Brain className="mr-2 h-5 w-5" /> AI Insights
            </CardTitle>
            <CardDescription>
              AI-powered recommendations to optimize your content and platform strategy.
            </CardDescription>
          </div>
          <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" /> Generate Insight
              </Button>
            </DialogTrigger>
            <DialogContent className="dark:bg-slate-900 dark:border-slate-800">
              <DialogHeader>
                <DialogTitle>Generate a New Insight</DialogTitle>
                <DialogDescription>
                  Choose the type of insight you want to generate based on your platform data.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-4">
                {insightTypes.map((type) => (
                  <Button
                    key={type.value}
                    variant="outline"
                    className="justify-start px-4 py-6 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                    onClick={() => handleGenerateInsight(type.value)}
                    disabled={isGenerating}
                  >
                    <div className="flex flex-col items-start">
                      <div className="flex items-center mb-1.5">
                        {type.icon}
                        <span className="ml-2 font-medium">{type.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground text-left">
                        {getInsightTypeDescription(type.value)}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
              {isGenerating && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Generating {insightTypeToGenerate && formatInsightType(insightTypeToGenerate)} insight...</span>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 lg:grid-cols-7 mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value={InsightType.CONTENT_STRATEGY}>Content</TabsTrigger>
            <TabsTrigger value={InsightType.PRICING_OPTIMIZATION}>Pricing</TabsTrigger>
            <TabsTrigger value={InsightType.POSTING_SCHEDULE}>Schedule</TabsTrigger>
            <TabsTrigger value={InsightType.PLATFORM_STRATEGY}>Platforms</TabsTrigger>
            <TabsTrigger value={InsightType.ENGAGEMENT_TACTICS}>Engagement</TabsTrigger>
            <TabsTrigger value={InsightType.REVENUE_GROWTH}>Revenue</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-4">
            {isLoading && (
              <>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Failed to load insights. Please try again later.</AlertDescription>
              </Alert>
            )}
            {!isLoading && !error && filteredInsights.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Lightbulb className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">No insights yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate an insight to get AI-powered recommendations for your platforms.
                </p>
                <Button onClick={() => setIsGenerateDialogOpen(true)}>
                  <Plus className="mr-1.5 h-4 w-4" /> Generate Your First Insight
                </Button>
              </div>
            )}
            <div className="space-y-4">
              {filteredInsights.map(insight => (
                <Card key={insight.id} className="overflow-hidden dark:border-slate-700">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-2">
                        {getInsightTypeIcon(insight.type as InsightType)}
                        <div>
                          <CardTitle className="text-base">{insight.title}</CardTitle>
                          <div className="flex items-center mt-1 space-x-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(insight.createdAt), { addSuffix: true })}
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground capitalize">
                              {formatInsightType(insight.type)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        {getStatusBadge(insight.status)}
                        {insight.confidence && (
                          <div className="flex items-center mt-1.5">
                            <span className="text-xs text-muted-foreground mr-1">Confidence:</span>
                            <span className="text-xs font-medium">
                              {Math.round(insight.confidence * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm">{insight.description}</p>
                    
                    {expandedInsight === insight.id && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Recommendation:</h4>
                        <div className="text-sm whitespace-pre-line bg-slate-50 dark:bg-slate-900 p-3 rounded-md">
                          {insight.recommendation}
                        </div>
                        
                        {insight.implementationSteps && insight.implementationSteps.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">Implementation Steps:</h4>
                            <ol className="text-sm list-decimal list-inside space-y-1 pl-2">
                              {insight.implementationSteps.map((step, index) => (
                                <li key={index}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                        
                        {insight.platforms && insight.platforms.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">Relevant Platforms:</h4>
                            <div className="flex flex-wrap gap-1">
                              {insight.platforms.map(platform => (
                                <Badge key={platform} variant="outline" className="capitalize">
                                  {platform}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleExpandInsight(insight.id)}
                    >
                      {expandedInsight === insight.id ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1.5" /> Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1.5" /> Show More
                        </>
                      )}
                    </Button>
                    
                    {insight.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleUpdateStatus(insight.id, 'rejected')}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <X className="h-4 w-4 mr-1.5" /> Reject
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleUpdateStatus(insight.id, 'accepted')}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Check className="h-4 w-4 mr-1.5" /> Accept
                        </Button>
                      </div>
                    )}
                    
                    {insight.status === 'accepted' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleUpdateStatus(insight.id, 'implemented')}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                      >
                        <Flag className="h-4 w-4 mr-1.5" /> Mark as Implemented
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Helper function to get description for each insight type
function getInsightTypeDescription(type: InsightType): string {
  switch (type) {
    case InsightType.CONTENT_STRATEGY:
      return "Recommendations for content types, topics, and formats to increase engagement.";
    case InsightType.PRICING_OPTIMIZATION:
      return "Optimize your pricing tiers, special offers, and subscription models.";
    case InsightType.POSTING_SCHEDULE:
      return "Determine the best times and days to post different content types.";
    case InsightType.PLATFORM_STRATEGY:
      return "Strategize which platforms to prioritize based on performance data.";
    case InsightType.ENGAGEMENT_TACTICS:
      return "Tactical approaches to increase user engagement and reduce churn.";
    case InsightType.REVENUE_GROWTH:
      return "Strategies to maximize revenue across all your platforms.";
    default:
      return "AI-powered recommendations based on your platform data.";
  }
} 