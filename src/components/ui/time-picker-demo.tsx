"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface TimePickerProps {
  date: Date;
  setDate: (date: Date) => void;
}

export function TimePickerDemo({ date, setDate }: TimePickerProps) {
  // This gets the hour in 24-hour format (0-23)
  const hours = date.getHours();
  
  // This gets the minutes (0-59)
  const minutes = date.getMinutes();
  
  // Convert 24-hour format to 12-hour format and determine AM/PM
  const hour12 = hours % 12 || 12;
  const ampm = hours >= 12 ? "PM" : "AM";
  
  // Format hours and minutes to always have 2 digits
  const formattedHours = hour12.toString().padStart(2, "0");
  const formattedMinutes = minutes.toString().padStart(2, "0");
  
  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHour = parseInt(e.target.value, 10);
    
    if (isNaN(newHour) || newHour < 1 || newHour > 12) {
      return;
    }
    
    // Convert to 24-hour format based on the current AM/PM
    const hour24 = (newHour % 12) + (ampm === "PM" ? 12 : 0);
    
    const newDate = new Date(date);
    newDate.setHours(hour24);
    setDate(newDate);
  };
  
  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinutes = parseInt(e.target.value, 10);
    
    if (isNaN(newMinutes) || newMinutes < 0 || newMinutes > 59) {
      return;
    }
    
    const newDate = new Date(date);
    newDate.setMinutes(newMinutes);
    setDate(newDate);
  };
  
  const handleAmPmChange = () => {
    // Calculate new hour based on AM/PM toggle
    const hour24 = (hours % 12) + (ampm === "AM" ? 12 : 0);
    
    const newDate = new Date(date);
    newDate.setHours(hour24);
    setDate(newDate);
  };
  
  return (
    <div className="flex items-center space-x-2">
      <div className="grid gap-1 text-center">
        <Label htmlFor="hours" className="text-xs">
          Hours
        </Label>
        <Input
          id="hours"
          className="w-12 text-center"
          value={formattedHours}
          onChange={handleHourChange}
        />
      </div>
      <span className="text-sm text-gray-400">:</span>
      <div className="grid gap-1 text-center">
        <Label htmlFor="minutes" className="text-xs">
          Minutes
        </Label>
        <Input
          id="minutes"
          className="w-12 text-center"
          value={formattedMinutes}
          onChange={handleMinuteChange}
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="ampm" className="text-xs">
          &nbsp;
        </Label>
        <button
          id="ampm"
          type="button"
          className="rounded-md border border-input bg-background px-2 py-1 text-xs"
          onClick={handleAmPmChange}
        >
          {ampm}
        </button>
      </div>
    </div>
  );
} 