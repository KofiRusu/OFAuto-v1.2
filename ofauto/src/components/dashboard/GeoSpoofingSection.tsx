'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Globe, Shield, RefreshCw, Check, MapPin, AlertCircle, Lock } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/ui/use-toast";

interface GeoSpoofingSectionProps {
  clientId: string;
}

// For the world map visualization (simplified)
const WorldMapPlaceholder = () => (
  <div className="h-[250px] w-full bg-slate-100 rounded-md flex items-center justify-center">
    <div className="text-center text-gray-500">
      <Globe className="h-10 w-10 mx-auto mb-2 text-gray-400" />
      <p>Interactive map visualization would appear here</p>
    </div>
  </div>
);

export default function GeoSpoofingSection({ clientId }: GeoSpoofingSectionProps) {
  const { toast } = useToast();
  const [proxyEnabled, setProxyEnabled] = useState(true);
  const [rotationEnabled, setRotationEnabled] = useState(true);
  const [currentTab, setCurrentTab] = useState("locations");
  const [selectedRegion, setSelectedRegion] = useState("united-states");
  const [isChangingLocation, setIsChangingLocation] = useState(false);

  // Mock regions data
  const regions = [
    { id: "united-states", name: "United States", status: "active", ipCount: 125, lastRotation: "2 hours ago" },
    { id: "europe", name: "Europe", status: "active", ipCount: 87, lastRotation: "45 minutes ago" },
    { id: "asia-pacific", name: "Asia Pacific", status: "active", ipCount: 64, lastRotation: "3 hours ago" },
    { id: "south-america", name: "South America", status: "inactive", ipCount: 42, lastRotation: "1 day ago" },
  ];

  // Mock proxy stats data
  const proxyStats = {
    uptime: 99.8,
    totalRequests: 15243,
    blockedTrackers: 423,
    averageSpeed: "65ms",
    dataUsage: "12.4 GB / 50 GB"
  };

  const handleLocationChange = (regionId: string) => {
    setIsChangingLocation(true);
    setSelectedRegion(regionId);
    
    // Simulate API call
    setTimeout(() => {
      setIsChangingLocation(false);
      
      toast({
        title: "Location Changed",
        description: `Successfully switched to ${regions.find(r => r.id === regionId)?.name}`,
      });
    }, 1500);
  };

  const handleRotateIP = () => {
    toast({
      title: "IP Rotated",
      description: "Your IP address has been successfully rotated",
    });
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={status === 'active' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
        {status === 'active' ? (
          <><Check className="mr-1 h-3 w-3" /> Active</>
        ) : "Inactive"}
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Shield className="mr-2 h-5 w-5" /> Geo-Spoofing & Proxy Control
        </CardTitle>
        <CardDescription>
          Manage your location, proxy settings, and regional configurations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Control Panel */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
          <div className="flex items-center space-x-4">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center ${proxyEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Shield className={`h-8 w-8 ${proxyEnabled ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <h3 className="text-lg font-medium">Proxy Status</h3>
              <p className={`${proxyEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                {proxyEnabled ? 'Active & Protected' : 'Disabled'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Switch 
              checked={proxyEnabled} 
              onCheckedChange={setProxyEnabled}
              id="proxy-toggle"
            />
            <Label htmlFor="proxy-toggle" className="cursor-pointer">
              {proxyEnabled ? 'Enabled' : 'Disabled'}
            </Label>
          </div>
        </div>
        
        {!proxyEnabled && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Warning: No Proxy Protection</AlertTitle>
            <AlertDescription>
              Your traffic is not being proxied. Your real IP address may be visible to platforms.
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="locations">
              <MapPin className="mr-2 h-4 w-4" /> Locations
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Lock className="mr-2 h-4 w-4" /> Security Settings
            </TabsTrigger>
            <TabsTrigger value="stats">
              <RefreshCw className="mr-2 h-4 w-4" /> Proxy Stats
            </TabsTrigger>
          </TabsList>
          
          {/* Locations Tab */}
          <TabsContent value="locations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Current Location</h3>
              <div className="flex items-center space-x-3">
                <Select 
                  value={selectedRegion} 
                  onValueChange={handleLocationChange}
                  disabled={isChangingLocation || !proxyEnabled}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map(region => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRotateIP}
                  disabled={isChangingLocation || !proxyEnabled}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isChangingLocation ? 'animate-spin' : ''}`} />
                  {isChangingLocation ? 'Changing...' : 'Rotate IP'}
                </Button>
              </div>
            </div>
            
            <WorldMapPlaceholder />
            
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Available Regions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {regions.map(region => (
                  <div 
                    key={region.id} 
                    className={`border p-4 rounded-lg ${selectedRegion === region.id ? 'border-blue-500 bg-blue-50' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{region.name}</h4>
                        <p className="text-sm text-gray-500">{region.ipCount} IP addresses available</p>
                        <p className="text-xs text-gray-400">Last rotation: {region.lastRotation}</p>
                      </div>
                      <div>
                        {getStatusBadge(region.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between items-center border p-4 rounded-lg">
              <div>
                <h4 className="font-medium">Auto IP Rotation</h4>
                <p className="text-sm text-gray-500">Automatically rotate IPs every 6 hours</p>
              </div>
              <Switch 
                checked={rotationEnabled} 
                onCheckedChange={setRotationEnabled}
                disabled={!proxyEnabled}
              />
            </div>
          </TabsContent>
          
          {/* Security Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">HTTPS Enforcement</h4>
                    <p className="text-sm text-gray-500">Force secure connections to all sites</p>
                  </div>
                  <Switch defaultChecked disabled={!proxyEnabled} />
                </div>
              </div>
              
              <div className="border p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">Ad Blocking</h4>
                    <p className="text-sm text-gray-500">Block ads and trackers</p>
                  </div>
                  <Switch defaultChecked disabled={!proxyEnabled} />
                </div>
              </div>
              
              <div className="border p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">WebRTC Protection</h4>
                    <p className="text-sm text-gray-500">Prevent WebRTC leaks</p>
                  </div>
                  <Switch defaultChecked disabled={!proxyEnabled} />
                </div>
              </div>
              
              <div className="border p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">DNS Leak Protection</h4>
                    <p className="text-sm text-gray-500">Use secure DNS servers</p>
                  </div>
                  <Switch defaultChecked disabled={!proxyEnabled} />
                </div>
              </div>
              
              <div className="border p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">Browser Fingerprint Randomization</h4>
                    <p className="text-sm text-gray-500">Change browser fingerprint regularly</p>
                  </div>
                  <Switch defaultChecked disabled={!proxyEnabled} />
                </div>
              </div>
              
              <div className="border p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">Cookie Management</h4>
                    <p className="text-sm text-gray-500">Control cookie persistence</p>
                  </div>
                  <Switch disabled={!proxyEnabled} />
                </div>
              </div>
            </div>
            
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Security Note</AlertTitle>
              <AlertDescription>
                These settings apply to all API calls made through the platform, but may not affect your local browser.
              </AlertDescription>
            </Alert>
          </TabsContent>
          
          {/* Proxy Stats Tab */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">Uptime</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{proxyStats.uptime}%</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">Total Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{proxyStats.totalRequests.toLocaleString()}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">Blocked Trackers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{proxyStats.blockedTrackers.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Average Connection Speed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{proxyStats.averageSpeed}</div>
                <Progress value={65} className="h-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Data Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{proxyStats.dataUsage.split('/')[0]}</div>
                <Progress value={25} className="h-2" />
                <p className="text-xs text-gray-500 mt-2">
                  {proxyStats.dataUsage} used this month
                </p>
              </CardContent>
            </Card>
            
            <div className="border p-4 rounded-lg">
              <h4 className="font-medium mb-2">Performance by Region</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>United States</span>
                    <span>58ms</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Europe</span>
                    <span>72ms</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Asia Pacific</span>
                    <span>110ms</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>South America</span>
                    <span>95ms</span>
                  </div>
                  <Progress value={52} className="h-2" />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t pt-6">
        <Alert className="w-full">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Advanced Feature</AlertTitle>
          <AlertDescription>
            Geo-spoofing should be used responsibly and in accordance with terms of service for connected platforms.
          </AlertDescription>
        </Alert>
      </CardFooter>
    </Card>
  );
} 