'use client';

import React from 'react';
import { CampaignPlanner } from '@/components/dashboard/CampaignPlanner';
import { useClientId } from '@/app/dashboard/useClientId';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function PlannerPage() {
  const clientId = useClientId();
  const { toast } = useToast();
  
  // Show loading state while waiting for clientId
  if (!clientId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        
        <div className="flex-1 space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // If there's an error with clientId, show error state
  if (clientId === 'error') {
    return (
      <Card className="bg-destructive/10 border-destructive/30">
        <CardContent className="py-6 flex flex-col items-center text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
          <h3 className="text-lg font-semibold">Unable to load client data</h3>
          <p className="text-muted-foreground mb-4">
            There was an error loading your client information. Please refresh the page or contact support if the problem persists.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-8">
      <CampaignPlanner clientId={clientId} />
    </div>
  );
} 