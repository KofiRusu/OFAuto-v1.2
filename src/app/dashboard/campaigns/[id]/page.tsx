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
  User
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
  BarChart3,
  Calendar,
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

// Mock campaign data
const MOCK_CAMPAIGN = {
  id: '1',
  name: 'New Subscriber Welcome',
  description: 'Automatically send a welcome message to new subscribers',
  status: 'active',
  triggerType: 'new_subscriber',
  platform: 'onlyfans',
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              asChild 
              className="h-8 w-8"
            >
              <Link href="/dashboard/campaigns">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">{campaignData.name}</h1>
            {getStatusBadge(campaignData.status)}
            {campaignData.abTest && (
              <Badge variant="outline">A/B Test</Badge>
            )}
            {campaignData.abTestVariant && (
              <Badge variant="outline">Variant: {campaignData.abTestVariant}</Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {campaignData.description || 'No description provided'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {renderStatusButtons()}
          
          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={handleEdit}
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this campaign? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete} 
                  className="bg-destructive text-destructive-foreground"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Campaign Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(campaignData.budget)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(campaignData.metrics?.cost || 0)} spent
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-md font-medium">
              {formatDate(campaignData.startDate)} - {formatDate(campaignData.endDate)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(campaignData.endDate) > new Date() 
                ? `${Math.ceil((new Date(campaignData.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining` 
                : 'Campaign ended'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="text-lg font-bold">
                {campaignData.metrics?.ctr?.toFixed(2) || '0.00'}% CTR
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatNumber(campaignData.metrics?.clicks || 0)} clicks / {formatNumber(campaignData.metrics?.impressions || 0)} impressions
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaignData.metrics?.roi?.toFixed(2) || '0.00'}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(campaignData.metrics?.conversions || 0)} conversions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Metrics and Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Metrics</CardTitle>
          <CardDescription>
            Performance data for the current campaign
          </CardDescription>
          <Tabs defaultValue={activeMetricTab} value={activeMetricTab} onValueChange={setActiveMetricTab}>
            <TabsList>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="abtest" disabled={abTestVariants.length <= 1}>A/B Testing</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <TabsContent value="performance" className="space-y-4">
            {/* Metrics Chart */}
            <div className="h-80">
              {metricsHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={metricsHistory}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="impressions" stroke="#8884d8" />
                    <Line type="monotone" dataKey="clicks" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="conversions" stroke="#ffc658" />
                    <Line type="monotone" dataKey="ctr" stroke="#ff8042" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <BarChart3 className="h-10 w-10 mb-2" />
                  <p>No historical data available for this campaign</p>
                </div>
              )}
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Impressions
                  </div>
                  <div className="text-xl font-bold">
                    {formatNumber(campaignData.metrics?.impressions || 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Clicks
                  </div>
                  <div className="text-xl font-bold">
                    {formatNumber(campaignData.metrics?.clicks || 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Conversions
                  </div>
                  <div className="text-xl font-bold">
                    {formatNumber(campaignData.metrics?.conversions || 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Conversion Rate
                  </div>
                  <div className="text-xl font-bold">
                    {campaignData.metrics?.conversionRate?.toFixed(2) || '0.00'}%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Revenue
                  </div>
                  <div className="text-xl font-bold">
                    {formatCurrency(campaignData.metrics?.revenue || 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Cost
                  </div>
                  <div className="text-xl font-bold">
                    {formatCurrency(campaignData.metrics?.cost || 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    ROI
                  </div>
                  <div className="text-xl font-bold">
                    {campaignData.metrics?.roi?.toFixed(2) || '0.00'}%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    CTR
                  </div>
                  <div className="text-xl font-bold">
                    {campaignData.metrics?.ctr?.toFixed(2) || '0.00'}%
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="abtest">
            {abTestVariants.length <= 1 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <div className="mb-4">No A/B test variants available</div>
                {!campaignData.abTestParentId && (
                  <Button onClick={() => setIsCreateVariantModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create A/B Test Variant
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">A/B Test Comparison</h3>
                  {!campaignData.abTestParentId && (
                    <Button onClick={() => setIsCreateVariantModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Variant
                    </Button>
                  )}
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Variant</th>
                        <th className="text-right p-2">Impressions</th>
                        <th className="text-right p-2">Clicks</th>
                        <th className="text-right p-2">CTR</th>
                        <th className="text-right p-2">Conversions</th>
                        <th className="text-right p-2">Conv. Rate</th>
                        <th className="text-right p-2">Revenue</th>
                        <th className="text-right p-2">ROI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[parentCampaign, ...abTestVariants.filter(c => c.id !== parentCampaign?.id)].map((variant) => {
                        const isBaseline = variant?.id === parentCampaign?.id;
                        const compareWith = isBaseline ? undefined : parentCampaign;
                        
                        return (
                          <tr key={variant?.id} className="border-b hover:bg-muted/50">
                            <td className="p-2">
                              <div className="font-medium">
                                {isBaseline ? 'Baseline' : variant?.abTestVariant || 'Variant'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {variant?.name}
                              </div>
                            </td>
                            <td className="text-right p-2">
                              <div>{formatNumber(variant?.metrics?.impressions || 0)}</div>
                              {!isBaseline && compareWith && (
                                <ComparisonBadge 
                                  comparison={compareMetrics('impressions', compareWith, variant!)}
                                />
                              )}
                            </td>
                            <td className="text-right p-2">
                              <div>{formatNumber(variant?.metrics?.clicks || 0)}</div>
                              {!isBaseline && compareWith && (
                                <ComparisonBadge 
                                  comparison={compareMetrics('clicks', compareWith, variant!)}
                                />
                              )}
                            </td>
                            <td className="text-right p-2">
                              <div>{variant?.metrics?.ctr?.toFixed(2) || '0.00'}%</div>
                              {!isBaseline && compareWith && (
                                <ComparisonBadge 
                                  comparison={compareMetrics('ctr', compareWith, variant!)}
                                />
                              )}
                            </td>
                            <td className="text-right p-2">
                              <div>{formatNumber(variant?.metrics?.conversions || 0)}</div>
                              {!isBaseline && compareWith && (
                                <ComparisonBadge 
                                  comparison={compareMetrics('conversions', compareWith, variant!)}
                                />
                              )}
                            </td>
                            <td className="text-right p-2">
                              <div>{variant?.metrics?.conversionRate?.toFixed(2) || '0.00'}%</div>
                              {!isBaseline && compareWith && (
                                <ComparisonBadge 
                                  comparison={compareMetrics('conversionRate', compareWith, variant!)}
                                />
                              )}
                            </td>
                            <td className="text-right p-2">
                              <div>{formatCurrency(variant?.metrics?.revenue || 0)}</div>
                              {!isBaseline && compareWith && (
                                <ComparisonBadge 
                                  comparison={compareMetrics('revenue', compareWith, variant!)}
                                />
                              )}
                            </td>
                            <td className="text-right p-2">
                              <div>{variant?.metrics?.roi?.toFixed(2) || '0.00'}%</div>
                              {!isBaseline && compareWith && (
                                <ComparisonBadge 
                                  comparison={compareMetrics('roi', compareWith, variant!)}
                                />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="bg-muted p-4 rounded-md">
                  <h4 className="font-medium mb-2">A/B Test Insights</h4>
                  <p className="text-sm text-muted-foreground">
                    {abTestVariants.length > 1 ? (
                      abTestVariants.some(v => 
                        v.id !== parentCampaign?.id && 
                        v.metrics?.ctr && 
                        parentCampaign?.metrics?.ctr && 
                        v.metrics.ctr > parentCampaign.metrics.ctr * 1.1
                      ) ? (
                        "One or more variants are outperforming the baseline. Consider allocating more budget to the best performing variant."
                      ) : (
                        "Variants are performing similarly to the baseline. Continue testing to gather more data."
                      )
                    ) : (
                      "Not enough variants to provide meaningful insights."
                    )}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Card>

      {/* Campaign Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium text-muted-foreground">Platform</div>
              <div className="text-sm capitalize">{campaignData.platform}</div>
              
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              <div className="text-sm">{getStatusBadge(campaignData.status)}</div>
              
              <div className="text-sm font-medium text-muted-foreground">Start Date</div>
              <div className="text-sm">{formatDate(campaignData.startDate)}</div>
              
              <div className="text-sm font-medium text-muted-foreground">End Date</div>
              <div className="text-sm">{formatDate(campaignData.endDate)}</div>
              
              <div className="text-sm font-medium text-muted-foreground">Budget</div>
              <div className="text-sm">{formatCurrency(campaignData.budget)}</div>
              
              <div className="text-sm font-medium text-muted-foreground">Created At</div>
              <div className="text-sm">{formatDate(campaignData.createdAt)}</div>
              
              <div className="text-sm font-medium text-muted-foreground">Last Updated</div>
              <div className="text-sm">{formatDate(campaignData.updatedAt)}</div>
              
              <div className="text-sm font-medium text-muted-foreground">A/B Test</div>
              <div className="text-sm">{campaignData.abTest || campaignData.abTestVariant ? 'Yes' : 'No'}</div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/dashboard/clients/${campaignData.clientId}`}>
                <Users className="h-4 w-4 mr-2" />
                View Client
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Campaign Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Placeholder for activity feed */}
              <div className="flex items-start gap-4 pb-4 border-b">
                <div className="rounded-full bg-primary/10 p-2">
                  <Play className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Campaign was activated</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(campaignData.updatedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 pb-4 border-b">
                <div className="rounded-full bg-primary/10 p-2">
                  <Settings className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Campaign settings updated</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(campaignData.updatedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Campaign created</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(campaignData.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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