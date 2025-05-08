'use client';

import { Suspense } from 'react';
import IntegrationStatusPanel from '@/components/dashboard/integrations/IntegrationStatusPanel';
import { Skeleton } from '@/components/ui/skeleton';

export default function IntegrationsPage() {
  // This main page shows the overview panel
  // Specific platform pages (/integrations/[platform]) can show more details if needed
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Platform Integrations</h1>
      <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
        <IntegrationStatusPanel />
      </Suspense>
    </div>
  );
} 