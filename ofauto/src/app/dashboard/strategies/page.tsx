'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  ArrowUpRight,
  Sparkles,
  BarChart3,
  MessageCircle,
  Lightbulb,
  Info
} from 'lucide-react';

export default function StrategiesPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">AI Content Strategies</h1>
          <p className="text-muted-foreground">Create, analyze, and execute data-driven content strategies.</p>
        </div>
        <NewStrategyDialog />
      </div>
      
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Strategies</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
          <TabsTrigger value="all">All Platforms</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <>
                <StrategySkeleton />
                <StrategySkeleton />
                <StrategySkeleton />
              </>
            ) : (
              <>
                <StrategyCard 
                  title="Engagement Boost"
                  platform="OnlyFans"
                  roi={2.8}
                  metrics={{
                    revenue: '+24%',
                    followers: '+156',
                    retention: '+9%'
                  }}
                  status="active"
                  type="content"
                  lastUpdated="2 days ago"
                  onClick={() => setSelectedStrategy('engagement-boost')}
                />
                <StrategyCard 
                  title="Subscriber Retention"
                  platform="Fansly"
                  roi={1.9}
                  metrics={{
                    revenue: '+15%',
                    followers: '+67',
                    retention: '+22%'
                  }}
                  status="active"
                  type="messaging"
                  lastUpdated="1 week ago"
                  onClick={() => setSelectedStrategy('subscriber-retention')}
                />
                <StrategyCard 
                  title="Cross-Platform Growth"
                  platform="All Platforms"
                  roi={3.2}
                  metrics={{
                    revenue: '+32%',
                    followers: '+412',
                    retention: '+5%'
                  }}
                  status="active"
                  type="cross-platform"
                  lastUpdated="3 days ago"
                  onClick={() => setSelectedStrategy('cross-platform-growth')}
                />
              </>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="archived">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StrategyCard 
              title="Summer Campaign"
              platform="Instagram"
              roi={1.2}
              metrics={{
                revenue: '+8%',
                followers: '+220',
                retention: '+1%'
              }}
              status="archived"
              type="seasonal"
              lastUpdated="2 months ago"
              onClick={() => setSelectedStrategy('summer-campaign')}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StrategyCard 
              title="Engagement Boost"
              platform="OnlyFans"
              roi={2.8}
              metrics={{
                revenue: '+24%',
                followers: '+156',
                retention: '+9%'
              }}
              status="active"
              type="content"
              lastUpdated="2 days ago"
              onClick={() => setSelectedStrategy('engagement-boost')}
            />
            <StrategyCard 
              title="Subscriber Retention"
              platform="Fansly"
              roi={1.9}
              metrics={{
                revenue: '+15%',
                followers: '+67',
                retention: '+22%'
              }}
              status="active"
              type="messaging"
              lastUpdated="1 week ago"
              onClick={() => setSelectedStrategy('subscriber-retention')}
            />
            <StrategyCard 
              title="Cross-Platform Growth"
              platform="All Platforms"
              roi={3.2}
              metrics={{
                revenue: '+32%',
                followers: '+412',
                retention: '+5%'
              }}
              status="active"
              type="cross-platform"
              lastUpdated="3 days ago"
              onClick={() => setSelectedStrategy('cross-platform-growth')}
            />
            <StrategyCard 
              title="Summer Campaign"
              platform="Instagram"
              roi={1.2}
              metrics={{
                revenue: '+8%',
                followers: '+220',
                retention: '+1%'
              }}
              status="archived"
              type="seasonal"
              lastUpdated="2 months ago"
              onClick={() => setSelectedStrategy('summer-campaign')}
            />
          </div>
        </TabsContent>
      </Tabs>
      
      {selectedStrategy && (
        <StrategyDetailsDialog 
          strategyId={selectedStrategy} 
          open={!!selectedStrategy}
          onClose={() => setSelectedStrategy(null)}
        />
      )}
    </div>
  );
}

function StrategySkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-5 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-8 w-1/2" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
          <Skeleton className="h-4 w-full" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );
  }

interface StrategyCardProps {
  title: string;
  platform: string;
  roi: number;
  metrics: {
    revenue: string;
    followers: string;
    retention: string;
  };
  status: 'active' | 'archived' | 'draft';
  type: 'content' | 'messaging' | 'cross-platform' | 'seasonal';
  lastUpdated: string;
  onClick: () => void;
}

function StrategyCard({ 
  title, 
  platform, 
  roi, 
  metrics, 
  status, 
  type, 
  lastUpdated, 
  onClick 
}: StrategyCardProps) {
  const platformColors: Record<string, string> = {
    'OnlyFans': 'bg-blue-100 text-blue-800',
    'Fansly': 'bg-purple-100 text-purple-800',
    'Instagram': 'bg-pink-100 text-pink-800',
    'Twitter': 'bg-sky-100 text-sky-800',
    'All Platforms': 'bg-emerald-100 text-emerald-800'
  };
  
  const statusColors: Record<string, string> = {
    'active': 'bg-green-100 text-green-800',
    'archived': 'bg-gray-100 text-gray-800',
    'draft': 'bg-yellow-100 text-yellow-800'
  };
  
  const typeIcons: Record<string, React.ReactNode> = {
    'content': <BarChart3 className="h-10 w-10 text-blue-500" />,
    'messaging': <MessageCircle className="h-10 w-10 text-purple-500" />,
    'cross-platform': <ArrowUpRight className="h-10 w-10 text-green-500" />,
    'seasonal': <Calendar className="h-10 w-10 text-orange-500" />
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge className={platformColors[platform]}>
            {platform}
          </Badge>
          <Badge className={statusColors[status]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>Last updated: {lastUpdated}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          <div className="bg-gray-100 p-2 rounded-full">
            {typeIcons[type]}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">ROI Score</span>
              <span className="text-xl font-bold text-green-600">{roi}x</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revenue</span>
                <span className="font-medium text-green-600">{metrics.revenue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Followers</span>
                <span className="font-medium">{metrics.followers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Retention</span>
                <span className="font-medium">{metrics.retention}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onClick} className="w-full">
          View Strategy Details
        </Button>
      </CardFooter>
    </Card>
  );
}

function NewStrategyDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [platform, setPlatform] = useState('');
  const [strategyType, setStrategyType] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate API call delay
    setTimeout(() => {
      setIsGenerating(false);
      setOpen(false);
      // Would show success toast in real implementation
    }, 2000);
  };
  
  const resetForm = () => {
    setStep(1);
    setPlatform('');
    setStrategyType('');
    setIsGenerating(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button>
          <Sparkles className="h-4 w-4 mr-2" />
          Generate New Strategy
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create AI Strategy</DialogTitle>
          <DialogDescription>
            Our AI will analyze your data and generate a tailored content strategy.
          </DialogDescription>
        </DialogHeader>
        
        {step === 1 ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="platform">Select Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Choose platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="onlyfans">OnlyFans</SelectItem>
                  <SelectItem value="fansly">Fansly</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="all">All Platforms</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setStep(2)} disabled={!platform}>
                Next
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="strategy-type">Strategy Type</Label>
              <Select value={strategyType} onValueChange={setStrategyType}>
                <SelectTrigger id="strategy-type">
                  <SelectValue placeholder="Choose strategy type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="content">Content Optimization</SelectItem>
                  <SelectItem value="messaging">Messaging & Engagement</SelectItem>
                  <SelectItem value="cross-platform">Cross-Platform Growth</SelectItem>
                  <SelectItem value="seasonal">Seasonal Campaign</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md flex gap-3">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">How this works</p>
                <p>Our AI will analyze your historical data across platforms to identify patterns and create a customized strategy to maximize your ROI.</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button 
                onClick={handleGenerate} 
                disabled={!strategyType || isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate Strategy'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
  }

interface StrategyDetailsDialogProps {
  strategyId: string;
  open: boolean;
  onClose: () => void;
}

function StrategyDetailsDialog({ strategyId, open, onClose }: StrategyDetailsDialogProps) {
  // In a real implementation, we would fetch strategy details based on the ID
  // This is just mock data for the UI

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) onClose();
    }}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Strategy: Engagement Boost</DialogTitle>
          <DialogDescription>
            AI-generated strategy to increase engagement and revenue on OnlyFans
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-md text-center">
              <p className="text-sm text-muted-foreground">ROI Score</p>
              <p className="text-2xl font-bold text-green-600">2.8x</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md text-center">
              <p className="text-sm text-muted-foreground">Confidence</p>
              <p className="text-2xl font-bold">92%</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md text-center">
              <p className="text-sm text-muted-foreground">Implementation</p>
              <p className="text-2xl font-bold">Easy</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Strategy Overview</h3>
            <p>This engagement strategy focuses on increasing interaction rates with your OnlyFans subscribers through targeted content scheduling and personalized messaging. Analysis of your existing data shows subscribers engage most with your content on weekends and during evening hours.</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Key Recommendations</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Increase posting frequency to 4-5x weekly</p>
                  <p className="text-sm text-muted-foreground">Schedule posts for Friday, Saturday and Sunday evenings for maximum engagement.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Implement personalized messaging sequences</p>
                  <p className="text-sm text-muted-foreground">Send tailored messages to subscribers who haven't engaged in 7+ days.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Use video content for higher engagement</p>
                  <p className="text-sm text-muted-foreground">Your video content receives 40% more engagement than images.</p>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="text-md font-medium text-blue-700">Implementation Plan</h3>
            <p className="text-sm text-blue-700 mt-1">This strategy can be implemented within 48 hours using our automation tools. View the detailed execution plan for step-by-step instructions.</p>
          </div>
        </div>
        
        <DialogFooter className="flex sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <div className="flex gap-2">
            <Button variant="outline">
              Download PDF
            </Button>
            <Button>
              Implement Strategy
            </Button>
    </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 