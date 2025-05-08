'use client';

import { Suspense } from 'react';
import ManualConfigPanel from '@/components/dashboard/settings/ManualConfigPanel';
import { Skeleton } from '@/components/ui/skeleton';

export default function ManualConfigurationPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold mb-4">API Manual Configuration</h1>
      <p className="text-muted-foreground mb-6">Configure advanced API settings and manual overrides. Only modify these settings if instructed by support.</p>
      
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <ManualConfigPanel />
      </Suspense>
    </div>
  );
} 