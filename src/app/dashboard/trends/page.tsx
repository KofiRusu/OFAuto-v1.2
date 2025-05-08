'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
  CalendarClock,
  Clock,
  Send,
  Twitter,
  Instagram,
  Youtube,
  Check,
  Info,
  AlertTriangle
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

// TikTok icon component (since Lucide doesn't have one)
const TikTokIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.13735 11.5803V10.8046C9.05958 10.8046 8.98223 10.8093 8.9044 10.8046C7.88085 10.7392 6.92455 10.2286 6.27099 9.40151C5.61743 8.57426 5.32223 7.54161 5.44223 6.5126L5.44614 6.47157L4.70285 6.47031C4.54785 7.75404 4.96427 9.04015 5.85462 10.0154C6.74504 10.9906 7.99574 11.555 9.28951 11.5811C9.30551 11.5811 9.32147 11.5803 9.3374 11.5803H9.13735Z" fill="currentColor"/>
    <path d="M9.28735 19.1886C10.9576 19.1886 12.3197 17.8518 12.3538 16.1834C12.3671 15.5412 12.1862 14.9145 11.8397 14.3932V16.954C11.8397 16.9684 11.838 16.9825 11.8347 16.9964C11.8347 16.9979 11.8347 16.9992 11.8341 17.0006C11.7848 17.8271 11.1041 18.489 10.268 18.51C9.93265 18.516 9.61055 18.4033 9.34824 18.2061C9.08594 18.009 8.89809 17.7382 8.8108 17.429C8.72344 17.1198 8.74094 16.7922 8.86088 16.4953C8.98083 16.1985 9.19676 15.9493 9.47627 15.7836C9.43412 15.6997 9.39887 15.6123 9.3699 15.5229C9.26645 15.253 9.20776 14.9696 9.19555 14.682C9.02777 14.758 8.86651 14.85 8.71527 14.9578C8.07237 15.4169 7.60779 16.074 7.39597 16.8267C7.18416 17.5794 7.23912 18.3743 7.55109 19.0925C7.86306 19.8108 8.41196 20.4102 9.10815 20.7996C9.80433 21.189 10.6098 21.3451 11.4035 21.2458C12.1972 21.1466 12.9346 20.7978 13.5031 20.255C14.0716 19.7122 14.4405 19.0026 14.55 18.2327C14.6594 17.4627 14.5038 16.6793 14.1075 16.0028V11.0496C14.9552 11.5795 15.9203 11.875 16.9178 11.9015V10.3497C16.4996 10.3347 16.0855 10.2614 15.6881 10.1324C15.2906 10.0034 14.9142 9.81999 14.5722 9.5873C14.2302 9.35452 13.9267 9.07567 13.6724 8.76C13.4181 8.44443 13.2161 8.0964 13.0735 7.72637C12.9309 7.35625 12.8495 6.96923 12.8326 6.57697C12.8157 6.18462 12.8633 5.79376 12.9738 5.41647C13.0843 5.03918 13.2563 4.68078 13.483 4.3512C13.7097 4.02162 13.9885 3.7259 14.3085 3.47607L14.3327 3.45691L13.8344 2.90104L13.8115 2.91863C12.5345 4.03191 11.8336 5.64457 11.8835 7.31571V9.87744C11.5365 9.35548 11.0555 8.93033 10.4897 8.64399C9.92381 8.35765 9.29272 8.21898 8.65555 8.24038C8.01837 8.26181 7.39891 8.44262 6.8574 8.76489C6.31598 9.08715 5.86682 9.54051 5.55593 10.0873C5.24501 10.634 5.08171 11.2546 5.0838 11.8861C5.0859 12.5176 5.25335 13.1372 5.56801 13.6819C5.88267 14.2266 6.33497 14.6771 6.87865 14.9957C7.42227 15.3143 8.04289 15.4908 8.67985 15.5077C9.31681 15.5246 9.94653 15.3815 10.5066 15.0914C10.4873 15.1903 10.4736 15.2904 10.4655 15.3914C10.3848 16.402 10.7255 17.4024 11.4134 18.1667C12.1014 18.931 13.0777 19.3693 14.0943 19.3703V17.8188C13.5596 17.8196 13.0409 17.6492 12.6123 17.3327C12.1838 17.0164 11.8674 16.5702 11.7074 16.062C11.8079 15.0538 12.7045 14.2496 13.7723 14.2485C14.1146 14.2485 14.4512 14.3442 14.7447 14.5267V13.0037C14.5377 12.9181 14.3144 12.8731 14.0895 12.8712C13.6172 12.8664 13.1562 12.9932 12.763 13.2349C12.3698 13.4767 12.0624 13.8227 11.8832 14.2273C11.8394 13.599 11.6015 12.9975 11.1997 12.5011C10.7978 12.0046 10.2498 11.6336 9.629 11.4363C9.50817 11.401 9.38735 11.3666 9.26735 11.3411L9.1374 11.3068V12.9851C9.22735 13.0027 9.31735 13.0222 9.4074 13.0495C9.74957 13.1511 10.0596 13.3429 10.31 13.6065C10.5605 13.8702 10.7431 14.1964 10.8386 14.5533C10.9341 14.9101 10.9392 15.2859 10.8536 15.6451C10.768 16.0044 10.5942 16.3351 10.3513 16.6051C10.1083 16.8749 9.80405 17.0745 9.46552 17.1848C9.12692 17.295 8.76579 17.3126 8.41859 17.2359C8.07138 17.1591 7.7517 16.9904 7.48976 16.7459C7.22782 16.5015 7.03211 16.1897 6.92297 15.8449L6.92114 15.84C6.8068 15.4741 6.78999 15.0866 6.87236 14.713C6.95481 14.3393 7.13337 13.9924 7.3911 13.7077C7.64884 13.423 7.97614 13.2101 8.34101 13.0912C8.70587 12.9722 9.09655 12.9511 9.47238 13.0299L9.62822 13.0659L9.91297 11.435L9.75785 11.3994C9.56585 11.3594 9.37627 11.3291 9.19123 11.3088C9.02055 11.2907 8.85162 11.2792 8.68575 11.2736C8.68533 11.2831 8.68324 11.2926 8.6819 11.3021C7.68499 11.4191 6.77084 11.9334 6.13169 12.7315C5.49254 13.5297 5.18038 14.5499 5.26405 15.5777C5.34772 16.6056 5.82142 17.5683 6.58851 18.2823C7.35559 18.9964 8.36024 19.4091 9.39885 19.433C9.42997 19.4342 9.46145 19.4342 9.49293 19.4336C9.4238 19.3536 9.35972 19.2693 9.30135 19.1811L9.30051 19.1798C9.2967 19.1832 9.2921 19.1853 9.28727 19.1861L9.28735 19.1886Z" fill="currentColor"/>
    <path d="M14.093 11.9015C15.0906 11.875 16.0557 11.5795 16.9033 11.0496V7.17553C16.4344 6.88553 16.0219 6.51553 15.6825 6.08553H14.0933C14.7517 6.80782 15.1377 7.74365 15.1801 8.72857C15.2225 9.7135 14.9185 10.6779 14.3255 11.4528C14.2522 11.5534 14.1747 11.65 14.093 11.7426V11.9015Z" fill="currentColor"/>
  </svg>
);

// Source icon mapping
const SourceIcon = ({ source }: { source: string }) => {
  switch (source) {
    case 'Twitter':
      return <Twitter className="h-4 w-4" />;
    case 'TikTok':
      return <TikTokIcon />;
    case 'Instagram':
      return <Instagram className="h-4 w-4" />;
    case 'YouTube':
      return <Youtube className="h-4 w-4" />;
    default:
      return <TrendingUp className="h-4 w-4" />;
  }
};

// Helper function to format large numbers in a readable way
const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

// Component for rendering a trend card
const TrendCard = ({ 
  trend, 
  onSelectTrend 
}: { 
  trend: any,
  onSelectTrend: (trend: any) => void 
}) => {
  return (
    <Card className="mb-4 hover:shadow-md transition-all cursor-pointer" onClick={() => onSelectTrend(trend)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="px-2 py-0 h-6">
                <SourceIcon source={trend.source} />
                <span className="ml-1">{trend.source}</span>
              </Badge>
              {trend.boostScore > 1.5 && (
                <Badge className="bg-green-500">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Hot
                </Badge>
              )}
            </div>
            <CardTitle className="mt-2 text-xl">{trend.name}</CardTitle>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold flex items-center">
              {trend.boostScore.toFixed(1)}
              <ArrowUpRight 
                className={`ml-1 h-5 w-5 ${
                  trend.boostScore > 1.5 ? 'text-green-500' : 
                  trend.boostScore > 1.0 ? 'text-yellow-500' : 'text-gray-400'
                }`} 
              />
            </div>
            <p className="text-sm text-muted-foreground">Boost Score</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <CalendarClock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {format(new Date(trend.detectedAt), 'MMM d, h:mm a')}
            </span>
          </div>
          <div>
            {trend.metrics && trend.metrics.length > 0 && (
              <span className="text-sm">
                {formatNumber(trend.metrics[0].value)} engagement
              </span>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="ghost" size="sm" className="ml-auto">
          <Send className="h-4 w-4 mr-2" /> Create Post
        </Button>
      </CardFooter>
    </Card>
  );
};

// Component for rendering detailed trend metrics
const TrendDetail = ({ 
  trend, 
  onBack 
}: { 
  trend: any, 
  onBack: () => void 
}) => {
  const [timeframe, setTimeframe] = useState<'hour' | 'day' | 'week' | 'month'>('day');
  const { data: metricsData, isLoading: metricsLoading } = trpc.trend.getTrendMetrics.useQuery({
    trendId: trend.id,
    timeframe
  });
  
  const { data: suggestions, isLoading: suggestionsLoading } = trpc.trend.getContentSuggestions.useQuery({
    trendId: trend.id
  });
  
  // Format metrics data for charts
  const chartData = metricsData?.metrics.map(metric => ({
    time: format(new Date(metric.timestamp), timeframe === 'hour' ? 'HH:mm' : 'MM/dd'),
    value: metric.value
  })) || [];
  
  return (
    <div>
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Back to Trends
        </Button>
        <Badge variant="outline" className="ml-2">
          <SourceIcon source={trend.source} />
          <span className="ml-1">{trend.source}</span>
        </Badge>
        {trend.boostScore > 1.5 && (
          <Badge className="ml-2 bg-green-500">
            <TrendingUp className="h-3 w-3 mr-1" />
            Hot Trend
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{trend.name}</CardTitle>
            <CardDescription>
              Trend metrics over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-4">
              <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hour">Last Hour</SelectItem>
                  <SelectItem value="day">Last 24 Hours</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {metricsLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-[250px] w-full" />
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name="Engagement" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">No metric data available for this timeframe</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Boost Score</CardTitle>
            <CardDescription>
              Current trend performance
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-5xl font-bold mb-4 flex items-center justify-center">
              {trend.boostScore.toFixed(1)}
              <ArrowUpRight 
                className={`ml-2 h-6 w-6 ${
                  trend.boostScore > 1.5 ? 'text-green-500' : 
                  trend.boostScore > 1.0 ? 'text-yellow-500' : 'text-gray-400'
                }`} 
              />
            </div>
            
            <Alert className={
              trend.boostScore > 1.5 ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 
              trend.boostScore > 1.0 ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' :
              'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800'
            }>
              <div className="flex items-start">
                {trend.boostScore > 1.5 ? (
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                ) : trend.boostScore > 1.0 ? (
                  <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-gray-600 dark:text-gray-400 mt-0.5" />
                )}
                <div className="ml-2">
                  <AlertTitle>
                    {trend.boostScore > 1.5 ? 'Recommended' : 
                     trend.boostScore > 1.0 ? 'Moderate Opportunity' : 
                     'Low Priority'}
                  </AlertTitle>
                  <AlertDescription className="text-left">
                    {trend.boostScore > 1.5 ? 
                      `Post about "${trend.name}" now for potentially +${Math.round((trend.boostScore - 1) * 100)}% increased engagement` : 
                     trend.boostScore > 1.0 ? 
                      'This trend may provide some engagement boost' : 
                      'This trend is not currently performing well'}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
            
            <div className="mt-6">
              <h4 className="font-medium mb-2">First Detected</h4>
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <CalendarClock className="h-4 w-4 mr-2" />
                {format(new Date(trend.detectedAt), 'MMM d, yyyy h:mm a')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Content Suggestions</CardTitle>
          <CardDescription>
            AI-generated post ideas based on this trend
          </CardDescription>
        </CardHeader>
        <CardContent>
          {suggestionsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : suggestions?.suggestions.length ? (
            <ul className="space-y-2">
              {suggestions.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-center p-2 border rounded-md hover:bg-muted/50">
                  <span className="mr-4 text-muted-foreground">{index + 1}.</span>
                  <span>{suggestion}</span>
                  <Button variant="ghost" size="sm" className="ml-auto">
                    <Send className="h-4 w-4 mr-1" /> Use
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No suggestions available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default function TrendsPage() {
  const [selectedSource, setSelectedSource] = useState<string | undefined>(undefined);
  const [selectedTrend, setSelectedTrend] = useState<any | null>(null);
  const { toast } = useToast();
  
  const { 
    data: trendsData, 
    isLoading: trendsLoading,
    refetch: refetchTrends 
  } = trpc.trend.getRecentTrends.useQuery({
    limit: 20,
    source: selectedSource,
  });
  
  const refreshTrendsMutation = trpc.trend.refreshTrends.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Trends refreshed",
        description: `Detected ${data.trendsDetected} trends from various sources.`,
      });
      refetchTrends();
    },
    onError: (error) => {
      toast({
        title: "Failed to refresh trends",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleSourceChange = (source: string) => {
    setSelectedSource(source === 'all' ? undefined : source);
  };
  
  const handleRefreshTrends = () => {
    refreshTrendsMutation.mutate();
  };
  
  const handleSelectTrend = (trend: any) => {
    setSelectedTrend(trend);
  };
  
  const handleBackToTrends = () => {
    setSelectedTrend(null);
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Trend Analysis</h1>
          <p className="text-muted-foreground">
            Discover trending topics to boost your content engagement
          </p>
        </div>
        <Button 
          onClick={handleRefreshTrends} 
          disabled={refreshTrendsMutation.isLoading}
        >
          {refreshTrendsMutation.isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Trends
            </>
          )}
        </Button>
      </div>
      
      {selectedTrend ? (
        <TrendDetail trend={selectedTrend} onBack={handleBackToTrends} />
      ) : (
        <>
          <div className="mb-6">
            <Tabs defaultValue="all" className="w-full" onValueChange={handleSourceChange}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Sources</TabsTrigger>
                <TabsTrigger value="Twitter">Twitter</TabsTrigger>
                <TabsTrigger value="TikTok">TikTok</TabsTrigger>
                <TabsTrigger value="Instagram">Instagram</TabsTrigger>
                <TabsTrigger value="YouTube">YouTube</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <p className="text-sm text-muted-foreground mb-4">
                  Showing trends from all available sources
                </p>
              </TabsContent>
              
              <TabsContent value="Twitter">
                <p className="text-sm text-muted-foreground mb-4">
                  Twitter trends are updated hourly based on tweet volume and engagement
                </p>
              </TabsContent>
              
              <TabsContent value="TikTok">
                <p className="text-sm text-muted-foreground mb-4">
                  TikTok trends include popular hashtags and trending video topics
                </p>
              </TabsContent>
              
              <TabsContent value="Instagram">
                <p className="text-sm text-muted-foreground mb-4">
                  Instagram trends focus on hashtags with high engagement rates
                </p>
              </TabsContent>
              
              <TabsContent value="YouTube">
                <p className="text-sm text-muted-foreground mb-4">
                  YouTube trends are based on trending videos and search queries
                </p>
              </TabsContent>
            </Tabs>
          </div>
          
          {trendsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="mb-4">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-8 w-20 ml-auto" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : trendsData?.trends && trendsData.trends.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendsData.trends.map((trend) => (
                <TrendCard 
                  key={trend.id} 
                  trend={trend} 
                  onSelectTrend={handleSelectTrend} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No trends found</h2>
              <p className="text-muted-foreground mb-4">
                {selectedSource 
                  ? `No trends available from ${selectedSource}` 
                  : "No trends available from any source"}
              </p>
              <Button onClick={handleRefreshTrends}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Trends
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 