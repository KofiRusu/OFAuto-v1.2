'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, AlertTriangle, MessageSquare, Calendar, BarChart, Users, Settings, Lock, Edit, Pencil, Eye, Save, Plus, Image } from 'lucide-react';
import { useFeatureFlags, FeatureFlag } from '@/components/providers/FeatureFlagProvider';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/modal';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';

export default function FeatureFlagDemo() {
  const { flags, isInitialized } = useFeatureFlags();
  const [localFlags, setLocalFlags] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<string>('live');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  // Initialize local flags from actual flags
  useEffect(() => {
    if (isInitialized) {
      const initialLocalFlags: Record<string, boolean> = {};
      Object.entries(flags).forEach(([key, value]) => {
        initialLocalFlags[key] = !!value;
      });
      setLocalFlags(initialLocalFlags);
    }
  }, [isInitialized, flags]);
  
  // Group flags by category
  const flagCategories = {
    core: [
      'ENABLE_NEW_DASHBOARD',
      'ENABLE_BETA_FEATURES',
      'ENABLE_AI_SUGGESTIONS',
    ],
    ui: [
      'ENABLE_CONTENT_CALENDAR',
      'ENABLE_ANALYTICS_DASHBOARD',
      'ENABLE_ADVANCED_TARGETING',
      'ENABLE_BULK_MESSAGING',
    ],
    platform: [
      'ENABLE_INSTAGRAM_INTEGRATION',
      'ENABLE_TWITTER_INTEGRATION',
      'ENABLE_TIKTOK_INTEGRATION',
    ],
    performance: [
      'ENABLE_PERFORMANCE_METRICS',
      'ENABLE_REALTIME_NOTIFICATIONS',
    ],
  };
  
  // Toggle a local flag
  const toggleLocalFlag = (key: string) => {
    setLocalFlags(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Get flag value based on current tab
  const getFlag = (key: string): boolean => {
    return tab === 'live' ? !!flags[key] : !!localFlags[key];
  };
  
  // Render a feature module based on flags
  const renderModule = (flagKey: string, title: string, icon: React.ReactNode, description: string) => {
    // Use actual flags when viewing "live" tab, otherwise use local flags
    const isEnabled = getFlag(flagKey);
    
    return (
      <Card className={`${isEnabled ? '' : 'opacity-60'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
            <Badge variant={isEnabled ? "default" : "outline"}>
              {isEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {isEnabled ? (
            <div className="border rounded-md p-4 text-center">
              {title} Module Content
            </div>
          ) : (
            <div className="border border-dashed rounded-md p-4 flex items-center justify-center">
              <Lock className="mr-2 h-4 w-4" />
              <span className="text-muted-foreground">This feature is disabled</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // A/B variant dashboard header component
  const DashboardHeader = () => {
    const isNewDesign = getFlag('ENABLE_NEW_DASHBOARD');
    
    if (isNewDesign) {
      // Variant B - New design
      return (
        <Card className="w-full mb-6">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <div className="px-6 py-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="mt-1 opacity-90">Welcome to your content manager</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      New Post
                    </Button>
                    <Button className="bg-white text-blue-600 hover:bg-white/90">
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-8 mt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">128</p>
                    <p className="text-sm opacity-90">Total Posts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">87%</p>
                    <p className="text-sm opacity-90">Engagement</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">24</p>
                    <p className="text-sm opacity-90">Scheduled</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-background p-4 rounded-b-lg border-t">
              <div className="flex gap-2 justify-center">
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Today</Badge>
                <Badge variant="outline">This Week</Badge>
                <Badge variant="outline">This Month</Badge>
                <Badge variant="outline">All Time</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    } else {
      // Variant A - Original design
      return (
        <Card className="w-full mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Dashboard</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  New Post
                </Button>
                <Button size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule
                </Button>
              </div>
            </div>
            <CardDescription>Welcome to your content manager dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Card className="flex-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">128</p>
                </CardContent>
              </Card>
              <Card className="flex-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">87%</p>
                </CardContent>
              </Card>
              <Card className="flex-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">24</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      );
    }
  };
  
  // Beta content editor component
  const ContentEditor = () => {
    const isBetaEnabled = getFlag('ENABLE_BETA_FEATURES');
    
    return (
      <Card className="w-full mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CardTitle>Content Editor</CardTitle>
              {isBetaEnabled && (
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                  BETA
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {}}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button size="sm">
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
          <CardDescription>Create and edit your content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <div className="bg-muted p-2 border-b flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <span className="font-bold">B</span>
              </Button>
              <Button variant="ghost" size="sm">
                <span className="italic">I</span>
              </Button>
              <Button variant="ghost" size="sm">
                <span className="underline">U</span>
              </Button>
              <div className="h-4 w-px bg-border mx-1" />
              <Button variant="ghost" size="sm">
                <Image className="h-4 w-4" />
              </Button>
              
              {isBetaEnabled && (
                <>
                  <div className="h-4 w-px bg-border mx-1" />
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    AI Assist
                  </Button>
                  <div className="ml-auto">
                    <Badge variant="outline" className="text-blue-600">New</Badge>
                  </div>
                </>
              )}
            </div>
            
            <textarea 
              className="w-full p-4 h-40 focus:outline-none resize-none" 
              placeholder={isBetaEnabled ? "Start typing or use AI Assist to generate content..." : "Start typing..."}
            />
          </div>
          
          {isBetaEnabled && (
            <div className="mt-4 bg-blue-50 text-blue-800 p-3 rounded-md text-sm">
              <div className="flex items-start gap-2">
                <InfoIcon className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Beta feature enabled</p>
                  <p className="mt-1">The new AI Assist feature helps you generate and refine content. Try asking it to "Write a caption about summer fashion" or "Suggest hashtags for a food post."</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  // Schedule post component with conditional form fields
  const SchedulePostModal = () => {
    const isAdvancedTargeting = getFlag('ENABLE_ADVANCED_TARGETING');
    
    return (
      <Modal
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
      >
        <ModalHeader>
          <ModalTitle>Schedule Content</ModalTitle>
          <ModalDescription>Configure when and where your content should be published</ModalDescription>
        </ModalHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="post-title">Post Title</Label>
            <input
              id="post-title"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Enter post title"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="post-date">Publish Date</Label>
            <input
              id="post-date"
              type="datetime-local"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="platform">Platform</Label>
            <select 
              id="platform" 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Platforms</option>
              <option value="onlyfans">OnlyFans</option>
              <option value="fansly">Fansly</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter</option>
            </select>
          </div>
          
          {isAdvancedTargeting && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 my-2">
                <p className="text-sm font-medium text-amber-800 flex items-center">
                  <InfoIcon className="h-4 w-4 mr-2" />
                  Advanced targeting options enabled
                </p>
              </div>
              
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="audience-segment">Audience Segment</Label>
                  <select 
                    id="audience-segment" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">All Subscribers</option>
                    <option value="new">New Subscribers (< 30 days)</option>
                    <option value="engaged">Highly Engaged</option>
                    <option value="at-risk">At Risk of Churning</option>
                    <option value="custom">Custom Segment</option>
                  </select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="content-personalization">Content Personalization</Label>
                  <select 
                    id="content-personalization" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="none">None</option>
                    <option value="name">Insert Subscriber Name</option>
                    <option value="membership">Based on Membership Tier</option>
                    <option value="behavior">Based on Past Behavior</option>
                  </select>
                </div>
                
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ab-testing">A/B Testing</Label>
                    <Switch id="ab-testing" />
                  </div>
                  <p className="text-sm text-muted-foreground">Test different versions of your content with a sample audience</p>
                </div>
              </div>
            </>
          )}
        </div>
        
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
            Cancel
          </Button>
          <Button onClick={() => setShowScheduleModal(false)}>
            Schedule Post
          </Button>
        </ModalFooter>
      </Modal>
    );
  };
  
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Feature Flag Demo</h1>
          <p className="text-muted-foreground">
            This page demonstrates how feature flags control the visibility and behavior of UI components.
          </p>
        </div>
        
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Feature Flag Demo</AlertTitle>
          <AlertDescription>
            Toggle between "Live" to see actual feature flags from LaunchDarkly and "Simulation" to test different combinations.
          </AlertDescription>
        </Alert>
        
        <Tabs defaultValue="live" value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="live">Live Flags</TabsTrigger>
            <TabsTrigger value="simulation">Simulation</TabsTrigger>
          </TabsList>
          
          <div className="my-4">
            {tab === 'simulation' && (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Simulation Mode</AlertTitle>
                <AlertDescription>
                  Changes here won't affect the real application. This is just for demonstration.
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <TabsContent value="live">
            <div className="grid gap-4 my-4">
              <h2 className="text-xl font-semibold">Current Feature Flags</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(flags).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-mono text-sm">{key}</p>
                    </div>
                    <Badge variant={value ? "default" : "outline"}>
                      {value ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="simulation">
            <div className="grid gap-6 my-4">
              {Object.entries(flagCategories).map(([category, categoryFlags]) => (
                <div key={category}>
                  <h2 className="text-xl font-semibold capitalize mb-3">{category} Features</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryFlags.map(flagKey => (
                      <div key={flagKey} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <p className="font-mono text-sm">{flagKey}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={flagKey} className="sr-only">Toggle {flagKey}</Label>
                          <Switch
                            id={flagKey}
                            checked={!!localFlags[flagKey]}
                            onCheckedChange={() => toggleLocalFlag(flagKey)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* A/B Dashboard Header Example */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">A/B Dashboard Header Example</h2>
          <p className="text-muted-foreground mb-4">
            This example shows how two different dashboard header designs can be toggled using the <code className="font-mono">ENABLE_NEW_DASHBOARD</code> flag.
          </p>
          <DashboardHeader />
        </div>
        
        {/* Beta Content Editor Example */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Beta Content Editor Example</h2>
          <p className="text-muted-foreground mb-4">
            This example demonstrates how the <code className="font-mono">ENABLE_BETA_FEATURES</code> flag can unlock beta functionality.
          </p>
          <ContentEditor />
        </div>
        
        {/* Scheduling Workflow Example */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Conditional Scheduling Workflow</h2>
          <p className="text-muted-foreground mb-4">
            This example shows how the <code className="font-mono">ENABLE_ADVANCED_TARGETING</code> flag can reveal additional form fields in the scheduling flow.
          </p>
          <Card>
            <CardContent className="pt-6">
              <Button onClick={() => setShowScheduleModal(true)}>Open Schedule Modal</Button>
            </CardContent>
          </Card>
          
          <SchedulePostModal />
        </div>
        
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Feature Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderModule('ENABLE_CONTENT_CALENDAR', 'Content Calendar', <Calendar className="h-5 w-5" />, 'Plan and schedule your content across platforms')}
            {renderModule('ENABLE_ANALYTICS_DASHBOARD', 'Analytics Dashboard', <BarChart className="h-5 w-5" />, 'View detailed performance metrics and insights')}
            {renderModule('ENABLE_ADVANCED_TARGETING', 'Advanced Targeting', <Users className="h-5 w-5" />, 'Target specific audience segments with custom criteria')}
            {renderModule('ENABLE_BULK_MESSAGING', 'Bulk Messaging', <MessageSquare className="h-5 w-5" />, 'Send personalized messages to multiple subscribers at once')}
          </div>
        </div>
        
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Feature Flag Component Example</h2>
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Feature Flag Component Usage</CardTitle>
              <CardDescription>
                This demonstrates how to conditionally render components using the FeatureFlag wrapper
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <FeatureFlag flag="ENABLE_NEW_DASHBOARD">
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <InfoIcon className="h-4 w-4" />
                    <AlertTitle>New Dashboard Enabled</AlertTitle>
                    <AlertDescription>
                      You're seeing the new dashboard experience. This is controlled by the ENABLE_NEW_DASHBOARD flag.
                    </AlertDescription>
                  </Alert>
                </FeatureFlag>
                
                <FeatureFlag 
                  flag="ENABLE_BETA_FEATURES"
                  fallback={
                    <Alert variant="default">
                      <Settings className="h-4 w-4" />
                      <AlertTitle>Beta Features Disabled</AlertTitle>
                      <AlertDescription>
                        Enable beta features to see experimental functionality.
                      </AlertDescription>
                    </Alert>
                  }
                >
                  <Alert variant="default" className="bg-blue-50 text-blue-800 border-blue-200">
                    <Settings className="h-4 w-4" />
                    <AlertTitle>Beta Features Enabled</AlertTitle>
                    <AlertDescription>
                      You have access to experimental features. This is controlled by the ENABLE_BETA_FEATURES flag.
                    </AlertDescription>
                  </Alert>
                </FeatureFlag>
              </div>
            </CardContent>
            <CardFooter>
              <div className="w-full">
                <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-x-auto text-sm">
                  {`<FeatureFlag flag="ENABLE_NEW_DASHBOARD">
  <NewDashboardComponent />
</FeatureFlag>

<FeatureFlag 
  flag="ENABLE_BETA_FEATURES"
  fallback={<StandardFeatureComponent />}
>
  <BetaFeatureComponent />
</FeatureFlag>`}
                </pre>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 