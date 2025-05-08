'use client'

import { useState } from 'react'
import { Send, DollarSign, Image as ImageIcon, Paperclip } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

// Mock recipients data - would come from an API in production
const MOCK_RECIPIENTS = {
  onlyfans: [
    { id: 'of_user_1', username: 'ofuser1', name: 'Fan 1', lastActive: '2 hours ago' },
    { id: 'of_user_2', username: 'ofuser2', name: 'Fan 2', lastActive: '1 day ago' },
    { id: 'of_user_3', username: 'ofuser3', name: 'Fan 3', lastActive: 'Just now' },
    { id: 'of_user_4', username: 'ofuser4', name: 'Fan 4', lastActive: '3 days ago' },
  ],
  twitter: [
    { id: 'tw_user_1', username: '@follower1', name: 'Follower 1', lastActive: '5 hours ago' },
    { id: 'tw_user_2', username: '@follower2', name: 'Follower 2', lastActive: '2 days ago' },
    { id: 'tw_user_3', username: '@follower3', name: 'Follower 3', lastActive: '1 week ago' },
  ],
  telegram: [
    { id: 'tg_user_1', username: 'tguser1', name: 'TG User 1', lastActive: '1 hour ago' },
    { id: 'tg_user_2', username: 'tguser2', name: 'TG User 2', lastActive: '4 hours ago' },
    { id: 'tg_group_1', username: 'tggroup1', name: 'My Channel', lastActive: 'N/A', isGroup: true },
  ]
}

export default function MessagesPage() {
  const [currentPlatform, setCurrentPlatform] = useState('onlyfans')
  const [selectedRecipient, setSelectedRecipient] = useState('')
  const [messageText, setMessageText] = useState('')
  const [price, setPrice] = useState('')
  const [isPPV, setIsPPV] = useState(false)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  
  const handleSendMessage = async () => {
    if (!selectedRecipient || !messageText) return
    
    setLoading(true)
    
    // Mock API call - would use ExecutionAgent's sendDM method in production
    try {
      console.log('Sending message to', selectedRecipient, 'on', currentPlatform, {
        message: messageText,
        isPPV: currentPlatform === 'onlyfans' && isPPV,
        price: isPPV ? price : undefined,
        media: mediaFile ? mediaFile.name : undefined
      })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Reset form after success
      setMessageText('')
      setPrice('')
      setMediaFile(null)
      
      // Show success notification
      alert('Message sent successfully!')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMediaFile(e.target.files[0])
    }
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Message Center</h1>
        <p className="text-muted-foreground">Send direct messages to your audience across platforms</p>
      </div>
      
      <Tabs 
        defaultValue="onlyfans" 
        value={currentPlatform}
        onValueChange={setCurrentPlatform}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="onlyfans">OnlyFans</TabsTrigger>
          <TabsTrigger value="twitter">Twitter/X</TabsTrigger>
          <TabsTrigger value="telegram">Telegram</TabsTrigger>
        </TabsList>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Compose Message</CardTitle>
                <CardDescription>
                  Send a direct message to your selected recipient
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient</Label>
                  <Select 
                    value={selectedRecipient} 
                    onValueChange={setSelectedRecipient}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_RECIPIENTS[currentPlatform as keyof typeof MOCK_RECIPIENTS]?.map(recipient => (
                        <SelectItem key={recipient.id} value={recipient.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{recipient.name} ({recipient.username})</span>
                            <span className="text-xs text-muted-foreground">{recipient.lastActive}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Type your message here..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows={5}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="media">Attach Media (optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="media"
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="flex-1"
                    />
                    {mediaFile && (
                      <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {mediaFile.name}
                      </span>
                    )}
                  </div>
                </div>
                
                {currentPlatform === 'onlyfans' && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="ppv"
                        checked={isPPV}
                        onCheckedChange={setIsPPV}
                      />
                      <Label htmlFor="ppv">Pay-Per-View Message</Label>
                    </div>
                    
                    {isPPV && (
                      <div className="space-y-2">
                        <Label htmlFor="price">PPV Price</Label>
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
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setMessageText('')
                    setPrice('')
                    setMediaFile(null)
                    setIsPPV(false)
                  }}
                >
                  Clear
                </Button>
                <Button 
                  type="submit" 
                  disabled={!selectedRecipient || !messageText || loading || (isPPV && !price)}
                  onClick={handleSendMessage}
                >
                  {loading ? 'Sending...' : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Message Templates</CardTitle>
                <CardDescription>
                  Quick message templates for common scenarios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => setMessageText("Hey! Thanks for your support. I just posted new content you might enjoy!")}
                >
                  New Content Alert
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setMessageText("Thank you for being such a loyal supporter! I'm creating something special just for you.")}
                >
                  Thank Loyal Fan
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setMessageText("I noticed you haven't been active lately. I miss you! Check out my recent posts when you get a chance.")}
                >
                  Re-engage Inactive Fan
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setMessageText("Hey there! I'm running a special promotion this week. Check it out and let me know if you're interested!")}
                >
                  Promotion Announcement
                </Button>
              </CardContent>
            </Card>
            
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Recent Conversations</CardTitle>
                <CardDescription>
                  Your most recent message threads
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {MOCK_RECIPIENTS[currentPlatform as keyof typeof MOCK_RECIPIENTS]?.slice(0, 3).map(recipient => (
                  <div 
                    key={recipient.id} 
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                    onClick={() => setSelectedRecipient(recipient.id)}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      {recipient.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{recipient.name}</p>
                      <p className="text-xs text-muted-foreground">{recipient.username} • {recipient.lastActive}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="w-full">
                  View All Conversations
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  )
} 