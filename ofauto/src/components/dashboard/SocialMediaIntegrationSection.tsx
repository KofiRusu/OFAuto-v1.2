'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Instagram, Twitter, TikTok, Youtube, Facebook, Trash2, Check, AlertCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/ui/use-toast";

type Platform = 'instagram' | 'twitter' | 'tiktok' | 'youtube' | 'facebook';

interface SocialPlatform {
  id: string;
  platform: Platform;
  username: string;
  connected: boolean;
  lastSync?: Date;
}

interface SocialMediaIntegrationSectionProps {
  clientId: string;
}

export default function SocialMediaIntegrationSection({ clientId }: SocialMediaIntegrationSectionProps) {
  const { toast } = useToast();
  const [isAddPlatformOpen, setIsAddPlatformOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [autoPostEnabled, setAutoPostEnabled] = useState<Record<string, boolean>>({});

  // This would be replaced with actual trpc query
  const connectedPlatforms: SocialPlatform[] = [
    { id: '1', platform: 'instagram', username: '@creator_lifestyle', connected: true, lastSync: new Date() },
    { id: '2', platform: 'twitter', username: '@creator_lifestyle', connected: true, lastSync: new Date(Date.now() - 86400000) },
    { id: '3', platform: 'tiktok', username: '@creator_lifestyle', connected: false },
  ];

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: <Instagram className="h-5 w-5" />, color: 'from-pink-500 to-purple-600' },
    { id: 'twitter', name: 'Twitter', icon: <Twitter className="h-5 w-5" />, color: 'from-blue-400 to-blue-600' },
    { id: 'tiktok', name: 'TikTok', icon: <TikTok className="h-5 w-5" />, color: 'from-black to-gray-800' },
    { id: 'youtube', name: 'YouTube', icon: <Youtube className="h-5 w-5" />, color: 'from-red-500 to-red-700' },
    { id: 'facebook', name: 'Facebook', icon: <Facebook className="h-5 w-5" />, color: 'from-blue-600 to-blue-800' },
  ];

  const handlePlatformSelect = (platform: Platform) => {
    setSelectedPlatform(platform);
    setIsAddPlatformOpen(true);
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    const platform = selectedPlatform;
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const username = formData.get('username') as string;
    const apiKey = formData.get('apiKey') as string;
    const apiSecret = formData.get('apiSecret') as string;

    // In a real implementation, this would call a trpc mutation
    console.log(`Connecting ${platform} with username: ${username}, API Key: ${apiKey.substring(0, 3)}...`);
    
    toast({
      title: "Platform Connected",
      description: `Successfully connected to ${platform}`,
    });
    
    setIsAddPlatformOpen(false);
    setSelectedPlatform(null);
  };

  const handleDisconnect = (platform: SocialPlatform) => {
    // In a real implementation, this would call a trpc mutation
    console.log(`Disconnecting ${platform.platform}`);
    
    toast({
      title: "Platform Disconnected",
      description: `Successfully disconnected from ${platform.platform}`,
    });
  };

  const toggleAutoPost = (platformId: string, enabled: boolean) => {
    setAutoPostEnabled(prev => ({
      ...prev,
      [platformId]: enabled
    }));
    
    // In a real implementation, this would call a trpc mutation
    console.log(`Auto-post ${enabled ? 'enabled' : 'disabled'} for platform ${platformId}`);
  };

  const getPlatformIcon = (platformType: Platform) => {
    const platform = platforms.find(p => p.id === platformType);
    return platform?.icon || <AlertCircle className="h-5 w-5" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Instagram className="mr-2 h-5 w-5" /> Social Media Integrations
        </CardTitle>
        <CardDescription>
          Connect your social media accounts to cross-post content and manage engagement.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Secure API Connection</AlertTitle>
          <AlertDescription>
            Your social media tokens and credentials are encrypted. We never store your passwords.
          </AlertDescription>
        </Alert>
        
        {/* Connected Platforms */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Connected Platforms</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Add Platform
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Social Media Platform</DialogTitle>
                  <DialogDescription>
                    Select a platform to connect to your account.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 py-4">
                  {platforms.map((platform) => (
                    <Button
                      key={platform.id}
                      variant="outline"
                      className={`h-24 justify-center flex-col bg-gradient-to-br ${platform.color} hover:opacity-90 text-white border-0`}
                      onClick={() => handlePlatformSelect(platform.id as Platform)}
                    >
                      {platform.icon}
                      <span className="mt-2">{platform.name}</span>
                    </Button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {connectedPlatforms.map((platform) => (
              <div key={platform.id} className="flex justify-between items-center border p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getPlatformIcon(platform.platform)}
                  <div>
                    <h4 className="font-medium capitalize">{platform.platform}</h4>
                    <p className="text-sm text-gray-500">{platform.username}</p>
                    {platform.lastSync && (
                      <p className="text-xs text-gray-400">
                        Last synced: {platform.lastSync.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`auto-post-${platform.id}`} className="text-sm">
                      Auto-post
                    </Label>
                    <Switch
                      id={`auto-post-${platform.id}`}
                      checked={autoPostEnabled[platform.id] || false}
                      onCheckedChange={(checked) => toggleAutoPost(platform.id, checked)}
                    />
                  </div>
                  
                  <Badge 
                    variant={platform.connected ? "default" : "outline"} 
                    className={platform.connected ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                  >
                    {platform.connected ? (
                      <><Check className="mr-1 h-3 w-3" /> Connected</>
                    ) : "Disconnected"}
                  </Badge>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDisconnect(platform)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {connectedPlatforms.length === 0 && (
            <div className="text-center py-8 border rounded-lg">
              <p className="text-gray-500">No social media platforms connected yet.</p>
              <Button onClick={() => setIsAddPlatformOpen(true)} className="mt-4">
                Connect Your First Platform
              </Button>
            </div>
          )}
        </div>
        
        {/* Cross-Posting Rules */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Cross-Posting Rules</h3>
          <div className="border p-4 rounded-lg">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Auto-format for each platform</h4>
                  <p className="text-sm text-gray-500">Optimize content automatically for each platform</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Cross-post premium content</h4>
                  <p className="text-sm text-gray-500">Post teasers of premium content to social media</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Schedule based on analytics</h4>
                  <p className="text-sm text-gray-500">Post at optimal times for each platform</p>
                </div>
                <Switch />
              </div>
            </div>
          </div>
        </div>
        
        {/* Add Platform Modal */}
        <Dialog open={isAddPlatformOpen} onOpenChange={setIsAddPlatformOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                {selectedPlatform && getPlatformIcon(selectedPlatform)}
                <span className="ml-2 capitalize">{selectedPlatform}</span>
              </DialogTitle>
              <DialogDescription>
                Connect your {selectedPlatform} account to enable cross-posting and analytics.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleConnect}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" name="username" placeholder={`Your ${selectedPlatform} username`} required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input id="apiKey" name="apiKey" type="password" placeholder="Your API key" required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="apiSecret">API Secret</Label>
                  <Input id="apiSecret" name="apiSecret" type="password" placeholder="Your API secret" required />
                </div>
                
                <p className="text-sm text-gray-500">
                  You can find your API credentials in your {selectedPlatform} developer settings.
                </p>
              </div>
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsAddPlatformOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Connect Account</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
} 