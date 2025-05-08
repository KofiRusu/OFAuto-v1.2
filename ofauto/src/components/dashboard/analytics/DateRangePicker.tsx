'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateChange: (range: DateRange | undefined) => void;
  disabled?: boolean;
}

export default function DateRangePicker({ 
  dateRange,
  onDateChange,
  disabled = false
}: DateRangePickerProps) {
  
  const handlePresetChange = (preset: string) => {
    const today = new Date();
    let from: Date | undefined;
    let to: Date | undefined = today;

    switch (preset) {
      case 'today':
        from = today;
        break;
      case 'yesterday':
        from = subDays(today, 1);
        to = subDays(today, 1);
        break;
      case 'last7':
        from = subDays(today, 6);
        break;
      case 'last30':
        from = subDays(today, 29);
        break;
      case 'thisWeek':
        from = startOfWeek(today);
        to = endOfWeek(today)
        break;
      case 'thisMonth':
        from = startOfMonth(today);
        to = endOfMonth(today);
        break;
       case 'lastMonth':
        const lastMonthStart = startOfMonth(subDays(today, 30)); // Go back ~30 days to ensure we are in the previous month
        from = lastMonthStart;
        to = endOfMonth(lastMonthStart);
        break;
      default:
        from = undefined;
        to = undefined;
    }
    onDateChange({ from, to });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
        <Select onValueChange={handlePresetChange} disabled={disabled}>
            <SelectTrigger className="w-full sm:w-[140px] h-9">
                <SelectValue placeholder="Select Preset..." />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last7">Last 7 Days</SelectItem>
                <SelectItem value="last30">Last 30 Days</SelectItem>
                <SelectItem value="thisWeek">This Week</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
            </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground hidden sm:inline">or</span>

        <Popover>
            <PopoverTrigger asChild>
            <Button
                id="date"
                variant={"outline"}
                className={cn(
                "w-full sm:w-[260px] justify-start text-left font-normal h-9",
                !dateRange && "text-muted-foreground"
                )}
                disabled={disabled}
            >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {
                dateRange?.from ? (
                    dateRange.to ? (
                    <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>
                    ) : (
                    format(dateRange.from, "LLL dd, y")
                    )
                ) : (
                    <span>Pick a date range</span>
                )
                }
            </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={onDateChange}
                    numberOfMonths={2}
                    disabled={disabled}
                />
            </PopoverContent>
        </Popover>
    </div>
  );
} 