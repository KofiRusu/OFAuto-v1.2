'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  MessageSquare, 
  DollarSign, 
  Send, 
  Image, 
  FileText,
  Calendar,
  RefreshCw, 
  Check,
  Clock,
  Users,
  Settings,
  ChevronRight,
  Info,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import Link from 'next/link'
import { PostConfig } from '../../../../../packages/onlyfans-bot/onlyfansAutomation'

export default function OnlyFansAutomationPage() {
  const [caption, setCaption] = useState('')
  const [mediaPath, setMediaPath] = useState('')
  const [price, setPrice] = useState<string>('')
  const [isPublic, setIsPublic] = useState(true)
  const [tier, setTier] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('post')
  
  // Mock data for recent successful posts
  const recentPosts = [
    { id: 'post-1', type: 'image', caption: 'Check out my new exclusive content!', date: '2 hours ago', likes: 54, comments: 12 },
    { id: 'post-2', type: 'text', caption: 'Thanks for all the support! New content coming tomorrow.', date: '1 day ago', likes: 32, comments: 8 },
    { id: 'post-3', type: 'video', caption: 'Behind the scenes look at today's photoshoot!', date: '3 days ago', likes: 87, comments: 24 },
  ]
  
  // Mock session status
  const sessionStatus = {
    isValid: true,
    expiresIn: '5 days',
    lastLogin: '2023-06-15 14:32:12'
  }
  
  // Clear form and success/error messages
  const resetForm = () => {
    setCaption('')
    setMediaPath('')
    setPrice('')
    setIsPublic(true)
    setTier('')
    setScheduledTime('')
    setMediaFile(null)
    setPreviewUrl(null)
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setMediaFile(file)
      
      // Create preview URL
      const fileUrl = URL.createObjectURL(file)
      setPreviewUrl(fileUrl)
      
      // Set mediaPath to file name (in real implementation, this would be a full path)
      setMediaPath(file.name)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMessage('')
    setErrorMessage('')
    
    // Prepare post configuration
    const postConfig: PostConfig = {
      caption,
      mediaPath: mediaPath || undefined,
      price: price ? parseFloat(price) : undefined,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
      isPublic,
      tier: tier || undefined
    }
    
    try {
      // In production, this would call your API that interfaces with the onlyfans-bot
      // const response = await fetch('/api/onlyfans/post', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(postConfig)
      // })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // if (!response.ok) throw new Error('Failed to create post')
      // const result = await response.json()
      
      setSuccessMessage('Post created successfully! ' + (scheduledTime ? 'It has been scheduled.' : 'It is now live.'))
      resetForm()
    } catch (error) {
      console.error('Error creating post:', error)
      setErrorMessage('Failed to create post. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">OnlyFans Automation</h1>
          <p className="text-muted-foreground">Create and schedule posts, manage messages, and more.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/settings/integrations">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
          <Button>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Session
          </Button>
        </div>
      </div>
      
      {/* Session Status Card */}
      <Card className="border-blue-200 dark:border-blue-950">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium">OnlyFans Session Status</h3>
                <p className="text-sm text-muted-foreground">
                  {sessionStatus.isValid 
                    ? `Session active, expires in ${sessionStatus.expiresIn}` 
                    : 'Session expired, please log in again'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              {sessionStatus.isValid ? (
                <Badge variant="outline" className="flex items-center gap-1 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                  <CheckCircle className="h-3 w-3" />
                  <span>Active</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center gap-1 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
                  <AlertCircle className="h-3 w-3" />
                  <span>Expired</span>
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
            
      <Tabs defaultValue="post" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 md:w-[400px]">
          <TabsTrigger value="post">
            <FileText className="h-4 w-4 mr-2" />
            Post Content
          </TabsTrigger>
          <TabsTrigger value="dm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Message Fans
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </TabsTrigger>
        </TabsList>
        
        {/* Post Content Tab */}
        <TabsContent value="post" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Post</CardTitle>
                  <CardDescription>
                    Create and publish content to your OnlyFans page
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {successMessage && (
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 rounded-md flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>{successMessage}</span>
                    </div>
                  )}
                  
                  {errorMessage && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-md flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errorMessage}</span>
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="caption">Post Caption</Label>
                      <Textarea
                        id="caption"
                        placeholder="Enter your post caption here..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        rows={4}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="media">Upload Media (Optional)</Label>
                      <Input
                        id="media"
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                      />
                      
                      {previewUrl && (
                        <div className="mt-2 relative w-32 h-32 rounded-md overflow-hidden border">
                          <img 
                            src={previewUrl} 
                            alt="Media preview" 
                            className="w-full h-full object-cover"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              setMediaFile(null)
                              setPreviewUrl(null)
                              setMediaPath('')
                            }}
                            className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price (Optional, for paid posts)</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="price"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-10"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="isPublic">Post Access</Label>
                        <Select 
                          value={isPublic ? "public" : tier ? `tier_${tier}` : "subscribers"}
                          onValueChange={(value) => {
                            if (value === "public") {
                              setIsPublic(true)
                              setTier('')
                            } else if (value.startsWith("tier_")) {
                              setIsPublic(false)
                              setTier(value.replace("tier_", ""))
                            } else {
                              setIsPublic(false)
                              setTier('')
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Who can see this post?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public (Free)</SelectItem>
                            <SelectItem value="subscribers">Subscribers Only</SelectItem>
                            <SelectItem value="tier_premium">Premium Tier</SelectItem>
                            <SelectItem value="tier_vip">VIP Tier</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="scheduledTime">Schedule For (Optional)</Label>
                      <Input
                        id="scheduledTime"
                        type="datetime-local"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave blank to publish immediately
                      </p>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading || !caption}
                    >
                      {loading ? 'Publishing...' : scheduledTime ? 'Schedule Post' : 'Publish Now'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Posts</CardTitle>
                  <CardDescription>
                    Your most recent OnlyFans posts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {recentPosts.map((post) => (
                        <div key={post.id} className="border rounded-md p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant={post.type === 'image' ? 'outline' : post.type === 'video' ? 'secondary' : 'default'}>
                              {post.type === 'image' ? 'Image' : post.type === 'video' ? 'Video' : 'Text'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{post.date}</span>
                          </div>
                          <p className="text-sm line-clamp-2">{post.caption}</p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <span className="flex items-center mr-3">
                              <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                              </svg>
                              {post.likes}
                            </span>
                            <span className="flex items-center">
                              <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                              </svg>
                              {post.comments}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full">View All Posts</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Message Fans Tab */}
        <TabsContent value="dm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Message Your Fans</CardTitle>
              <CardDescription>
                Send individual or bulk messages to your subscribers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <MessageSquare className="h-16 w-16 text-muted-foreground/50" />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">Start Messaging Your Subscribers</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Use our messaging feature to communicate with your fans, send PPV content, and automate responses.
                  </p>
                </div>
                <Button asChild>
                  <Link href="/dashboard/automation/onlyfans/messages">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Go to Messaging Center
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Schedule</CardTitle>
              <CardDescription>
                View and manage your scheduled OnlyFans posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Calendar className="h-16 w-16 text-muted-foreground/50" />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">Plan Your Content Calendar</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Schedule posts and messages in advance to maintain a consistent posting schedule and engage with your audience.
                  </p>
                </div>
                <Button asChild>
                  <Link href="/dashboard/automation/onlyfans/schedule">
                    <Calendar className="mr-2 h-4 w-4" />
                    Go to Content Calendar
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 