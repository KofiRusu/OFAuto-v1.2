'use client'

import { useState } from 'react'
import { Shield, Eye, EyeOff, Lock, Key, RefreshCw, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

export default function CredentialsPage() {
  const [activeTab, setActiveTab] = useState('instagram')
  const [saving, setSaving] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  // Mock credential states - would be fetched from API
  const [instagramCredentials, setInstagramCredentials] = useState({
    accessToken: '••••••••••••••••••••••••••••••',
    businessAccountId: '17841123456789',
    isConnected: true,
    expiresAt: '2023-12-31T23:59:59Z'
  })
  
  const [twitterCredentials, setTwitterCredentials] = useState({
    accessToken: '',
    userId: '',
    isConnected: false,
    expiresAt: null
  })
  
  const [telegramCredentials, setTelegramCredentials] = useState({
    botToken: '••••••••••••••••••••••••••••••',
    chatId: '-100123456789',
    isConnected: true,
    expiresAt: null
  })
  
  const [onlyfansCredentials, setOnlyfansCredentials] = useState({
    sessionCookies: '••••••••••••••••••••••••••••••',
    username: 'yourusername',
    password: '••••••••••••••',
    profileUrl: 'https://onlyfans.com/yourusername',
    isConnected: true,
    expiresAt: '2023-10-15T23:59:59Z'
  })
  
  const handleSaveCredentials = async (platform: string) => {
    setSaving(true)
    
    // Mock API call to CredentialService
    try {
      console.log(`Saving ${platform} credentials`)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Show success message
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error(`Error saving ${platform} credentials:`, error)
      alert('Failed to save credentials. Please try again.')
    } finally {
      setSaving(false)
      setShowSecret(false)
    }
  }
  
  const renderExpiryBadge = (expiresAt: string | null) => {
    if (!expiresAt) return null
    
    const now = new Date()
    const expiry = new Date(expiresAt)
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry <= 0) {
      return <Badge variant="destructive">Expired</Badge>
    } else if (daysUntilExpiry <= 7) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Expires in {daysUntilExpiry} days</Badge>
    } else {
      return <Badge variant="outline" className="bg-green-100 text-green-800">Valid</Badge>
    }
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Credential Management</h1>
          <p className="text-muted-foreground">Securely manage platform API keys and tokens</p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <Badge className="bg-blue-100 text-blue-800">Admin Only</Badge>
        </div>
      </div>
      
      {saveSuccess && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            Credentials have been securely saved and encrypted.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs 
        defaultValue="instagram"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="instagram">Instagram</TabsTrigger>
          <TabsTrigger value="twitter">Twitter/X</TabsTrigger>
          <TabsTrigger value="onlyfans">OnlyFans</TabsTrigger>
          <TabsTrigger value="telegram">Telegram</TabsTrigger>
        </TabsList>
        
        <TabsContent value="instagram">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Instagram Credentials</CardTitle>
                  <CardDescription>
                    Meta Graph API credentials for Instagram Business/Creator account
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {instagramCredentials.isConnected ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800">Connected</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 text-red-800">Not Connected</Badge>
                  )}
                  {renderExpiryBadge(instagramCredentials.expiresAt)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accessToken">
                  Access Token
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="accessToken"
                    type={showSecret ? "text" : "password"}
                    value={instagramCredentials.accessToken}
                    onChange={(e) => setInstagramCredentials({...instagramCredentials, accessToken: e.target.value})}
                    placeholder="Enter long-lived access token"
                    className="pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full aspect-square"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Long-lived access token from Meta Developer Dashboard with {' '}
                  <code className="text-xs bg-gray-100 p-1 rounded">instagram_basic, instagram_content_publish</code> permissions
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="businessAccountId">
                  Instagram Business Account ID
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="businessAccountId"
                  value={instagramCredentials.businessAccountId}
                  onChange={(e) => setInstagramCredentials({...instagramCredentials, businessAccountId: e.target.value})}
                  placeholder="Enter Instagram Business Account ID"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline"
                onClick={() => {
                  window.open('https://developers.facebook.com/docs/instagram-api/getting-started', '_blank')
                }}
              >
                View Documentation
              </Button>
              <Button 
                onClick={() => handleSaveCredentials('instagram')}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Credentials'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="twitter">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Twitter/X Credentials</CardTitle>
                  <CardDescription>
                    Twitter API v2 OAuth 2.0 credentials
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {twitterCredentials.isConnected ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800">Connected</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 text-red-800">Not Connected</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="twitterToken">
                  Access Token
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="twitterToken"
                    type={showSecret ? "text" : "password"}
                    value={twitterCredentials.accessToken}
                    onChange={(e) => setTwitterCredentials({...twitterCredentials, accessToken: e.target.value})}
                    placeholder="Enter OAuth 2.0 bearer token"
                    className="pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full aspect-square"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  OAuth 2.0 bearer token with <code className="text-xs bg-gray-100 p-1 rounded">tweet.read, tweet.write, users.read</code> scopes
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="twitterUserId">
                  Twitter User ID
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="twitterUserId"
                  value={twitterCredentials.userId}
                  onChange={(e) => setTwitterCredentials({...twitterCredentials, userId: e.target.value})}
                  placeholder="Enter Twitter User ID"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  The numeric ID of your Twitter account (not the @username)
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline"
                onClick={() => {
                  window.open('https://developer.twitter.com/en/docs/twitter-api/getting-started/getting-access-to-the-twitter-api', '_blank')
                }}
              >
                View Documentation
              </Button>
              <Button 
                onClick={() => handleSaveCredentials('twitter')}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Credentials'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="onlyfans">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>OnlyFans Credentials</CardTitle>
                  <CardDescription>
                    Session cookies and authentication details for browser automation
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {onlyfansCredentials.isConnected ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800">Connected</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 text-red-800">Not Connected</Badge>
                  )}
                  {renderExpiryBadge(onlyfansCredentials.expiresAt)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sessionCookies">
                  Session Cookies (JSON)
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Textarea
                  id="sessionCookies"
                  value={onlyfansCredentials.sessionCookies}
                  onChange={(e) => setOnlyfansCredentials({...onlyfansCredentials, sessionCookies: e.target.value})}
                  placeholder="Paste session cookies JSON here"
                  rows={5}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Extracted session cookies from an authenticated browser session
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ofUsername">
                  Username/Email (Fallback)
                </Label>
                <Input
                  id="ofUsername"
                  value={onlyfansCredentials.username}
                  onChange={(e) => setOnlyfansCredentials({...onlyfansCredentials, username: e.target.value})}
                  placeholder="Enter OnlyFans username or email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ofPassword">
                  Password (Fallback)
                </Label>
                <div className="relative">
                  <Input
                    id="ofPassword"
                    type={showSecret ? "text" : "password"}
                    value={onlyfansCredentials.password}
                    onChange={(e) => setOnlyfansCredentials({...onlyfansCredentials, password: e.target.value})}
                    placeholder="Enter OnlyFans password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full aspect-square"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="profileUrl">
                  Profile URL
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="profileUrl"
                  value={onlyfansCredentials.profileUrl}
                  onChange={(e) => setOnlyfansCredentials({...onlyfansCredentials, profileUrl: e.target.value})}
                  placeholder="Enter OnlyFans profile URL"
                  required
                />
              </div>
              
              <Alert className="bg-amber-50 border-amber-200">
                <RefreshCw className="h-4 w-4 text-amber-600" />
                <AlertTitle>Session Expiry</AlertTitle>
                <AlertDescription>
                  OnlyFans sessions typically expire after 2-3 weeks. You will need to refresh these credentials regularly.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline"
                onClick={() => {
                  window.open('https://puppeteer.github.io/puppeteer/', '_blank')
                }}
              >
                View Documentation
              </Button>
              <Button 
                onClick={() => handleSaveCredentials('onlyfans')}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Credentials'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="telegram">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Telegram Credentials</CardTitle>
                  <CardDescription>
                    Telegram Bot API credentials
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {telegramCredentials.isConnected ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800">Connected</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 text-red-800">Not Connected</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="botToken">
                  Bot Token
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="botToken"
                    type={showSecret ? "text" : "password"}
                    value={telegramCredentials.botToken}
                    onChange={(e) => setTelegramCredentials({...telegramCredentials, botToken: e.target.value})}
                    placeholder="Enter Bot Token from BotFather"
                    className="pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full aspect-square"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Bot token obtained from @BotFather on Telegram
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="chatId">
                  Chat ID
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="chatId"
                  value={telegramCredentials.chatId}
                  onChange={(e) => setTelegramCredentials({...telegramCredentials, chatId: e.target.value})}
                  placeholder="Enter Chat ID (e.g., -100123456789)"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  The ID of the channel, group, or user to send messages to
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline"
                onClick={() => {
                  window.open('https://core.telegram.org/bots/api', '_blank')
                }}
              >
                View Documentation
              </Button>
              <Button 
                onClick={() => handleSaveCredentials('telegram')}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Credentials'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-blue-600" />
            Security Information
          </CardTitle>
          <CardDescription>
            How credentials are stored and managed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Storage Method</h3>
              <p className="text-sm text-muted-foreground">
                All credentials are encrypted using AES-256-GCM before storage. The encryption keys are
                secured using a Key Management System (KMS) and rotated regularly.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Access Control</h3>
              <p className="text-sm text-muted-foreground">
                Only administrators can view and modify credentials. All access is logged and audited.
                No credentials are exposed in logs or error messages.
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Implementation</h3>
            <p className="text-sm text-muted-foreground">
              The <code className="text-xs bg-gray-100 p-1 rounded">CredentialService</code> handles all credential operations.
              Method: <code className="text-xs bg-gray-100 p-1 rounded">CredentialService.storeCredential(platform, accountId, key, value)</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 