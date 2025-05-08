import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, AlertCircle, Settings, RefreshCcw, KeyRound, Lock, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { Integration } from "./IntegrationStatusPanel"; // Assuming type is exported
import { cn } from "@/lib/utils";

interface IntegrationStatusCardProps {
  integration: Integration;
  onConfigure: (integration: Integration) => void;
  onTest: (id: string) => Promise<void>; // Make test async to handle loading
  isTesting: boolean;
}

const platformLogos: Record<string, string> = {
    onlyfans: '/logos/onlyfans.svg', // Replace with actual paths
    fansly: '/logos/fansly.svg',
    patreon: '/logos/patreon.svg',
    kofi: '/logos/kofi.svg',
    instagram: '/logos/instagram.svg',
    twitter: '/logos/twitter.svg',
    google: '/logos/google.svg',
}

export default function IntegrationStatusCard({ 
    integration, 
    onConfigure, 
    onTest,
    isTesting
}: IntegrationStatusCardProps) {

  const getStatusInfo = () => {
    if (!integration.connected) {
      if (integration.errorMessage) {
        return { text: 'Connection Failed', color: 'bg-red-100 text-red-800', icon: AlertCircle };
      } else {
        return { text: 'Not Connected', color: 'bg-gray-100 text-gray-800', icon: WifiOff };
      }
    }
    if (integration.errorMessage) { // Connected but with recent errors (e.g., expired token)
       return { text: 'Expired / Needs Reconnect', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle };
    }
    return { text: 'Connected', color: 'bg-green-100 text-green-800', icon: Wifi };
  };

  const getAuthTypeInfo = () => {
      switch(integration.authType) {
          case 'apiKey': return { text: 'API Key', icon: KeyRound };
          case 'session': return { text: 'Session Cookie', icon: Lock };
          case 'oauth': return { text: 'OAuth 2.0', icon: ExternalLink };
          default: return { text: 'Unknown', icon: AlertCircle };
      }
  }

  const statusInfo = getStatusInfo();
  const authInfo = getAuthTypeInfo();
  const logoSrc = platformLogos[integration.id] || '/logos/default.svg'; // Fallback logo

  return (
    <Card className="flex flex-col justify-between">
        <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
                 <div className="flex items-center gap-3">
                     <img src={logoSrc} alt={`${integration.name} Logo`} className="h-8 w-8 rounded-md object-contain" />
                     <CardTitle className="text-lg font-semibold">{integration.name}</CardTitle>
                 </div>
                 <Badge variant="outline" className={cn("text-xs font-medium", statusInfo.color)}>
                    <statusInfo.icon size={13} className="mr-1" />
                    {statusInfo.text}
                 </Badge>
            </div>
            {integration.errorMessage && (
                <p className="text-xs text-red-600 pt-1">Error: {integration.errorMessage}</p>
            )}
        </CardHeader>
        <CardContent className="flex-grow py-2 space-y-2 text-sm">
             <div className="flex items-center gap-2 text-muted-foreground">
                 <authInfo.icon size={14}/>
                 <span>Authentication: {authInfo.text}</span>
             </div>
              <div className="text-xs text-muted-foreground">
                 {integration.lastSyncAt ? (
                     <span>Last synced: {formatDistanceToNow(integration.lastSyncAt, { addSuffix: true })}</span>
                 ) : (
                     <span>Never synced.</span>
                 )}
             </div>
        </CardContent>
        <CardFooter className="bg-muted/50 p-2 flex justify-end gap-2">
             <Button 
                variant="outline"
                size="sm"
                onClick={() => onTest(integration.id)}
                disabled={isTesting || !integration.connected}
                title={!integration.connected ? "Connect first to test" : "Test Connection"}
             >
                {isTesting ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <RefreshCcw size={14} className="mr-1.5" />}
                Test
             </Button>
             <Button 
                size="sm"
                onClick={() => onConfigure(integration)}
             >
                 <Settings size={14} className="mr-1.5" />
                Configure
             </Button>
             {/* Add Reconnect button logic if needed based on status/error */}
             {/* {!integration.connected || integration.errorMessage ? <Button>Reconnect</Button> : null} */}
        </CardFooter>
    </Card>
  );
} 