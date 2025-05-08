'use client'

import { useState, useEffect } from 'react'
import { Calendar, Search, Plus, Filter, SortDesc, MoreHorizontal, Copy, Pencil, Trash, AlertCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { trpc } from '@/lib/trpc/client'
import { useToast } from '@/components/ui/use-toast'
import { PostSchedulerModal } from '@/components/dashboard/posts'
import { Skeleton } from '@/components/ui/skeleton'

export default function PostsPage() {
  const { toast } = useToast()
  const router = useRouter()
  
  // State for post management
  const [searchQuery, setSearchQuery] = useState('')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('date-desc')
  const [modalOpen, setModalOpen] = useState(false)
  
  // Fetch the current client ID (you'd get this from your auth context)
  const clientId = "current-client-id"
  
  // Fetch posts
  const {
    data: posts = [],
    isLoading: postsLoading,
    isError: postsError,
    refetch: refetchPosts
  } = trpc.scheduledPost.getAll.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 60000, // 1 minute
  })
  
  // Delete post mutation
  const deletePostMutation = trpc.scheduledPost.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Post deleted",
        description: "The post has been permanently removed."
      })
      refetchPosts()
    },
    onError: (error) => {
      toast({
        title: "Failed to delete post",
        description: error.message || "An error occurred while deleting the post.",
        variant: "destructive"
      })
    }
  })
  
  // Handle delete post
  const handleDeletePost = (id: string) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      deletePostMutation.mutate({ id })
    }
  }
  
  // Duplicate post mutation
  const duplicatePostMutation = trpc.scheduledPost.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Post duplicated",
        description: "A copy has been created as a draft."
      })
      refetchPosts()
    },
    onError: (error) => {
      toast({
        title: "Failed to duplicate post",
        description: error.message || "An error occurred while duplicating the post.",
        variant: "destructive"
      })
    }
  })
  
  // Handle duplicate post
  const handleDuplicatePost = async (id: string) => {
    // Find the post to duplicate
    const postToDuplicate = posts.find(post => post.id === id)
    if (postToDuplicate) {
      // Create a new post based on the duplicated one
      duplicatePostMutation.mutate({
        title: `Copy of ${postToDuplicate.title}`,
        content: postToDuplicate.content,
        scheduledFor: postToDuplicate.scheduledFor,
        clientId: postToDuplicate.clientId,
        platforms: postToDuplicate.platforms.map(p => p.platform.id),
        status: 'draft',
        createdById: postToDuplicate.createdById
      })
    }
  }
  
  // Edit a post
  const handleEditPost = (id: string) => {
    router.push(`/dashboard/posts/${id}`)
  }
  
  // Filter posts based on search query and filters
  const filteredPosts = postsLoading ? [] : posts.filter(post => {
    // Search filter
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Platform filter
    const matchesPlatform = platformFilter === 'all' || 
                           post.platforms.some(p => p.platform.type === platformFilter)
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter
    
    return matchesSearch && matchesPlatform && matchesStatus
  })
  
  // Sort posts
  const sortedPosts = postsLoading ? [] : [...filteredPosts].sort((a, b) => {
    const dateA = new Date(a.scheduledFor).getTime()
    const dateB = new Date(b.scheduledFor).getTime()
    
    switch (sortOrder) {
      case 'date-asc':
        return dateA - dateB
      case 'date-desc':
        return dateB - dateA
      case 'title-asc':
        return a.title.localeCompare(b.title)
      case 'title-desc':
        return b.title.localeCompare(a.title)
      default:
        return dateB - dateA
    }
  })
  
  // Group posts by status
  const draftPosts = sortedPosts.filter(post => post.status === 'DRAFT')
  const scheduledPosts = sortedPosts.filter(post => post.status === 'SCHEDULED')
  const publishedPosts = sortedPosts.filter(post => post.status === 'POSTED')
  
  // Platform badge style
  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'onlyfans':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">OnlyFans</Badge>
      case 'fansly':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">Fansly</Badge>
      case 'instagram':
        return <Badge variant="outline" className="bg-pink-100 text-pink-800 border-pink-200">Instagram</Badge>
      case 'twitter':
        return <Badge variant="outline" className="bg-sky-100 text-sky-800 border-sky-200">Twitter</Badge>
      default:
        return <Badge variant="outline">{platform}</Badge>
    }
  }
  
  // Status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">Draft</Badge>
      case 'SCHEDULED':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Scheduled</Badge>
      case 'POSTED':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Published</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  
  if (postsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-7 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex gap-2 mb-3">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-5 w-36" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-8 w-8 ml-auto" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }
  
  if (postsError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load posts. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Post Manager</h1>
          <p className="text-muted-foreground">Schedule, publish, and analyze content across platforms</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Post
        </Button>
      </div>
      
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="search"
            placeholder="Search posts..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <span>Platform</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="onlyfans">OnlyFans</SelectItem>
              <SelectItem value="fansly">Fansly</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <span>Status</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="DRAFT">Drafts</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="POSTED">Published</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[140px]">
              <SortDesc className="mr-2 h-4 w-4" />
              <span>Sort By</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="title-asc">Title (A-Z)</SelectItem>
              <SelectItem value="title-desc">Title (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Posts ({sortedPosts.length})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({draftPosts.length})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled ({scheduledPosts.length})</TabsTrigger>
          <TabsTrigger value="published">Published ({publishedPosts.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {sortedPosts.length === 0 ? (
            <EmptyState onCreatePost={() => setModalOpen(true)} />
          ) : (
            sortedPosts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onDelete={handleDeletePost}
                onDuplicate={handleDuplicatePost}
                onEdit={handleEditPost}
                getPlatformBadge={getPlatformBadge}
                getStatusBadge={getStatusBadge}
              />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="drafts" className="space-y-4">
          {draftPosts.length === 0 ? (
            <Alert variant="default">
              <AlertTitle>No draft posts</AlertTitle>
              <AlertDescription>
                You don't have any draft posts. Create a new post to get started.
              </AlertDescription>
            </Alert>
          ) : (
            draftPosts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onDelete={handleDeletePost}
                onDuplicate={handleDuplicatePost}
                onEdit={handleEditPost}
                getPlatformBadge={getPlatformBadge}
                getStatusBadge={getStatusBadge}
              />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="scheduled" className="space-y-4">
          {scheduledPosts.length === 0 ? (
            <Alert variant="default">
              <AlertTitle>No scheduled posts</AlertTitle>
              <AlertDescription>
                You don't have any scheduled posts. Create and schedule a new post to see it here.
              </AlertDescription>
            </Alert>
          ) : (
            scheduledPosts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onDelete={handleDeletePost}
                onDuplicate={handleDuplicatePost}
                onEdit={handleEditPost}
                getPlatformBadge={getPlatformBadge}
                getStatusBadge={getStatusBadge}
              />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="published" className="space-y-4">
          {publishedPosts.length === 0 ? (
            <Alert variant="default">
              <AlertTitle>No published posts</AlertTitle>
              <AlertDescription>
                You don't have any published posts. Create and publish a post to see analytics here.
              </AlertDescription>
            </Alert>
          ) : (
            publishedPosts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onDelete={handleDeletePost}
                onDuplicate={handleDuplicatePost}
                onEdit={handleEditPost}
                getPlatformBadge={getPlatformBadge}
                getStatusBadge={getStatusBadge}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
      
      {/* Post Scheduler Modal */}
      <PostSchedulerModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        clientId={clientId}
        onPostCreated={() => {
          refetchPosts()
          setModalOpen(false)
        }}
      />
    </div>
  )
}

// PostCard Component
function PostCard({ post, onDelete, onDuplicate, onEdit, getPlatformBadge, getStatusBadge }) {
  const platformTypes = post.platforms.map(p => p.platform.type)
  const analytics = post.analytics || { impressions: 0, engagements: 0, clicks: 0 }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{post.title}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">{post.content}</CardDescription>
          </div>
          {getStatusBadge(post.status)}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-wrap gap-1 mb-3">
          {platformTypes.map(platform => (
            <div key={platform} className="mr-1">
              {getPlatformBadge(platform)}
            </div>
          ))}
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            <span>
              {post.status === 'POSTED' 
                ? `Published on ${format(new Date(post.scheduledFor), 'MMM d, yyyy')}`
                : post.status === 'SCHEDULED'
                ? `Scheduled for ${format(new Date(post.scheduledFor), 'MMM d, yyyy')}`
                : 'Draft'
              }
            </span>
          </div>
          
          {post.status === 'POSTED' && (
            <div className="flex space-x-3 text-sm">
              <span className="text-gray-500">
                <strong className="text-gray-700">{analytics.impressions.toLocaleString()}</strong> Views
              </span>
              <span className="text-gray-500">
                <strong className="text-gray-700">{analytics.engagements.toLocaleString()}</strong> Engagements
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(post.id)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(post.id)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-600" 
              onClick={() => onDelete(post.id)}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  )
}

// Empty state when no posts are available
function EmptyState({ onCreatePost }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-gray-100 p-3 dark:bg-gray-800">
        <Calendar className="h-10 w-10 text-gray-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No posts found</h3>
      <p className="mt-2 text-sm text-gray-500 max-w-md">
        You don't have any posts that match your current filters. Create a new post or adjust your search criteria.
      </p>
      <Button onClick={onCreatePost} className="mt-4">
        <Plus className="mr-2 h-4 w-4" />
        Create New Post
      </Button>
    </div>
  )
} 