import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Bot, Check, Copy, ExternalLink, Info, RefreshCw, Save, Settings, Trash2, Webhook } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Types
type BotStatus = 'online' | 'offline' | 'error' | 'connecting';
type Platform = 'discord' | 'telegram';

interface ConnectedGroup {
  id: string;
  name: string;
  memberCount: number;
  isMonitored: boolean;
  lastSynced?: Date;
}

interface BotConfig {
  token: string;
  username?: string;
  webhookUrl?: string;
  commandPrefix?: string;
  autoRespond: boolean;
  notificationsEnabled: boolean;
  monitored: boolean;
  status: BotStatus;
  connectedGroups: ConnectedGroup[];
}

interface BotSettingsPanelProps {
  discordConfig?: BotConfig;
  telegramConfig?: BotConfig;
  isLoading?: boolean;
  onSaveDiscordConfig?: (config: BotConfig) => Promise<void>;
  onSaveTelegramConfig?: (config: BotConfig) => Promise<void>;
  onRemoveGroup?: (platform: Platform, groupId: string) => Promise<void>;
  onRefreshGroups?: (platform: Platform) => Promise<void>;
  onGenerateWebhook?: (platform: Platform) => Promise<string>;
}

export function BotSettingsPanel({
  discordConfig,
  telegramConfig,
  isLoading = false,
  onSaveDiscordConfig,
  onSaveTelegramConfig,
  onRemoveGroup,
  onRefreshGroups,
  onGenerateWebhook,
}: BotSettingsPanelProps) {
  const defaultDiscordConfig: BotConfig = {
    token: '',
    commandPrefix: '!',
    autoRespond: true,
    notificationsEnabled: true,
    monitored: true,
    status: 'offline',
    connectedGroups: [],
  };

  const defaultTelegramConfig: BotConfig = {
    token: '',
    commandPrefix: '/',
    autoRespond: true,
    notificationsEnabled: true,
    monitored: true,
    status: 'offline',
    connectedGroups: [],
  };

  const [activeTab, setActiveTab] = React.useState<Platform>('discord');
  const [editedDiscordConfig, setEditedDiscordConfig] = React.useState<BotConfig>(
    discordConfig || defaultDiscordConfig
  );
  const [editedTelegramConfig, setEditedTelegramConfig] = React.useState<BotConfig>(
    telegramConfig || defaultTelegramConfig
  );
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [lastSavedTime, setLastSavedTime] = React.useState<Date | null>(null);

  // Update edited configs when props change
  React.useEffect(() => {
    if (discordConfig) {
      setEditedDiscordConfig(discordConfig);
    }
    if (telegramConfig) {
      setEditedTelegramConfig(telegramConfig);
    }
  }, [discordConfig, telegramConfig]);

  // Get current config based on active platform
  const currentConfig = activeTab === 'discord' ? editedDiscordConfig : editedTelegramConfig;

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as Platform);
  };

  // Handle text input changes for discord
  const handleDiscordInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedDiscordConfig(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle text input changes for telegram
  const handleTelegramInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedTelegramConfig(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle switch changes for discord
  const handleDiscordSwitchChange = (name: string, checked: boolean) => {
    setEditedDiscordConfig(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  // Handle switch changes for telegram
  const handleTelegramSwitchChange = (name: string, checked: boolean) => {
    setEditedTelegramConfig(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  // Handle group monitoring toggle
  const handleGroupMonitoringToggle = (groupId: string, checked: boolean) => {
    if (activeTab === 'discord') {
      setEditedDiscordConfig(prev => ({
        ...prev,
        connectedGroups: prev.connectedGroups.map(group => 
          group.id === groupId ? { ...group, isMonitored: checked } : group
        ),
      }));
    } else {
      setEditedTelegramConfig(prev => ({
        ...prev,
        connectedGroups: prev.connectedGroups.map(group => 
          group.id === groupId ? { ...group, isMonitored: checked } : group
        ),
      }));
    }
  };

  // Handle remove group
  const handleRemoveGroup = async (groupId: string) => {
    if (!onRemoveGroup) return;
    
    try {
      await onRemoveGroup(activeTab, groupId);
      
      // Update local state to remove the group
      if (activeTab === 'discord') {
        setEditedDiscordConfig(prev => ({
          ...prev,
          connectedGroups: prev.connectedGroups.filter(group => group.id !== groupId),
        }));
      } else {
        setEditedTelegramConfig(prev => ({
          ...prev,
          connectedGroups: prev.connectedGroups.filter(group => group.id !== groupId),
        }));
      }
    } catch (error) {
      console.error(`Failed to remove ${activeTab} group:`, error);
    }
  };

  // Handle refresh groups
  const handleRefreshGroups = async () => {
    if (!onRefreshGroups) return;
    
    setIsRefreshing(true);
    try {
      await onRefreshGroups(activeTab);
    } catch (error) {
      console.error(`Failed to refresh ${activeTab} groups:`, error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Generate webhook
  const handleGenerateWebhook = async () => {
    if (!onGenerateWebhook) return;
    
    setIsGenerating(true);
    try {
      const webhookUrl = await onGenerateWebhook(activeTab);
      
      if (activeTab === 'discord') {
        setEditedDiscordConfig(prev => ({
          ...prev,
          webhookUrl,
        }));
      } else {
        setEditedTelegramConfig(prev => ({
          ...prev,
          webhookUrl,
        }));
      }
    } catch (error) {
      console.error(`Failed to generate ${activeTab} webhook:`, error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy webhook to clipboard
  const handleCopyWebhook = () => {
    const webhookUrl = activeTab === 'discord' 
      ? editedDiscordConfig.webhookUrl 
      : editedTelegramConfig.webhookUrl;
    
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl);
    }
  };

  // Save config changes
  const handleSaveConfig = async () => {
    setIsSaving(true);
    
    try {
      if (activeTab === 'discord' && onSaveDiscordConfig) {
        await onSaveDiscordConfig(editedDiscordConfig);
      } else if (activeTab === 'telegram' && onSaveTelegramConfig) {
        await onSaveTelegramConfig(editedTelegramConfig);
      }
      
      setLastSavedTime(new Date());
    } catch (error) {
      console.error(`Failed to save ${activeTab} config:`, error);
    } finally {
      setIsSaving(false);
    }
  };

  // Get status indicator class
  const getStatusIndicator = (status: BotStatus) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-amber-500';
      case 'error':
        return 'bg-red-500';
      case 'offline':
      default:
        return 'bg-gray-400';
    }
  };

  // Get status text
  const getStatusText = (status: BotStatus) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'connecting':
        return 'Connecting';
      case 'error':
        return 'Error';
      case 'offline':
      default:
        return 'Offline';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <CardTitle>Bot Settings</CardTitle>
        </div>
        <CardDescription>
          Configure and manage your Discord and Telegram bots
        </CardDescription>
      </CardHeader>
      
      <div className="px-6">
        <Tabs defaultValue="discord" onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="discord" className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.393-.44.883-.608 1.27-.184-.028-3.65-.028-3.83 0-.169-.388-.4-.877-.61-1.27a.077.077 0 0 0-.079-.036c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055c1.903 1.392 3.754 2.23 5.563 2.79a.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106c-.605-.229-1.19-.504-1.746-.82a.077.077 0 0 1-.008-.128c.118-.088.236-.18.348-.272a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.112.093.23.184.347.272a.077.077 0 0 1-.006.127 9.49 9.49 0 0 1-1.747.82.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028c1.818-.56 3.67-1.399 5.573-2.79a.077.077 0 0 0 .031-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
              </svg>
              Discord Bot
            </TabsTrigger>
            <TabsTrigger value="telegram" className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-2.88-1.92-2.88-1.92-2.88-1.92.85-.5 1.36-1.8 1.36-1.8.7-1.55-1.32.13-1.32.13l-4.3 2.63c-.65.38-1.3-.13-1.7-.58 2.46-1.88 4.9-3.75 7.38-5.63.6-.5 1.8-.94 2.53-.42.18.17.29.39.32.65z" />
              </svg>
              Telegram Bot
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="discord" className="mt-4 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${getStatusIndicator(editedDiscordConfig.status)}`} />
                <span className="text-sm font-medium">
                  Status: {getStatusText(editedDiscordConfig.status)}
                </span>
                {editedDiscordConfig.username && (
                  <Badge variant="outline" className="ml-2">
                    {editedDiscordConfig.username}
                  </Badge>
                )}
              </div>
              
              {lastSavedTime && activeTab === 'discord' && (
                <span className="text-xs text-muted-foreground">
                  Last saved: {lastSavedTime.toLocaleTimeString()}
                </span>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="discord-token">Bot Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="discord-token"
                    name="token"
                    value={editedDiscordConfig.token}
                    onChange={handleDiscordInputChange}
                    type="password"
                    placeholder="Enter your Discord bot token"
                    className="flex-1"
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="h-10 w-10">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-80">
                        <p className="text-xs">
                          Create a Discord bot and get your token from the Discord Developer Portal. 
                          <a 
                            href="https://discord.com/developers/applications" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-primary gap-1 mt-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Discord Developer Portal</span>
                          </a>
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="discord-command-prefix">Command Prefix</Label>
                <Input
                  id="discord-command-prefix"
                  name="commandPrefix"
                  value={editedDiscordConfig.commandPrefix}
                  onChange={handleDiscordInputChange}
                  placeholder="!"
                  className="w-full max-w-20"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="discord-webhook">Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="discord-webhook"
                    name="webhookUrl"
                    value={editedDiscordConfig.webhookUrl || ''}
                    onChange={handleDiscordInputChange}
                    placeholder="Webhook URL for receiving events"
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    className="gap-1"
                    onClick={handleGenerateWebhook}
                    disabled={isGenerating}
                  >
                    <Webhook className="h-4 w-4" />
                    <span>Generate</span>
                  </Button>
                  {editedDiscordConfig.webhookUrl && (
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleCopyWebhook}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Add this webhook URL to your Discord bot's configuration to receive events
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="discord-auto-respond">Auto-Respond to Commands</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically respond to user commands in Discord
                    </p>
                  </div>
                  <Switch
                    id="discord-auto-respond"
                    checked={editedDiscordConfig.autoRespond}
                    onCheckedChange={(checked) => handleDiscordSwitchChange('autoRespond', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="discord-notifications">Enable Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive notifications about important events
                    </p>
                  </div>
                  <Switch
                    id="discord-notifications"
                    checked={editedDiscordConfig.notificationsEnabled}
                    onCheckedChange={(checked) => handleDiscordSwitchChange('notificationsEnabled', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="discord-monitored">Monitor Bot Activity</Label>
                    <p className="text-xs text-muted-foreground">
                      Track bot usage and performance metrics
                    </p>
                  </div>
                  <Switch
                    id="discord-monitored"
                    checked={editedDiscordConfig.monitored}
                    onCheckedChange={(checked) => handleDiscordSwitchChange('monitored', checked)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="telegram" className="mt-4 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${getStatusIndicator(editedTelegramConfig.status)}`} />
                <span className="text-sm font-medium">
                  Status: {getStatusText(editedTelegramConfig.status)}
                </span>
                {editedTelegramConfig.username && (
                  <Badge variant="outline" className="ml-2">
                    {editedTelegramConfig.username}
                  </Badge>
                )}
              </div>
              
              {lastSavedTime && activeTab === 'telegram' && (
                <span className="text-xs text-muted-foreground">
                  Last saved: {lastSavedTime.toLocaleTimeString()}
                </span>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="telegram-token">Bot Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="telegram-token"
                    name="token"
                    value={editedTelegramConfig.token}
                    onChange={handleTelegramInputChange}
                    type="password"
                    placeholder="Enter your Telegram bot token"
                    className="flex-1"
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="h-10 w-10">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-80">
                        <p className="text-xs">
                          Create a Telegram bot and get your token from BotFather.
                          <a 
                            href="https://core.telegram.org/bots#creating-a-new-bot" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-primary gap-1 mt-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>How to create a Telegram bot</span>
                          </a>
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="telegram-command-prefix">Command Prefix</Label>
                <Input
                  id="telegram-command-prefix"
                  name="commandPrefix"
                  value={editedTelegramConfig.commandPrefix}
                  onChange={handleTelegramInputChange}
                  placeholder="/"
                  className="w-full max-w-20"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="telegram-webhook">Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="telegram-webhook"
                    name="webhookUrl"
                    value={editedTelegramConfig.webhookUrl || ''}
                    onChange={handleTelegramInputChange}
                    placeholder="Webhook URL for receiving events"
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    className="gap-1"
                    onClick={handleGenerateWebhook}
                    disabled={isGenerating}
                  >
                    <Webhook className="h-4 w-4" />
                    <span>Generate</span>
                  </Button>
                  {editedTelegramConfig.webhookUrl && (
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleCopyWebhook}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Configure this webhook URL in your application to receive events from Telegram
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="telegram-auto-respond">Auto-Respond to Commands</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically respond to user commands in Telegram
                    </p>
                  </div>
                  <Switch
                    id="telegram-auto-respond"
                    checked={editedTelegramConfig.autoRespond}
                    onCheckedChange={(checked) => handleTelegramSwitchChange('autoRespond', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="telegram-notifications">Enable Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive notifications about important events
                    </p>
                  </div>
                  <Switch
                    id="telegram-notifications"
                    checked={editedTelegramConfig.notificationsEnabled}
                    onCheckedChange={(checked) => handleTelegramSwitchChange('notificationsEnabled', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="telegram-monitored">Monitor Bot Activity</Label>
                    <p className="text-xs text-muted-foreground">
                      Track bot usage and performance metrics
                    </p>
                  </div>
                  <Switch
                    id="telegram-monitored"
                    checked={editedTelegramConfig.monitored}
                    onCheckedChange={(checked) => handleTelegramSwitchChange('monitored', checked)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Separator className="my-4" />
      
      <div className="px-6 pb-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Connected Groups</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshGroups}
            disabled={isRefreshing || isLoading}
            className="h-8 gap-1 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
        
        {currentConfig.connectedGroups.length === 0 ? (
          <div className="text-center p-6 bg-muted/50 rounded-md">
            <Bot className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <h4 className="text-sm font-medium mb-1">No Groups Connected</h4>
            <p className="text-xs text-muted-foreground mb-3">
              {activeTab === 'discord' 
                ? 'Add your bot to Discord servers to start monitoring them' 
                : 'Add your bot to Telegram groups to start monitoring them'}
            </p>
            <Button asChild variant="outline" size="sm" className="gap-1">
              <a 
                href={activeTab === 'discord' 
                  ? 'https://discord.com/api/oauth2/authorize' 
                  : 'https://telegram.me/botfather'
                } 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>
                  {activeTab === 'discord' ? 'Add to Discord' : 'Create Bot with BotFather'}
                </span>
              </a>
            </Button>
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <ScrollArea className="h-[260px]">
              <div className="divide-y">
                {currentConfig.connectedGroups.map(group => (
                  <div key={group.id} className="flex items-center justify-between p-3 hover:bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <span className="font-medium text-sm truncate">{group.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {group.memberCount} members
                        </Badge>
                      </div>
                      
                      {group.lastSynced && (
                        <p className="text-xs text-muted-foreground">
                          Last synced: {new Date(group.lastSynced).toLocaleString()}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <Label 
                          htmlFor={`monitor-${group.id}`}
                          className="text-xs font-normal cursor-pointer"
                        >
                          Monitor
                        </Label>
                        <Switch
                          id={`monitor-${group.id}`}
                          checked={group.isMonitored}
                          onCheckedChange={(checked) => handleGroupMonitoringToggle(group.id, checked)}
                          className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
                        />
                      </div>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveGroup(group.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Remove group</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        
        {(activeTab === 'discord' && !editedDiscordConfig.token) || 
         (activeTab === 'telegram' && !editedTelegramConfig.token) ? (
          <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Please enter a bot token to continue
            </AlertDescription>
          </Alert>
        ) : null}
      </div>
      
      <CardFooter className="justify-end pt-2">
        <Button
          onClick={handleSaveConfig}
          disabled={isSaving || isLoading || 
            (activeTab === 'discord' && !editedDiscordConfig.token) || 
            (activeTab === 'telegram' && !editedTelegramConfig.token)}
          className="gap-1"
        >
          {isSaving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>Save Changes</span>
        </Button>
      </CardFooter>
    </Card>
  );
} 