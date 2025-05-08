'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { InsightTimeline, Insight } from '@/components/dashboard/InsightTimeline';
import { RefreshCcw, Search, FilterX, Calendar, Filter } from 'lucide-react';
import { addDays, subDays, format } from 'date-fns';

// This would typically come from an API
const fetchInsightHistory = (): Promise<Insight[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockHistory: Insight[] = [
        {
          id: '1',
          title: 'Campaign Budget Depleted',
          description: 'Summer Sale campaign has used 100% of its budget before scheduled end date.',
          type: 'alert',
          source: 'campaign',
          importance: 'high',
          timestamp: subDays(new Date(), 1),
          read: true,
          actionable: true,
          campaignId: 'camp_123',
          campaignName: 'Summer Sale'
        },
        {
          id: '2',
          title: 'ROAS Target Achieved',
          description: 'Product Launch campaign has exceeded ROAS target by 25%.',
          type: 'performance',
          source: 'analytics',
          importance: 'medium',
          timestamp: subDays(new Date(), 2),
          read: true,
          actionable: false,
          campaignId: 'camp_456',
          campaignName: 'Product Launch'
        },
        {
          id: '3',
          title: 'Audience Overlap Detected',
          description: 'Significant audience overlap detected between two active campaigns.',
          type: 'opportunity',
          source: 'analytics',
          importance: 'medium',
          timestamp: subDays(new Date(), 3),
          read: true,
          actionable: true
        },
        {
          id: '4',
          title: 'System Maintenance Completed',
          description: 'The scheduled system maintenance has been completed successfully.',
          type: 'notification',
          source: 'system',
          importance: 'low',
          timestamp: subDays(new Date(), 4),
          read: true,
          actionable: false
        },
        {
          id: '5',
          title: 'API Rate Limit Warning',
          description: 'You are approaching your daily API rate limit. Consider upgrading your plan.',
          type: 'alert',
          source: 'system',
          importance: 'medium',
          timestamp: subDays(new Date(), 5),
          read: true,
          actionable: false
        },
        {
          id: '6',
          title: 'Community Engagement Spike',
          description: 'Unusual increase in engagement detected in Discord community.',
          type: 'notification',
          source: 'community',
          importance: 'low',
          timestamp: subDays(new Date(), 6),
          read: true,
          actionable: false
        },
        {
          id: '7',
          title: 'Critical Ad Account Issue',
          description: 'Your Facebook ad account has been flagged for policy violations.',
          type: 'alert',
          source: 'campaign',
          importance: 'critical',
          timestamp: subDays(new Date(), 7),
          read: true,
          actionable: true
        },
        {
          id: '8',
          title: 'New Audience Segment Available',
          description: 'Based on recent traffic, a new high-value audience segment has been identified.',
          type: 'opportunity',
          source: 'analytics',
          importance: 'high',
          timestamp: subDays(new Date(), 8),
          read: true,
          actionable: true
        },
        {
          id: '9',
          title: 'Campaign Underperformance',
          description: 'Winter Promotion campaign is performing 35% below target metrics.',
          type: 'alert',
          source: 'campaign',
          importance: 'high',
          timestamp: subDays(new Date(), 9),
          read: true,
          actionable: true,
          campaignId: 'camp_789',
          campaignName: 'Winter Promotion'
        },
        {
          id: '10',
          title: 'Budget Allocation Opportunity',
          description: 'Reallocation of budget from underperforming campaigns could improve overall ROAS by 15%.',
          type: 'opportunity',
          source: 'analytics',
          importance: 'high',
          timestamp: subDays(new Date(), 10),
          read: true,
          actionable: true
        },
      ];
      resolve(mockHistory);
    }, 700);
  });
};

export default function InsightsHistoryPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [filteredInsights, setFilteredInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [toDate, setToDate] = useState<Date | undefined>(new Date());
  const [importanceFilter, setImportanceFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  const loadInsights = async () => {
    setIsLoading(true);
    try {
      const data = await fetchInsightHistory();
      setInsights(data);
      setFilteredInsights(data);
    } catch (error) {
      console.error('Failed to load insights history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  useEffect(() => {
    let filtered = [...insights];

    // Apply tab filter
    if (activeTab !== 'all') {
      filtered = filtered.filter(insight => insight.type === activeTab);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        insight => 
          insight.title.toLowerCase().includes(query) || 
          insight.description.toLowerCase().includes(query) || 
          (insight.campaignName && insight.campaignName.toLowerCase().includes(query))
      );
    }

    // Apply date range filter
    if (fromDate) {
      filtered = filtered.filter(insight => insight.timestamp >= fromDate);
    }
    if (toDate) {
      filtered = filtered.filter(insight => {
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        return insight.timestamp <= endOfDay;
      });
    }

    // Apply importance filter
    if (importanceFilter !== 'all') {
      filtered = filtered.filter(insight => insight.importance === importanceFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(insight => insight.type === typeFilter);
    }

    // Apply source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(insight => insight.source === sourceFilter);
    }

    setFilteredInsights(filtered);
  }, [insights, activeTab, searchQuery, fromDate, toDate, importanceFilter, typeFilter, sourceFilter]);

  const handleRefresh = () => {
    loadInsights();
  };

  const handleMarkAsRead = (id: string) => {
    // In a real app, you'd call an API to mark as read
    console.log(`Marking insight ${id} as read`);
  };

  const handleTakeAction = (id: string) => {
    // In a real app, you'd navigate to the action page or show a modal
    console.log(`Taking action on insight ${id}`);
  };

  const handleViewDetails = (id: string) => {
    // In a real app, you'd navigate to the insight details page
    console.log(`Viewing details for insight ${id}`);
  };

  const handleDismiss = (id: string) => {
    // In a real app, you'd call an API to dismiss the insight
    console.log(`Dismissing insight ${id}`);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFromDate(subDays(new Date(), 30));
    setToDate(new Date());
    setImportanceFilter('all');
    setTypeFilter('all');
    setSourceFilter('all');
    setActiveTab('all');
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Insights History"
        description="View and analyze all historical insights and actions"
      >
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </DashboardHeader>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Filter Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search insights..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DatePicker
                    date={fromDate}
                    setDate={setFromDate}
                    label="From"
                  />
                  <DatePicker
                    date={toDate}
                    setDate={setToDate}
                    label="To"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Select value={importanceFilter} onValueChange={setImportanceFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Importance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Importance</SelectLabel>
                      <SelectItem value="all">All Importance</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Type</SelectLabel>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="alert">Alerts</SelectItem>
                      <SelectItem value="opportunity">Opportunities</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="notification">Notifications</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Source</SelectLabel>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="campaign">Campaign</SelectItem>
                      <SelectItem value="analytics">Analytics</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="community">Community</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={resetFilters} className="w-full sm:w-auto gap-2">
                  <FilterX className="h-4 w-4" />
                  <span>Reset Filters</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="alert">Alerts</TabsTrigger>
              <TabsTrigger value="opportunity">Opportunities</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="notification">Notifications</TabsTrigger>
            </TabsList>
            
            <div className="text-sm text-muted-foreground">
              {filteredInsights.length} {filteredInsights.length === 1 ? 'insight' : 'insights'}
            </div>
          </div>
          
          <TabsContent value="all" className="mt-4">
            <InsightTimeline
              insights={filteredInsights}
              isLoading={isLoading}
              onRefresh={handleRefresh}
              onMarkAsRead={handleMarkAsRead}
              onTakeAction={handleTakeAction}
              onViewDetails={handleViewDetails}
              onDismiss={handleDismiss}
              activeTab={activeTab}
            />
          </TabsContent>
          
          <TabsContent value="alert" className="mt-4">
            <InsightTimeline
              insights={filteredInsights}
              isLoading={isLoading}
              onRefresh={handleRefresh}
              onMarkAsRead={handleMarkAsRead}
              onTakeAction={handleTakeAction}
              onViewDetails={handleViewDetails}
              onDismiss={handleDismiss}
              activeTab={activeTab}
            />
          </TabsContent>
          
          <TabsContent value="opportunity" className="mt-4">
            <InsightTimeline
              insights={filteredInsights}
              isLoading={isLoading}
              onRefresh={handleRefresh}
              onMarkAsRead={handleMarkAsRead}
              onTakeAction={handleTakeAction}
              onViewDetails={handleViewDetails}
              onDismiss={handleDismiss}
              activeTab={activeTab}
            />
          </TabsContent>
          
          <TabsContent value="performance" className="mt-4">
            <InsightTimeline
              insights={filteredInsights}
              isLoading={isLoading}
              onRefresh={handleRefresh}
              onMarkAsRead={handleMarkAsRead}
              onTakeAction={handleTakeAction}
              onViewDetails={handleViewDetails}
              onDismiss={handleDismiss}
              activeTab={activeTab}
            />
          </TabsContent>
          
          <TabsContent value="notification" className="mt-4">
            <InsightTimeline
              insights={filteredInsights}
              isLoading={isLoading}
              onRefresh={handleRefresh}
              onMarkAsRead={handleMarkAsRead}
              onTakeAction={handleTakeAction}
              onViewDetails={handleViewDetails}
              onDismiss={handleDismiss}
              activeTab={activeTab}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
} 