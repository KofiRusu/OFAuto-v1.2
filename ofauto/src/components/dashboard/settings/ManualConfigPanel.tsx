'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Check, AlertTriangle, KeyRound, RefreshCw } from "lucide-react";

// Mock API keys and configuration state
const initialConfig = {
  onlyfans: {
    enabled: true,
    apiKey: "of_live_87a5d3ebf91234",
    apiSecret: "••••••••••••••••••••••",
    baseUrl: "https://api.onlyfans.com/v2/",
    timeout: 30000,
    customHeaders: '{\n  "User-Agent": "OFAuto/1.0",\n  "Accept-Language": "en-US"\n}',
    bypassRateLimit: false
  },
  fansly: {
    enabled: true,
    apiKey: "fansly_prod_a8c3d9e7",
    apiSecret: "••••••••••••••••••••••",
    baseUrl: "https://api.fansly.com/api/v1/",
    timeout: 15000,
    customHeaders: '{}',
    bypassRateLimit: true
  },
  patreon: {
    enabled: false,
    apiKey: "",
    apiSecret: "",
    baseUrl: "https://www.patreon.com/api/oauth2/v2/",
    timeout: 10000,
    customHeaders: '{}',
    bypassRateLimit: false
  },
  kofi: {
    enabled: false,
    apiKey: "",
    apiSecret: "",
    baseUrl: "https://ko-fi.com/api/v1/",
    timeout: 10000,
    customHeaders: '{}',
    bypassRateLimit: false
  }
};

type Platform = 'onlyfans' | 'fansly' | 'patreon' | 'kofi';

interface PlatformConfig {
  enabled: boolean;
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  timeout: number;
  customHeaders: string;
  bypassRateLimit: boolean;
}

export default function ManualConfigPanel() {
  const [config, setConfig] = useState<Record<Platform, PlatformConfig>>(initialConfig);
  const [activePlatform, setActivePlatform] = useState<Platform>('onlyfans');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const handleChange = (field: keyof PlatformConfig, value: string | boolean | number) => {
    setConfig(prev => ({
      ...prev,
      [activePlatform]: {
        ...prev[activePlatform],
        [field]: value
      }
    }));
  };

  const saveChanges = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const testConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200));
    setTestingConnection(false);
    // Randomly succeed or fail for demo purposes
    setTestResult(Math.random() > 0.3 ? 'success' : 'error');
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="onlyfans" onValueChange={(v) => setActivePlatform(v as Platform)} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="onlyfans">OnlyFans</TabsTrigger>
          <TabsTrigger value="fansly">Fansly</TabsTrigger>
          <TabsTrigger value="patreon">Patreon</TabsTrigger>
          <TabsTrigger value="kofi">Ko-fi</TabsTrigger>
        </TabsList>
        
        {Object.keys(config).map((platform) => (
          <TabsContent key={platform} value={platform} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl capitalize">{platform} API Configuration</CardTitle>
                    <CardDescription>
                      Manual override for API access. Only modify if instructed by support.
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`enable-${platform}`}>Enabled</Label>
                    <Switch 
                      id={`enable-${platform}`}
                      checked={config[platform as Platform].enabled}
                      onCheckedChange={(checked) => handleChange('enabled', checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`apikey-${platform}`}>API Key</Label>
                    <Input 
                      id={`apikey-${platform}`}
                      value={config[platform as Platform].apiKey}
                      onChange={(e) => handleChange('apiKey', e.target.value)}
                      placeholder="Enter API key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`apisecret-${platform}`}>API Secret</Label>
                    <Input 
                      id={`apisecret-${platform}`}
                      type="password"
                      value={config[platform as Platform].apiSecret}
                      onChange={(e) => handleChange('apiSecret', e.target.value)}
                      placeholder="Enter API secret"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`baseurl-${platform}`}>Base URL</Label>
                  <Input 
                    id={`baseurl-${platform}`}
                    value={config[platform as Platform].baseUrl}
                    onChange={(e) => handleChange('baseUrl', e.target.value)}
                    placeholder="API Base URL"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`timeout-${platform}`}>Timeout (ms)</Label>
                    <Input 
                      id={`timeout-${platform}`}
                      type="number"
                      value={config[platform as Platform].timeout}
                      onChange={(e) => handleChange('timeout', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2 flex items-center">
                    <div className="flex items-center space-x-2 mt-8">
                      <Switch 
                        id={`bypass-${platform}`}
                        checked={config[platform as Platform].bypassRateLimit}
                        onCheckedChange={(checked) => handleChange('bypassRateLimit', checked)}
                      />
                      <Label htmlFor={`bypass-${platform}`}>Bypass Rate Limiting</Label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`headers-${platform}`}>Custom Headers (JSON)</Label>
                  <Textarea 
                    id={`headers-${platform}`}
                    value={config[platform as Platform].customHeaders}
                    onChange={(e) => handleChange('customHeaders', e.target.value)}
                    rows={5}
                    className="font-mono text-sm"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div>
                  <Button
                    variant="outline"
                    onClick={testConnection}
                    disabled={testingConnection || !config[platform as Platform].enabled}
                    className="flex items-center"
                  >
                    {testingConnection ? (
                      <>
                        <RefreshCw size={16} className="mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <KeyRound size={16} className="mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                  
                  {testResult === 'success' && (
                    <div className="text-green-600 text-sm flex items-center mt-2">
                      <Check size={16} className="mr-1" /> Connection successful
                    </div>
                  )}
                  
                  {testResult === 'error' && (
                    <div className="text-red-600 text-sm flex items-center mt-2">
                      <AlertTriangle size={16} className="mr-1" /> Connection failed
                    </div>
                  )}
                </div>
                
                <Button onClick={saveChanges} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>
            
            {showSuccess && (
              <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center">
                <Check size={16} className="mr-2" />
                Settings saved successfully
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
} 