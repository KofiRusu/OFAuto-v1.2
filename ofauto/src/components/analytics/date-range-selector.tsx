"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { AnalyticsPeriod } from "@/lib/analytics/types";

interface DateRangeSelectorProps {
  startDate: Date;
  endDate: Date;
  period: AnalyticsPeriod;
  onChange: (startDate: Date, endDate: Date, period: AnalyticsPeriod) => void;
}

export function DateRangeSelector({
  startDate,
  endDate,
  period,
  onChange,
}: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Predefined date ranges
  const dateRanges = [
    { 
      label: "Last 7 days", 
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 7);
        return { start, end, period: "daily" as AnalyticsPeriod };
      } 
    },
    { 
      label: "Last 30 days", 
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        return { start, end, period: "daily" as AnalyticsPeriod };
      } 
    },
    { 
      label: "This month", 
      getRange: () => {
        const end = new Date();
        const start = new Date(end.getFullYear(), end.getMonth(), 1);
        return { start, end, period: "daily" as AnalyticsPeriod };
      } 
    },
    { 
      label: "Last 3 months", 
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setMonth(end.getMonth() - 3);
        return { start, end, period: "weekly" as AnalyticsPeriod };
      } 
    },
    { 
      label: "Year to date", 
      getRange: () => {
        const end = new Date();
        const start = new Date(end.getFullYear(), 0, 1);
        return { start, end, period: "monthly" as AnalyticsPeriod };
      } 
    }
  ];

  const formatDateRange = () => {
    return `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`;
  };

  const handleRangeSelect = (range: { start: Date; end: Date; period: AnalyticsPeriod }) => {
    onChange(range.start, range.end, range.period);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-4 py-2 border rounded-md bg-white hover:bg-gray-50 focus:outline-none"
      >
        <CalendarIcon className="w-4 h-4 mr-2 text-gray-500" />
        <span>{formatDateRange()}</span>
        <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
          {period.charAt(0).toUpperCase() + period.slice(1)}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-10 border">
          <div className="py-1">
            {dateRanges.map((range, index) => (
              <button
                key={index}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none"
                onClick={() => handleRangeSelect(range.getRange())}
              >
                {range.label}
              </button>
            ))}
          </div>
          <div className="border-t p-2">
            <div className="text-sm font-medium mb-2">Group by:</div>
            <div className="flex space-x-2">
              {["daily", "weekly", "monthly"].map((p) => (
                <button
                  key={p}
                  className={`px-3 py-1 text-xs rounded-full ${
                    period === p
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                  onClick={() => {
                    onChange(startDate, endDate, p as AnalyticsPeriod);
                    setIsOpen(false);
                  }}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 