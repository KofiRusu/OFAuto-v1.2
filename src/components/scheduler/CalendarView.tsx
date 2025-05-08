"use client";

import { useState } from "react";
import { format, addDays, startOfMonth, endOfMonth, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { UserRole, PostStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScheduledPostCard } from "./ScheduledPostCard";
import { Badge } from "@/components/ui/badge";

type ScheduledPost = {
  id: string;
  title: string;
  content: string;
  status: PostStatus;
  scheduledFor: Date;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  clientId: string | null;
  client?: {
    name: string;
  } | null;
  mediaUrls: string[];
  platforms: {
    platformId: string;
    platform: {
      type: string;
      name: string;
    };
  }[];
};

interface CalendarViewProps {
  posts: ScheduledPost[];
  onDelete: () => void;
  onUpdate: () => void;
  userId: string;
  userRole: UserRole;
}

export function CalendarView({ posts, onDelete, onUpdate, userId, userRole }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const daysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    
    const days = [];
    let currentDay = start;
    
    // Add days from previous month to fill the first week
    const dayOfWeek = currentDay.getDay();
    const previousDays = [];
    for (let i = dayOfWeek - 1; i >= 0; i--) {
      previousDays.push(addDays(currentDay, -i - 1));
    }
    days.push(...previousDays);
    
    // Add days of the current month
    while (currentDay <= end) {
      days.push(new Date(currentDay));
      currentDay = addDays(currentDay, 1);
    }
    
    // Add days from next month to fill the last week
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        days.push(addDays(end, i));
      }
    }
    
    return days;
  };
  
  const getPostsForDay = (day: Date) => {
    return posts.filter(post => isSameDay(new Date(post.scheduledFor), day));
  };
  
  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
    setSelectedDate(null);
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
    setSelectedDate(null);
  };
  
  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };
  
  const isAdminOrManager = userRole === UserRole.ADMIN || userRole === UserRole.MANAGER;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <CalendarIcon className="mr-2 h-5 w-5" />
          <h2 className="text-xl font-semibold">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handlePreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentMonth(new Date());
              setSelectedDate(null);
            }}
          >
            Today
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium">
        <div className="py-2">Sun</div>
        <div className="py-2">Mon</div>
        <div className="py-2">Tue</div>
        <div className="py-2">Wed</div>
        <div className="py-2">Thu</div>
        <div className="py-2">Fri</div>
        <div className="py-2">Sat</div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth().map((day, i) => {
          const dayPosts = getPostsForDay(day);
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isDaySelected = selectedDate && isSameDay(day, selectedDate);
          
          return (
            <div
              key={i}
              className={`
                border rounded-md min-h-[100px] p-1 relative 
                ${isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400"} 
                ${isToday(day) ? "border-blue-300" : "border-gray-200"} 
                ${isDaySelected ? "ring-2 ring-blue-500" : ""}
              `}
              onClick={() => handleDayClick(day)}
            >
              <div className="text-right p-1">
                <span className={`
                  text-sm rounded-full w-7 h-7 flex items-center justify-center 
                  ${isToday(day) ? "bg-blue-100 text-blue-800 font-medium" : ""}
                `}>
                  {format(day, "d")}
                </span>
              </div>
              
              <div className="space-y-1">
                {dayPosts.length > 0 ? (
                  dayPosts.length <= 2 ? (
                    dayPosts.map(post => (
                      <div
                        key={post.id}
                        className={`
                          text-xs truncate p-1 rounded 
                          ${post.status === "DRAFT" ? "bg-gray-100" : ""}
                          ${post.status === "SCHEDULED" ? "bg-blue-100" : ""}
                          ${post.status === "POSTED" ? "bg-green-100" : ""}
                          ${post.status === "FAILED" ? "bg-red-100" : ""}
                        `}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPost(post);
                        }}
                      >
                        {post.title || "Untitled Post"}
                      </div>
                    ))
                  ) : (
                    <>
                      <div
                        key={dayPosts[0].id}
                        className={`
                          text-xs truncate p-1 rounded 
                          ${dayPosts[0].status === "DRAFT" ? "bg-gray-100" : ""}
                          ${dayPosts[0].status === "SCHEDULED" ? "bg-blue-100" : ""}
                          ${dayPosts[0].status === "POSTED" ? "bg-green-100" : ""}
                          ${dayPosts[0].status === "FAILED" ? "bg-red-100" : ""}
                        `}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPost(dayPosts[0]);
                        }}
                      >
                        {dayPosts[0].title || "Untitled Post"}
                      </div>
                      <div
                        className="text-xs text-center p-1 bg-gray-100 rounded cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(day);
                        }}
                      >
                        +{dayPosts.length - 1} more
                      </div>
                    </>
                  )
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      
      {selectedDate && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">
                Posts for {format(selectedDate, "MMMM d, yyyy")}
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedDate(null)}
              >
                Close
              </Button>
            </div>
            
            <div className="space-y-3">
              {getPostsForDay(selectedDate).length > 0 ? (
                getPostsForDay(selectedDate).map(post => (
                  <div key={post.id} className="border rounded-md p-2">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{post.title || "Untitled Post"}</h4>
                        <p className="text-xs text-gray-500">
                          {format(new Date(post.scheduledFor), "h:mm a")}
                        </p>
                      </div>
                      <Badge variant="outline" className={
                        post.status === "DRAFT" ? "bg-gray-100 text-gray-800"
                        : post.status === "SCHEDULED" ? "bg-blue-100 text-blue-800"
                        : post.status === "POSTED" ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                      }>
                        {post.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {post.platforms.map(platform => (
                        <div
                          key={platform.platformId}
                          className="text-xs bg-gray-100 px-2 py-1 rounded"
                        >
                          {platform.platform.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No posts scheduled for this day
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <ScheduledPostCard
              post={selectedPost}
              onDelete={() => {
                onDelete();
                setSelectedPost(null);
              }}
              onUpdate={() => {
                onUpdate();
                setSelectedPost(null);
              }}
              canManage={isAdminOrManager || selectedPost.createdById === userId}
            />
            <div className="mt-2 flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => setSelectedPost(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 