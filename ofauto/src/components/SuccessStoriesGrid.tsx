'use client';

import { useState, useEffect } from "react";
import { SuccessStory } from "@/lib/ai-strategy/success-tracker";
import { StrategyType } from "@/lib/ai-strategy/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUpRight, Download, Star, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SuccessStoriesGridProps {
  clientId?: string;
  initialType?: StrategyType;
  showFilters?: boolean;
  onDetailsClick?: (story: SuccessStory) => void;
}

export function SuccessStoriesGrid({
  clientId,
  initialType = "PRICING",
  showFilters = true,
  onDetailsClick,
}: SuccessStoriesGridProps) {
  const [type, setType] = useState<StrategyType>(initialType);
  const [filter, setFilter] = useState<"all" | "featured">("all");
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [metrics, setMetrics] = useState<{
    averageRevenue: number;
    averageEngagement: number;
    averageRetention: number;
    averageConversionRate: number;
    averageTimeToROI: number;
    totalSuccessStories: number;
  }>();
  const [loading, setLoading] = useState(true);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (type) params.append("type", type);
      if (clientId) params.append("clientId", clientId);
      if (filter === "featured") params.append("featured", "true");

      const response = await fetch(`/api/strategies/success-stories?${params}`);
      if (response.ok) {
        const data = await response.json();
        setStories(data);
      } else {
        console.error("Failed to fetch success stories");
        setStories([]);
      }

      // Fetch metrics for the current type
      const metricsResponse = await fetch(`/api/strategies/success-stories/metrics?type=${type}`);
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }
    } catch (error) {
      console.error("Error fetching success stories:", error);
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [type, clientId, filter]);

  const onTypeChange = (newType: StrategyType) => {
    setType(newType);
  };

  const renderSkeletons = () => {
    return Array(3)
      .fill(0)
      .map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="pb-0">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="py-4">
            <Skeleton className="h-24 w-full" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Success Stories & Case Studies</h2>
        {showFilters && (
          <div className="flex items-center gap-4">
            <Select value={type} onValueChange={(value) => onTypeChange(value as StrategyType)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRICING">Pricing</SelectItem>
                <SelectItem value="CONTENT">Content</SelectItem>
                <SelectItem value="ENGAGEMENT">Engagement</SelectItem>
                <SelectItem value="GROWTH">Growth</SelectItem>
                <SelectItem value="RETENTION">Retention</SelectItem>
                <SelectItem value="CROSS_PROMOTION">Cross Promotion</SelectItem>
                <SelectItem value="AI_MESSAGE_TEMPLATES">AI Messages</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filter} onValueChange={(value) => setFilter(value as "all" | "featured")}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stories</SelectItem>
                <SelectItem value="featured">Featured Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {metrics && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>
              Average metrics across {metrics.totalSuccessStories} success stories for {type} strategies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Revenue</span>
                <span className="text-2xl font-bold">{metrics.averageRevenue.toFixed(1)}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Engagement</span>
                <span className="text-2xl font-bold">{metrics.averageEngagement.toFixed(1)}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Retention</span>
                <span className="text-2xl font-bold">{metrics.averageRetention.toFixed(1)}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Conversion</span>
                <span className="text-2xl font-bold">{metrics.averageConversionRate.toFixed(1)}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">ROI Time</span>
                <span className="text-2xl font-bold">{metrics.averageTimeToROI} days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          renderSkeletons()
        ) : stories.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No success stories found for the selected criteria.</p>
          </div>
        ) : (
          stories.map((story) => (
            <Card key={story.id} className="overflow-hidden">
              {story.featured && (
                <div className="bg-yellow-500 text-white px-3 py-1 text-xs font-medium flex items-center absolute top-2 right-2 rounded-full">
                  <Star className="w-3 h-3 mr-1" />
                  Featured
                </div>
              )}
              <CardHeader>
                <CardTitle>{story.title}</CardTitle>
                <CardDescription>
                  {new Date(story.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {story.description}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1 bg-muted rounded-md p-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Revenue: +{story.metrics.revenue}%</span>
                  </div>
                  <div className="flex items-center gap-1 bg-muted rounded-md p-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">ROI: {story.metrics.timeToROI} days</span>
                  </div>
                </div>
                {story.testimonial && (
                  <div className="mt-4 bg-muted/50 p-3 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={`https://avatar.vercel.sh/${story.clientId}`} />
                        <AvatarFallback>C</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">Client Testimonial</span>
                    </div>
                    <p className="text-xs italic line-clamp-2">{story.testimonial}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Badge>{story.strategyType}</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDetailsClick?.(story)}
                  className="flex items-center gap-1"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  View Case Study
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 