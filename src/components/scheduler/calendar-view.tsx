"use client";

import { useMemo } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScheduledPost } from "./create-scheduled-post-modal";

interface CalendarViewProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  posts: ScheduledPost[];
  onEditPost: (post: ScheduledPost) => void;
  onDeletePost: (postId: string) => void;
}

export function CalendarView({ 
  selectedDate, 
  setSelectedDate, 
  posts, 
  onEditPost, 
  onDeletePost 
}: CalendarViewProps) {
  const firstDayOfMonth = startOfMonth(selectedDate);
  const lastDayOfMonth = endOfMonth(selectedDate);
  const firstDayOfCalendar = startOfWeek(firstDayOfMonth);
  const lastDayOfCalendar = endOfWeek(lastDayOfMonth);

  const days = useMemo(() => {
    return eachDayOfInterval({
      start: firstDayOfCalendar,
      end: lastDayOfCalendar,
    });
  }, [firstDayOfCalendar, lastDayOfCalendar]);

  const getPostsForDay = (date: Date) => {
    return posts.filter((post) => isSameDay(new Date(post.scheduledDate), date));
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "twitter":
        return "bg-sky-500";
      case "facebook":
        return "bg-blue-600";
      case "instagram":
        return "bg-pink-600";
      case "linkedin":
        return "bg-blue-700";
      default:
        return "bg-slate-500";
    }
  };

  const previousMonth = () => {
    const prevMonth = new Date(selectedDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setSelectedDate(prevMonth);
  };

  const nextMonth = () => {
    const nextMonth = new Date(selectedDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setSelectedDate(nextMonth);
  };

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          {format(selectedDate, "MMMM yyyy")}
        </h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setSelectedDate(new Date())}
          >
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
        {weekdays.map((day) => (
          <div 
            key={day}
            className="bg-background p-2 text-center text-sm text-muted-foreground font-medium"
          >
            {day}
          </div>
        ))}
        
        {days.map((day, dayIdx) => {
          const dayPosts = getPostsForDay(day);
          return (
            <div
              key={day.toString()}
              className={cn(
                "min-h-24 p-2 bg-background flex flex-col",
                !isSameMonth(day, selectedDate) && "opacity-40",
                isEqual(day, selectedDate) && "bg-muted/50"
              )}
              onClick={() => setSelectedDate(day)}
            >
              <div className="flex justify-between items-center">
                <span
                  className={cn(
                    "text-sm font-medium",
                    isToday(day) && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>
              <div className="space-y-1 mt-1 overflow-auto max-h-24">
                {dayPosts.map((post) => (
                  <div
                    key={post.id}
                    className={cn(
                      "text-xs px-2 py-1 rounded truncate cursor-pointer hover:opacity-80",
                      getPlatformColor(post.platform),
                      "text-white"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditPost(post);
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="truncate">
                        {format(new Date(post.scheduledDate), "h:mm a")} - {post.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 