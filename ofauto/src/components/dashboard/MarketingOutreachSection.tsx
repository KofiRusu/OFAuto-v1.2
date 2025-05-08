'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Calendar,
  MessageSquare, 
  Send, 
  Clock, 
  CheckSquare,
  Users,
  BarChart3,
  Megaphone,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface MarketingOutreachSectionProps {
  clientId: string;
}

export default function MarketingOutreachSection({ clientId }: MarketingOutreachSectionProps) {
  const [activeTab, setActiveTab] = useState("scheduler");
  const [automatedResponseActive, setAutomatedResponseActive] = useState(true);
  const [welcomeMessageActive, setWelcomeMessageActive] = useState(true);
  const [reengagementActive, setReengagementActive] = useState(false);
  const [tipThankYouActive, setTipThankYouActive] = useState(true);
  const [broadcastActive, setBroadcastActive] = useState(false);

  // Mock scheduled posts data
  const scheduledPosts = [
    { id: 1, title: "Weekly Teaser Content", platforms: ["onlyfans", "fansly"], date: "2023-05-15 10:00 AM", status: "scheduled" },
    { id: 2, title: "Exclusive Members Update", platforms: ["patreon"], date: "2023-05-16 2:30 PM", status: "scheduled" },
    { id: 3, title: "Special Weekend Promotion", platforms: ["onlyfans", "fansly", "instagram"], date: "2023-05-18 7:00 PM", status: "scheduled" },
    { id: 4, title: "Behind the Scenes Content", platforms: ["kofi", "patreon"], date: "2023-05-14 12:00 PM", status: "sent" },
  ];

  // Mock campaigns data
  const campaigns = [
    { id: 1, name: "Spring Promotion", platform: "All Platforms", subscribers: 523, status: "active", roi: "+18.2%" },
    { id: 2, name: "Re-engagement Series", platform: "OnlyFans", subscribers: 127, status: "paused", roi: "+5.3%" },
    { id: 3, name: "New Follower Funnel", platform: "Fansly", subscribers: 89, status: "active", roi: "+12.7%" },
    { id: 4, name: "Expired Subscription", platform: "Patreon", subscribers: 42, status: "scheduled", roi: "N/A" },
  ];

  const isLoadingData = false; // Replace with actual loading state from trpc

  function getPlatformBadge(platform: string) {
    const colors: Record<string, string> = {
      onlyfans: "bg-blue-100 text-blue-800",
      fansly: "bg-purple-100 text-purple-800",
      patreon: "bg-orange-100 text-orange-800",
      kofi: "bg-red-100 text-red-800",
      instagram: "bg-pink-100 text-pink-800",
    };
    
    return (
      <Badge className={`${colors[platform] || "bg-gray-100 text-gray-800"} mr-1`}>
        {platform}
      </Badge>
    );
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = {
      scheduled: "bg-yellow-100 text-yellow-800",
      sent: "bg-green-100 text-green-800",
      paused: "bg-gray-100 text-gray-800",
      active: "bg-green-100 text-green-800",
    };
    
    return (
      <Badge className={`${colors[status] || "bg-gray-100 text-gray-800"}`}>
        {status}
      </Badge>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Megaphone className="mr-2 h-5 w-5" /> Marketing & Outreach
        </CardTitle>
        <CardDescription>
          Schedule content, manage campaigns, and automate communications with your subscribers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="scheduler">
              <Calendar className="mr-2 h-4 w-4" /> Content Scheduler
            </TabsTrigger>
            <TabsTrigger value="auto-messaging">
              <MessageSquare className="mr-2 h-4 w-4" /> Auto-Messaging
            </TabsTrigger>
            <TabsTrigger value="campaigns">
              <BarChart3 className="mr-2 h-4 w-4" /> Campaigns
            </TabsTrigger>
          </TabsList>

          {/* Content Scheduler Tab */}
          <TabsContent value="scheduler" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Upcoming Posts</h3>
              <Link href="/dashboard/scheduler">
                <Button size="sm">
                  <Calendar className="mr-2 h-4 w-4" /> Schedule New Post
                </Button>
              </Link>
            </div>

            {isLoadingData ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Platforms</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledPosts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium">{post.title}</TableCell>
                        <TableCell>
                          {post.platforms.map((platform) => (
                            <span key={platform}>{getPlatformBadge(platform)}</span>
                          ))}
                        </TableCell>
                        <TableCell>{post.date}</TableCell>
                        <TableCell>{getStatusBadge(post.status)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">Edit</Button>
                            {post.status !== "sent" && (
                              <Button variant="outline" size="sm">Cancel</Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Quick Scheduling Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button variant="outline" className="justify-start">
                  <Clock className="mr-2 h-4 w-4" /> Schedule for Peak Hours
                </Button>
                <Button variant="outline" className="justify-start">
                  <CheckSquare className="mr-2 h-4 w-4" /> Use AI Post Generator
                </Button>
                <Button variant="outline" className="justify-start">
                  <Users className="mr-2 h-4 w-4" /> Target Specific Audience
                </Button>
                <Button variant="outline" className="justify-start">
                  <BarChart3 className="mr-2 h-4 w-4" /> View Analytics
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Auto-Messaging Tab */}
          <TabsContent value="auto-messaging" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Automated Messaging</h3>
              <Button size="sm">
                <Send className="mr-2 h-4 w-4" /> Create New Template
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-md">Automated Responses</CardTitle>
                      <Switch 
                        checked={automatedResponseActive} 
                        onCheckedChange={setAutomatedResponseActive}
                      />
                    </div>
                    <CardDescription>
                      Reply automatically to common subscriber questions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue placeholder="Platforms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Platforms</SelectItem>
                        <SelectItem value="onlyfans">OnlyFans</SelectItem>
                        <SelectItem value="fansly">Fansly</SelectItem>
                        <SelectItem value="patreon">Patreon</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="mt-2">
                      <Badge>5 Templates Active</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-md">Welcome Messages</CardTitle>
                      <Switch 
                        checked={welcomeMessageActive} 
                        onCheckedChange={setWelcomeMessageActive}
                      />
                    </div>
                    <CardDescription>
                      Send welcome messages to new subscribers.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue placeholder="Platforms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Platforms</SelectItem>
                        <SelectItem value="onlyfans">OnlyFans</SelectItem>
                        <SelectItem value="fansly">Fansly</SelectItem>
                        <SelectItem value="patreon">Patreon</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="mt-2">
                      <Badge>3 Templates Active</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-md">Re-engagement Messages</CardTitle>
                      <Switch 
                        checked={reengagementActive} 
                        onCheckedChange={setReengagementActive}
                      />
                    </div>
                    <CardDescription>
                      Send messages to inactive subscribers.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue placeholder="Platforms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Platforms</SelectItem>
                        <SelectItem value="onlyfans">OnlyFans</SelectItem>
                        <SelectItem value="fansly">Fansly</SelectItem>
                        <SelectItem value="patreon">Patreon</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="mt-2">
                      <Badge className="bg-gray-100 text-gray-800">Disabled</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-md">Tip Thank You</CardTitle>
                      <Switch 
                        checked={tipThankYouActive} 
                        onCheckedChange={setTipThankYouActive}
                      />
                    </div>
                    <CardDescription>
                      Send thank you messages for tips and donations.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue placeholder="Platforms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Platforms</SelectItem>
                        <SelectItem value="onlyfans">OnlyFans</SelectItem>
                        <SelectItem value="fansly">Fansly</SelectItem>
                        <SelectItem value="kofi">Ko-fi</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="mt-2">
                      <Badge>2 Templates Active</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-md">Broadcast Messages</CardTitle>
                    <Switch 
                      checked={broadcastActive} 
                      onCheckedChange={setBroadcastActive}
                    />
                  </div>
                  <CardDescription>
                    Send one-time messages to all subscribers or specific segments.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select defaultValue="all-subscribers">
                      <SelectTrigger>
                        <SelectValue placeholder="Audience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-subscribers">All Subscribers</SelectItem>
                        <SelectItem value="new">New Subscribers (30 days)</SelectItem>
                        <SelectItem value="high-spenders">High Spenders</SelectItem>
                        <SelectItem value="inactive">Inactive (90+ days)</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue placeholder="Platforms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Platforms</SelectItem>
                        <SelectItem value="onlyfans">OnlyFans</SelectItem>
                        <SelectItem value="fansly">Fansly</SelectItem>
                        <SelectItem value="patreon">Patreon</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button disabled={!broadcastActive}>Create Broadcast</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Active Campaigns</h3>
              <Button size="sm">
                <Megaphone className="mr-2 h-4 w-4" /> Create New Campaign
              </Button>
            </div>

            {isLoadingData ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign Name</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Subscribers</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>ROI</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>{campaign.platform}</TableCell>
                        <TableCell>{campaign.subscribers}</TableCell>
                        <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                        <TableCell>
                          <span className={campaign.roi.startsWith("+") ? "text-green-600" : ""}>
                            {campaign.roi}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">Edit</Button>
                            <Button variant="outline" size="sm">
                              {campaign.status === "active" ? "Pause" : "Activate"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Campaign Performance</h3>
              <div className="h-64 w-full border rounded-md flex items-center justify-center bg-gray-50">
                <p className="text-gray-500">Campaign performance charts will appear here</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 