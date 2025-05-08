'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, UserPlus, TrendingUp, Users, Calendar, DollarSign } from 'lucide-react';

export default function FollowersPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Followers & Subscribers</h1>
          <p className="text-muted-foreground">Manage and analyze your audience across platforms.</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Export List
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total Followers"
          value="12,548"
          icon={<Users className="h-8 w-8 text-blue-500" />}
          change="+254"
          period="this month"
          isLoading={isLoading}
        />
        <StatCard 
          title="Paid Subscribers"
          value="1,847"
          icon={<DollarSign className="h-8 w-8 text-green-500" />}
          change="+32"
          period="this month"
          isLoading={isLoading}
        />
        <StatCard 
          title="Retention Rate"
          value="87.3%"
          icon={<TrendingUp className="h-8 w-8 text-purple-500" />}
          change="+2.1%"
          period="vs last month"
          isLoading={isLoading}
        />
        <StatCard 
          title="Avg. Subscription"
          value="$16.49"
          icon={<Calendar className="h-8 w-8 text-orange-500" />}
          change="$1.23"
          period="per user/month"
          isLoading={isLoading}
        />
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-4 pb-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search followers..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Platforms</TabsTrigger>
          <TabsTrigger value="onlyfans">OnlyFans</TabsTrigger>
          <TabsTrigger value="fansly">Fansly</TabsTrigger>
          <TabsTrigger value="instagram">Instagram</TabsTrigger>
          <TabsTrigger value="twitter">Twitter</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Followers Overview</CardTitle>
              <CardDescription>
                View and manage your subscribers across all platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <FollowerListSkeleton />
              ) : (
                <div className="space-y-4">
                  <FollowerItem 
                    name="Jessica Smith"
                    username="jesssmith92"
                    platforms={['onlyfans', 'instagram']}
                    subscribedSince="Dec 12, 2023"
                    status="active"
                    spentAmount="$124.50"
                  />
                  <FollowerItem 
                    name="Michael Johnson"
                    username="mikej_official"
                    platforms={['fansly']}
                    subscribedSince="Jan 3, 2024"
                    status="active"
                    spentAmount="$76.25"
                  />
                  <FollowerItem 
                    name="Sarah Williams"
                    username="sarah_w"
                    platforms={['onlyfans', 'twitter']}
                    subscribedSince="Nov 20, 2023"
                    status="active"
                    spentAmount="$210.99"
                  />
                  <FollowerItem 
                    name="David Brown"
                    username="dave_brown"
                    platforms={['onlyfans']}
                    subscribedSince="Feb 5, 2024"
                    status="expired"
                    spentAmount="$45.00"
                  />
                  <FollowerItem 
                    name="Emma Davis"
                    username="emma_d21"
                    platforms={['fansly', 'instagram']}
                    subscribedSince="Jan 29, 2024"
                    status="active"
                    spentAmount="$98.75"
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Previous</Button>
              <div className="text-sm text-muted-foreground">Page 1 of 12</div>
              <Button>Next</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="onlyfans" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>OnlyFans Subscribers</CardTitle>
              <CardDescription>
                Your subscribers from OnlyFans platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Platform-specific subscriber data will appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="fansly" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Fansly Subscribers</CardTitle>
              <CardDescription>
                Your subscribers from Fansly platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Platform-specific subscriber data will appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="instagram" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Instagram Followers</CardTitle>
              <CardDescription>
                Your followers from Instagram platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Platform-specific follower data will appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="twitter" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Twitter Followers</CardTitle>
              <CardDescription>
                Your followers from Twitter platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Platform-specific follower data will appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FollowerListSkeleton() {
  return (
    <div className="space-y-4">
      {Array(5).fill(0).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-2">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface FollowerItemProps {
  name: string;
  username: string;
  platforms: string[];
  subscribedSince: string;
  status: 'active' | 'expired' | 'paused';
  spentAmount: string;
}

function FollowerItem({ name, username, platforms, subscribedSince, status, spentAmount }: FollowerItemProps) {
  const platformColors: Record<string, string> = {
    onlyfans: 'bg-blue-100 text-blue-800',
    fansly: 'bg-purple-100 text-purple-800',
    instagram: 'bg-pink-100 text-pink-800',
    twitter: 'bg-sky-100 text-sky-800'
  };
  
  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800',
    paused: 'bg-yellow-100 text-yellow-800'
  };
  
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 rounded-lg border hover:bg-gray-50">
      <Avatar className="h-12 w-12">
        <AvatarImage src={`https://i.pravatar.cc/150?u=${username}`} alt={name} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <div className="font-medium">{name}</div>
        <div className="text-sm text-muted-foreground">@{username}</div>
        <div className="flex flex-wrap gap-1 mt-1">
          {platforms.map(platform => (
            <Badge key={platform} variant="secondary" className={platformColors[platform]}>
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </Badge>
          ))}
        </div>
      </div>
      
      <div className="text-sm space-y-1 text-right mt-2 sm:mt-0">
        <div>Member since: <span className="font-medium">{subscribedSince}</span></div>
        <div>Total spent: <span className="font-medium">{spentAmount}</span></div>
      </div>
      
      <div className="mt-2 sm:mt-0">
        <Badge className={statusColors[status]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change: string;
  period: string;
  isLoading: boolean;
}

function StatCard({ title, value, icon, change, period, isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between">
            <Skeleton className="h-8 w-8" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>{icon}</div>
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">{change}</span> {period}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 