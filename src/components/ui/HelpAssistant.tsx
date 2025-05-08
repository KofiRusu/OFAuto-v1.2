'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  HelpCircle, 
  X, 
  Search, 
  Calendar, 
  Settings, 
  FileText, 
  Bot, 
  BarChart,
  MessageSquare,
  Brain,
  ChevronRight,
  Sparkles,
  Youtube,
  Users,
  DollarSign,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface HelpItem {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  action: () => void;
  category: 'navigation' | 'task' | 'learning' | 'platform';
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'outline';
  };
}

export function HelpAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<HelpItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Simulate loading when navigating
  const handleNavigation = (path: string) => {
    setIsLoading(true);
    setTimeout(() => {
      router.push(path);
      setIsOpen(false);
      setIsLoading(false);
    }, 300);
  };

  // Define help items with their actions
  const helpItems: HelpItem[] = [
    // Tasks
    {
      id: 'schedule-post',
      title: 'Schedule a post',
      description: 'Create and schedule content across platforms',
      icon: <Calendar className="h-5 w-5" />,
      action: () => handleNavigation('/dashboard/scheduler'),
      category: 'task'
    },
    {
      id: 'create-automation',
      title: 'Create an automation',
      description: 'Set up triggers and automated actions',
      icon: <Bot className="h-5 w-5" />,
      action: () => handleNavigation('/dashboard/automation'),
      category: 'task',
      badge: { text: 'Popular', variant: 'default' }
    },
    {
      id: 'send-message',
      title: 'Send a message',
      description: 'Message followers or subscribers',
      icon: <MessageSquare className="h-5 w-5" />,
      action: () => handleNavigation('/dashboard/messages'),
      category: 'task'
    },
    {
      id: 'ai-strategy',
      title: 'Generate AI strategy',
      description: 'Get AI-powered content and monetization strategies',
      icon: <Brain className="h-5 w-5" />,
      action: () => handleNavigation('/dashboard/strategies'),
      category: 'task',
      badge: { text: 'AI Powered', variant: 'secondary' }
    },
    {
      id: 'upload-content',
      title: 'Upload content',
      description: 'Add new photos or videos to your library',
      icon: <ImageIcon className="h-5 w-5" />,
      action: () => handleNavigation('/dashboard/content'),
      category: 'task'
    },
    
    // Navigation
    {
      id: 'view-insights',
      title: 'View insights',
      description: 'See AI-powered analytics and recommendations',
      icon: <BarChart className="h-5 w-5" />,
      action: () => handleNavigation('/dashboard/insights'),
      category: 'navigation'
    },
    {
      id: 'audience-analytics',
      title: 'Audience analytics',
      description: 'Understand your followers and subscribers',
      icon: <Users className="h-5 w-5" />,
      action: () => handleNavigation('/dashboard/clients'),
      category: 'navigation'
    },
    {
      id: 'revenue-insights',
      title: 'Revenue insights',
      description: 'Track earnings and subscription metrics',
      icon: <DollarSign className="h-5 w-5" />,
      action: () => handleNavigation('/dashboard/campaign-insights'),
      category: 'navigation'
    },
    
    // Platform connections
    {
      id: 'connect-platform',
      title: 'Connect platforms',
      description: 'Link your social media accounts',
      icon: <Settings className="h-5 w-5" />,
      action: () => handleNavigation('/dashboard/credentials'),
      category: 'platform'
    },
    {
      id: 'onlyfans-setup',
      title: 'OnlyFans setup',
      description: 'Configure your OnlyFans integration',
      icon: <Sparkles className="h-5 w-5" />,
      action: () => handleNavigation('/dashboard/credentials?platform=onlyfans'),
      category: 'platform'
    },
    {
      id: 'instagram-setup',
      title: 'Instagram setup',
      description: 'Configure your Instagram integration',
      icon: <Sparkles className="h-5 w-5" />,
      action: () => handleNavigation('/dashboard/credentials?platform=instagram'),
      category: 'platform'
    },
    
    // Learning
    {
      id: 'view-docs',
      title: 'Documentation',
      description: 'Read platform guides and API reference',
      icon: <FileText className="h-5 w-5" />,
      action: () => handleNavigation('/dashboard/help'),
      category: 'learning'
    },
    {
      id: 'video-tutorials',
      title: 'Video tutorials',
      description: 'Watch guided tutorials for key features',
      icon: <Youtube className="h-5 w-5" />,
      action: () => handleNavigation('/dashboard/help/videos'),
      category: 'learning',
      badge: { text: 'New', variant: 'default' }
    },
    {
      id: 'ai-best-practices',
      title: 'AI best practices',
      description: 'Learn how to leverage AI for content creation',
      icon: <Brain className="h-5 w-5" />,
      action: () => handleNavigation('/dashboard/help/ai-guide'),
      category: 'learning'
    },
  ];

  // Filter items based on search query and category
  useEffect(() => {
    let filtered = helpItems;
    
    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(item => item.category === activeCategory);
    }
    
    // Filter by search query
    if (query) {
      filtered = filtered.filter(
        item => 
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    setFilteredItems(filtered);
  }, [query, activeCategory]);

  // Handle keyboard shortcut to open/close (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Floating help button */}
      <Button
        variant="secondary"
        size="icon"
        className="rounded-full fixed bottom-6 right-6 shadow-md z-30 hover:scale-105 transition-transform"
        onClick={() => setIsOpen(true)}
      >
        <HelpCircle className="h-5 w-5" />
        <span className="sr-only">Open Help</span>
      </Button>

      {/* Help panel overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Help panel */}
      <div
        className={`fixed right-6 bottom-20 w-80 rounded-lg border bg-card shadow-lg transition-all duration-200 z-50 transform ${
          isOpen ? 'translate-y-0 opacity-100 animate-fade-in' : 'translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="text-lg font-semibold">Help Assistant</div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for help..."
              className="pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus={isOpen}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Press <kbd className="rounded border px-1.5 bg-muted">Ctrl</kbd> + <kbd className="rounded border px-1.5 bg-muted">K</kbd> to toggle help
          </div>
        </div>

        <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
          <div className="px-3 pt-2">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="task" className="text-xs">Tasks</TabsTrigger>
              <TabsTrigger value="navigation" className="text-xs">Analytics</TabsTrigger>
              <TabsTrigger value="learning" className="text-xs">Guides</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="all" className="m-0">
            <ScrollArea className="h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <HelpItemsList items={filteredItems} query={query} />
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="task" className="m-0">
            <ScrollArea className="h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <HelpItemsList items={filteredItems} query={query} />
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="navigation" className="m-0">
            <ScrollArea className="h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <HelpItemsList items={filteredItems} query={query} />
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="learning" className="m-0">
            <ScrollArea className="h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <HelpItemsList items={filteredItems} query={query} />
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="platform" className="m-0">
            <ScrollArea className="h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <HelpItemsList items={filteredItems} query={query} />
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="p-3 border-t text-xs flex items-center justify-center gap-1 text-muted-foreground">
          <span>Need more help?</span>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs font-normal"
            onClick={() => {
              handleNavigation('/dashboard/help');
            }}
          >
            View documentation
          </Button>
        </div>
      </div>
    </>
  );
}

interface HelpItemsListProps {
  items: HelpItem[];
  query: string;
}

function HelpItemsList({ items, query }: HelpItemsListProps) {
  return (
    <div className="p-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="group flex items-center gap-3 rounded-md p-2 hover:bg-accent transition-colors cursor-pointer"
          onClick={item.action}
        >
          <div className="flex-shrink-0 h-9 w-9 rounded-md flex items-center justify-center bg-primary/10 text-primary">
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium truncate">{item.title}</div>
              {item.badge && (
                <Badge variant={item.badge.variant} className="text-[10px] px-1 py-0 h-4">
                  {item.badge.text}
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground truncate">{item.description}</div>
          </div>
          <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-70 transition-opacity flex-shrink-0" />
        </div>
      ))}

      {items.length === 0 && (
        <div className="text-center py-8 px-4">
          <div className="text-muted-foreground mb-2">No results found for "{query}"</div>
          <p className="text-xs text-muted-foreground">Try a different search term or browse the categories</p>
        </div>
      )}
    </div>
  );
} 
} 