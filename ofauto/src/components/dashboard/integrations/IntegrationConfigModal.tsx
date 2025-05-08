'use client';

import { useState, useEffect } from 'react';
import { 
    Dialog, DialogContent, DialogDescription, DialogFooter, 
    DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle, AlertCircle, Wifi, WifiOff, ExternalLink } from 'lucide-react';
import { Integration } from "./IntegrationStatusPanel"; // Assuming type is exported
import { Platform } from "@/lib/types";

// Mock credential service functions
async function testConnectionApi(platformId: Platform, credentials: any): Promise<{ success: boolean; message?: string }> {
    console.log("Testing connection for:", platformId, "with:", credentials);
    await new Promise(resolve => setTimeout(resolve, 1200));
    if (credentials?.apiKey?.includes('fail') || credentials?.sessionCookie?.includes('fail')) {
        return { success: false, message: "Invalid credentials provided." };
    }
    if (Math.random() < 0.1) {
        return { success: false, message: "Platform API timeout." };
    }
    return { success: true, message: "Connection successful!" };
}

async function saveCredentialsApi(platformId: Platform, credentials: any): Promise<{ success: boolean }> {
    console.log("Saving credentials for:", platformId, credentials);
    await new Promise(resolve => setTimeout(resolve, 800));
    if (Math.random() < 0.05) throw new Error("Database save error.");
    return { success: true };
}

interface IntegrationConfigModalProps {
  integration: Integration | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSuccess: () => void; // Callback to potentially refresh the status list
}

export default function IntegrationConfigModal({ 
    integration, 
    isOpen, 
    onOpenChange, 
    onSaveSuccess 
}: IntegrationConfigModalProps) {
    
  // Initialize state based on the integration type
  const [apiKey, setApiKey] = useState('');
  const [sessionCookie, setSessionCookie] = useState('');
  const [proxyRegion, setProxyRegion] = useState('us');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string } | null>(null);

  // Load existing credentials (mocked) when modal opens
  useEffect(() => {
    if (isOpen && integration) {
      console.log("Modal opened for:", integration.id);
      // In real app, fetch credentials from secure storage based on integration.id
      // Mock loading based on type:
      if (integration.authType === 'apiKey') setApiKey('mock_api_key_xyz');
      if (integration.authType === 'session') setSessionCookie('mock_session_cookie=verylongstring;');
      setProxyRegion(integration.proxyRegion || 'us');
      setTestResult(null); // Clear previous test result
    } else {
        // Clear form on close
        setApiKey('');
        setSessionCookie('');
        setProxyRegion('us');
        setTestResult(null);
    }
  }, [integration, isOpen]);

  const getCredentials = () => {
      const creds: any = { proxyRegion };
      if (integration?.authType === 'apiKey') creds.apiKey = apiKey;
      if (integration?.authType === 'session') creds.sessionCookie = sessionCookie;
      // Add OAuth tokens etc. later
      return creds;
  }

  const handleTestConnection = async () => {
    if (!integration) return;
    setIsTesting(true);
    setTestResult(null);
    const credentials = getCredentials();
    const result = await testConnectionApi(integration.id, credentials);
    setTestResult(result);
    setIsTesting(false);
  };

  const handleSave = async () => {
     if (!integration) return;
     setIsSaving(true);
     const credentials = getCredentials();
     try {
         const testRes = await testConnectionApi(integration.id, credentials);
         if (!testRes.success) {
             toast({ variant: "destructive", title: "Connection Test Failed", description: testRes.message || "Please verify credentials before saving." });
             setIsSaving(false);
             return;
         }

         await saveCredentialsApi(integration.id, credentials);
         toast({ title: "Credentials Saved", description: `${integration.name} connection updated successfully.`, action: <CheckCircle className="text-green-500" /> });
         onSaveSuccess(); // Notify parent to refresh
         onOpenChange(false); // Close modal
     } catch (error: any) {
         toast({ variant: "destructive", title: "Save Failed", description: error.message || "Could not save credentials." });
     } finally {
         setIsSaving(false);
     }
  };

  const renderFields = () => {
    if (!integration) return null;

    switch (integration.authType) {
      case 'apiKey':
        return (
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input 
              id="api-key" 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Enter ${integration.name} API Key`}
            />
          </div>
        );
      case 'session':
         return (
          <div className="space-y-2">
            <Label htmlFor="session-cookie">Session Cookie</Label>
            <Textarea 
              id="session-cookie" 
              value={sessionCookie}
              onChange={(e) => setSessionCookie(e.target.value)}
              placeholder={`Paste full ${integration.name} session cookie string here`}
              rows={4}
              className="font-mono text-xs"
            />
             <p className="text-xs text-muted-foreground">
                Find this in your browser's developer tools (Network or Application tab) after logging into {integration.name}.
             </p>
          </div>
        );
      case 'oauth':
        return (
            <div className="text-center p-4 border rounded-md bg-muted/30">
                <p className="mb-3">Connect using {integration.name} OAuth:</p>
                 <Button>
                     <ExternalLink size={16} className="mr-2"/>
                     Connect with {integration.name}
                 </Button>
                 <p className="text-xs text-muted-foreground mt-2">You will be redirected to {integration.name} to authorize.</p>
            </div>
        );
      default:
        return <p>Configuration type not supported.</p>;
    }
  };

  if (!integration) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Configure {integration.name} Integration</DialogTitle>
          <DialogDescription>
            Enter or update connection details for {integration.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            {renderFields()}

            {/* Proxy Selector (Optional based on platform support) */}
            {(integration.authType === 'apiKey' || integration.authType === 'session') && (
                <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="proxy-region">Proxy Region (Optional)</Label>
                    <Select value={proxyRegion} onValueChange={setProxyRegion}>
                        <SelectTrigger id="proxy-region">
                            <SelectValue placeholder="Select Proxy Region" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="us">United States</SelectItem>
                            <SelectItem value="eu">Europe</SelectItem>
                            <SelectItem value="ap">Asia Pacific</SelectItem>
                            <SelectItem value="none">No Proxy</SelectItem>
                        </SelectContent>
                    </Select>
                     <p className="text-xs text-muted-foreground">
                        Use a proxy to avoid potential platform restrictions based on location.
                     </p>
                </div>
            )}

            {/* Test Result Display */}
            {testResult && (
                <div className={`flex items-center gap-2 p-2 rounded-md text-sm ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {testResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    <span>{testResult.message}</span>
                </div>
            )}
        </div>
        <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
            <Button 
                variant="outline" 
                onClick={handleTestConnection} 
                disabled={isTesting || isSaving || integration.authType === 'oauth'}
                className="w-full sm:w-auto"
            >
                 {isTesting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Wifi size={16} className="mr-2" />}
                Test Connection
            </Button>
           <div className="flex gap-2 w-full sm:w-auto justify-end">
                <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving || isTesting || integration.authType === 'oauth'}>
                    {isSaving && <Loader2 size={16} className="mr-2 animate-spin" />}
                    Save Configuration
                </Button>
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 