import React, { useState, useMemo } from 'react';
import { format, isSameDay, isSameMonth, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isToday, getDay, parseISO, isValid, getDate } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { CampaignItem } from '@/lib/trpc/routers/campaignPlanner';
import { CampaignCard } from '@/components/dashboard/CampaignCard';

interface CalendarGridProps {
  items: CampaignItem[];
  view: 'month' | 'week';
  onCreateItem?: (date: Date) => void;
  onItemClick?: (item: CampaignItem) => void;
  onEditItem?: (item: CampaignItem) => void;
  onDeleteItem?: (item: CampaignItem) => void;
  onRescheduleItem?: (item: CampaignItem) => void;
  className?: string;
}

export const CalendarGrid = ({
  items,
  view = 'month',
  onCreateItem,
  onItemClick,
  onEditItem,
  onDeleteItem,
  onRescheduleItem,
  className,
}: CalendarGridProps) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Navigate to previous month/week
  const navigatePrevious = () => {
    if (view === 'month') {
      setCurrentDate(prevDate => subMonths(prevDate, 1));
    } else {
      setCurrentDate(prevDate => addDays(prevDate, -7));
    }
  };
  
  // Navigate to next month/week
  const navigateNext = () => {
    if (view === 'month') {
      setCurrentDate(prevDate => addMonths(prevDate, 1));
    } else {
      setCurrentDate(prevDate => addDays(prevDate, 7));
    }
  };
  
  // Navigate to today
  const navigateToday = () => {
    setCurrentDate(new Date());
  };
  
  // Calculate days to display based on view
  const daysToDisplay = useMemo(() => {
    if (view === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const startDate = startOfWeek(monthStart);
      const endDate = endOfWeek(monthEnd);
      
      return eachDayOfInterval({ start: startDate, end: endDate });
    } else {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
  }, [currentDate, view]);
  
  // Group items by date
  const itemsByDate = useMemo(() => {
    const grouped: Record<string, CampaignItem[]> = {};
    
    daysToDisplay.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      grouped[dateStr] = [];
    });
    
    items.forEach(item => {
      if (!item.scheduledFor || !isValid(item.scheduledFor)) return;
      
      const dateStr = format(item.scheduledFor, 'yyyy-MM-dd');
      if (grouped[dateStr]) {
        grouped[dateStr].push(item);
      }
    });
    
    // Sort items by time for each day
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        return a.scheduledFor.getTime() - b.scheduledFor.getTime();
      });
    });
    
    return grouped;
  }, [items, daysToDisplay]);
  
  // Format month header
  const monthYearHeader = format(currentDate, 'MMMM yyyy');
  
  // Format week range header (e.g., "Jun 7 - Jun 13, 2023")
  const weekRangeHeader = `${format(daysToDisplay[0], 'MMM d')} - ${format(daysToDisplay[6], 'MMM d, yyyy')}`;
  
  return (
    <div className={cn('w-full flex flex-col', className)}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          {view === 'month' ? monthYearHeader : weekRangeHeader}
        </h2>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={navigatePrevious}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={navigateToday}
            className="h-8"
          >
            Today
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={navigateNext}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 text-center mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
          <div key={day} className="py-2 font-medium text-sm">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div 
        className={cn(
          'grid grid-cols-7 gap-2',
          view === 'month' ? 'auto-rows-fr' : 'auto-rows-fr'
        )}
      >
        {daysToDisplay.map((day, i) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayItems = itemsByDate[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);
          
          return (
            <div 
              key={i}
              className={cn(
                'border rounded-md flex flex-col overflow-hidden',
                'transition-colors hover:border-primary/50 hover:bg-muted/30',
                !isCurrentMonth && 'opacity-40',
                isTodayDate && 'border-primary/50 bg-primary/5'
              )}
            >
              {/* Day Header */}
              <div className="flex items-start justify-between p-2 border-b">
                <div className={cn(
                  "font-medium",
                  isTodayDate && "text-primary"
                )}>
                  {format(day, 'd')}
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => onCreateItem?.(day)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Day Events */}
              <div className="flex-1 flex flex-col gap-1 p-1 overflow-y-auto max-h-40">
                {dayItems.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                    {getDate(day) <= 20 ? 'No items' : ''}
                  </div>
                ) : (
                  dayItems.map(item => (
                    <CampaignCard
                      key={item.id}
                      item={item}
                      compact={true}
                      onClick={onItemClick}
                      onEdit={onEditItem}
                      onDelete={onDeleteItem}
                      onReschedule={onRescheduleItem}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 