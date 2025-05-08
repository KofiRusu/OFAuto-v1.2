'use client'

import { useState } from 'react'
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Download, ThumbsUp, ThumbsDown, Calendar, Filter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Mock strategy data - would be fetched from API
const MOCK_STRATEGIES = [
  {
    id: '1',
    title: 'Increase Instagram Engagement',
    description: 'Post interactive stories daily with polls and questions to boost follower engagement.',
    platform: 'instagram',
    roi: 4.8,
    status: 'active',
    autoImplement: false,
    createdAt: '2023-09-15T10:00:00Z',
    insights: [
      'Stories get 35% more engagement than regular posts',
      'Questions generate 54% more direct messages',
      'Consistency increases reach by 28%'
    ]
  },
  {
    id: '2',
    title: 'Twitter Engagement Campaign',
    description: 'Schedule 3 tweets per day with trending hashtags and engage with follower responses.',
    platform: 'twitter',
    roi: 3.9,
    status: 'implemented',
    autoImplement: true,
    createdAt: '2023-09-10T14:30:00Z',
    insights: [
      'Hashtag usage increases visibility by 42%',
      'Engagement with responses boosts follower loyalty',
      'Consistent timing improves algorithm placement'
    ]
  },
  {
    id: '3',
    title: 'OnlyFans Premium Content Strategy',
    description: 'Create exclusive weekly content with premium pricing to maximize revenue.',
    platform: 'onlyfans',
    roi: 6.2,
    status: 'pending',
    autoImplement: false,
    createdAt: '2023-09-05T09:15:00Z',
    insights: [
      'Premium content converts at 3.2x higher rate',
      'Limited availability drives urgency',
      'Exclusive messaging generates 2.8x more responses'
    ]
  },
]

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState(MOCK_STRATEGIES)
  const [filter, setFilter] = useState('all')
  
  const handleFeedback = (id: string, type: 'like' | 'dislike') => {
    console.log(`Strategy ${id} received ${type}`)
    // API call would go here
  }
  
  const handleImplementToggle = (id: string, value: boolean) => {
    setStrategies(strategies.map(strategy => 
      strategy.id === id ? {...strategy, autoImplement: value} : strategy
    ))
    // API call would go here
  }
  
  const filteredStrategies = filter === 'all' 
    ? strategies 
    : strategies.filter(s => s.status === filter)
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">AI Strategy System</h1>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Strategies</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="implemented">Implemented</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="current">
        <TabsList className="mb-4">
          <TabsTrigger value="current">Current Strategies</TabsTrigger>
          <TabsTrigger value="history">Strategy History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="current" className="space-y-4">
          {filteredStrategies.map(strategy => (
            <Card key={strategy.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{strategy.title}</CardTitle>
                    <CardDescription className="mt-1">{strategy.description}</CardDescription>
                  </div>
                  <Badge 
                    variant={
                      strategy.status === 'active' ? 'default' : 
                      strategy.status === 'implemented' ? 'success' : 'secondary'
                    }
                  >
                    {strategy.status.charAt(0).toUpperCase() + strategy.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Strategy Insights</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {strategy.insights.map((insight, i) => (
                        <li key={i} className="text-sm">{insight}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Platform</span>
                      <Badge variant="outline" className="capitalize">{strategy.platform}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Expected ROI</span>
                      <span className="text-green-600 font-bold">{strategy.roi}x</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Created</span>
                      <span className="text-muted-foreground">{new Date(strategy.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id={`auto-implement-${strategy.id}`}
                          checked={strategy.autoImplement}
                          onCheckedChange={(value) => handleImplementToggle(strategy.id, value)}
                        />
                        <Label htmlFor={`auto-implement-${strategy.id}`}>Auto-implement</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleFeedback(strategy.id, 'like')}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Like
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleFeedback(strategy.id, 'dislike')}
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    Dislike
                  </Button>
                </div>
                <Button variant="secondary" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Download PDF
                </Button>
              </CardFooter>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="history">
          <div className="p-4 text-center">
            <h3 className="text-lg font-medium">Strategy History</h3>
            <p className="text-muted-foreground">View all past strategies and their performance metrics</p>
            {/* History content would go here */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 