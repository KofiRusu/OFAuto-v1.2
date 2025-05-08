'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { UploadCloud } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface OnlyFansIntegrationSettingsProps {
  platformId: string;
  initialStatus?: 'connected' | 'disconnected' | 'pending';
  lastSyncTime?: string;
}

export function OnlyFansIntegrationSettings({
  platformId,
  initialStatus = 'disconnected',
  lastSyncTime
}: OnlyFansIntegrationSettingsProps) {
  const [cookieFile, setCookieFile] = useState<File | null>(null);
  const [cookieJson, setCookieJson] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'pending'>(initialStatus);
  const { toast } = useToast();

  // Fetch initial status
  useEffect(() => {
    const fetchStatus = async () => {
      // Placeholder: Fetch actual status based on platformId
      // Example: check if valid cookies are stored
      // setStatus(fetchedStatus); 
    };
    // fetchStatus();
  }, [platformId]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setCookieFile(acceptedFiles[0]);
      setCookieJson(''); // Clear JSON input if file is dropped
      toast({ title: "File Selected", description: acceptedFiles[0].name });
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/json': ['.json'], 'text/plain': ['.txt'] }, // Accept JSON or TXT
    multiple: false,
  });

  const handleTestAndSave = async () => {
    if (!cookieFile && !cookieJson) {
      toast({ title: "Input Required", description: "Please upload a cookie file or paste JSON.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setStatus('pending');
    let success = false;
    let errorMessage = 'An unexpected error occurred.';

    try {
      let cookiesToStore: string | undefined; // To store cookies after successful test

      // --- Test Phase --- 
      const formData = new FormData();
      formData.append('platformId', platformId);

      if (cookieFile) {
        formData.append('cookieFile', cookieFile);
        cookiesToStore = await cookieFile.text(); // Read file content for potential storage
      } else {
        formData.append('cookiesJson', cookieJson); // Sending JSON string directly in form data for simplicity here
        cookiesToStore = cookieJson;
      }

      // Use the /test endpoint which validates without storing permanently
      const testResponse = await fetch('/api/integrations/onlyfans/test', {
        method: 'POST',
        body: formData, // Send as FormData
      });
      const testApiResult = await testResponse.json();

      if (!testResponse.ok || !testApiResult.success) {
        throw new Error(testApiResult.error || 'Invalid session cookies');
      }
      
      // --- Store Phase (if test passed) ---
      if (cookiesToStore) { // Only store if test was successful
        console.info('Test successful, now storing OF cookies', { platformId });
        // Use the authenticate method which handles storage
        const storeResponse = await fetch('/api/integrations/onlyfans/authenticate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platformId, cookiesData: cookiesToStore }), // Send parsed data
        });
        const storeResult = await storeResponse.json();
        if (!storeResponse.ok || !storeResult.success) {
          throw new Error(storeResult.error || 'Failed to save session cookies after validation');
        }
        success = true;
      } else {
        throw new Error('No cookie data available to store after testing');
      }

    } catch (error: any) {
      errorMessage = error.message || 'Failed to test/save connection';
      console.error('OnlyFans connection error:', error);
    } finally {
      setIsLoading(false);
      setStatus(success ? 'connected' : 'disconnected');
      if (success) {
        toast({ title: "Connection Successful", description: "OnlyFans session cookies validated and saved." });
        setCookieFile(null); // Clear inputs on success
        setCookieJson('');
      } else {
        toast({ title: "Connection Failed", description: errorMessage, variant: "destructive" });
      }
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'connected': return <Badge variant="success">Connected</Badge>;
      case 'pending': return <Badge variant="outline">Testing...</Badge>;
      default: return <Badge variant="destructive">Disconnected</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-4 border rounded-lg">
      <div className="flex justify-between items-center">
         <h3 className="text-lg font-semibold">OnlyFans Integration</h3>
         {getStatusBadge()}
      </div>
       {status === 'connected' && lastSyncTime && (
            <p className="text-sm text-muted-foreground">Last synced: {lastSyncTime}</p>
        )}

      {/* Option 1: File Upload */}
      <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${isDragActive ? 'border-primary bg-muted' : 'border-border'}`}>
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
        {isDragActive ? (
          <p className="mt-2 text-sm font-semibold">Drop the cookie file here ...</p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Drag & drop your cookie file here (e.g., .json, .txt), or click to select
          </p>
        )}
        {cookieFile && <p className="mt-2 text-sm font-medium text-primary">Selected: {cookieFile.name}</p>}
      </div>

      <div className="relative flex items-center">
        <div className="flex-grow border-t border-muted"></div>
        <span className="flex-shrink mx-4 text-xs uppercase text-muted-foreground">Or</span>
        <div className="flex-grow border-t border-muted"></div>
      </div>

      {/* Option 2: Paste JSON */}
      <div className="space-y-2">
        <Label htmlFor="of-cookie-json">Paste Cookie JSON String</Label>
        <Input
          id="of-cookie-json"
          type="password" // Use password type to obscure by default
          value={cookieJson}
          onChange={(e) => { setCookieJson(e.target.value); setCookieFile(null); }}
          placeholder="Paste the JSON array from your browser cookies"
          disabled={isLoading}
          className="font-mono text-xs h-20 resize-none" // Style like a textarea
          as="textarea" // Render as textarea
        />
        <p className="text-sm text-muted-foreground">
          Ensure this is the full JSON array, usually starting with `[`.
        </p>
      </div>
      
      <Button onClick={handleTestAndSave} disabled={isLoading || (!cookieFile && !cookieJson)}>
        {isLoading ? 'Processing...' : 'Test & Save Connection'}
      </Button>
    </div>
  );
} 