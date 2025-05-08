'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Shield, Key, Lock, Globe, Server, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ManualConfigurationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);
  
  // For actual implementation, these would be fetched from the CredentialService
  const [formData, setFormData] = useState({
    onlyfans: {
      apiKey: '',
      sessionCookie: '',
      userAgent: '',
      proxyRegion: 'us',
      customHeaders: '',
      webhookUrl: ''
    },
    fansly: {
      apiKey: '',
      sessionCookie: '',
      userAgent: '',
      proxyRegion: 'us',
      customHeaders: '',
      webhookUrl: ''
    },
    instagram: {
      apiKey: '',
      sessionCookie: '',
      userAgent: '',
      proxyRegion: 'us',
      customHeaders: '',
      webhookUrl: ''
    },
    twitter: {
      apiKey: '',
      apiSecret: '',
      accessToken: '',
      accessTokenSecret: '',
      proxyRegion: 'us',
      customHeaders: '',
      webhookUrl: ''
    }
  });
  
  const handleInputChange = (platform: string, field: string, value: string) => {
    setFormData({
      ...formData,
      [platform]: {
        ...formData[platform as keyof typeof formData],
        [field]: value
      }
    });
  };
  
  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would call the CredentialService
      // await CredentialService.saveOverrides(formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSavedSuccessfully(true);
      setTimeout(() => setSavedSuccessfully(false), 3000);
    } catch (error) {
      console.error('Error saving configuration:', error);
      // Show error toast/alert
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Advanced API Configuration</h1>
          <p className="text-muted-foreground">Manually override API settings and credentials for platform integrations.</p>
        </div>
        <div className="flex items-center bg-yellow-50 text-yellow-800 px-3 py-1 rounded-md">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <span className="text-sm">Admin access only</span>
        </div>
      </div>
      
      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle>Manual Configuration Overrides</CardTitle>
          <CardDescription>
            These settings will override any automatically generated values. Use with caution.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs defaultValue="onlyfans">
            <TabsList className="mb-4 grid grid-cols-4">
              <TabsTrigger value="onlyfans">OnlyFans</TabsTrigger>
              <TabsTrigger value="fansly">Fansly</TabsTrigger>
              <TabsTrigger value="instagram">Instagram</TabsTrigger>
              <TabsTrigger value="twitter">Twitter/X</TabsTrigger>
            </TabsList>
            
            <TabsContent value="onlyfans" className="space-y-4">
              <PlatformConfigForm
                platform="onlyfans"
                formData={formData.onlyfans}
                onChange={(field, value) => handleInputChange('onlyfans', field, value)}
                hasCookieAuth={true}
              />
            </TabsContent>
            
            <TabsContent value="fansly" className="space-y-4">
              <PlatformConfigForm
                platform="fansly"
                formData={formData.fansly}
                onChange={(field, value) => handleInputChange('fansly', field, value)}
                hasCookieAuth={true}
              />
            </TabsContent>
            
            <TabsContent value="instagram" className="space-y-4">
              <PlatformConfigForm
                platform="instagram"
                formData={formData.instagram}
                onChange={(field, value) => handleInputChange('instagram', field, value)}
                hasCookieAuth={true}
              />
            </TabsContent>
            
            <TabsContent value="twitter" className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="twitter-apiKey">API Key</Label>
                    <Input
                      id="twitter-apiKey"
                      type="password"
                      value={formData.twitter.apiKey}
                      onChange={(e) => handleInputChange('twitter', 'apiKey', e.target.value)}
                      placeholder="Enter API key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter-apiSecret">API Secret</Label>
                    <Input
                      id="twitter-apiSecret"
                      type="password"
                      value={formData.twitter.apiSecret}
                      onChange={(e) => handleInputChange('twitter', 'apiSecret', e.target.value)}
                      placeholder="Enter API secret"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="twitter-accessToken">Access Token</Label>
                    <Input
                      id="twitter-accessToken"
                      type="password"
                      value={formData.twitter.accessToken}
                      onChange={(e) => handleInputChange('twitter', 'accessToken', e.target.value)}
                      placeholder="Enter access token"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter-accessTokenSecret">Access Token Secret</Label>
                    <Input
                      id="twitter-accessTokenSecret"
                      type="password"
                      value={formData.twitter.accessTokenSecret}
                      onChange={(e) => handleInputChange('twitter', 'accessTokenSecret', e.target.value)}
                      placeholder="Enter access token secret"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="twitter-proxyRegion">Proxy Region</Label>
                  <Select 
                    value={formData.twitter.proxyRegion}
                    onValueChange={(value) => handleInputChange('twitter', 'proxyRegion', value)}
                  >
                    <SelectTrigger id="twitter-proxyRegion">
                      <SelectValue placeholder="Select proxy region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="eu">Europe</SelectItem>
                      <SelectItem value="ap">Asia Pacific</SelectItem>
                      <SelectItem value="none">No Proxy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="twitter-webhookUrl">Webhook URL (Optional)</Label>
                  <Input
                    id="twitter-webhookUrl"
                    value={formData.twitter.webhookUrl}
                    onChange={(e) => handleInputChange('twitter', 'webhookUrl', e.target.value)}
                    placeholder="https://your-webhook-url.com/twitter-events"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="twitter-customHeaders">Custom Headers (JSON format)</Label>
                  <Textarea
                    id="twitter-customHeaders"
                    value={formData.twitter.customHeaders}
                    onChange={(e) => handleInputChange('twitter', 'customHeaders', e.target.value)}
                    placeholder='{"X-Custom-Header": "value"}'
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="border-t pt-4 flex justify-between">
          <div className="flex items-center">
            {savedSuccessfully && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">Settings saved successfully</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Reset to Defaults</Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>API Security</CardTitle>
          <CardDescription>Additional security settings for API connections</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2 text-blue-500" />
                <Label htmlFor="enforce-mfa">Enforce MFA for API Changes</Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Require multi-factor authentication when updating API credentials
              </p>
            </div>
            <Switch id="enforce-mfa" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center">
                <Globe className="h-4 w-4 mr-2 text-blue-500" />
                <Label htmlFor="enforce-ip">IP Restriction</Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Only allow API calls from whitelisted IP addresses
              </p>
            </div>
            <Switch id="enforce-ip" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center">
                <Server className="h-4 w-4 mr-2 text-blue-500" />
                <Label htmlFor="audit-logging">Enhanced Audit Logging</Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Keep detailed logs of all API activity
              </p>
            </div>
            <Switch id="audit-logging" checked={true} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface PlatformConfigFormProps {
  platform: string;
  formData: any;
  onChange: (field: string, value: string) => void;
  hasCookieAuth: boolean;
}

function PlatformConfigForm({ platform, formData, onChange, hasCookieAuth }: PlatformConfigFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${platform}-apiKey`}>API Key</Label>
        <div className="relative">
          <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id={`${platform}-apiKey`}
            type="password"
            value={formData.apiKey}
            onChange={(e) => onChange('apiKey', e.target.value)}
            placeholder="Enter API key"
            className="pl-10"
          />
        </div>
      </div>
      
      {hasCookieAuth && (
        <div className="space-y-2">
          <Label htmlFor={`${platform}-sessionCookie`}>Session Cookie</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Textarea
              id={`${platform}-sessionCookie`}
              value={formData.sessionCookie}
              onChange={(e) => onChange('sessionCookie', e.target.value)}
              placeholder="Paste full cookie string here"
              className="pl-10"
              rows={3}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Paste the full cookie string from your browser's developer tools
          </p>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor={`${platform}-userAgent`}>User Agent</Label>
        <Input
          id={`${platform}-userAgent`}
          value={formData.userAgent}
          onChange={(e) => onChange('userAgent', e.target.value)}
          placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={`${platform}-proxyRegion`}>Proxy Region</Label>
        <Select 
          value={formData.proxyRegion}
          onValueChange={(value) => onChange('proxyRegion', value)}
        >
          <SelectTrigger id={`${platform}-proxyRegion`}>
            <SelectValue placeholder="Select proxy region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="us">United States</SelectItem>
            <SelectItem value="eu">Europe</SelectItem>
            <SelectItem value="ap">Asia Pacific</SelectItem>
            <SelectItem value="none">No Proxy</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={`${platform}-webhookUrl`}>Webhook URL (Optional)</Label>
        <Input
          id={`${platform}-webhookUrl`}
          value={formData.webhookUrl}
          onChange={(e) => onChange('webhookUrl', e.target.value)}
          placeholder="https://your-webhook-url.com/events"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={`${platform}-customHeaders`}>Custom Headers (JSON format)</Label>
        <Textarea
          id={`${platform}-customHeaders`}
          value={formData.customHeaders}
          onChange={(e) => onChange('customHeaders', e.target.value)}
          placeholder='{"X-Custom-Header": "value"}'
          rows={3}
        />
      </div>
    </div>
  );
} 