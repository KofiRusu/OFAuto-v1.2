'use client';

import React from 'react';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertCircle, 
  Loader2, 
  ExternalLink, 
  ShoppingBag, 
  Twitter as TwitterIcon, 
  Instagram as InstagramIcon 
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/ui/use-toast";
import { logger } from '@/lib/logger';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Expanded PlatformType to include new platforms
type PlatformType = 'patreon' | 'kofi' | 'fansly' | 'onlyfans' | 'gumroad' | 'twitter' | 'instagram';

// Define schemas based on platform type
const kofiSchema = z.object({
  apiKey: z.string().min(10, "Invalid API Key format"),
});

const gumroadSchema = z.object({
  apiKey: z.string().min(10, "Invalid API Key format"),
});

const userPassSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const twitterSchema = z.object({
  accessToken: z.string().min(1, "Access token cannot be empty"),
  refreshToken: z.string().optional(),
  apiKey: z.string().min(1, "API key cannot be empty"),
  apiSecret: z.string().min(1, "API secret cannot be empty"),
});

const instagramSchema = z.object({
  accessToken: z.string().min(1, "Access token cannot be empty"),
  userId: z.string().min(1, "User ID cannot be empty"),
});

// Determine schema based on platformType
const getValidationSchema = (platformType: PlatformType) => {
  switch (platformType) {
    case 'kofi': return kofiSchema;
    case 'gumroad': return gumroadSchema;
    case 'fansly':
    case 'onlyfans': return userPassSchema;
    case 'twitter': return twitterSchema;
    case 'instagram': return instagramSchema;
    default: return z.object({}); // Default empty schema
  }
};

interface ConnectPlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  platformType: PlatformType;
  platformName: string;
  clientId: string;
  'data-testid'?: string;
}

export default function ConnectPlatformModal({
  isOpen,
  onClose,
  platformType,
  platformName,
  clientId,
  'data-testid': testId = 'connect-platform-modal'
}: ConnectPlatformModalProps) {
  const { toast } = useToast();
  const validationSchema = getValidationSchema(platformType);
  type FormData = z.infer<typeof validationSchema>;
  const [authMethod, setAuthMethod] = React.useState<'oauth' | 'manual'>('oauth');

  const form = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: getDefaultValues(platformType),
  });

  const { formState: { errors, isSubmitting } } = form;

  // Helper function to get default values for the form
  function getDefaultValues(type: PlatformType): any {
    switch (type) {
      case 'kofi':
      case 'gumroad':
        return { apiKey: '' };
      case 'fansly':
      case 'onlyfans':
        return { email: '', password: '' };
      case 'twitter':
        return { accessToken: '', refreshToken: '', apiKey: '', apiSecret: '' };
      case 'instagram':
        return { accessToken: '', userId: '' };
      default:
        return {};
    }
  }

  // Check if platform supports OAuth
  const supportsOAuth = React.useMemo(() => {
    return ['patreon', 'twitter', 'instagram', 'gumroad'].includes(platformType);
  }, [platformType]);

  // Helper to get OAuth redirects
  const getOAuthUrl = (platform: PlatformType): string => {
    const baseUrl = window.location.origin;
    switch (platform) {
      case 'patreon':
        return `${baseUrl}/api/integrations/patreon/authorize?clientId=${clientId}`;
      case 'twitter':
        return `${baseUrl}/api/integrations/twitter/authorize?clientId=${clientId}`;
      case 'instagram':
        return `${baseUrl}/api/integrations/instagram/authorize?clientId=${clientId}`;
      case 'gumroad':
        return `${baseUrl}/api/integrations/gumroad/authorize?clientId=${clientId}`;
      default:
        return '#';
    }
  };

  // Get platform specific icon
  const getPlatformIcon = () => {
    switch (platformType) {
      case 'gumroad':
        return <ShoppingBag className="h-6 w-6 text-pink-600 dark:text-pink-400" />;
      case 'twitter':
        return <TwitterIcon className="h-6 w-6 text-blue-500 dark:text-blue-400" />;
      case 'instagram':
        return <InstagramIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />;
      default:
        return null;
    }
  };

  // tRPC Mutations
  const connectKofiMutation = trpc.platformConnections.connectKofi.useMutation({
    onSuccess: () => {
        toast({ title: "Success", description: `${platformName} connected successfully.` });
        form.reset();
        onClose();
    },
    onError: (err) => {
      logger.error({ err, clientId, platform: platformType }, `Failed to connect ${platformName}`);
      toast({ title: "Connection Failed", description: err.message, variant: "destructive" });
    }
  });
  
  const connectGumroadMutation = trpc.platformConnections.connectGumroad.useMutation({
    onSuccess: () => {
        toast({ title: "Success", description: `${platformName} connected successfully.` });
        form.reset();
        onClose();
    },
    onError: (err) => {
      logger.error({ err, clientId, platform: platformType }, `Failed to connect ${platformName}`);
      toast({ title: "Connection Failed", description: err.message, variant: "destructive" });
    }
  });
  
  const connectUserPassMutation = trpc.platformConnections.connectUserPass.useMutation({
      onSuccess: () => {
        toast({ title: "Success", description: `${platformName} credentials saved.` });
        form.reset();
        onClose();
      },
      onError: (err) => {
        logger.error({ err, clientId, platform: platformType }, `Failed to save ${platformName} credentials`);
        toast({ title: "Connection Failed", description: err.message, variant: "destructive" });
      }
  });
  
  const connectTwitterMutation = trpc.platformConnections.connectTwitter.useMutation({
      onSuccess: () => {
        toast({ title: "Success", description: `${platformName} connected successfully.` });
        form.reset();
        onClose();
      },
      onError: (err) => {
        logger.error({ err, clientId, platform: platformType }, `Failed to connect ${platformName}`);
        toast({ title: "Connection Failed", description: err.message, variant: "destructive" });
      }
  });
  
  const connectInstagramMutation = trpc.platformConnections.connectInstagram.useMutation({
      onSuccess: () => {
        toast({ title: "Success", description: `${platformName} connected successfully.` });
        form.reset();
        onClose();
      },
      onError: (err) => {
        logger.error({ err, clientId, platform: platformType }, `Failed to connect ${platformName}`);
        toast({ title: "Connection Failed", description: err.message, variant: "destructive" });
      }
  });

  const onSubmit = async (values: FormData) => {
    switch (platformType) {
      case 'kofi':
        connectKofiMutation.mutate({ 
          clientId, 
          platformType: 'kofi', 
          apiKey: (values as z.infer<typeof kofiSchema>).apiKey 
        });
        break;
      case 'gumroad':
        connectGumroadMutation.mutate({
          clientId,
          platformType: 'gumroad',
          apiKey: (values as z.infer<typeof gumroadSchema>).apiKey
        });
        break;
      case 'fansly':
      case 'onlyfans':
        connectUserPassMutation.mutate({ 
          clientId, 
          platformType: platformType,
          email: (values as z.infer<typeof userPassSchema>).email,
          password: (values as z.infer<typeof userPassSchema>).password,
        });
        break;
      case 'twitter':
        const twitterValues = values as z.infer<typeof twitterSchema>;
        connectTwitterMutation.mutate({
          clientId,
          platformType: 'twitter',
          accessToken: twitterValues.accessToken,
          refreshToken: twitterValues.refreshToken,
          apiKey: twitterValues.apiKey,
          apiSecret: twitterValues.apiSecret,
        });
        break;
      case 'instagram':
        const instagramValues = values as z.infer<typeof instagramSchema>;
        connectInstagramMutation.mutate({
          clientId,
          platformType: 'instagram',
          accessToken: instagramValues.accessToken,
          userId: instagramValues.userId,
        });
        break;
      case 'patreon':
        // Trigger Patreon OAuth flow - now handled by button click in the OAuth tab
        break;
    }
  };

  // Handle OAuth button click
  const handleOAuthConnect = () => {
    const url = getOAuthUrl(platformType);
    if (url) {
      window.location.href = url;
    }
  };

  // Loading state combines both mutations
  const isLoading = 
    connectKofiMutation.isLoading || 
    connectGumroadMutation.isLoading ||
    connectUserPassMutation.isLoading || 
    connectTwitterMutation.isLoading ||
    connectInstagramMutation.isLoading ||
    isSubmitting;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] dark:bg-slate-900 dark:border-slate-800" data-testid={testId}>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {getPlatformIcon()}
            <span className="ml-2">Connect {platformName}</span>
          </DialogTitle>
          <DialogDescription>
            {supportsOAuth 
              ? "Connect to your account using OAuth (recommended) or enter credentials manually." 
              : `Enter the required credentials to connect your ${platformName} account.`}
          </DialogDescription>
        </DialogHeader>
        
        {supportsOAuth ? (
          <Tabs defaultValue="oauth" value={authMethod} onValueChange={(v) => setAuthMethod(v as 'oauth' | 'manual')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="oauth">Connect with OAuth</TabsTrigger>
              <TabsTrigger value="manual">Enter Manually</TabsTrigger>
            </TabsList>
            
            <TabsContent value="oauth" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Secure Connection</AlertTitle>
                <AlertDescription>
                  Connect securely using OAuth. You'll be redirected to {platformName} to authorize access.
                </AlertDescription>
              </Alert>
              
              <div className="text-center py-4">
                <Button 
                  onClick={handleOAuthConnect}
                  className="w-full"
                  data-testid={`${platformType}-oauth-button`}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Connect via {platformName}
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground text-center">
                You'll be redirected to {platformName} to grant access to your account.
                <br />No passwords are stored in our system when using OAuth.
              </div>
            </TabsContent>
            
            <TabsContent value="manual">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="connect-form">
                {renderManualForm()}
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onClose} 
                    disabled={isLoading}
                    data-testid="cancel-button"
                    className="dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    data-cy="connect-submit"
                    data-testid="connect-submit"
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Credentials
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>
          </Tabs>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="connect-form">
            {renderManualForm()}
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                disabled={isLoading}
                data-testid="cancel-button"
                className="dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                data-cy="connect-submit"
                data-testid="connect-submit"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Credentials
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
  
  // Helper function to render the correct form fields based on platform type
  function renderManualForm() {
    switch (platformType) {
      case 'kofi':
        return (
          <div className="space-y-2">
            <Label htmlFor="apiKey">Ko-fi API Key</Label>
            <Input 
              id="apiKey" 
              {...form.register("apiKey")} 
              placeholder="Enter your Ko-fi API Key"
              type="password"
              data-cy="api-key-input"
              data-testid="api-key-input"
              className="dark:border-slate-700 dark:bg-slate-800"
            />
            {errors.apiKey && <p className="text-sm text-red-600 dark:text-red-400" data-testid="api-key-error">{errors.apiKey.message}</p>}
            <p className="text-xs text-muted-foreground">Find your API key in Ko-fi settings.</p>
          </div>
        );
      
      case 'gumroad':
        return (
          <div className="space-y-2">
            <Label htmlFor="apiKey">Gumroad API Key</Label>
            <Input 
              id="apiKey" 
              {...form.register("apiKey")} 
              placeholder="Enter your Gumroad API Key"
              type="password"
              data-cy="api-key-input"
              data-testid="api-key-input"
              className="dark:border-slate-700 dark:bg-slate-800"
            />
            {errors.apiKey && <p className="text-sm text-red-600 dark:text-red-400" data-testid="api-key-error">{errors.apiKey.message}</p>}
            <p className="text-xs text-muted-foreground">
              Find your API key in the Gumroad settings under API & Webhooks.
            </p>
          </div>
        );
        
      case 'fansly':
      case 'onlyfans':
        return (
          <>
            <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Security Notice</AlertTitle>
                <AlertDescription>
                  Storing login credentials requires trust. We encrypt your password, but using platform-specific API keys or OAuth is always more secure when available. 
                </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="email">{platformName} Email</Label>
              <Input 
                id="email" 
                {...form.register("email")} 
                placeholder={`Enter your ${platformName} login email`}
                type="email"
                data-cy="email-input"
                data-testid="email-input"
                className="dark:border-slate-700 dark:bg-slate-800"
              />
              {errors.email && <p className="text-sm text-red-600 dark:text-red-400" data-testid="email-error">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{platformName} Password</Label>
              <Input 
                id="password" 
                {...form.register("password")} 
                placeholder={`Enter your ${platformName} password`}
                type="password"
                data-cy="password-input"
                data-testid="password-input"
                className="dark:border-slate-700 dark:bg-slate-800"
              />
              {errors.password && <p className="text-sm text-red-600 dark:text-red-400" data-testid="password-error">{errors.password.message}</p>}
            </div>
          </>
        );
        
      case 'twitter':
        return (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>API Access Required</AlertTitle>
              <AlertDescription>
                You'll need Twitter API access and a developer account to use this integration.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token</Label>
              <Input 
                id="accessToken" 
                {...form.register("accessToken")} 
                placeholder="Enter your Twitter Access Token"
                type="password"
                data-testid="access-token-input"
                className="dark:border-slate-700 dark:bg-slate-800"
              />
              {errors.accessToken && <p className="text-sm text-red-600 dark:text-red-400">{errors.accessToken.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="refreshToken">Refresh Token (Optional)</Label>
              <Input 
                id="refreshToken" 
                {...form.register("refreshToken")} 
                placeholder="Enter your Twitter Refresh Token"
                type="password"
                data-testid="refresh-token-input"
                className="dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input 
                id="apiKey" 
                {...form.register("apiKey")} 
                placeholder="Enter your Twitter API Key"
                type="password"
                data-testid="twitter-api-key-input"
                className="dark:border-slate-700 dark:bg-slate-800"
              />
              {errors.apiKey && <p className="text-sm text-red-600 dark:text-red-400">{errors.apiKey.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiSecret">API Secret</Label>
              <Input 
                id="apiSecret" 
                {...form.register("apiSecret")} 
                placeholder="Enter your Twitter API Secret"
                type="password"
                data-testid="api-secret-input"
                className="dark:border-slate-700 dark:bg-slate-800"
              />
              {errors.apiSecret && <p className="text-sm text-red-600 dark:text-red-400">{errors.apiSecret && errors.apiSecret.message}</p>}
            </div>
          </>
        );
        
      case 'instagram':
        return (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Meta Developer Account Required</AlertTitle>
              <AlertDescription>
                You'll need a Meta developer account and an Instagram Basic Display API app to use this integration.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token</Label>
              <Input 
                id="accessToken" 
                {...form.register("accessToken")} 
                placeholder="Enter your Instagram Access Token"
                type="password"
                data-testid="instagram-access-token-input"
                className="dark:border-slate-700 dark:bg-slate-800"
              />
              {errors.accessToken && <p className="text-sm text-red-600 dark:text-red-400">{errors.accessToken.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="userId">Instagram User ID</Label>
              <Input 
                id="userId" 
                {...form.register("userId")} 
                placeholder="Enter your Instagram User ID"
                data-testid="instagram-user-id-input"
                className="dark:border-slate-700 dark:bg-slate-800"
              />
              {errors.userId && <p className="text-sm text-red-600 dark:text-red-400">{errors.userId.message}</p>}
            </div>
            <p className="text-xs text-muted-foreground">
              You can find your User ID and generate an access token in the Meta for Developers dashboard.
            </p>
          </>
        );
        
      case 'patreon':
        return (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">Patreon requires connecting through their secure OAuth process.</p>
            <Button 
              type="button"
              onClick={handleOAuthConnect}
              disabled={isLoading}
              data-cy="patreon-connect-button"
              data-testid="patreon-connect-button"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Connect via Patreon
            </Button>
          </div>
        );
        
      default:
        return null;
    }
  }
} 