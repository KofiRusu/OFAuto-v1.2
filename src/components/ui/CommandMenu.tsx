'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Calendar,
  Settings,
  FileText,
  Bot,
  BarChart,
  MessageSquare,
  Brain,
  User,
  LayoutDashboard,
  HelpCircle,
  Database,
  ChevronRight,
  Search,
  Clock,
  Image as ImageIcon,
  DollarSign,
  Users,
  PlusCircle,
  Sparkles,
  Instagram,
  Twitter,
  RefreshCw,
  Plus,
  LogOut,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock recently viewed items - in a real app, this would come from browser storage or API
const recentlyViewed = [
  { 
    title: 'Weekly Stats', 
    path: '/dashboard/insights?report=weekly', 
    icon: <BarChart className="h-4 w-4" />,
    timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
  },
  { 
    title: 'Instagram Automation', 
    path: '/dashboard/automation?platform=instagram', 
    icon: <Bot className="h-4 w-4" />,
    timestamp: new Date(Date.now() - 1000 * 60 * 90) // 90 minutes ago
  },
  { 
    title: 'Content Calendar', 
    path: '/dashboard/scheduler?view=calendar', 
    icon: <Calendar className="h-4 w-4" />,
    timestamp: new Date(Date.now() - 1000 * 60 * 120) // 2 hours ago
  },
];

// Format timestamp as relative time
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  // List of connected platforms (this would typically come from a user's settings or API)
  const connectedPlatforms = [
    { name: 'OnlyFans', path: '/dashboard/credentials?platform=onlyfans', icon: <ExternalLink className="h-4 w-4" /> },
    { name: 'Instagram', path: '/dashboard/credentials?platform=instagram', icon: <Instagram className="h-4 w-4" /> },
    { name: 'Twitter', path: '/dashboard/credentials?platform=twitter', icon: <Twitter className="h-4 w-4" /> },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden shadow-lg max-w-[640px]">
        <Command className="rounded-lg" shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput 
              placeholder="Search commands, pages, content..." 
              className="border-0 focus:ring-0 focus:outline-none h-11 flex-1"
              value={query}
              onValueChange={setQuery}
            />
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium opacity-50">
              <span>⌘</span>K
            </kbd>
          </div>
          <CommandList>
            <CommandEmpty>
              <div className="py-6 text-center text-sm">
                <div className="mb-2">No results found for "{query}"</div>
                <div className="text-xs text-muted-foreground">Try searching for pages, actions, or settings</div>
              </div>
            </CommandEmpty>
            
            {recentlyViewed.length > 0 && (
              <>
                <CommandGroup heading="Recently Viewed">
                  {recentlyViewed.map((item, index) => (
                    <CommandItem
                      key={index}
                      onSelect={() => runCommand(() => router.push(item.path))}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        {item.icon}
                        <span className="ml-2">{item.title}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatRelativeTime(item.timestamp)}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}
            
            <CommandGroup heading="Navigation">
              <CommandItem
                onSelect={() => runCommand(() => router.push('/dashboard'))}
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
                <CommandShortcut>D</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push('/dashboard/scheduler'))}
              >
                <Calendar className="mr-2 h-4 w-4" />
                <span>Scheduler</span>
                <CommandShortcut>S</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push('/dashboard/insights'))}
              >
                <BarChart className="mr-2 h-4 w-4" />
                <span>Insights</span>
                <CommandShortcut>I</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push('/dashboard/content'))}
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                <span>Content Library</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push('/dashboard/messages'))}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Messages</span>
                <CommandShortcut>M</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push('/dashboard/automation'))}
              >
                <Bot className="mr-2 h-4 w-4" />
                <span>Automation</span>
                <CommandShortcut>A</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push('/dashboard/automation/dm-campaigns'))}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                <span>DM Campaigns</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push('/dashboard/strategies'))}
              >
                <Brain className="mr-2 h-4 w-4" />
                <span>AI Strategies</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push('/dashboard/clients'))}
              >
                <Users className="mr-2 h-4 w-4" />
                <span>Audience</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push('/dashboard/campaign-insights'))}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                <span>Financials</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push('/dashboard/credentials'))}
              >
                <Database className="mr-2 h-4 w-4" />
                <span>Platform Connections</span>
              </CommandItem>
            </CommandGroup>
            
            <CommandSeparator />
            
            <CommandGroup heading="Actions">
              <CommandItem
                onSelect={() => runCommand(() => router.push('/dashboard/scheduler?action=new'))}
              >
                <PlusCircle className="mr-2 h-4 w-4 text-emerald-500" />
                <span>Create New Post</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push('/dashboard/automation?action=new'))}
              >
                <PlusCircle className="mr-2 h-4 w-4 text-blue-500" />
                <span>Create New Automation</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push('/dashboard/strategies?action=new'))}
              >
                <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
                <span>Generate AI Strategy</span>
                <Badge className="ml-auto text-[10px] px-1 border-none bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">AI</Badge>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push('/dashboard/messages?action=new'))}
              >
                <PlusCircle className="mr-2 h-4 w-4 text-amber-500" />
                <span>Send New Message</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push('/dashboard/content?action=upload'))}
              >
                <PlusCircle className="mr-2 h-4 w-4 text-rose-500" />
                <span>Upload New Content</span>
              </CommandItem>
            </CommandGroup>
            
            <CommandSeparator />
            
            <CommandGroup heading="Connected Platforms">
              {connectedPlatforms.map((platform, index) => (
                <CommandItem
                  key={index}
                  onSelect={() => runCommand(() => router.push(platform.path))}
                >
                  {platform.icon}
                  <span className="ml-2">{platform.name}</span>
                  <CommandShortcut>
                    <RefreshCw className="h-3 w-3" />
                  </CommandShortcut>
                </CommandItem>
              ))}
              <CommandItem
                onSelect={() => runCommand(() => router.push('/dashboard/credentials?action=add'))}
                className="text-primary"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>Connect New Platform</span>
              </CommandItem>
            </CommandGroup>
            
            <CommandSeparator />
            
            <CommandGroup heading="Settings & Help">
              <CommandItem
                onSelect={() => runCommand(() => router.push('/dashboard/settings'))}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push('/dashboard/help'))}
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help & Support</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push('/dashboard/user-profile'))}
              >
                <User className="mr-2 h-4 w-4" />
                <span>User Profile</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => {
                  // In a real app, this would call a sign-out API
                  router.push('/api/auth/sign-out');
                })}
                className="text-rose-500 dark:text-rose-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

// CommandMenuProvider to handle global keyboard shortcut
export function CommandMenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  // Handle keyboard shortcuts for opening the command menu
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Add keyboard shortcuts for specific navigation commands
  useEffect(() => {
    const navigationShortcuts = (e: KeyboardEvent) => {
      // Only process if Command/Ctrl is pressed and the menu is not open
      if (!(e.metaKey || e.ctrlKey) || open) return;
      
      const router = useRouter();
      switch (e.key.toLowerCase()) {
        case 'd':
          e.preventDefault();
          router.push('/dashboard');
          break;
        case 's':
          e.preventDefault();
          router.push('/dashboard/scheduler');
          break;
        case 'i':
          e.preventDefault();
          router.push('/dashboard/insights');
          break;
        case 'm':
          e.preventDefault();
          router.push('/dashboard/messages');
          break;
        case 'a':
          e.preventDefault();
          router.push('/dashboard/automation');
          break;
      }
    };

    document.addEventListener('keydown', navigationShortcuts);
    return () => document.removeEventListener('keydown', navigationShortcuts);
  }, [open]);

  return (
    <>
      <CommandMenu open={open} onOpenChange={setOpen} />
      {children}
    </>
  );
} 