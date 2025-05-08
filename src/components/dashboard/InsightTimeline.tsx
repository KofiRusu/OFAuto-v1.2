'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format, formatDistanceToNow } from 'date-fns';
import { ChevronDown, Settings, AlertTriangle, Bell, Lightbulb, Zap, BarChart, Megaphone, Filter, Check, RefreshCcw, Book, Eye, Activity, Package, X, CheckCircle2, MoreHorizontal, Info, Calendar, Users, LayoutDashboard, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// Type definitions
export type InsightType = 'alert' | 'notification' | 'opportunity' | 'performance';
export type InsightSource = 'campaign' | 'community' | 'system' | 'analytics';
export type InsightImportance = 'low' | 'medium' | 'high' | 'critical';

export interface Insight {
  id: string;
  title: string;
  description: string;
  type: InsightType;
  source: InsightSource;
  importance: InsightImportance;
  timestamp: Date;
  read: boolean;
  actionable: boolean;
  campaignId?: string;
  campaignName?: string;
}

interface InsightTimelineProps {
  insights: Insight[];
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
  onMarkAsRead?: (insightId: string) => Promise<void>;
  onMarkAllAsRead?: () => Promise<void>;
  onTakeAction?: (insightId: string) => Promise<void>;
  onViewDetails?: (insightId: string) => void;
  onDismiss?: (insightId: string) => Promise<void>;
  showOnlyHistory?: boolean;
  activeTab: string;
}

export function InsightTimeline({
  insights,
  isLoading = false,
  onRefresh,
  onMarkAsRead,
  onMarkAllAsRead,
  onTakeAction,
  onViewDetails,
  onDismiss,
  showOnlyHistory = false,
  activeTab
}: InsightTimelineProps) {
  const [filteredInsights, setFilteredInsights] = useState<Insight[]>(insights);

  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredInsights(insights);
    } else {
      setFilteredInsights(insights.filter(insight => insight.type === activeTab));
    }
  }, [insights, activeTab]);

  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<InsightType[]>([]);
  const [selectedSources, setSelectedSources] = useState<InsightSource[]>([]);
  const [selectedImportance, setSelectedImportance] = useState<InsightImportance[]>([]);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showActionableOnly, setShowActionableOnly] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter and sort insights
  const filteredInsights = useMemo(() => {
    return insights
      .filter(insight => {
        // Text search
        if (searchTerm && !`${insight.title} ${insight.description} ${insight.campaignName || ''}`.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        
        // Type filter
        if (selectedTypes.length > 0 && !selectedTypes.includes(insight.type)) {
          return false;
        }
        
        // Source filter
        if (selectedSources.length > 0 && !selectedSources.includes(insight.source)) {
          return false;
        }
        
        // Importance filter
        if (selectedImportance.length > 0 && !selectedImportance.includes(insight.importance)) {
          return false;
        }
        
        // Unread filter
        if (showUnreadOnly && insight.read) {
          return false;
        }
        
        // Actionable filter
        if (showActionableOnly && !insight.actionable) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        // Sort by importance first (critical -> high -> medium -> low)
        const importanceOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const importanceDiff = importanceOrder[a.importance] - importanceOrder[b.importance];
        if (importanceDiff !== 0) return importanceDiff;
        
        // Then sort by timestamp (newest first)
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
  }, [insights, searchTerm, selectedTypes, selectedSources, selectedImportance, showUnreadOnly, showActionableOnly]);

  // Check if any filters are active
  const hasActiveFilters = selectedTypes.length > 0 || 
    selectedSources.length > 0 || 
    selectedImportance.length > 0 || 
    showUnreadOnly || 
    showActionableOnly ||
    searchTerm.length > 0;

  // Handle refresh
  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTypes([]);
    setSelectedSources([]);
    setSelectedImportance([]);
    setShowUnreadOnly(false);
    setShowActionableOnly(false);
  };

  // Toggle filters
  const toggleType = (type: InsightType) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type) 
        : [...prev, type]
    );
  };

  const toggleSource = (source: InsightSource) => {
    setSelectedSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source) 
        : [...prev, source]
    );
  };

  const toggleImportance = (importance: InsightImportance) => {
    setSelectedImportance(prev => 
      prev.includes(importance) 
        ? prev.filter(i => i !== importance) 
        : [...prev, importance]
    );
  };

  // Helper functions to get icons and styles
  const getInsightIcon = (type: InsightType) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="h-4 w-4" />;
      case 'notification': return <Bell className="h-4 w-4" />;
      case 'opportunity': return <Lightbulb className="h-4 w-4" />;
      case 'performance': return <BarChart className="h-4 w-4" />;
    }
  };

  const getSourceIcon = (source: InsightSource) => {
    switch (source) {
      case 'campaign': return <Activity className="h-4 w-4" />;
      case 'community': return <Megaphone className="h-4 w-4" />;
      case 'system': return <Settings className="h-4 w-4" />;
      case 'analytics': return <BarChart className="h-4 w-4" />;
    }
  };

  const getImportanceBadgeStyle = (importance: InsightImportance) => {
    switch (importance) {
      case 'critical': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 hover:bg-green-200';
    }
  };

  const getTypeLabel = (type: InsightType) => {
    switch (type) {
      case 'alert': return 'Alert';
      case 'notification': return 'Notification';
      case 'opportunity': return 'Opportunity';
      case 'performance': return 'Performance';
    }
  };

  const getSourceLabel = (source: InsightSource) => {
    switch (source) {
      case 'campaign': return 'Campaign';
      case 'community': return 'Community';
      case 'system': return 'System';
      case 'analytics': return 'Analytics';
    }
  };

  const getImportanceLabel = (importance: InsightImportance) => {
    switch (importance) {
      case 'critical': return 'Critical';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else {
      return format(date, 'MMM d, yyyy h:mm a');
    }
  };

  const getTypeIcon = (type: Insight['type']) => {
    switch (type) {
      case 'alert':
        return <AlertCircle className="h-4 w-4" />;
      case 'opportunity':
        return <Lightbulb className="h-4 w-4" />;
      case 'performance':
        return <BarChart className="h-4 w-4" />;
      case 'notification':
        return <Bell className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getSourceBadge = (source: Insight['source']) => {
    switch (source) {
      case 'campaign':
        return {
          label: 'Campaign',
          variant: 'default' as const,
        };
      case 'analytics':
        return {
          label: 'Analytics',
          variant: 'secondary' as const,
        };
      case 'system':
        return {
          label: 'System',
          variant: 'outline' as const,
        };
      case 'community':
        return {
          label: 'Community',
          variant: 'secondary' as const,
        };
      default:
        return {
          label: source,
          variant: 'outline' as const,
        };
    }
  };

  const getImportanceStyles = (importance: Insight['importance']) => {
    switch (importance) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getImportanceBadge = (importance: Insight['importance']) => {
    switch (importance) {
      case 'critical':
        return {
          label: 'Critical',
          variant: 'destructive' as const,
        };
      case 'high':
        return {
          label: 'High Priority',
          variant: 'destructive' as const,
        };
      case 'medium':
        return {
          label: 'Medium Priority',
          variant: 'default' as const,
        };
      case 'low':
        return {
          label: 'Low Priority',
          variant: 'secondary' as const,
        };
      default:
        return {
          label: importance,
          variant: 'outline' as const,
        };
    }
  };

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Insight Timeline</CardTitle>
            <CardDescription className="mt-1">
              {filteredInsights.length} {filteredInsights.length === 1 ? 'insight' : 'insights'} 
              {hasActiveFilters ? ' (filtered)' : ''}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {onMarkAllAsRead && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={onMarkAllAsRead}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Mark All Read
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Mark all insights as read</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {onRefresh && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                    >
                      <RefreshCcw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh insights</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-3">
          <div className="relative flex-grow">
            <Input
              placeholder="Search insights..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={hasActiveFilters ? "default" : "outline"} size="sm">
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="outline" className="ml-1 bg-primary/20">
                      {selectedTypes.length + selectedSources.length + selectedImportance.length + 
                       (showUnreadOnly ? 1 : 0) + (showActionableOnly ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[240px]">
                <DropdownMenuLabel>Filter Insights</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <div className="p-2">
                  <p className="text-sm font-medium mb-2">Type</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['alert', 'notification', 'opportunity', 'performance'] as InsightType[]).map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`type-${type}`} 
                          checked={selectedTypes.includes(type)}
                          onCheckedChange={() => toggleType(type)}
                        />
                        <Label htmlFor={`type-${type}`} className="text-sm flex items-center">
                          {getInsightIcon(type)}
                          <span className="ml-1">{getTypeLabel(type)}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <DropdownMenuSeparator />
                
                <div className="p-2">
                  <p className="text-sm font-medium mb-2">Source</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['campaign', 'community', 'system', 'analytics'] as InsightSource[]).map(source => (
                      <div key={source} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`source-${source}`} 
                          checked={selectedSources.includes(source)}
                          onCheckedChange={() => toggleSource(source)}
                        />
                        <Label htmlFor={`source-${source}`} className="text-sm flex items-center">
                          {getSourceIcon(source)}
                          <span className="ml-1">{getSourceLabel(source)}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <DropdownMenuSeparator />
                
                <div className="p-2">
                  <p className="text-sm font-medium mb-2">Importance</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['critical', 'high', 'medium', 'low'] as InsightImportance[]).map(importance => (
                      <div key={importance} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`importance-${importance}`} 
                          checked={selectedImportance.includes(importance)}
                          onCheckedChange={() => toggleImportance(importance)}
                        />
                        <Label htmlFor={`importance-${importance}`} className="text-sm capitalize">
                          {getImportanceLabel(importance)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <DropdownMenuSeparator />
                
                <div className="p-2">
                  <p className="text-sm font-medium mb-2">Status</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="unread-only" 
                        checked={showUnreadOnly}
                        onCheckedChange={() => setShowUnreadOnly(prev => !prev)}
                      />
                      <Label htmlFor="unread-only" className="text-sm flex items-center">
                        <Book className="h-4 w-4 mr-1" />
                        Unread only
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="actionable-only" 
                        checked={showActionableOnly}
                        onCheckedChange={() => setShowActionableOnly(prev => !prev)}
                      />
                      <Label htmlFor="actionable-only" className="text-sm flex items-center">
                        <Zap className="h-4 w-4 mr-1" />
                        Actionable only
                      </Label>
                    </div>
                  </div>
                </div>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-center"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                  >
                    Clear All Filters
                  </Button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="min-h-[300px]">
        <ScrollArea className="h-[calc(100vh-340px)]">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="mb-4">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex gap-2 mt-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-4/5" />
                  </CardContent>
                  <CardFooter>
                    <div className="flex justify-between w-full">
                      <Skeleton className="h-3 w-20" />
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filteredInsights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No insights found</h3>
              <p className="text-muted-foreground mt-1 max-w-md">
                {hasActiveFilters 
                  ? "Try adjusting your filters to see more insights" 
                  : "No insights are available at this time. Check back later or refresh to get new insights."}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInsights.map((insight) => (
                <Card 
                  key={insight.id} 
                  className={`mb-4 transition-all duration-200 ${!insight.read ? 'border-l-4 border-l-primary' : ''}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className={`text-base ${!insight.read ? 'font-semibold' : ''}`}>
                        {insight.title}
                      </CardTitle>
                      <div className="flex gap-1 items-start">
                        <Badge variant="outline" className={getImportanceBadgeStyle(insight.importance)}>
                          {getImportanceLabel(insight.importance)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        {getInsightIcon(insight.type)}
                        {getTypeLabel(insight.type)}
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        {getSourceIcon(insight.source)}
                        {getSourceLabel(insight.source)}
                      </Badge>
                      {insight.campaignName && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {insight.campaignName}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {insight.description}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(insight.timestamp)}
                      </span>
                      <div className="flex gap-2">
                        {!insight.read && onMarkAsRead && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => onMarkAsRead(insight.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Mark as read</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        
                        {onViewDetails && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => onViewDetails(insight.id)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View details</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        
                        {insight.actionable && onTakeAction && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => onTakeAction(insight.id)}
                                >
                                  <Zap className="h-4 w-4 mr-1" />
                                  Take Action
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Take recommended action</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        
                        {onDismiss && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => onDismiss(insight.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Dismiss insight</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 