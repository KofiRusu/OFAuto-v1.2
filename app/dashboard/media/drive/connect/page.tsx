"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc/client';
import { Icons } from '@/components/ui/icons';

export default function ConnectGoogleDrivePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get Drive status to check if already connected
  const { data: driveStatus, isLoading: isStatusLoading } = trpc.drive.getDriveStatus.useQuery();
  
  // Get auth URL for Google OAuth
  const { data: authUrlData } = trpc.drive.getAuthUrl.useQuery();
  
  // Connect Drive mutation
  const connectDriveMutation = trpc.drive.connectDrive.useMutation({
    onSuccess: () => {
      router.push('/dashboard/media/drive/list');
    },
    onError: (error) => {
      setError(error.message);
      setIsLoading(false);
    },
  });
  
  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    
    if (code) {
      setIsLoading(true);
      
      // Call the connect mutation with the code
      connectDriveMutation.mutate({ code });
    }
  }, [searchParams, connectDriveMutation]);
  
  // Handle "Connect Google Drive" button click
  const handleConnectClick = () => {
    if (authUrlData?.url) {
      window.location.href = authUrlData.url;
    }
  };
  
  // If already connected, redirect to file list
  useEffect(() => {
    if (driveStatus?.connected && !isStatusLoading) {
      router.push('/dashboard/media/drive/list');
    }
  }, [driveStatus, isStatusLoading, router]);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Connect Google Drive</CardTitle>
          <CardDescription>
            Connect your Google Drive account to access and manage your files directly from the platform.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <div className="flex items-center justify-center p-4">
            <Icons.googleDrive className="h-16 w-16 text-blue-500" />
          </div>
          
          <p className="text-sm text-muted-foreground text-center mb-4">
            By connecting your Google Drive, you'll be able to:
          </p>
          
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Browse and manage your Drive files</li>
            <li>Upload new content directly to your Drive</li>
            <li>Access files across your devices</li>
          </ul>
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={handleConnectClick}
            disabled={isLoading || isStatusLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Icons.google className="mr-2 h-4 w-4" />
                Connect Google Drive
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 