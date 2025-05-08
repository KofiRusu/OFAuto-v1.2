'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BotActivityFeed } from './BotActivityFeed';
import { GroupStatsCard } from './GroupStatsCard';
import { BotSettingsPanel } from './BotSettingsPanel';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { DateRange } from 'react-day-picker';
import { ChevronDown, BarChart, CircleUsers, MessageSquare, Telegram, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface CommunityDashboardProps {
  className?: string;
}

export function CommunityDashboard({ className }: CommunityDashboardProps) {
  const [platform, setPlatform] = useState<'discord' | 'telegram'>('discord');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  // Mock data for demonstration
  const communityStats = {
    messageCount: 1243,
    activeUsers: 156,
    newMembers: 24,
    engagementRate: 68,
  };

  const platforms = [
    { name: 'Discord', value: 'discord', icon: <MessageSquare className="h-4 w-4 mr-2" /> },
    { name: 'Telegram', value: 'telegram', icon: <Telegram className="h-4 w-4 mr-2" /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Community Monitoring</h2>
          <p className="text-muted-foreground">
            Monitor and manage your community across platforms.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[180px]">
                {platforms.find(p => p.value === platform)?.icon}
                {platforms.find(p => p.value === platform)?.name}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {platforms.map((p) => (
                <DropdownMenuItem
                  key={p.value}
                  onClick={() => setPlatform(p.value as 'discord' | 'telegram')}
                  className="flex items-center"
                >
                  {p.icon}
                  {p.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DatePickerWithRange 
            dateRange={dateRange}
            setDateRange={setDateRange}
            className="w-[300px]"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communityStats.messageCount}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(communityStats.messageCount * 0.05)} from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <CircleUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communityStats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{communityStats.newMembers} new members
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communityStats.engagementRate}%</div>
            <p className="text-xs text-muted-foreground">
              +2% from last period
            </p>
          </CardContent>
        </Card>
        <GroupStatsCard
          platform={platform}
          dateRange={dateRange}
        />
      </div>

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
          <TabsTrigger value="settings">Bot Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="activity" className="space-y-4">
          <BotActivityFeed
            platform={platform}
            dateRange={dateRange}
          />
        </TabsContent>
        <TabsContent value="settings">
          <BotSettingsPanel
            platform={platform}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 