'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc/client';

/**
 * Hook to get the current client ID from the URL or from the user's first client
 * @returns The client ID to use
 */
export function useClientId(): string {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [clientId, setClientId] = useState<string>('');
  
  // Get client ID from URL query parameter
  const clientIdFromUrl = searchParams.get('clientId');
  
  // Get user's clients
  const { data: clients } = trpc.client.getClients.useQuery(
    undefined,
    {
      enabled: !!session?.user?.id,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
  
  useEffect(() => {
    // If client ID is in URL, use that
    if (clientIdFromUrl) {
      setClientId(clientIdFromUrl);
      return;
    }
    
    // Otherwise, use first client if available
    if (clients?.length) {
      setClientId(clients[0].id);
    }
  }, [clientIdFromUrl, clients]);
  
  return clientId;
} 