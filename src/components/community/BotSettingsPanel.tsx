'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Settings,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Clock,
  MessageSquare,
  Shield,
  Filter,
  Zap,
  HelpCircle,
  Webhook,
  BrainCircuit,
  TestTube,
  Sparkles,
  AlertCircle,
  Check,
  ClipboardCopy,
  Edit,
  Loader2,
  RotateCw,
  X
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  XCircle,
  Globe,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { MessageSquare as MessageSquareIcon, Send, Bell } from 'lucide-react';

interface CommandSetting {
  name: string;
  enabled: boolean;
  description: string;
  cooldown?: number;
  permissions?: string[];
}

interface AutoModSetting {
  type: string;
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
  actions: ('warn' | 'timeout' | 'kick' | 'ban')[];
}

interface PlatformSettings {
  enabled: boolean;
  token?: string;
  prefix: string;
  autoModeration: {
    enabled: boolean;
    settings: AutoModSetting[];
  };
  commands: CommandSetting[];
  webhookUrl?: string;
  welcomeMessage?: string;
  autoRoles?: string[];
  responseDelay: number;
  aiPersonality: string;
  aiEnabled: boolean;
  connected: boolean;
  connectedSince?: string;
  autoRespond: boolean;
  status?: 'online' | 'offline' | 'error';
  statusMessage?: string;
}

interface BotConfig {
  id: string;
  name: string;
  platform: BotPlatform;
  avatar?: string;
  isActive: boolean;
  token?: string;
  webhookUrl?: string;
  commandPrefix?: string;
  groups: {
    id: string;
    name: string;
    isActive: boolean;
    memberCount?: number;
  }[];
  features: {
    keywordMonitoring: boolean;
    userTracking: boolean;
    autoResponders: boolean;
    moderationTools: boolean;
    analytics: boolean;
  };
  keywords: string[];
  autoResponders: {
    id: string;
    trigger: string;
    response: string;
    isActive: boolean;
  }[];
  lastSynced?: Date;
}

export enum BotPlatform {
  DISCORD = 'discord',
  TELEGRAM = 'telegram'
}

export interface BotSettingsPanelProps {
  bots: BotConfig[];
  isLoading?: boolean;
  onSave?: (botConfig: BotConfig) => Promise<void>;
  onSyncGroups?: (botId: string) => Promise<void>;
  onAddBot?: (platform: BotPlatform) => void;
  onDeleteBot?: (botId: string) => Promise<void>;
  className?: string;
}

// Define form schemas
const discordBotSchema = z.object({
  botToken: z.string().min(1, 'Bot token is required'),
  prefix: z.string().min(1, 'Command prefix is required'),
  automodEnabled: z.boolean().default(false),
  welcomeEnabled: z.boolean().default(true),
  welcomeMessage: z.string().optional(),
  restrictedCommands: z.string().optional(),
  customCommands: z.string().optional(),
});

const telegramBotSchema = z.object({
  botToken: z.string().min(1, 'Bot token is required'),
  botUsername: z.string().min(1, 'Bot username is required'),
  automodEnabled: z.boolean().default(false),
  welcomeEnabled: z.boolean().default(true),
  welcomeMessage: z.string().optional(),
  customCommands: z.string().optional(),
});

type DiscordBotSettings = z.infer<typeof discordBotSchema>;
type TelegramBotSettings = z.infer<typeof telegramBotSchema>;

export function BotSettingsPanel({
  bots = [],
  isLoading = false,
  onSave,
  onSyncGroups,
  onAddBot,
  onDeleteBot,
  className,
}: BotSettingsPanelProps) {
  const [activeBot, setActiveBot] = React.useState<BotConfig | null>(bots[0] || null);
  const [editedBot, setEditedBot] = React.useState<BotConfig | null>(activeBot);
  const [activeTab, setActiveTab] = React.useState<string>('general');
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [isSyncing, setIsSyncing] = React.useState<boolean>(false);
  const [newKeyword, setNewKeyword] = React.useState<string>('');
  const [newResponder, setNewResponder] = React.useState<{trigger: string, response: string}>({
    trigger: '',
    response: ''
  });
  const [settings, setSettings] = useState<Record<BotPlatform, PlatformSettings>>(defaultSettings);
  const [activePlatform, setActivePlatform] = useState<BotPlatform>(BotPlatform.DISCORD);
  
  // Update edited bot when active bot changes
  React.useEffect(() => {
    if (activeBot) {
      setEditedBot(JSON.parse(JSON.stringify(activeBot)));
    }
  }, [activeBot]);
  
  // Update active bot when bots prop changes
  React.useEffect(() => {
    if (bots.length > 0) {
      const currentActiveBot = bots.find(b => activeBot && b.id === activeBot.id);
      setActiveBot(currentActiveBot || bots[0]);
    } else {
      setActiveBot(null);
      setEditedBot(null);
    }
  }, [bots, activeBot]);
  
  // Handle bot change
  const handleBotChange = (botId: string) => {
    const bot = bots.find(b => b.id === botId);
    if (bot) {
      setActiveBot(bot);
    }
  };
  
  // Handle save
  const handleSave = async () => {
    if (!editedBot || !onSave) return;
    
    try {
      setIsSaving(true);
      await onSave(editedBot);
    } catch (error) {
      console.error('Failed to save bot configuration:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle sync groups
  const handleSyncGroups = async () => {
    if (!activeBot || !onSyncGroups) return;
    
    try {
      setIsSyncing(true);
      await onSyncGroups(activeBot.id);
    } catch (error) {
      console.error('Failed to sync groups:', error);
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Handle delete bot
  const handleDeleteBot = async () => {
    if (!activeBot || !onDeleteBot) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete the bot "${activeBot.name}"? This action cannot be undone.`);
    if (!confirmed) return;
    
    try {
      await onDeleteBot(activeBot.id);
    } catch (error) {
      console.error('Failed to delete bot:', error);
    }
  };
  
  // Add keyword
  const addKeyword = () => {
    if (!editedBot || !newKeyword.trim()) return;
    
    setEditedBot({
      ...editedBot,
      keywords: [...(editedBot.keywords || []), newKeyword.trim()]
    });
    
    setNewKeyword('');
  };
  
  // Remove keyword
  const removeKeyword = (keyword: string) => {
    if (!editedBot) return;
    
    setEditedBot({
      ...editedBot,
      keywords: (editedBot.keywords || []).filter(k => k !== keyword)
    });
  };
  
  // Add auto responder
  const addAutoResponder = () => {
    if (!editedBot || !newResponder.trigger.trim() || !newResponder.response.trim()) return;
    
    const newId = Date.now().toString();
    
    setEditedBot({
      ...editedBot,
      autoResponders: [
        ...(editedBot.autoResponders || []),
        {
          id: newId,
          trigger: newResponder.trigger.trim(),
          response: newResponder.response.trim(),
          isActive: true
        }
      ]
    });
    
    setNewResponder({ trigger: '', response: '' });
  };
  
  // Remove auto responder
  const removeAutoResponder = (id: string) => {
    if (!editedBot) return;
    
    setEditedBot({
      ...editedBot,
      autoResponders: (editedBot.autoResponders || []).filter(r => r.id !== id)
    });
  };
  
  // Toggle auto responder
  const toggleAutoResponder = (id: string, isActive: boolean) => {
    if (!editedBot) return;
    
    setEditedBot({
      ...editedBot,
      autoResponders: (editedBot.autoResponders || []).map(r => 
        r.id === id ? { ...r, isActive } : r
      )
    });
  };
  
  // Toggle group
  const toggleGroup = (groupId: string, isActive: boolean) => {
    if (!editedBot) return;
    
    setEditedBot({
      ...editedBot,
      groups: (editedBot.groups || []).map(g =>
        g.id === groupId ? { ...g, isActive } : g
      )
    });
  };
  
  // Toggle feature
  const toggleFeature = (feature: keyof BotConfig['features'], value: boolean) => {
    if (!editedBot) return;
    
    setEditedBot({
      ...editedBot,
      features: {
        ...editedBot.features,
        [feature]: value
      }
    });
  };
  
  // Render loading skeleton
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="h-6 w-40 bg-muted animate-pulse rounded mb-1" />
          <div className="h-4 w-60 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-10 w-full bg-muted animate-pulse rounded mb-6" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-muted animate-pulse rounded" />
            <div className="h-24 bg-muted animate-pulse rounded" />
            <div className="h-24 bg-muted animate-pulse rounded" />
            <div className="h-24 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // If no bots
  if (bots.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Bot Settings
          </CardTitle>
          <CardDescription>
            Configure and manage your community bots
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Bot className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No bots configured</p>
          <p className="text-sm text-muted-foreground/80 max-w-md mt-1 mb-6">
            Add a Discord or Telegram bot to start monitoring your communities
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              className="gap-2"
              onClick={() => onAddBot?.(BotPlatform.DISCORD)}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9857 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
              </svg>
              Add Discord Bot
            </Button>
            <Button 
              variant="outline"
              className="gap-2"
              onClick={() => onAddBot?.(BotPlatform.TELEGRAM)}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0Zm5.568 8.16c-.18 1.896-.96 6.504-1.356 8.628-.168.9-.504 1.2-.816 1.236-.696.06-1.224-.456-1.896-.9-1.056-.696-1.656-1.128-2.676-1.8-1.188-.78-.42-1.212.264-1.908.18-.18 3.252-2.976 3.312-3.228a.24.24 0 0 0-.06-.216c-.072-.06-.168-.036-.252-.024-.108.024-1.788 1.14-5.064 3.348-.48.324-.912.492-1.296.48-.432-.012-1.248-.24-1.86-.444-.756-.24-1.344-.372-1.296-.792.024-.216.324-.432.888-.66 3.504-1.524 5.832-2.532 6.996-3.012 3.336-1.392 4.02-1.632 4.476-1.632.096 0 .324.024.468.144.12.096.156.228.168.324-.012.072.012.288 0 .324Z" />
              </svg>
              Add Telegram Bot
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render bot settings
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Bot Settings
        </CardTitle>
        <CardDescription>
          Configure and manage your community bots
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Bot Selector */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <Select value={activeBot?.id} onValueChange={handleBotChange}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select a bot" />
            </SelectTrigger>
            <SelectContent>
              {bots.map(bot => (
                <SelectItem key={bot.id} value={bot.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={bot.avatar} alt={bot.name} />
                      <AvatarFallback className="bg-primary/10 text-xs">
                        {bot.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{bot.name}</span>
                    <Badge variant={bot.platform === BotPlatform.DISCORD ? 'secondary' : 'default'} className="ml-2 capitalize text-xs">
                      {bot.platform}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => onAddBot?.(BotPlatform.DISCORD)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Bot
            </Button>
            {editedBot && activeBot && JSON.stringify(editedBot) !== JSON.stringify(activeBot) && (
              <Button 
                variant="default" 
                size="sm" 
                className="gap-1"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className={`h-3.5 w-3.5 ${isSaving ? 'animate-pulse' : ''}`} />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </div>
        
        {editedBot && (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="groups">Groups</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="responses">Auto Responses</TabsTrigger>
              </TabsList>
              
              {/* General Settings */}
              <TabsContent value="general" className="py-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={editedBot.avatar} alt={editedBot.name} />
                        <AvatarFallback className="text-xl">
                          {editedBot.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="space-y-1.5">
                          <Label htmlFor="botName">Bot Name</Label>
                          <Input 
                            id="botName" 
                            value={editedBot.name}
                            onChange={(e) => setEditedBot({...editedBot, name: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="avatarUrl">Avatar URL</Label>
                      <Input 
                        id="avatarUrl" 
                        placeholder="https://example.com/avatar.png"
                        value={editedBot.avatar || ''}
                        onChange={(e) => setEditedBot({...editedBot, avatar: e.target.value})}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="botActive" 
                        checked={editedBot.isActive}
                        onCheckedChange={(checked) => setEditedBot({...editedBot, isActive: checked})}
                      />
                      <Label htmlFor="botActive">Bot Active</Label>
                    </div>
                  </div>
                  
                  {/* API Configuration */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="botToken">
                        Bot Token
                        <span className="text-muted-foreground ml-1 text-xs">(stored securely)</span>
                      </Label>
                      <div className="flex">
                        <Input 
                          id="botToken" 
                          type="password"
                          placeholder="••••••••••••••••••••••"
                          value={editedBot.token || ''}
                          onChange={(e) => setEditedBot({...editedBot, token: e.target.value})}
                          className="flex-1 rounded-r-none"
                        />
                        <Button variant="outline" className="rounded-l-none" onClick={() => {}}>
                          <ClipboardCopy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {editedBot.platform === BotPlatform.DISCORD && (
                      <div className="space-y-1.5">
                        <Label htmlFor="webhookUrl">Webhook URL</Label>
                        <Input 
                          id="webhookUrl" 
                          placeholder="https://discord.com/api/webhooks/..."
                          value={editedBot.webhookUrl || ''}
                          onChange={(e) => setEditedBot({...editedBot, webhookUrl: e.target.value})}
                        />
                      </div>
                    )}
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="commandPrefix">Command Prefix</Label>
                      <Input 
                        id="commandPrefix" 
                        placeholder="!"
                        value={editedBot.commandPrefix || ''}
                        onChange={(e) => setEditedBot({...editedBot, commandPrefix: e.target.value})}
                        className="w-20"
                      />
                    </div>
                    
                    <div className="mt-8 pt-4 border-t flex justify-between">
                      <div className="text-sm text-muted-foreground">
                        {editedBot.lastSynced ? (
                          <>Last synced: {new Date(editedBot.lastSynced).toLocaleString()}</>
                        ) : (
                          <>Never synced</>
                        )}
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        className="gap-1"
                        onClick={handleDeleteBot}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete Bot
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Groups Tab */}
              <TabsContent value="groups" className="py-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Connected Groups</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1"
                    onClick={handleSyncGroups}
                    disabled={isSyncing}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync Groups'}
                  </Button>
                </div>
                
                {editedBot.groups.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg">
                    <p className="text-muted-foreground">No groups found</p>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                      Click "Sync Groups" to fetch the latest groups for this bot
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1"
                      onClick={handleSyncGroups}
                      disabled={isSyncing}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      Sync Groups
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-[340px] pr-4">
                    <div className="space-y-2">
                      {editedBot.groups.map(group => (
                        <div 
                          key={group.id} 
                          className={`flex items-center justify-between p-3 rounded-lg border ${group.isActive ? 'bg-secondary/20' : ''}`}
                        >
                          <div className="flex-1">
                            <div className="font-medium">{group.name}</div>
                            {group.memberCount !== undefined && (
                              <div className="text-sm text-muted-foreground">
                                {group.memberCount.toLocaleString()} members
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <Switch 
                              id={`group-${group.id}`} 
                              checked={group.isActive}
                              onCheckedChange={(checked) => toggleGroup(group.id, checked)}
                            />
                            <Label htmlFor={`group-${group.id}`} className="sr-only">
                              Enable {group.name}
                            </Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
              
              {/* Features Tab */}
              <TabsContent value="features" className="py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    {/* Keyword Monitoring */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            Keyword Monitoring
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Monitor messages for specific keywords
                          </p>
                        </div>
                        <Switch 
                          id="keywordMonitoring" 
                          checked={editedBot.features.keywordMonitoring}
                          onCheckedChange={(checked) => toggleFeature('keywordMonitoring', checked)}
                        />
                      </div>
                      
                      {editedBot.features.keywordMonitoring && (
                        <div className="space-y-3 pt-2">
                          <div className="flex gap-2">
                            <Input 
                              placeholder="Add a new keyword..."
                              value={newKeyword}
                              onChange={(e) => setNewKeyword(e.target.value)}
                              className="flex-1"
                            />
                            <Button variant="outline" onClick={addKeyword}>
                              Add
                            </Button>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 pt-2">
                            {(editedBot.keywords || []).map(keyword => (
                              <Badge key={keyword} variant="secondary" className="gap-1 pl-2 py-1.5">
                                {keyword}
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-4 w-4 ml-1 hover:bg-transparent" 
                                  onClick={() => removeKeyword(keyword)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))}
                            
                            {(editedBot.keywords || []).length === 0 && (
                              <div className="text-sm text-muted-foreground py-2">
                                No keywords added yet
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* User Tracking */}
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            User Tracking
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Track user joins, leaves, and activity
                          </p>
                        </div>
                        <Switch 
                          id="userTracking" 
                          checked={editedBot.features.userTracking}
                          onCheckedChange={(checked) => toggleFeature('userTracking', checked)}
                        />
                      </div>
                    </div>
                    
                    {/* Analytics */}
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium flex items-center gap-2">
                            <Layers className="h-4 w-4" />
                            Analytics
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Collect and analyze group activity metrics
                          </p>
                        </div>
                        <Switch 
                          id="analytics" 
                          checked={editedBot.features.analytics}
                          onCheckedChange={(checked) => toggleFeature('analytics', checked)}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Auto Responders */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Auto Responders
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Automatically respond to specific messages
                          </p>
                        </div>
                        <Switch 
                          id="autoResponders" 
                          checked={editedBot.features.autoResponders}
                          onCheckedChange={(checked) => toggleFeature('autoResponders', checked)}
                        />
                      </div>
                    </div>
                    
                    {/* Moderation Tools */}
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Moderation Tools
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Tools to moderate and manage group content
                          </p>
                        </div>
                        <Switch 
                          id="moderationTools" 
                          checked={editedBot.features.moderationTools}
                          onCheckedChange={(checked) => toggleFeature('moderationTools', checked)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Auto Responses Tab */}
              <TabsContent value="responses" className="py-4">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Auto Responses</h3>
                    <div>
                      {!editedBot.features.autoResponders && (
                        <Badge variant="outline" className="gap-1 text-amber-500 border-amber-200 bg-amber-50">
                          <AlertTriangle className="h-3 w-3" />
                          Enable Auto Responders in Features tab
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {editedBot.features.autoResponders && (
                    <>
                      <div className="space-y-4 border p-4 rounded-lg">
                        <h4 className="text-sm font-medium">Add New Response</h4>
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="triggerPhrase">Trigger Phrase</Label>
                            <Input 
                              id="triggerPhrase" 
                              placeholder="Enter a phrase that will trigger this response..."
                              value={newResponder.trigger}
                              onChange={(e) => setNewResponder({...newResponder, trigger: e.target.value})}
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <Label htmlFor="autoResponse">Response</Label>
                            <Textarea 
                              id="autoResponse" 
                              placeholder="Enter the response message..."
                              rows={3}
                              value={newResponder.response}
                              onChange={(e) => setNewResponder({...newResponder, response: e.target.value})}
                            />
                          </div>
                          
                          <Button 
                            className="w-full mt-2 gap-1" 
                            onClick={addAutoResponder}
                            disabled={!newResponder.trigger.trim() || !newResponder.response.trim()}
                          >
                            <PlusCircle className="h-4 w-4" />
                            Add Response
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">Current Auto Responses</h4>
                        
                        {(editedBot.autoResponders || []).length === 0 ? (
                          <div className="text-center py-6 border rounded-lg">
                            <p className="text-muted-foreground">No auto responses configured</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Add responses above to automatically reply to messages
                            </p>
                          </div>
                        ) : (
                          <ScrollArea className="h-[280px] pr-4">
                            <div className="space-y-3">
                              {(editedBot.autoResponders || []).map(responder => (
                                <div 
                                  key={responder.id} 
                                  className={`border rounded-lg p-4 ${responder.isActive ? '' : 'bg-muted/40'}`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <h5 className="font-medium">
                                      When someone says: <span className="text-primary">{responder.trigger}</span>
                                    </h5>
                                    <div className="flex items-center gap-2">
                                      <Switch 
                                        id={`responder-${responder.id}`}
                                        checked={responder.isActive}
                                        onCheckedChange={(checked) => toggleAutoResponder(responder.id, checked)}
                                      />
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        onClick={() => removeAutoResponder(responder.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-muted/40 p-3 rounded-md text-sm">
                                    {responder.response}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
} 