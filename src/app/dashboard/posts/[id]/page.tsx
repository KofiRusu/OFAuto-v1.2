'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Calendar, Clock, ArrowLeft, Edit, Trash, BarChart, Share, Copy } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { trpc } from '@/lib/trpc/client'
import { useToast } from '@/components/ui/use-toast'
import { PostSchedulerModal } from '@/components/dashboard/posts'

// Mock post data for development
const MOCK_POST = {
  id: '1',
  title: 'Weekly Promotion Announcement',
  content: 'Check out our latest promotion! 25% off all premium content this weekend only.',
  platforms: ['onlyfans', 'fansly', 'instagram'],
  scheduledFor: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
  status: 'scheduled',
  mediaUrls: [
    'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80',
  ],
  analytics: {
    overview: {
      impressions: 1240,
      engagements: 354,
      clicks: 78,
      saves: 45,
      shares: 30,
    },
    platforms: {
      onlyfans: {
        impressions: 580,
        engagements: 120,
        clicks: 35, 
      },
      fansly: {
        impressions: 410,
        engagements: 95,
        clicks: 28,
      },
      instagram: {
        impressions: 250,
        engagements: 139,
        clicks: 15,
        saves: 45,
        shares: 30,
      },
    },
    timeline: [
      { date: '2023-05-01', impressions: 120, engagements: 35 },
      { date: '2023-05-02', impressions: 180, engagements: 42 },
      { date: '2023-05-03', impressions: 240, engagements: 68 },
      { date: '2023-05-04', impressions: 300, engagements: 85 },
      { date: '2023-05-05', impressions: 400, engagements: 124 },
    ]
  }
}

// Prepare platform data for display
const PLATFORMS = {
  onlyfans: { name: 'OnlyFans', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  fansly: { name: 'Fansly', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  instagram: { name: 'Instagram', color: 'bg-pink-100 text-pink-800 border-pink-200' },
  twitter: { name: 'Twitter', color: 'bg-sky-100 text-sky-800 border-sky-200' },
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const postId = params.id as string
  
  // States
  const [post, setPost] = useState(MOCK_POST)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  // Fetch client ID
  const clientId = "current-client-id"
  
  // Fetch post data
  useEffect(() => {
    // In a real implementation, this would fetch data from your API
    // For now, we're using mock data
    if (postId !== MOCK_POST.id) {
      // If the ID doesn't match our mock, we'd normally show an error or 404
      // For demo purposes, we'll just use the mock data
    }
  }, [postId])
  
  // Delete post
  const handleDelete = () => {
    // In a real implementation, call your API
    toast({
      title: "Post deleted",
      description: "The post has been permanently removed."
    })
    router.push('/dashboard/posts')
  }
  
  // Duplicate post
  const handleDuplicate = () => {
    // In a real implementation, call your API
    toast({
      title: "Post duplicated",
      description: "A copy has been created as a draft."
    })
    router.push('/dashboard/posts')
  }
  
  // Cancel scheduled post
  const handleCancel = () => {
    // In a real implementation, call your API
    toast({
      title: "Post cancelled",
      description: "The scheduled post has been cancelled."
    })
    setPost({ ...post, status: 'cancelled' })
  }
  
  // Format the post's status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">Draft</Badge>
      case 'scheduled':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Scheduled</Badge>
      case 'published':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Published</Badge>
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-6">
        {/* Header with back button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push('/dashboard/posts')}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Post Details</h1>
          </div>
          
          <div className="flex space-x-2">
            {post.status === 'draft' || post.status === 'scheduled' ? (
              <Button 
                variant="outline" 
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Post
              </Button>
            ) : null}
            
            <Button 
              variant="outline" 
              onClick={handleDuplicate}
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </Button>
            
            {post.status === 'scheduled' && (
              <Button 
                variant="outline" 
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleCancel}
              >
                Cancel Scheduled Post
              </Button>
            )}
            
            <Button 
              variant="destructive" 
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
        
        {/* Post overview */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{post.title}</CardTitle>
                <CardDescription className="mt-1">
                  {getStatusBadge(post.status)}
                  <span className="ml-3 inline-flex items-center text-sm text-gray-500">
                    {post.status === 'published' ? (
                      <>
                        <Calendar className="mr-1 h-4 w-4" />
                        Published on {format(parseISO(post.scheduledFor), 'MMM d, yyyy')}
                      </>
                    ) : post.status === 'scheduled' ? (
                      <>
                        <Clock className="mr-1 h-4 w-4" />
                        Scheduled for {format(parseISO(post.scheduledFor), 'MMM d, yyyy h:mm a')}
                      </>
                    ) : (
                      <>
                        <Calendar className="mr-1 h-4 w-4" />
                        Last updated on {format(parseISO(post.scheduledFor), 'MMM d, yyyy')}
                      </>
                    )}
                  </span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1 mb-4">
              {post.platforms.map(platform => (
                <Badge 
                  key={platform} 
                  variant="outline" 
                  className={PLATFORMS[platform]?.color || "bg-gray-100 text-gray-800"}>
                  {PLATFORMS[platform]?.name || platform}
                </Badge>
              ))}
            </div>
            
            <div className="my-4 whitespace-pre-wrap">{post.content}</div>
            
            {post.mediaUrls && post.mediaUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4">
                {post.mediaUrls.map((url, index) => (
                  <div key={index} className="aspect-square rounded-md overflow-hidden border">
                    <img src={url} alt={`Media ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Analytics section - only shown for published posts */}
        {post.status === 'published' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center">
              <BarChart className="mr-2 h-5 w-5" />
              Performance Analytics
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium text-gray-500">Impressions</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold">{post.analytics.overview.impressions.toLocaleString()}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium text-gray-500">Engagements</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold">{post.analytics.overview.engagements.toLocaleString()}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium text-gray-500">Clicks</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold">{post.analytics.overview.clicks.toLocaleString()}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium text-gray-500">Shares</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold">{post.analytics.overview.shares?.toLocaleString() || "0"}</div>
                </CardContent>
              </Card>
            </div>
            
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All Platforms</TabsTrigger>
                {post.platforms.map(platform => (
                  <TabsTrigger key={platform} value={platform}>
                    {PLATFORMS[platform]?.name || platform}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value="all" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance by Platform</CardTitle>
                    <CardDescription>
                      Comparison of engagement metrics across different platforms
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th scope="col" className="px-6 py-3">Platform</th>
                            <th scope="col" className="px-6 py-3">Impressions</th>
                            <th scope="col" className="px-6 py-3">Engagements</th>
                            <th scope="col" className="px-6 py-3">Clicks</th>
                            <th scope="col" className="px-6 py-3">Engagement Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {post.platforms.map(platform => {
                            const platformData = post.analytics.platforms[platform];
                            const engagementRate = ((platformData.engagements / platformData.impressions) * 100).toFixed(1);
                            
                            return (
                              <tr key={platform} className="bg-white border-b dark:bg-gray-900 dark:border-gray-700">
                                <th scope="row" className="px-6 py-4 font-medium whitespace-nowrap">
                                  {PLATFORMS[platform]?.name || platform}
                                </th>
                                <td className="px-6 py-4">{platformData.impressions.toLocaleString()}</td>
                                <td className="px-6 py-4">{platformData.engagements.toLocaleString()}</td>
                                <td className="px-6 py-4">{platformData.clicks.toLocaleString()}</td>
                                <td className="px-6 py-4">{engagementRate}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {post.platforms.map(platform => (
                <TabsContent key={platform} value={platform} className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{PLATFORMS[platform]?.name || platform} Performance</CardTitle>
                      <CardDescription>
                        Detailed metrics for this platform
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Impressions</p>
                          <p className="text-2xl font-bold">{post.analytics.platforms[platform].impressions.toLocaleString()}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Engagements</p>
                          <p className="text-2xl font-bold">{post.analytics.platforms[platform].engagements.toLocaleString()}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Clicks</p>
                          <p className="text-2xl font-bold">{post.analytics.platforms[platform].clicks.toLocaleString()}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Engagement Rate</p>
                          <p className="text-2xl font-bold">
                            {((post.analytics.platforms[platform].engagements / post.analytics.platforms[platform].impressions) * 100).toFixed(1)}%
                          </p>
                        </div>
                        
                        {platform === 'instagram' && (
                          <>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-500">Saves</p>
                              <p className="text-2xl font-bold">{post.analytics.platforms[platform].saves?.toLocaleString() || "0"}</p>
                            </div>
                            
                            <div className="space-y-1">
                              <p className="text-sm text-gray-500">Shares</p>
                              <p className="text-2xl font-bold">{post.analytics.platforms[platform].shares?.toLocaleString() || "0"}</p>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="mt-8">
                        <h4 className="font-medium mb-4">Performance Timeline</h4>
                        <div className="h-64 bg-gray-50 rounded-md dark:bg-gray-800 flex items-center justify-center">
                          <p className="text-gray-500">Chart visualization would be shown here</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </div>
      
      {/* Edit Modal */}
      <PostSchedulerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        clientId={clientId}
        initialData={{
          title: post.title,
          platforms: post.platforms,
          content: post.content,
          mediaUrls: post.mediaUrls || [],
          scheduleNow: false,
          scheduledAt: parseISO(post.scheduledFor),
          isDraft: post.status === 'draft',
        }}
        isEditing={true}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the post
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 