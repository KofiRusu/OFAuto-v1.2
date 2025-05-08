'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import Link from 'next/link';
import { CheckCircle, Plug, UserCog, Calendar, MessageSquare, BellRing } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Mock API to fetch checklist status
interface ChecklistStatus {
    platformConnected: boolean;
    personaConfigured: boolean;
    firstPostScheduled: boolean;
    firstMessageSent: boolean; // Might be hard to track accurately, maybe track first follower interaction?
    alertRuleEnabled: boolean;
}
async function fetchChecklistStatusApi(): Promise<ChecklistStatus> {
    console.log("Fetching checklist status...");
    await new Promise(resolve => setTimeout(resolve, 400));
    // Simulate partial completion
    return {
        platformConnected: true,
        personaConfigured: true,
        firstPostScheduled: false,
        firstMessageSent: false,
        alertRuleEnabled: true,
    };
}

const checklistItems = [
    { id: 'platformConnected', label: 'Connect at least 1 platform', link: '/dashboard/integrations', icon: Plug },
    { id: 'personaConfigured', label: 'Configure an AI persona', link: '/dashboard/settings/persona', icon: UserCog },
    { id: 'firstPostScheduled', label: 'Schedule your first post', link: '/dashboard/scheduler', icon: Calendar },
    { id: 'firstMessageSent', label: 'Check follower messages', link: '/dashboard/messages', icon: MessageSquare },
    { id: 'alertRuleEnabled', label: 'Enable at least 1 alert rule', link: '/dashboard/alerts', icon: BellRing },
];

export default function OnboardingChecklist() {
  const [status, setStatus] = useState<ChecklistStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStatus() {
        setIsLoading(true);
        try {
            const fetchedStatus = await fetchChecklistStatusApi();
            setStatus(fetchedStatus);
        } catch (error) { console.error("Failed to load checklist status"); }
         finally { setIsLoading(false); }
    }
    loadStatus();
  }, []);

  const completedCount = useMemo(() => {
      if (!status) return 0;
      return Object.values(status).filter(Boolean).length;
  }, [status]);

  const progressPercentage = useMemo(() => {
      return (completedCount / checklistItems.length) * 100;
  }, [completedCount]);

  if (isLoading) {
      return <Skeleton className="h-48 w-full" />;
  }
  
  if (!status || progressPercentage === 100) {
      return null; // Don't show if loading failed or checklist is complete
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Getting Started Checklist</CardTitle>
        <CardDescription>Complete these steps to unlock the full power of OFAuto.</CardDescription>
         <Progress value={progressPercentage} className="mt-2 h-2" />
         <p className="text-xs text-muted-foreground text-right mt-1">{completedCount} of {checklistItems.length} steps completed</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {checklistItems.map(item => {
          const isCompleted = status[item.id as keyof ChecklistStatus];
          const Icon = item.icon;
          return (
            <Link key={item.id} href={item.link} className={`flex items-center gap-3 p-2 rounded-md transition-colors ${isCompleted ? 'opacity-60 cursor-default' : 'hover:bg-muted/50'}`}>
              {/* Use Checkbox visually, but it's not interactive here */} 
              <Checkbox checked={isCompleted} disabled className={isCompleted ? '' : 'border-primary'} />
              <Icon size={18} className={isCompleted ? 'text-muted-foreground' : 'text-primary'} />
              <span className={`text-sm ${isCompleted ? 'line-through text-muted-foreground' : 'font-medium'}`}>{item.label}</span>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
} 