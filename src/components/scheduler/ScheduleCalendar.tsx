'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Calendar as CalendarIcon, Clock, ImageIcon, CalendarCheck } from 'lucide-react';
import { format, parseISO, isToday, isAfter, isBefore, addDays, startOfDay, endOfDay, isSameDay } from 'date-fns';
import { capitalize } from '@/lib/utils';

// Types
interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  platforms: string[];
  scheduledFor: string;
  status: string;
  clientId: string;
  clientName?: string;
  mediaUrls?: string[];
}

interface ScheduleCalendarProps {
  clientId?: string;
  onCreateClick?: () => void;
  onPostClick?: (post: ScheduledPost) => void;
}

export function ScheduleCalendar({ 
  clientId, 
  onCreateClick, 
  onPostClick 
}: ScheduleCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  
  // Custom hook query - can later be replaced with actual API call
  const { 
    data: posts = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['scheduledPosts', clientId, view],
    queryFn: async () => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      return [
        {
          id: '1',
          title: 'Product launch teaser',
          content: 'Exciting new content coming soon! Stay tuned for our big reveal next week... 🔥',
          platforms: ['onlyfans', 'instagram'],
          scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
          status: 'pending',
          clientId: '1',
          clientName: 'Sarah Johnson',
          mediaUrls: ['/images/post1.jpg']
        },
        {
          id: '2',
          title: 'Weekly subscriber update',
          content: 'Check your DMs for an exclusive surprise! 💖 Let me know what you think!',
          platforms: ['onlyfans'],
          scheduledFor: new Date().toISOString(),
          status: 'pending',
          clientId: '1',
          clientName: 'Sarah Johnson'
        },
        {
          id: '3',
          title: 'Holiday special announcement',
          content: 'Holiday special pricing this week only! Subscribe now and get 20% off.',
          platforms: ['onlyfans', 'fansly', 'instagram'],
          scheduledFor: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
          status: 'published',
          clientId: '2',
          clientName: 'Emma Williams'
        },
        {
          id: '4',
          title: 'Behind the scenes',
          content: 'Here\'s a sneak peek into my latest photoshoot! More content dropping this weekend.',
          platforms: ['instagram', 'twitter'],
          scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
          status: 'pending',
          clientId: '2',
          clientName: 'Emma Williams',
          mediaUrls: ['/images/post2.jpg', '/images/post3.jpg']
        }
      ].filter(post => !clientId || post.clientId === clientId);
    }
  });
  
  // Get posts for the selected date
  const getPostsForSelectedDate = () => {
    if (!date) return [];
    
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    return posts.filter(post => {
      const postDate = parseISO(post.scheduledFor);
      return isSameDay(postDate, date);
    });
  };
  
  // Get posts for current date range based on view
  const getPostsForDateRange = () => {
    if (!date) return [];
    
    switch (view) {
      case 'day':
        return getPostsForSelectedDate();
      case 'week': {
        const startDate = date;
        const endDate = addDays(date, 6);
        return posts.filter(post => {
          const postDate = parseISO(post.scheduledFor);
          return (
            (isAfter(postDate, startOfDay(startDate)) || isSameDay(postDate, startDate)) && 
            (isBefore(postDate, endOfDay(endDate)) || isSameDay(postDate, endDate))
          );
        });
      }
      case 'month':
        // For simplicity, just return all posts
        return posts;
      default:
        return posts;
    }
  };
  
  // Get dates with posts for calendar highlighting
  const getDatesWithPosts = () => {
    const uniqueDates = new Set<string>();
    
    posts.forEach(post => {
      const date = parseISO(post.scheduledFor);
      uniqueDates.add(format(date, 'yyyy-MM-dd'));
    });
    
    return Array.from(uniqueDates).map(dateStr => new Date(dateStr));
  };
  
  // Post count by date
  const getPostCountForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    return posts.filter(post => {
      const postDate = parseISO(post.scheduledFor);
      return format(postDate, 'yyyy-MM-dd') === dateStr;
    }).length;
  };
  
  // Handle calendar date change
  const handleDateChange = (date: Date | undefined) => {
    setDate(date);
  };
  
  // Handle post click
  const handlePostClick = (post: ScheduledPost) => {
    if (onPostClick) {
      onPostClick(post);
    }
  };
  
  // Handle create click
  const handleCreateClick = () => {
    if (onCreateClick) {
      onCreateClick();
    } else {
      // Default navigation if no handler provided
      window.location.href = '/dashboard/scheduler/create';
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:space-y-0">
        <Card className="flex-1 md:max-w-72">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>
              Scheduled posts overview
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateChange}
              disabled={{ before: new Date('2000-01-01') }}
              className="w-full rounded-md border"
              modifiers={{
                hasPosts: getDatesWithPosts(),
                today: [new Date()]
              }}
              modifiersStyles={{
                hasPosts: {
                  fontWeight: 'bold',
                  backgroundColor: 'var(--accent)',
                }
              }}
              components={{
                DayContent: (props) => {
                  const count = getPostCountForDate(props.date);
                  return (
                    <div className="flex flex-col items-center justify-center">
                      <div>{props.date.getDate()}</div>
                      {count > 0 && (
                        <Badge className="h-4 w-4 flex items-center justify-center p-0 text-[10px]" variant="default">
                          {count}
                        </Badge>
                      )}
                    </div>
                  );
                }
              }}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDate(new Date())}
            >
              Today
            </Button>
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView('day')}
                className={view === 'day' ? 'bg-accent' : ''}
              >
                Day
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView('week')}
                className={view === 'week' ? 'bg-accent' : ''}
              >
                Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView('month')}
                className={view === 'month' ? 'bg-accent' : ''}
              >
                Month
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>
                {view === 'day' ? 
                  format(date || new Date(), 'MMMM d, yyyy') : 
                  view === 'week' ?
                    `Week of ${format(date || new Date(), 'MMM d')}` :
                    format(date || new Date(), 'MMMM yyyy')
                }
              </CardTitle>
              <CardDescription>
                {getPostsForDateRange().length} post{getPostsForDateRange().length !== 1 ? 's' : ''}
                {view === 'day' ? ' scheduled for this day' : 
                  view === 'week' ? ' this week' : ' this month'}
              </CardDescription>
            </div>
            <Button onClick={handleCreateClick}>
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex space-x-2">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : getPostsForDateRange().length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarCheck className="mb-2 h-10 w-10 text-muted-foreground" />
                <h3 className="text-lg font-medium">No posts scheduled</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  No posts scheduled for this {view}. Create a new post to get started.
                </p>
                <Button variant="outline" onClick={handleCreateClick}>
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule New Post
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {getPostsForDateRange().map(post => (
                    <div 
                      key={post.id}
                      className="flex items-start space-x-4 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => handlePostClick(post)}
                    >
                      <div className="bg-accent/50 h-12 w-12 rounded-md flex items-center justify-center text-muted-foreground">
                        {post.mediaUrls && post.mediaUrls.length > 0 ? (
                          <ImageIcon className="h-6 w-6" />
                        ) : (
                          <CalendarIcon className="h-6 w-6" />
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm line-clamp-1">{post.title}</h4>
                          <Badge variant={post.status === 'published' ? 'secondary' : 'outline'}>
                            {capitalize(post.status)}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {post.content}
                        </p>
                        
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="mr-1 h-3 w-3" />
                            <span>
                              {isToday(parseISO(post.scheduledFor)) 
                                ? `Today at ${format(parseISO(post.scheduledFor), 'h:mm a')}` 
                                : format(parseISO(post.scheduledFor), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          
                          <div className="flex space-x-1">
                            {post.platforms.map(platform => (
                              <Badge key={platform} variant="outline" className="h-5 px-1.5 text-xs">
                                {platform}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 