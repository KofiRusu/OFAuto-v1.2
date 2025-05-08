"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@clerk/nextjs";
import { DEFAULT_ORG_SETTINGS } from "@/lib/schemas/organization";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Icons } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/spinner";
import { toast } from "@/components/ui/use-toast";
import Forbidden from "@/components/forbidden";

export default function ClientOrgSettingsPage({ params }: { params: { clientId: string } }) {
  const router = useRouter();
  const { userId, sessionClaims } = useAuth();
  const { clientId } = params;
  
  // Get the user role from sessionClaims
  const userRole = sessionClaims?.userRole || "USER";
  
  // Check if the user has manager or admin access
  const hasAccess = userRole === "MANAGER" || userRole === "ADMIN";

  // State for settings
  const [settings, setSettings] = useState<Record<string, any> | null>(null);
  const [originalSettings, setOriginalSettings] = useState<Record<string, any> | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Query to get client data
  const {
    data: clientData,
    isLoading: isLoadingClient,
  } = trpc.organization.getClientWithOrgData.useQuery(
    { clientId },
    {
      enabled: hasAccess,
    }
  );

  // Query to get organization settings
  const {
    data: orgSettings,
    isLoading: isLoadingSettings,
    refetch: refetchSettings,
  } = trpc.organization.getOrgSettings.useQuery(
    { clientId },
    {
      enabled: hasAccess,
      onSuccess: (data) => {
        setSettings(data.settings);
        setOriginalSettings(JSON.parse(JSON.stringify(data.settings)));
      },
    }
  );

  // Update organization settings mutation
  const updateSettingsMutation = trpc.organization.updateOrgSettings.useMutation({
    onSuccess: () => {
      refetchSettings();
      toast({
        title: "Settings Updated",
        description: "Organization settings have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error Updating Settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate referral code mutation
  const generateReferralCodeMutation = trpc.organization.generateReferralCode.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Referral Code Generated",
        description: `New referral code: ${data.referralCode}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error Generating Referral Code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check for changes when settings are updated
  useEffect(() => {
    if (settings && originalSettings) {
      setHasChanges(JSON.stringify(settings) !== JSON.stringify(originalSettings));
    }
  }, [settings, originalSettings]);

  // Handle settings changes
  const handleSettingChange = (section: string, key: string, value: any) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value
      }
    });
  };

  // Handle saving settings
  const handleSaveSettings = () => {
    if (!settings) return;
    
    updateSettingsMutation.mutate({
      clientId,
      settings,
    });
  };

  // Handle generating a new referral code
  const handleGenerateReferralCode = () => {
    generateReferralCodeMutation.mutate({ clientId });
  };

  // If user has no access, show forbidden page
  if (!hasAccess) {
    return <Forbidden />;
  }

  // Show loading state
  if (isLoadingClient || isLoadingSettings) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{clientData?.name || "Client"} Settings</h1>
          <p className="text-muted-foreground">Manage organization settings and referral codes</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard/admin/organization')}>
          <Icons.arrowLeft className="mr-2 h-4 w-4" /> Back to Clients
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>Client details and referral code</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">Name</h3>
              <p>{clientData?.name || "N/A"}</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Email</h3>
              <p>{clientData?.email || "N/A"}</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Phone</h3>
              <p>{clientData?.phone || "N/A"}</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Status</h3>
              <Badge 
                variant={clientData?.status === "ACTIVE" ? "success" : "secondary"}
              >
                {clientData?.status || "N/A"}
              </Badge>
            </div>
            <Separator />
            <div>
              <h3 className="font-medium mb-2">Referral Code</h3>
              {clientData?.referralCode ? (
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="px-3 py-1 text-base">
                    {clientData.referralCode}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(clientData.referralCode || "");
                      toast({
                        title: "Copied to Clipboard",
                        description: "Referral code has been copied to clipboard.",
                      });
                    }}
                  >
                    <Icons.copy className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <span className="text-muted-foreground">No referral code</span>
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleGenerateReferralCode}
                disabled={generateReferralCodeMutation.isLoading}
              >
                {generateReferralCodeMutation.isLoading ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Icons.refresh className="mr-2 h-4 w-4" />
                    {clientData?.referralCode ? "Regenerate Code" : "Generate Code"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Organization Settings</CardTitle>
            <CardDescription>Customize organization settings and features</CardDescription>
          </CardHeader>
          <CardContent>
            {settings ? (
              <Tabs defaultValue="branding">
                <TabsList className="mb-4">
                  <TabsTrigger value="branding">Branding</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="communication">Communication</TabsTrigger>
                  <TabsTrigger value="privacy">Privacy</TabsTrigger>
                  <TabsTrigger value="billing">Billing</TabsTrigger>
                </TabsList>

                {/* Branding Settings */}
                <TabsContent value="branding" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={settings.branding.primaryColor}
                          onChange={(e) => handleSettingChange('branding', 'primaryColor', e.target.value)}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={settings.branding.primaryColor}
                          onChange={(e) => handleSettingChange('branding', 'primaryColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor">Secondary Color</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={settings.branding.secondaryColor}
                          onChange={(e) => handleSettingChange('branding', 'secondaryColor', e.target.value)}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={settings.branding.secondaryColor}
                          onChange={(e) => handleSettingChange('branding', 'secondaryColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logoUrl">Logo URL</Label>
                      <Input
                        id="logoUrl"
                        placeholder="https://example.com/logo.png"
                        value={settings.branding.logoUrl || ""}
                        onChange={(e) => handleSettingChange('branding', 'logoUrl', e.target.value || null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="favicon">Favicon URL</Label>
                      <Input
                        id="favicon"
                        placeholder="https://example.com/favicon.ico"
                        value={settings.branding.favicon || ""}
                        onChange={(e) => handleSettingChange('branding', 'favicon', e.target.value || null)}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Features Settings */}
                <TabsContent value="features" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between space-x-2">
                      <div>
                        <Label htmlFor="enableReferrals" className="block mb-1">Enable Referrals</Label>
                        <p className="text-sm text-muted-foreground">Allow clients to use referral codes</p>
                      </div>
                      <Switch
                        id="enableReferrals"
                        checked={settings.features.enableReferrals}
                        onCheckedChange={(checked) => handleSettingChange('features', 'enableReferrals', checked)}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between space-x-2">
                      <div>
                        <Label htmlFor="enableActivityLogs" className="block mb-1">Enable Activity Logs</Label>
                        <p className="text-sm text-muted-foreground">Track user activity within the platform</p>
                      </div>
                      <Switch
                        id="enableActivityLogs"
                        checked={settings.features.enableActivityLogs}
                        onCheckedChange={(checked) => handleSettingChange('features', 'enableActivityLogs', checked)}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between space-x-2">
                      <div>
                        <Label htmlFor="enablePerformanceReports" className="block mb-1">Enable Performance Reports</Label>
                        <p className="text-sm text-muted-foreground">Generate performance reports for this client</p>
                      </div>
                      <Switch
                        id="enablePerformanceReports"
                        checked={settings.features.enablePerformanceReports}
                        onCheckedChange={(checked) => handleSettingChange('features', 'enablePerformanceReports', checked)}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between space-x-2">
                      <div>
                        <Label htmlFor="enableNotifications" className="block mb-1">Enable Notifications</Label>
                        <p className="text-sm text-muted-foreground">Send system notifications to this client</p>
                      </div>
                      <Switch
                        id="enableNotifications"
                        checked={settings.features.enableNotifications}
                        onCheckedChange={(checked) => handleSettingChange('features', 'enableNotifications', checked)}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Communication Settings */}
                <TabsContent value="communication" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emailFooter">Email Footer</Label>
                      <Textarea
                        id="emailFooter"
                        placeholder="Email footer text"
                        value={settings.communication.emailFooter || ""}
                        onChange={(e) => handleSettingChange('communication', 'emailFooter', e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailReplyTo">Reply-To Email</Label>
                      <Input
                        id="emailReplyTo"
                        type="email"
                        placeholder="reply@example.com"
                        value={settings.communication.emailReplyTo || ""}
                        onChange={(e) => handleSettingChange('communication', 'emailReplyTo', e.target.value || null)}
                      />
                    </div>
                    <Separator />
                    <div>
                      <h3 className="font-medium mb-2">Notification Preferences</h3>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center justify-between space-x-2">
                          <Label htmlFor="emailNotifications">Email Notifications</Label>
                          <Switch
                            id="emailNotifications"
                            checked={settings.communication.notificationPreferences.email}
                            onCheckedChange={(checked) => {
                              if (!settings.communication.notificationPreferences) {
                                handleSettingChange('communication', 'notificationPreferences', { email: checked, inApp: true });
                              } else {
                                handleSettingChange('communication', 'notificationPreferences', {
                                  ...settings.communication.notificationPreferences,
                                  email: checked
                                });
                              }
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                          <Label htmlFor="inAppNotifications">In-App Notifications</Label>
                          <Switch
                            id="inAppNotifications"
                            checked={settings.communication.notificationPreferences.inApp}
                            onCheckedChange={(checked) => {
                              if (!settings.communication.notificationPreferences) {
                                handleSettingChange('communication', 'notificationPreferences', { email: true, inApp: checked });
                              } else {
                                handleSettingChange('communication', 'notificationPreferences', {
                                  ...settings.communication.notificationPreferences,
                                  inApp: checked
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Privacy Settings */}
                <TabsContent value="privacy" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between space-x-2">
                      <div>
                        <Label htmlFor="dataSharingEnabled" className="block mb-1">Data Sharing</Label>
                        <p className="text-sm text-muted-foreground">Allow data to be shared with third parties</p>
                      </div>
                      <Switch
                        id="dataSharingEnabled"
                        checked={settings.privacy.dataSharingEnabled}
                        onCheckedChange={(checked) => handleSettingChange('privacy', 'dataSharingEnabled', checked)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="retentionPeriodDays">Data Retention Period (Days)</Label>
                      <Input
                        id="retentionPeriodDays"
                        type="number"
                        min="30"
                        max="3650"
                        value={settings.privacy.retentionPeriodDays}
                        onChange={(e) => handleSettingChange('privacy', 'retentionPeriodDays', parseInt(e.target.value, 10))}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Billing Settings */}
                <TabsContent value="billing" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentTerms">Payment Terms</Label>
                      <Input
                        id="paymentTerms"
                        placeholder="net30"
                        value={settings.billing.paymentTerms}
                        onChange={(e) => handleSettingChange('billing', 'paymentTerms', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxRate">Tax Rate (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={settings.billing.taxRate}
                        onChange={(e) => handleSettingChange('billing', 'taxRate', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setSettings(JSON.parse(JSON.stringify(originalSettings)));
              }}
              disabled={!hasChanges || updateSettingsMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={!hasChanges || updateSettingsMutation.isLoading}
            >
              {updateSettingsMutation.isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 