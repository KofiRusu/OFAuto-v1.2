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
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  MessageSquare, 
  Users,
  UserPlus,
  User,
  RefreshCw, 
  Send,
  Settings,
  ArrowLeft,
  Info,
  CheckCircle,
  AlertCircle,
  Loader2,
  DollarSign,
  UploadCloud,
  X
} from 'lucide-react'
import Link from 'next/link'
import { ChatConfig } from '../../../../../packages/onlyfans-bot/chatAutomation'

export default function OnlyFansMessagesPage() {
  // Recipients state
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [allRecipients, setAllRecipients] = useState<{id: string, name: string, isSubscriber: boolean}[]>([])
  const [recipientFilter, setRecipientFilter] = useState<'all' | 'subscribers' | 'non-subscribers'>('all')
  const [loadingRecipients, setLoadingRecipients] = useState(false)
  
  // Message state
  const [message, setMessage] = useState('')
  const [includeMedia, setIncludeMedia] = useState(false)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isPaidMessage, setIsPaidMessage] = useState(false)
  const [price, setPrice] = useState('')
  
  // Automation state
  const [responseDelay, setResponseDelay] = useState({ min: 3, max: 10 })
  const [useAiResponses, setUseAiResponses] = useState(false)
  const [personaStyle, setPersonaStyle] = useState('friendly')
  
  // Session and UI state
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [sessionStatus, setSessionStatus] = useState<{isValid: boolean, expiresIn?: string}>({
    isValid: true,
    expiresIn: '3 days'
  })
  
  // Mock data for recent messages
  const recentMessages = [
    { id: 'm1', recipient: 'user123', content: 'Hey, thanks for subscribing! Let me know if you have any requests.', timestamp: '2 hours ago', status: 'delivered' },
    { id: 'm2', recipient: 'johndoe', content: 'Check out my new exclusive content! Link in bio.', timestamp: '1 day ago', status: 'read' },
    { id: 'm3', recipient: 'fan456', content: 'Thanks for the tip! I appreciate your support.', timestamp: '3 days ago', status: 'delivered' },
  ]
  
  // Mock data for recipients
  useEffect(() => {
    const mockRecipients = [
      { id: 'user123', name: 'John Smith', isSubscriber: true },
      { id: 'user456', name: 'Emily Davis', isSubscriber: true },
      { id: 'user789', name: 'Michael Brown', isSubscriber: false },
      { id: 'user101', name: 'Sarah Johnson', isSubscriber: true },
      { id: 'user102', name: 'David Wilson', isSubscriber: false },
      { id: 'user103', name: 'Jessica Taylor', isSubscriber: true },
      { id: 'user104', name: 'Robert Martin', isSubscriber: true },
      { id: 'user105', name: 'Jennifer Garcia', isSubscriber: false },
      { id: 'user106', name: 'William Anderson', isSubscriber: true },
      { id: 'user107', name: 'Elizabeth Thomas', isSubscriber: true },
    ]
    
    setAllRecipients(mockRecipients)
  }, [])
  
  // Filter recipients based on selected filter
  const filteredRecipients = allRecipients.filter(recipient => {
    if (recipientFilter === 'subscribers') return recipient.isSubscriber
    if (recipientFilter === 'non-subscribers') return !recipient.isSubscriber
    return true
  })
  
  const handleSelectAllRecipients = () => {
    setSelectedRecipients(filteredRecipients.map(r => r.id))
  }
  
  const handleUnselectAllRecipients = () => {
    setSelectedRecipients([])
  }
  
  const handleRecipientSelection = (id: string) => {
    setSelectedRecipients(prev => 
      prev.includes(id) 
        ? prev.filter(r => r !== id) 
        : [...prev, id]
    )
  }
  
  const handleFetchRecipients = async () => {
    setLoadingRecipients(true)
    
    try {
      // In production, this would fetch actual recipients
      // const response = await fetch('/api/onlyfans/recipients')
      // const data = await response.json()
      // setAllRecipients(data.recipients)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // We'll just use the mock data for now
    } catch (error) {
      console.error('Error fetching recipients:', error)
    } finally {
      setLoadingRecipients(false)
    }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setMediaFile(file)
      
      // Create preview URL
      const fileUrl = URL.createObjectURL(file)
      setPreviewUrl(fileUrl)
    }
  }
  
  const handleRemoveMedia = () => {
    setMediaFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedRecipients.length === 0) {
      setErrorMessage('Please select at least one recipient')
      return
    }
    
    if (!message.trim()) {
      setErrorMessage('Please enter a message')
      return
    }
    
    setLoading(true)
    setSuccessMessage('')
    setErrorMessage('')
    
    try {
      // Prepare chat configuration
      const chatConfig: Partial<ChatConfig> = {
        message,
        recipients: selectedRecipients,
        responseDelay: {
          min: responseDelay.min * 1000, // Convert to ms
          max: responseDelay.max * 1000
        },
        price: isPaidMessage && price ? parseFloat(price) : undefined,
        mediaPath: mediaFile ? mediaFile.name : undefined, // In production, this would be a path
        // If using AI responses
        ...(useAiResponses && {
          persona: {
            style: personaStyle
          }
        })
      }
      
      // In production, this would call your API
      // const response = await fetch('/api/onlyfans/messages', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(chatConfig)
      // })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // if (!response.ok) throw new Error('Failed to send messages')
      // const result = await response.json()
      
      setSuccessMessage(`Messages successfully queued for ${selectedRecipients.length} recipient(s).`)
      
      // Reset form
      setMessage('')
      setSelectedRecipients([])
      setMediaFile(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      setPrice('')
      setIsPaidMessage(false)
    } catch (error) {
      console.error('Error sending messages:', error)
      setErrorMessage('Failed to send messages. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/automation/onlyfans" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
          <h1 className="text-2xl font-bold">OnlyFans Messages</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleFetchRecipients} disabled={loadingRecipients}>
            {loadingRecipients ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Recipients
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Session Status */}
      <Card className={sessionStatus.isValid ? 'border-green-200 dark:border-green-900' : 'border-red-200 dark:border-red-900'}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={sessionStatus.isValid 
                ? 'bg-green-100 dark:bg-green-900 p-2 rounded-full' 
                : 'bg-red-100 dark:bg-red-900 p-2 rounded-full'
              }>
                <Info className={`h-5 w-5 ${sessionStatus.isValid 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
                }`} />
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
                <Button size="sm" variant="destructive" asChild>
                  <Link href="/dashboard/automation/onlyfans/login">
                    <AlertCircle className="mr-2 h-3 w-3" />
                    Login Required
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recipients Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>Recipients</span>
            </CardTitle>
            <CardDescription>
              Select recipients for your message
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSelectAllRecipients}
                  disabled={filteredRecipients.length === 0}
                >
                  Select All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleUnselectAllRecipients}
                  disabled={selectedRecipients.length === 0}
                >
                  Clear
                </Button>
              </div>
              
              <Select 
                value={recipientFilter} 
                onValueChange={(value) => setRecipientFilter(value as any)}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="subscribers">Subscribers</SelectItem>
                  <SelectItem value="non-subscribers">Non-Subscribers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="text-sm text-muted-foreground pb-1">
              {selectedRecipients.length} of {filteredRecipients.length} selected
            </div>
            
            <ScrollArea className="h-[300px] border rounded-md">
              {filteredRecipients.length > 0 ? (
                <div className="p-4 space-y-2">
                  {filteredRecipients.map((recipient) => (
                    <div key={recipient.id} className="flex items-center space-x-2 py-1">
                      <Checkbox 
                        id={`recipient-${recipient.id}`}
                        checked={selectedRecipients.includes(recipient.id)}
                        onCheckedChange={() => handleRecipientSelection(recipient.id)}
                      />
                      <div className="grid gap-0.5">
                        <Label 
                          htmlFor={`recipient-${recipient.id}`} 
                          className="text-sm font-medium cursor-pointer"
                        >
                          {recipient.name}
                        </Label>
                        <div className="flex items-center">
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-1 py-0 h-4 ${recipient.isSubscriber 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {recipient.isSubscriber ? 'Subscriber' : 'Non-Subscriber'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No recipients match the current filter
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Message Composer */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <span>Compose Message</span>
            </CardTitle>
            <CardDescription>
              Craft your message to selected recipients
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
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Enter your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="includeMedia" className="mb-0">Attach Media</Label>
                  <Switch 
                    id="includeMedia" 
                    checked={includeMedia}
                    onCheckedChange={setIncludeMedia}
                  />
                </div>
                
                {includeMedia && (
                  <div className="space-y-2">
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
                          onClick={handleRemoveMedia}
                          className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1"
                        >
                          <X className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isPaidMessage" className="mb-0">PPV (Paid) Message</Label>
                  <Switch 
                    id="isPaidMessage" 
                    checked={isPaidMessage}
                    onCheckedChange={setIsPaidMessage}
                  />
                </div>
                
                {isPaidMessage && (
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
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
                        required={isPaidMessage}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Advanced Options</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minDelay">Min Response Delay (seconds)</Label>
                      <Input 
                        id="minDelay"
                        type="number"
                        min="1"
                        max="60"
                        value={responseDelay.min}
                        onChange={(e) => setResponseDelay({...responseDelay, min: parseInt(e.target.value) || 1})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxDelay">Max Response Delay (seconds)</Label>
                      <Input 
                        id="maxDelay"
                        type="number"
                        min={responseDelay.min + 1}
                        max="300"
                        value={responseDelay.max}
                        onChange={(e) => setResponseDelay({...responseDelay, max: parseInt(e.target.value) || responseDelay.min + 1})}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="useAiResponses" className="mb-0">Enable AI Responses</Label>
                    <Switch 
                      id="useAiResponses" 
                      checked={useAiResponses}
                      onCheckedChange={setUseAiResponses}
                    />
                  </div>
                  
                  {useAiResponses && (
                    <div className="space-y-2">
                      <Label htmlFor="personaStyle">Persona Style</Label>
                      <Select 
                        value={personaStyle} 
                        onValueChange={setPersonaStyle}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select persona style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="friendly">Friendly & Casual</SelectItem>
                          <SelectItem value="flirty">Flirty & Playful</SelectItem>
                          <SelectItem value="professional">Professional & Formal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <div className="text-sm text-muted-foreground">
                  Sending to <strong>{selectedRecipients.length}</strong> recipient(s)
                </div>
                
                <Button 
                  type="submit" 
                  disabled={loading || selectedRecipients.length === 0 || !message.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Messages
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
          <CardDescription>
            Your most recent OnlyFans message activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentMessages.map((message) => (
              <div key={message.id} className="border rounded-md p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{message.recipient}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                </div>
                <p className="text-sm">{message.content}</p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {message.status === 'delivered' ? 'Delivered' : message.status === 'read' ? 'Read' : 'Sent'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm">View All Messages</Button>
        </CardFooter>
      </Card>
    </div>
  )
} 