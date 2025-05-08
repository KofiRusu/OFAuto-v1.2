'use client';

import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Mail,
  Lock,
  BellRing,
  Shield,
  CreditCard,
  LogOut,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  TikTok,
  Edit2,
  Upload,
  Trash2,
  AlertCircle,
  CheckCircle,
  Globe,
  Phone,
  Clock
} from 'lucide-react';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState('/avatars/user-01.jpg');
  
  // Mock user data
  const userData = {
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    username: '@alexjohnson',
    role: 'Content Creator',
    bio: 'Fashion and lifestyle content creator with a passion for sustainable brands. Working with eco-conscious companies to promote a better future.',
    location: 'Los Angeles, CA',
    phone: '+1 (555) 123-4567',
    timezone: 'Pacific Time (UTC-7)',
    memberSince: 'January 2023',
    plan: 'Professional',
    connectedPlatforms: [
      { name: 'Instagram', connected: true, handle: '@alexjstyle', followers: '24.5K' },
      { name: 'TikTok', connected: true, handle: '@alex.johnson', followers: '18.2K' },
      { name: 'YouTube', connected: true, handle: 'Alex Johnson', followers: '12.3K' },
      { name: 'Twitter', connected: false, handle: '', followers: '' },
      { name: 'Facebook', connected: true, handle: 'Alex Johnson', followers: '8.7K' }
    ]
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and connected platforms
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="platforms" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Platforms
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <BellRing className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your profile information and public details
                  </CardDescription>
                </div>
                <Button 
                  variant={isEditing ? "default" : "outline"} 
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? "Save Changes" : "Edit Profile"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-32 h-32 border">
                    <AvatarImage src={profileImage} alt={userData.name} />
                    <AvatarFallback>{userData.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  
                  {isEditing && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="gap-1">
                        <Upload className="h-4 w-4" /> Upload
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-destructive">
                        <Trash2 className="h-4 w-4" /> Remove
                      </Button>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <Badge className="mb-2">{userData.plan}</Badge>
                    <p className="text-xs text-muted-foreground">Member since {userData.memberSince}</p>
                  </div>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" defaultValue={userData.name} disabled={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" defaultValue={userData.username} disabled={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" defaultValue={userData.email} disabled={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      {isEditing ? (
                        <Select defaultValue={userData.role}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Content Creator">Content Creator</SelectItem>
                            <SelectItem value="Brand Manager">Brand Manager</SelectItem>
                            <SelectItem value="Influencer">Influencer</SelectItem>
                            <SelectItem value="Agency">Agency</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input id="role" defaultValue={userData.role} disabled />
                      )}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea 
                        id="bio" 
                        defaultValue={userData.bio} 
                        disabled={!isEditing}
                        className="min-h-[100px]"
                        placeholder="Write a short bio about yourself"
                      />
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" /> Location
                      </Label>
                      <Input id="location" defaultValue={userData.location} disabled={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" /> Phone Number
                      </Label>
                      <Input id="phone" defaultValue={userData.phone} disabled={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Timezone
                      </Label>
                      {isEditing ? (
                        <Select defaultValue={userData.timezone}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pacific Time (UTC-7)">Pacific Time (UTC-7)</SelectItem>
                            <SelectItem value="Mountain Time (UTC-6)">Mountain Time (UTC-6)</SelectItem>
                            <SelectItem value="Central Time (UTC-5)">Central Time (UTC-5)</SelectItem>
                            <SelectItem value="Eastern Time (UTC-4)">Eastern Time (UTC-4)</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input id="timezone" defaultValue={userData.timezone} disabled />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Account Tab */}
        <TabsContent value="account">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Address</CardTitle>
                <CardDescription>
                  Change your email address and manage verification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Mail className="h-10 w-10 p-2 bg-primary/10 rounded-full text-primary" />
                    <div>
                      <p className="font-medium">{userData.email}</p>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        <p className="text-sm text-muted-foreground">Verified</p>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline">Change Email</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Change your password or enable additional security options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                  </div>
                  
                  <Button className="mt-4">Update Password</Button>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Security Options</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="2fa">Two-factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Switch id="2fa" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="recovery">Recovery Codes</Label>
                      <p className="text-sm text-muted-foreground">
                        Generate backup codes to access your account
                      </p>
                    </div>
                    <Button variant="outline">Generate Codes</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Danger Zone</CardTitle>
                <CardDescription>
                  Manage account deletion and data export options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Export Your Data</Label>
                    <p className="text-sm text-muted-foreground">
                      Download a copy of all your data from our platform
                    </p>
                  </div>
                  <Button variant="outline">Export Data</Button>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base text-destructive">Delete Account</Label>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Connected Platforms Tab */}
        <TabsContent value="platforms">
          <Card>
            <CardHeader>
              <CardTitle>Connected Platforms</CardTitle>
              <CardDescription>
                Manage your connected social media accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {userData.connectedPlatforms.map((platform, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                      {platform.name === 'Instagram' && <Instagram className="h-6 w-6 text-[#E1306C]" />}
                      {platform.name === 'TikTok' && <TikTok className="h-6 w-6" />}
                      {platform.name === 'YouTube' && <Youtube className="h-6 w-6 text-[#FF0000]" />}
                      {platform.name === 'Twitter' && <Twitter className="h-6 w-6 text-[#1DA1F2]" />}
                      {platform.name === 'Facebook' && <Facebook className="h-6 w-6 text-[#4267B2]" />}
                    </div>
                    <div>
                      <p className="font-medium">{platform.name}</p>
                      {platform.connected ? (
                        <div className="flex flex-col xs:flex-row xs:items-center gap-x-2">
                          <div className="flex items-center">
                            <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                            <p className="text-xs text-green-500">Connected</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {platform.handle} • {platform.followers} followers
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Not connected</p>
                      )}
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm">
                    {platform.connected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              ))}
              
              <div className="rounded-md bg-muted p-4 mt-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-primary mr-2" />
                  <div>
                    <h4 className="text-sm font-medium">Why connect your platforms?</h4>
                    <p className="text-sm text-muted-foreground">
                      Connecting your social media platforms allows for seamless content scheduling, 
                      cross-platform analytics, and AI-powered insights to optimize your social media strategy.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Platform Permissions</CardTitle>
              <CardDescription>
                Manage what data OFAuto can access from your connected accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="read_data">Read Account Data</Label>
                    <p className="text-sm text-muted-foreground">
                      Access followers, profile info, and engagement metrics
                    </p>
                  </div>
                  <Switch id="read_data" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="post_content">Post Content</Label>
                    <p className="text-sm text-muted-foreground">
                      Publish content to your accounts via OFAuto
                    </p>
                  </div>
                  <Switch id="post_content" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="read_messages">Read Direct Messages</Label>
                    <p className="text-sm text-muted-foreground">
                      Access your direct messages for engagement management
                    </p>
                  </div>
                  <Switch id="read_messages" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="analytics">Detailed Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Collect extended metrics for advanced insights
                    </p>
                  </div>
                  <Switch id="analytics" defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Manage how and when you receive notifications from OFAuto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Email Notifications</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email_analytics">Analytics Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Weekly performance summaries and insights
                    </p>
                  </div>
                  <Switch id="email_analytics" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email_campaign">Campaign Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications about scheduled posts and campaigns
                    </p>
                  </div>
                  <Switch id="email_campaign" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email_platform">Platform Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Important updates from connected platforms
                    </p>
                  </div>
                  <Switch id="email_platform" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email_product">Product Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      New features and improvements to OFAuto
                    </p>
                  </div>
                  <Switch id="email_product" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email_marketing">Marketing & Promotions</Label>
                    <p className="text-sm text-muted-foreground">
                      Special offers, discounts, and marketing messages
                    </p>
                  </div>
                  <Switch id="email_marketing" />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Push Notifications</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push_engagement">Engagement Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Significant engagement on your content
                    </p>
                  </div>
                  <Switch id="push_engagement" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push_post">Post Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Reminders about scheduled posts
                    </p>
                  </div>
                  <Switch id="push_post" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push_analytics">Analytics Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Significant changes in performance metrics
                    </p>
                  </div>
                  <Switch id="push_analytics" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push_message">Direct Messages</Label>
                    <p className="text-sm text-muted-foreground">
                      New direct messages across platforms
                    </p>
                  </div>
                  <Switch id="push_message" />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Schedule</h3>
                <p className="text-sm text-muted-foreground">
                  Set quiet hours to pause non-critical notifications
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quiet_start">Start Time</Label>
                    <Select defaultValue="22:00">
                      <SelectTrigger>
                        <SelectValue placeholder="Select start time" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }).map((_, i) => (
                          <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                            {`${i.toString().padStart(2, '0')}:00`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="quiet_end">End Time</Label>
                    <Select defaultValue="07:00">
                      <SelectTrigger>
                        <SelectValue placeholder="Select end time" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }).map((_, i) => (
                          <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                            {`${i.toString().padStart(2, '0')}:00`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mt-2">
                  <Switch id="quiet_hours" defaultChecked />
                  <Label htmlFor="quiet_hours">Enable quiet hours</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Billing Tab */}
        <TabsContent value="billing">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>
                  Manage your subscription and billing information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-primary/5">
                  <div>
                    <h3 className="font-semibold text-lg">Professional Plan</h3>
                    <p className="text-sm text-muted-foreground">
                      $29/month, billed monthly
                    </p>
                    <div className="flex items-center mt-2">
                      <Badge variant="outline" className="bg-primary/20 text-primary border-0">
                        Current Plan
                      </Badge>
                      <p className="text-xs text-muted-foreground ml-2">
                        Renews on July 15, 2023
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">Change Plan</Button>
                    <Button variant="outline" className="text-destructive">
                      Cancel Plan
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Plan Features</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span>Schedule up to 150 posts per month</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span>Connect up to 10 social accounts</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span>Advanced analytics and reporting</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span>AI content suggestions</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span>Priority customer support</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>
                  Manage your payment methods and billing history
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-medium">Visa ending in 4242</p>
                      <p className="text-sm text-muted-foreground">
                        Expires 04/2025
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="outline" size="sm">Remove</Button>
                  </div>
                </div>
                
                <Button variant="outline" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  Add Payment Method
                </Button>
                
                <Separator className="my-4" />
                
                <div className="space-y-4">
                  <h4 className="font-medium">Billing History</h4>
                  <div className="space-y-2">
                    {[
                      { date: 'Jun 15, 2023', amount: '$29.00', status: 'Paid' },
                      { date: 'May 15, 2023', amount: '$29.00', status: 'Paid' },
                      { date: 'Apr 15, 2023', amount: '$29.00', status: 'Paid' }
                    ].map((invoice, i) => (
                      <div key={i} className="flex items-center justify-between py-2">
                        <div>
                          <p className="font-medium">Professional Plan</p>
                          <p className="text-sm text-muted-foreground">{invoice.date}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-medium">{invoice.amount}</p>
                          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                            {invoice.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" className="w-full">
                    View All Invoices
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 