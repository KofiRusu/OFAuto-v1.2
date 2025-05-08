'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoModeBannerProps {
  className?: string;
}

export default function DemoModeBanner({ className }: DemoModeBannerProps) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if demo mode cookie exists
    const hasDemoCookie = document.cookie.includes('demo_mode_active=true');
    
    // Check for environment variable (this would be set server-side)
    const envDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    
    setIsDemoMode(hasDemoCookie || envDemoMode);
  }, []);

  if (!isDemoMode || !isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        "sticky top-0 z-50 flex items-center justify-center bg-amber-500 px-4 py-2 text-sm text-white shadow-md",
        className
      )}
    >
      <span className="font-medium">Demo Mode</span>
      <span className="mx-2 hidden sm:inline">—</span>
      <span className="hidden sm:inline">
        You are viewing OFAuto in demo mode. Some actions are disabled.
      </span>
      <Button
        size="sm"
        variant="ghost"
        className="ml-2 h-6 w-6 rounded-full p-0 text-amber-900 hover:bg-amber-400 hover:text-amber-950"
        onClick={() => setIsVisible(false)}
      >
        <X className="h-3 w-3" />
        <span className="sr-only">Close</span>
      </Button>
    </div>
  );
} 