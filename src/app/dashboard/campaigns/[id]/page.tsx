'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Pencil, 
  Trash, 
  Copy, 
  Play, 
  Pause, 
  MessageSquare, 
  BarChart, 
  Clock,
  Eye,
  Share,
  User,
  MoreVertical,
  DollarSign,
  TrendingUp,
  Calendar
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Progress } from '@/components/ui/progress'
import { trpc } from '@/lib/trpc/client'
import { useToast } from '@/components/ui/use-toast'
import { CampaignForm } from '@/components/dashboard/campaigns/CampaignForm'
import { TemplatePreview } from '@/components/dashboard/campaigns/TemplatePreview'
import { useCampaigns, Campaign } from '@/hooks/useCampaigns'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Edit,
  ExternalLink,
  Plus,
  Settings,
  Users,
  AlertTriangle,
  Trash2,
} from 'lucide-react'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import CampaignModal from '@/components/campaigns/campaign-modal'
import { Metadata } from 'next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'

export const metadata: Metadata = {
  title: 'Campaign Details - OFAuto Dashboard',
  description: 'View and manage campaign details',
}

// Mock campaign data
const MOCK_CAMPAIGN = {
  id: '1',
  name: 'Summer Promotion 2024',
  status: 'active',
  startDate: '2024-06-01',
  endDate: '2024-08-31',
  budget: 5000,
  spent: 2345,
  reach: 45678,
  conversions: 234,
  conversionRate: 3.2,
  roi: 156,
  platforms: ['OnlyFans', 'Fansly', 'Instagram'],
  description: 'Summer promotional campaign featuring exclusive beach content and special subscriber discounts.',
  createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  templateData: {
    subject: 'Welcome to my OnlyFans!',
    message: 'Hey {{name}},\n\nThank you so much for subscribing to my OnlyFans! I really appreciate your support.\n\nAs a new subscriber, you get access to all my exclusive content and special promotions.\n\nFeel free to message me anytime with requests or feedback.\n\nXOXO,\n{{creator_name}}',
    includeMedia: true,
    mediaUrls: [
      'https://images.unsplash.com/photo-1667489022797-ab608913feeb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxlZGl0b3JpYWwtZmVlZHw5fHx8ZW58MHx8fHw%3D&auto=format&fit=crop&w=800&q=60'
    ]
  },
  triggerSettings: {
    delay: 1, // hours
    sendOnlyOnce: true,
    sendTimeRestrictions: false,
    restrictedTimeStart: '22:00',
    restrictedTimeEnd: '08:00'
  },
  stats: {
    sent: 450,
    opened: 382,
    replied: 124,
    conversion: 27.5,
    daily: [
      { date: '2023-07-01', sent: 15, opened: 12, replied: 5 },
      { date: '2023-07-02', sent: 18, opened: 14, replied: 6 },
      { date: '2023-07-03', sent: 22, opened: 19, replied: 7 },
      { date: '2023-07-04', sent: 17, opened: 15, replied: 4 },
      { date: '2023-07-05', sent: 25, opened: 21, replied: 8 }
    ],
    topRecipients: [
      { id: '1', username: 'superfan1', opened: 7, replied: 4 },
      { id: '2', username: 'premium_user', opened: 5, replied: 3 },
      { id: '3', username: 'new_subscriber', opened: 4, replied: 1 }
    ]
  }
}

// Platform mapping for display
const PLATFORMS = {
  onlyfans: { name: 'OnlyFans', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  fansly: { name: 'Fansly', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  instagram: { name: 'Instagram', color: 'bg-pink-100 text-pink-800 border-pink-200' },
  twitter: { name: 'Twitter', color: 'bg-sky-100 text-sky-800 border-sky-200' }
}

// Trigger type mapping
const TRIGGER_TYPES = {
  new_subscriber: { name: 'New Subscriber', icon: <User className="h-4 w-4" /> },
  renewal: { name: 'Subscription Renewal', icon: <Clock className="h-4 w-4" /> },
  inactivity: { name: 'Inactivity', icon: <Pause className="h-4 w-4" /> },
  segment: { name: 'Segment', icon: <User className="h-4 w-4" /> },
  manual: { name: 'Manual', icon: <Play className="h-4 w-4" /> }
}

// Helper to compare metrics between campaigns
const compareMetrics = (metricKey: string, baseline: Campaign, variant: Campaign) => {
  const baseValue = baseline.metrics?.[metricKey as keyof typeof baseline.metrics] as number || 0;
  const variantValue = variant.metrics?.[metricKey as keyof typeof variant.metrics] as number || 0;
  
  if (baseValue === 0) return { diff: 0, percent: 0 };
  
  const diff = variantValue - baseValue;
  const percent = (diff / baseValue) * 100;
  
  return { diff, percent };
};

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const campaignId = params.id as string
  
  // States
  const [campaign, setCampaign] = useState(MOCK_CAMPAIGN)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreateVariantModalOpen, setIsCreateVariantModalOpen] = useState(false)
  const [activeMetricTab, setActiveMetricTab] = useState('performance')
  
  // Fetch campaign data
  const { useGetCampaign, updateCampaign, deleteCampaign, createABTestVariant } = useCampaigns()
  const { data: campaignData, isLoading, error } = useGetCampaign(campaignId)

  // Fetch all related campaigns for A/B testing
  const { data: allCampaigns } = useCampaigns().useGetCampaign('')
  const abTestVariants = campaignData?.abTest || campaignData?.abTestParentId 
    ? allCampaigns?.filter(c => 
        (campaignData.abTestParentId && (c.id === campaignData.abTestParentId || c.abTestParentId === campaignData.abTestParentId)) ||
        (campaignData.abTest && c.abTestParentId === campaignData.id)
      )
    : []

  // Find parent campaign (baseline) for comparison
  const parentCampaign = campaignData?.abTestParentId 
    ? abTestVariants.find(c => c.id === campaignData.abTestParentId) 
    : campaignData

  // Generate historical metrics data for chart
  const generateHistoricalData = () => {
    if (!campaignData?.metrics?.platformMetrics) return []

    const platformMetrics = campaignData.metrics.platformMetrics
    
    if (!platformMetrics.history) return []
    
    return platformMetrics.history.map((entry: any) => ({
      date: formatDate(entry.date),
      impressions: entry.impressions || 0,
      clicks: entry.clicks || 0,
      conversions: entry.conversions || 0,
      ctr: entry.ctr || 0,
      roi: entry.roi || 0
    }))
  }

  const metricsHistory = generateHistoricalData()

  // Handle campaign actions
  const handleEdit = () => {
    setIsModalOpen(true)
  }

  const handleDelete = async () => {
    try {
      await deleteCampaign.mutateAsync(campaignId)
      setIsDeleteDialogOpen(false)
      router.push('/dashboard/campaigns')
      toast.success('Campaign deleted successfully')
    } catch (error) {
      toast.error('Failed to delete campaign')
    }
  }

  const handleSaveCampaign = async (data: any) => {
    try {
      await updateCampaign.mutateAsync({ id: campaignId, ...data })
      setIsModalOpen(false)
      toast.success('Campaign updated successfully')
    } catch (error) {
      toast.error('Failed to update campaign')
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateCampaign.mutateAsync({ 
        id: campaignId, 
        status: newStatus as any 
      })
      toast.success(`Campaign ${newStatus}`)
    } catch (error) {
      toast.error('Failed to update campaign status')
    }
  }

  const handleCreateVariant = async (data: any) => {
    try {
      await createABTestVariant.mutateAsync({
        parentId: campaignId,
        variantData: data
      })
      setIsCreateVariantModalOpen(false)
      toast.success('A/B test variant created successfully')
    } catch (error) {
      toast.error('Failed to create A/B test variant')
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  // Error state
  if (error || !campaignData) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-96">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Campaign Not Found</h2>
        <p className="text-muted-foreground mb-6">The campaign you're looking for doesn't exist or you don't have access to it.</p>
        <Button asChild>
          <Link href="/dashboard/campaigns">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Link>
        </Button>
      </div>
    )
  }

  // Status action buttons based on current status
  const renderStatusButtons = () => {
    switch (campaignData.status) {
      case 'draft':
        return (
          <Button 
            className="gap-2" 
            onClick={() => handleStatusChange('active')}
          >
            <Play className="h-4 w-4" />
            Activate Campaign
          </Button>
        )
      case 'active':
        return (
          <Button 
            className="gap-2" 
            variant="outline" 
            onClick={() => handleStatusChange('paused')}
          >
            <Pause className="h-4 w-4" />
            Pause Campaign
          </Button>
        )
      case 'paused':
        return (
          <Button 
            className="gap-2" 
            onClick={() => handleStatusChange('active')}
          >
            <Play className="h-4 w-4" />
            Resume Campaign
          </Button>
        )
      default:
        return null
    }
  }

  // Status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      'draft': { color: 'bg-slate-200 text-slate-800', label: 'Draft' },
      'active': { color: 'bg-green-100 text-green-800', label: 'Active' },
      'paused': { color: 'bg-amber-100 text-amber-800', label: 'Paused' },
      'completed': { color: 'bg-blue-100 text-blue-800', label: 'Completed' },
      'failed': { color: 'bg-red-100 text-red-800', label: 'Failed' }
    }

    const { color, label } = statusMap[status] || { color: 'bg-gray-100 text-gray-800', label: status }

    return (
      <Badge className={`${color} font-medium`}>
        {label}
      </Badge>
    )
  }

  const progress = (campaignData.spent / campaignData.budget) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/campaigns">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{campaignData.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(campaignData.status)}
              <span className="text-sm text-muted-foreground">
                {formatDate(campaignData.startDate)} - {formatDate(campaignData.endDate)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {renderStatusButtons()}
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Campaign
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Export Data</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Campaign
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${campaignData.spent.toLocaleString()}</div>
            <Progress value={progress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {progress.toFixed(1)}% of ${campaignData.budget.toLocaleString()} budget
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignData.reach.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignData.conversions}</div>
            <p className="text-xs text-muted-foreground">
              {campaignData.conversionRate}% conversion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignData.roi}%</div>
            <p className="text-xs text-muted-foreground">
              Return on investment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Details */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{campaignData.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Platforms</CardTitle>
              <CardDescription>
                This campaign is running on the following platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {campaignData.platforms.map((platform) => (
                  <Badge key={platform} variant="secondary">
                    {platform}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates and actions for this campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Campaign launched</p>
                    <p className="text-xs text-muted-foreground">June 1, 2024 at 9:00 AM</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Reached 25% of budget</p>
                    <p className="text-xs text-muted-foreground">June 15, 2024 at 2:30 PM</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">100 new conversions</p>
                    <p className="text-xs text-muted-foreground">June 20, 2024 at 11:45 AM</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Detailed performance analytics will be displayed here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Charts and graphs showing campaign performance over time
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Content</CardTitle>
              <CardDescription>
                Posts and media associated with this campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Content items will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audience">
          <Card>
            <CardHeader>
              <CardTitle>Target Audience</CardTitle>
              <CardDescription>
                Audience demographics and targeting settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Audience insights will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Settings</CardTitle>
              <CardDescription>
                Configure campaign parameters and automation rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Campaign configuration options will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <CampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCampaign}
        onDelete={handleDelete}
        campaign={campaignData}
      />

      {/* Create Variant Modal */}
      <CampaignModal
        isOpen={isCreateVariantModalOpen}
        onClose={() => setIsCreateVariantModalOpen(false)}
        onSave={(data) => handleCreateVariant({ ...data, abTest: true })}
        onDelete={() => {}}
        campaign={{
          ...campaignData,
          id: '',
          name: `${campaignData.name} - Variant`,
          abTest: true,
          abTestVariant: '',
          abTestParentId: campaignData.id,
        }}
      />
    </div>
  )
}

// Helper component to display comparison badges
const ComparisonBadge = ({ comparison }: { comparison: { diff: number; percent: number } }) => {
  if (comparison.percent === 0) return null;
  
  const isPositive = comparison.percent > 0;
  const color = isPositive ? 'text-green-600' : 'text-red-600';
  const sign = isPositive ? '+' : '';
  
  return (
    <div className={`text-xs ${color}`}>
      {sign}{comparison.percent.toFixed(2)}%
    </div>
  );
}; 