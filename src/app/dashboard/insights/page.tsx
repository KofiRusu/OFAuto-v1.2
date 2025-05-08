'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Lightbulb,
  BarChart3,
  Filter,
  RefreshCw,
  ChevronLeft,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  AlertCircle,
  LineChart,
  ChevronRight,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Share2,
  MessageSquare,
  Heart,
  Bookmark,
  ChevronDown,
  PieChart,
  ArrowRight,
  Calendar,
  Download
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/ui/use-toast";
import InsightCard from '@/components/dashboard/InsightCard';
import { Insight } from '@/lib/services/reasoningService';
import { useClientId } from '@/app/dashboard/useClientId';
import { PostSchedulerModal } from '@/components/dashboard/PostSchedulerModal';
import { InsightTimeline } from '@/components/dashboard/InsightTimeline';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// Mock data for insights - this would be fetched from an API in a real application
const mockInsights: Insight[] = [
  {
    id: '1',
    title: 'Campaign ROI below threshold for 7 days',
    description: 'The Facebook campaign "Summer Sale 2023" has been performing below the target ROI of 2.5 for 7 consecutive days. Consider adjusting your bidding strategy or creative elements.',
    type: 'alert',
    source: 'campaign',
    importance: 'high',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: false,
    actionable: true,
    campaignId: 'fb-123',
    campaignName: 'Summer Sale 2023'
  },
  {
    id: '2',
    title: 'New audience segment identified',
    description: 'Analysis of your recent campaign performance suggests that women aged 25-34 in urban areas show 47% higher engagement than your current targeting. Consider creating a campaign focused on this segment.',
    type: 'opportunity',
    source: 'analytics',
    importance: 'medium',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    read: false,
    actionable: true
  },
  {
    id: '3',
    title: 'Weekly performance report available',
    description: 'Your weekly performance summary for August 1-7 is now available. Overall performance is up 12% from the previous week.',
    type: 'notification',
    source: 'system',
    importance: 'low',
    timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
    read: true,
    actionable: false
  },
  {
    id: '4',
    title: 'Budget depleted for "Back to School" campaign',
    description: 'Your Instagram "Back to School" campaign has depleted its budget ahead of schedule. Consider adding additional budget to maintain campaign momentum.',
    type: 'alert',
    source: 'campaign',
    importance: 'critical',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    read: false,
    actionable: true,
    campaignId: 'ig-456',
    campaignName: 'Back to School 2023'
  },
  {
    id: '5',
    title: 'Rising cost per acquisition detected',
    description: 'Your CPA has increased by 23% over the last 10 days across all platforms. The most affected campaign is "Product Launch Q3".',
    type: 'performance',
    source: 'analytics',
    importance: 'high',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    read: false,
    actionable: true,
    campaignId: 'all-789',
    campaignName: 'Product Launch Q3'
  }
];

// Mock data for charts
const performanceData = [
  { name: 'Jan', engagement: 2400, reach: 4000, impressions: 6800 },
  { name: 'Feb', engagement: 1398, reach: 3000, impressions: 5800 },
  { name: 'Mar', engagement: 9800, reach: 12000, impressions: 14800 },
  { name: 'Apr', engagement: 3908, reach: 5000, impressions: 7800 },
  { name: 'May', engagement: 4800, reach: 6000, impressions: 8800 },
  { name: 'Jun', engagement: 3800, reach: 5000, impressions: 7800 },
  { name: 'Jul', engagement: 4300, reach: 5500, impressions: 8300 },
];

const contentPerformanceData = [
  { name: 'Post 1', views: 4000, likes: 2400, shares: 800, comments: 600 },
  { name: 'Post 2', views: 3000, likes: 1398, shares: 500, comments: 400 },
  { name: 'Post 3', views: 2000, likes: 9800, shares: 1200, comments: 900 },
  { name: 'Post 4', views: 2780, likes: 3908, shares: 700, comments: 500 },
  { name: 'Post 5', views: 1890, likes: 4800, shares: 900, comments: 700 },
  { name: 'Post 6', views: 2390, likes: 3800, shares: 800, comments: 600 },
  { name: 'Post 7', views: 3490, likes: 4300, shares: 850, comments: 650 },
];

const audienceData = [
  { name: '18-24', value: 30 },
  { name: '25-34', value: 40 },
  { name: '35-44', value: 15 },
  { name: '45-54', value: 10 },
  { name: '55+', value: 5 },
];

const genderData = [
  { name: 'Female', value: 58 },
  { name: 'Male', value: 40 },
  { name: 'Other', value: 2 },
];

const locationData = [
  { name: 'United States', value: 45 },
  { name: 'United Kingdom', value: 15 },
  { name: 'Canada', value: 10 },
  { name: 'Australia', value: 8 },
  { name: 'Germany', value: 7 },
  { name: 'Other', value: 15 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF', '#FF6B6B'];

export default function InsightsPage() {
  const { toast } = useToast();
  const clientId = useClientId();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showScheduler, setShowScheduler] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [insights, setInsights] = useState<Insight[]>(mockInsights);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [dateRange, setDateRange] = useState('last30Days');
  const [platform, setPlatform] = useState('all');
  
  // Fetch insights data
  const { 
    data: insightsData, 
    isLoading: apiLoading, 
    isError,
    refetch 
  } = trpc.insights.getInsights.useQuery(
    { clientId },
    {
      enabled: Boolean(clientId),
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (err) => {
        toast({ 
          title: "Error loading insights", 
          description: "Could not load AI insights. Please try again later.", 
          variant: "destructive" 
        });
      }
    }
  );
  
  // Handle refresh
  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Simulate refreshing insights - in a real app, you'd fetch from an API
    setInsights([...mockInsights]);
    setIsLoading(false);
  };
  
  // Handle insight action
  const handleInsightAction = (insight: Insight) => {
    setSelectedInsight(insight);
    
    if (insight.actionType === 'schedule_post') {
      setShowScheduler(true);
    } else if (insight.actionType === 'edit_campaign') {
      router.push(`/dashboard/marketing?campaign=new&recommendation=${encodeURIComponent(insight.recommendedValue || '')}`);
    } else if (insight.actionType === 'adjust_price') {
      router.push(`/dashboard/settings/pricing?recommendation=${encodeURIComponent(insight.recommendedValue || '')}`);
    }
  };
  
  // Filter insights by category
  const filteredInsights = insights?.filter(insight => {
    if (selectedCategory === "all") return true;
    return insight.category === selectedCategory;
  }) || [];
  
  // Group insights by priority
  const highPriorityInsights = filteredInsights.filter(i => i.importance && i.importance >= 4);
  const mediumPriorityInsights = filteredInsights.filter(i => i.importance === 3);
  const otherInsights = filteredInsights.filter(i => i.importance && i.importance <= 2);
  
  useEffect(() => {
    handleRefresh();
  }, []);

  const handleMarkAsRead = (id: string) => {
    setInsights(prev => 
      prev.map(insight => 
        insight.id === id ? { ...insight, read: true } : insight
      )
    );
  };

  const handleDismiss = (id: string) => {
    setInsights(prev => prev.filter(insight => insight.id !== id));
  };

  const handleTakeAction = (id: string) => {
    // Implementation for taking action
    console.log(`Taking action on insight ${id}`);
    
    // For demo purposes, mark as read when action is taken
    handleMarkAsRead(id);
  };

  const handleViewDetails = (id: string) => {
    // Implementation for viewing details
    console.log(`Viewing details for insight ${id}`);
  };

  const unreadCount = insights.filter(insight => !insight.read).length;
  const criticalCount = insights.filter(insight => 
    !insight.read && insight.importance === 'critical'
  ).length;

  const performanceMetrics = [
    {
      title: "Total Followers",
      value: "24,531",
      change: "+12.5%",
      isPositive: true,
      icon: <Users className="h-4 w-4" />
    },
    {
      title: "Total Impressions",
      value: "1.2M",
      change: "+18.2%",
      isPositive: true,
      icon: <Eye className="h-4 w-4" />
    },
    {
      title: "Engagement Rate",
      value: "3.8%",
      change: "-0.5%",
      isPositive: false,
      icon: <Heart className="h-4 w-4" />
    },
    {
      title: "Avg. Reach per Post",
      value: "8,942",
      change: "+5.1%",
      isPositive: true,
      icon: <Share2 className="h-4 w-4" />
    }
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics & Insights</h1>
          <p className="text-muted-foreground">
            Track performance metrics across all your social media platforms
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7Days">Last 7 days</SelectItem>
              <SelectItem value="last30Days">Last 30 days</SelectItem>
              <SelectItem value="last3Months">Last 3 months</SelectItem>
              <SelectItem value="last6Months">Last 6 months</SelectItem>
              <SelectItem value="lastYear">Last year</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                  <h3 className="text-2xl font-bold mt-2">{metric.value}</h3>
                  <div className="flex items-center mt-1">
                    <span className={`text-xs font-medium ${metric.isPositive ? 'text-green-500' : 'text-red-500'} mr-1`}>
                      {metric.change}
                    </span>
                    {metric.isPositive ? 
                      <ArrowUpRight className="h-3 w-3 text-green-500" /> : 
                      <ArrowDownRight className="h-3 w-3 text-red-500" />
                    }
                  </div>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  {metric.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Main Charts Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content Performance</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="platforms">Platform Breakdown</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Track your engagement, reach, and impressions over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart
                    data={performanceData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <RechartsLineChart.Line type="monotone" dataKey="engagement" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <RechartsLineChart.Line type="monotone" dataKey="reach" stroke="#82ca9d" />
                    <RechartsLineChart.Line type="monotone" dataKey="impressions" stroke="#ffc658" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Content</CardTitle>
                <CardDescription>Content with highest engagement rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        {i === 0 ? <Heart className="h-6 w-6 text-primary" /> : 
                         i === 1 ? <MessageSquare className="h-6 w-6 text-primary" /> :
                         <Share2 className="h-6 w-6 text-primary" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{`Summer collection photoshoot #${i+1}`}</p>
                        <p className="text-sm text-muted-foreground">Posted on Instagram • Jun 12</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{`${8.4 - i * 1.2}%`}</p>
                        <p className="text-sm text-muted-foreground">Engagement</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full mt-4">
                  View all content <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Growth Trends</CardTitle>
                <CardDescription>Follower growth across platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={[
                        { name: 'Instagram', growth: 1240 },
                        { name: 'TikTok', growth: 2180 },
                        { name: 'YouTube', growth: 590 },
                        { name: 'Facebook', growth: 380 },
                        { name: 'Twitter', growth: 490 }
                      ]}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <RechartsBarChart.Bar dataKey="growth" fill="#8884d8" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Performance</CardTitle>
              <CardDescription>Compare performance metrics across your content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={contentPerformanceData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <RechartsBarChart.Bar dataKey="views" stackId="a" fill="#8884d8" />
                    <RechartsBarChart.Bar dataKey="likes" stackId="a" fill="#82ca9d" />
                    <RechartsBarChart.Bar dataKey="shares" stackId="a" fill="#ffc658" />
                    <RechartsBarChart.Bar dataKey="comments" stackId="a" fill="#ff8042" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Best Time to Post</CardTitle>
                <CardDescription>Engagement rates by day and time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                    <div key={i} className="text-center text-xs font-medium">{day}</div>
                  ))}
                  {Array.from({ length: 24 * 7 }).map((_, i) => {
                    const intensity = Math.random();
                    const bgColor = intensity > 0.7 ? 'bg-green-500' : 
                                    intensity > 0.4 ? 'bg-green-300' : 
                                    intensity > 0.2 ? 'bg-green-200' : 'bg-green-100';
                    return (
                      <div
                        key={i}
                        className={`h-3 rounded-sm ${bgColor} ${intensity < 0.2 ? 'opacity-30' : ''}`}
                        title={`Engagement: ${(intensity * 100).toFixed(1)}%`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-4 text-xs text-muted-foreground">
                  <span>12am</span>
                  <span>6am</span>
                  <span>12pm</span>
                  <span>6pm</span>
                  <span>12am</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Content Types</CardTitle>
                <CardDescription>Performance by content format</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: 'Photos', value: 45 },
                          { name: 'Videos', value: 35 },
                          { name: 'Carousels', value: 15 },
                          { name: 'Reels', value: 5 }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                        label
                      >
                        {[
                          { name: 'Photos', value: 45 },
                          { name: 'Videos', value: 35 },
                          { name: 'Carousels', value: 15 },
                          { name: 'Reels', value: 5 }
                        ].map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Hashtag Performance</CardTitle>
                <CardDescription>Top performing hashtags</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { tag: '#summervibes', count: '24.5K', growth: '+15%' },
                    { tag: '#fashiontrends', count: '18.2K', growth: '+8%' },
                    { tag: '#travelblogger', count: '12.7K', growth: '+22%' },
                    { tag: '#foodie', count: '9.3K', growth: '+5%' },
                    { tag: '#fitness', count: '8.1K', growth: '+12%' }
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="font-medium">{item.tag}</span>
                      <div className="text-right">
                        <span className="block font-medium">{item.count}</span>
                        <span className="text-xs text-green-500">{item.growth}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="audience" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Age Distribution</CardTitle>
                <CardDescription>Breakdown by age groups</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={audienceData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {audienceData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Gender</CardTitle>
                <CardDescription>Audience gender breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {genderData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Locations</CardTitle>
                <CardDescription>Where your audience is from</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={locationData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {locationData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Audience Interests</CardTitle>
              <CardDescription>What your audience cares about</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[
                  { name: 'Fashion', percent: 78 },
                  { name: 'Travel', percent: 65 },
                  { name: 'Food', percent: 54 },
                  { name: 'Technology', percent: 48 },
                  { name: 'Fitness', percent: 42 },
                  { name: 'Beauty', percent: 38 },
                  { name: 'Music', percent: 35 },
                  { name: 'Art', percent: 30 },
                  { name: 'Sports', percent: 28 },
                  { name: 'Books', percent: 25 },
                  { name: 'Movies', percent: 22 },
                  { name: 'Gaming', percent: 18 }
                ].map((interest, i) => (
                  <Card key={i} className="overflow-hidden border-0 shadow-none">
                    <div className="p-4">
                      <h4 className="font-medium mb-2">{interest.name}</h4>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${interest.percent}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{interest.percent}%</p>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Active Times</CardTitle>
              <CardDescription>When your audience is most active online</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={[
                      { hour: '12 AM', users: 1200 },
                      { hour: '2 AM', users: 800 },
                      { hour: '4 AM', users: 500 },
                      { hour: '6 AM', users: 700 },
                      { hour: '8 AM', users: 1500 },
                      { hour: '10 AM', users: 2500 },
                      { hour: '12 PM', users: 3500 },
                      { hour: '2 PM', users: 4200 },
                      { hour: '4 PM', users: 4800 },
                      { hour: '6 PM', users: 5500 },
                      { hour: '8 PM', users: 6200 },
                      { hour: '10 PM', users: 3800 }
                    ]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <RechartsBarChart.Bar dataKey="users" fill="#8884d8" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="platforms" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Performance</CardTitle>
                <CardDescription>Comparison across social platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={[
                        { name: 'Instagram', followers: 12500, engagement: 3.5, posts: 124 },
                        { name: 'TikTok', followers: 8200, engagement: 5.2, posts: 98 },
                        { name: 'YouTube', followers: 5400, engagement: 2.8, posts: 45 },
                        { name: 'Facebook', followers: 7800, engagement: 1.5, posts: 78 },
                        { name: 'Twitter', followers: 4300, engagement: 2.1, posts: 210 }
                      ]}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <RechartsBarChart.Bar yAxisId="left" dataKey="followers" fill="#8884d8" />
                      <RechartsBarChart.Bar yAxisId="right" dataKey="engagement" fill="#82ca9d" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Platform Growth</CardTitle>
                <CardDescription>Follower growth by platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart
                      data={[
                        { month: 'Jan', instagram: 9000, tiktok: 5000, youtube: 4000, facebook: 6500, twitter: 3500 },
                        { month: 'Feb', instagram: 9500, tiktok: 5600, youtube: 4200, facebook: 6700, twitter: 3600 },
                        { month: 'Mar', instagram: 10200, tiktok: 6400, youtube: 4300, facebook: 6900, twitter: 3700 },
                        { month: 'Apr', instagram: 10800, tiktok: 6900, youtube: 4500, facebook: 7100, twitter: 3900 },
                        { month: 'May', instagram: 11500, tiktok: 7300, youtube: 4800, facebook: 7300, twitter: 4000 },
                        { month: 'Jun', instagram: 12500, tiktok: 8200, youtube: 5400, facebook: 7800, twitter: 4300 }
                      ]}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <RechartsLineChart.Line type="monotone" dataKey="instagram" stroke="#E1306C" />
                      <RechartsLineChart.Line type="monotone" dataKey="tiktok" stroke="#000000" />
                      <RechartsLineChart.Line type="monotone" dataKey="youtube" stroke="#FF0000" />
                      <RechartsLineChart.Line type="monotone" dataKey="facebook" stroke="#4267B2" />
                      <RechartsLineChart.Line type="monotone" dataKey="twitter" stroke="#1DA1F2" />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Instagram', 'TikTok', 'YouTube'].map((platform, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <CardTitle>{platform}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Followers</span>
                      <span className="font-medium">{i === 0 ? '12.5K' : i === 1 ? '8.2K' : '5.4K'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Engagement Rate</span>
                      <span className="font-medium">{i === 0 ? '3.5%' : i === 1 ? '5.2%' : '2.8%'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Posts</span>
                      <span className="font-medium">{i === 0 ? '124' : i === 1 ? '98' : '45'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Monthly Growth</span>
                      <span className="font-medium text-green-500">{i === 0 ? '+8.7%' : i === 1 ? '+12.3%' : '+11.1%'}</span>
                    </div>
                    <Button variant="outline" className="w-full mt-2">View Details</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Post scheduler modal */}
      {showScheduler && selectedInsight && (
        <PostSchedulerModal
          isOpen={showScheduler}
          onClose={() => setShowScheduler(false)}
          clientId={clientId}
          recommendedContent={selectedInsight.recommendedValue}
        />
      )}
    </div>
  );
} 