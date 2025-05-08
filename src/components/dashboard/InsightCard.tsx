'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  FileText, 
  Calendar, 
  Send,
  Settings,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Lightning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type Insight } from "@/lib/services/reasoningService";

interface InsightCardProps {
  insight: Insight;
  onAction?: (insight: Insight) => void;
}

export default function InsightCard({ insight, onAction }: InsightCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Determine icon based on category or action type
  const getIcon = () => {
    if (insight.category === 'revenue') return DollarSign;
    if (insight.category === 'engagement') return BarChart3;
    if (insight.category === 'growth') return TrendingUp;
    if (insight.category === 'content') return FileText;
    
    // Fallback based on action type
    if (insight.actionType === 'schedule_post') return Calendar;
    if (insight.actionType === 'edit_campaign') return Settings;
    if (insight.actionType === 'adjust_price') return DollarSign;
    
    return Lightning; // Default
  };
  
  // Get badge color based on importance
  const getBadgeColor = () => {
    switch (insight.importance) {
      case 5: return 'bg-red-500 hover:bg-red-600';
      case 4: return 'bg-orange-500 hover:bg-orange-600';
      case 3: return 'bg-yellow-500 hover:bg-yellow-600';
      case 2: return 'bg-blue-500 hover:bg-blue-600';
      default: return 'bg-green-500 hover:bg-green-600';
    }
  };
  
  // Get category label
  const getCategoryLabel = () => {
    switch (insight.category) {
      case 'revenue': return 'Revenue';
      case 'engagement': return 'Engagement';
      case 'growth': return 'Growth';
      case 'content': return 'Content';
      default: return 'Strategy';
    }
  };
  
  const Icon = getIcon();
  
  const handleAction = () => {
    if (onAction) {
      onAction(insight);
    }
  };
  
  return (
    <Card className={cn(
      "w-full transition-all duration-300",
      insight.importance >= 4 ? "border-l-4 border-l-orange-500" : ""
    )}>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            insight.category === 'revenue' ? "bg-emerald-100 text-emerald-700" :
            insight.category === 'engagement' ? "bg-blue-100 text-blue-700" :
            insight.category === 'growth' ? "bg-indigo-100 text-indigo-700" :
            "bg-purple-100 text-purple-700"
          )}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">{insight.title}</CardTitle>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {getCategoryLabel()}
              </Badge>
              {insight.importance >= 4 && (
                <Badge className={cn("text-xs text-white", getBadgeColor())}>
                  High Priority
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
      </CardHeader>
      
      <CardContent className={cn(
        "grid transition-all duration-300",
        expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
      )}>
        <div className="overflow-hidden">
          <p className="text-muted-foreground">
            {insight.description}
          </p>
          
          {insight.recommendedValue && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Recommended Action:</p>
              <p className="text-sm">{insight.recommendedValue}</p>
            </div>
          )}
        </div>
      </CardContent>
      
      {insight.actionLabel && (
        <CardFooter className="pt-0">
          <Button 
            className="w-full" 
            onClick={handleAction}
            size="sm"
          >
            {insight.actionType === 'schedule_post' && <Calendar className="w-4 h-4 mr-2" />}
            {insight.actionType === 'edit_campaign' && <Settings className="w-4 h-4 mr-2" />}
            {insight.actionType === 'adjust_price' && <DollarSign className="w-4 h-4 mr-2" />}
            {insight.actionLabel}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 