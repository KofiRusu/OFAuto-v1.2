'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, Sparkles, Clock, Bot, Send, PaperclipIcon, Image } from 'lucide-react';

export default function MessagesPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>('jesssmith92');
  const [message, setMessage] = useState('');
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Manage conversations with your audience across platforms.</p>
        </div>
        <Button>
          <Bot className="h-4 w-4 mr-2" />
          Auto-Response Settings
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle>Conversations</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-[600px] overflow-y-auto">
            <Tabs defaultValue="all" className="px-4 pb-2">
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                <TabsTrigger value="unread" className="flex-1">Unread</TabsTrigger>
                <TabsTrigger value="ai" className="flex-1">AI Handled</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="space-y-1 p-1">
              {isLoading ? (
                <ChatListSkeleton />
              ) : (
                <>
                  <ChatListItem 
                    name="Jessica Smith"
                    username="jesssmith92"
                    platform="onlyfans"
                    lastMessage="Thanks for the content! I had a question about..."
                    time="5m ago"
                    unread={2}
                    isSelected={selectedChat === 'jesssmith92'}
                    onClick={() => setSelectedChat('jesssmith92')}
                  />
                  <ChatListItem 
                    name="Michael Johnson"
                    username="mikej_official"
                    platform="fansly"
                    lastMessage="Will you be posting more of those tutorial videos?"
                    time="25m ago"
                    unread={0}
                    isSelected={selectedChat === 'mikej_official'}
                    onClick={() => setSelectedChat('mikej_official')}
                  />
                  <ChatListItem 
                    name="Sarah Williams"
                    username="sarah_w"
                    platform="onlyfans"
                    lastMessage="I loved your last photo set! Can't wait to see more."
                    time="2h ago"
                    unread={1}
                    isSelected={selectedChat === 'sarah_w'}
                    onClick={() => setSelectedChat('sarah_w')}
                    aiHandled={true}
                  />
                  <ChatListItem 
                    name="David Brown"
                    username="dave_brown"
                    platform="fansly"
                    lastMessage="When is your next live stream scheduled?"
                    time="1d ago"
                    unread={0}
                    isSelected={selectedChat === 'dave_brown'}
                    onClick={() => setSelectedChat('dave_brown')}
                  />
                  <ChatListItem 
                    name="Emma Davis"
                    username="emma_d21"
                    platform="onlyfans"
                    lastMessage="Just subscribed! Loving your content so far."
                    time="2d ago"
                    unread={0}
                    isSelected={selectedChat === 'emma_d21'}
                    onClick={() => setSelectedChat('emma_d21')}
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 md:col-span-3">
          {selectedChat ? (
            <>
              <CardHeader className="pb-2 border-b">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://i.pravatar.cc/150?u=${selectedChat}`} />
                      <AvatarFallback>JS</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">Jessica Smith</CardTitle>
                      <CardDescription className="text-xs">@jesssmith92 • OnlyFans</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Clock className="h-4 w-4 mr-1" />
                      History
                    </Button>
                    <Button variant="outline" size="sm">
                      <Sparkles className="h-4 w-4 mr-1" />
                      Quick Responses
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 h-[460px] overflow-y-auto space-y-4">
                <ChatMessage 
                  content="Hi there! I just subscribed to your OnlyFans. I love your content!" 
                  timestamp="Today, 2:30 PM"
                  isOwn={false}
                />
                <ChatMessage 
                  content="Thank you so much for subscribing! I'm glad you're enjoying the content. Let me know if there's anything specific you'd like to see more of!" 
                  timestamp="Today, 2:35 PM"
                  isOwn={true}
                />
                <ChatMessage 
                  content="I really loved your beach photoshoot. Will you be doing more outdoor content?" 
                  timestamp="Today, 2:36 PM"
                  isOwn={false}
                />
                <ChatMessage 
                  content="Absolutely! I have another outdoor shoot planned for next week. Subscribers will get early access to those photos." 
                  timestamp="Today, 2:40 PM"
                  isOwn={true}
                />
                <ChatMessage 
                  content="That's awesome! Can't wait to see them. Do you also do custom requests?" 
                  timestamp="Today, 2:42 PM"
                  isOwn={false}
                />
              </CardContent>
              <CardFooter className="p-4 border-t">
                <div className="flex w-full items-center gap-2">
                  <Button variant="outline" size="icon">
                    <PaperclipIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Image className="h-4 w-4" />
                  </Button>
                  <Textarea 
                    placeholder="Type your message..."
                    className="flex-1 min-h-10"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <Button variant="default" size="icon" disabled={!message.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-[550px] flex-col gap-4 text-center">
              <div className="rounded-full bg-blue-100 p-4">
                <MessageIcon className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold">Select a conversation</h3>
              <p className="text-muted-foreground max-w-xs">
                Choose a conversation from the list to view and respond to messages.
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

function ChatListSkeleton() {
  return (
    <div className="space-y-2">
      {Array(5).fill(0).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface ChatListItemProps {
  name: string;
  username: string;
  platform: string;
  lastMessage: string;
  time: string;
  unread: number;
  isSelected: boolean;
  onClick: () => void;
  aiHandled?: boolean;
}

function ChatListItem({ 
  name, 
  username, 
  platform, 
  lastMessage, 
  time, 
  unread, 
  isSelected,
  onClick,
  aiHandled = false
}: ChatListItemProps) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  const platformColors: Record<string, string> = {
    onlyfans: 'bg-blue-100 text-blue-800',
    fansly: 'bg-purple-100 text-purple-800',
    instagram: 'bg-pink-100 text-pink-800',
    twitter: 'bg-sky-100 text-sky-800'
  };
  
  return (
    <div 
      className={`flex items-start gap-3 p-2 rounded-md cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-gray-100' : ''}`}
      onClick={onClick}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={`https://i.pravatar.cc/150?u=${username}`} alt={name} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <div className="font-medium truncate">{name}</div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{time}</span>
        </div>
        
        <div className="text-sm text-muted-foreground truncate">
          {lastMessage}
        </div>
        
        <div className="flex gap-1 mt-1">
          <Badge variant="secondary" className={platformColors[platform]}>
            {platform.charAt(0).toUpperCase() + platform.slice(1)}
          </Badge>
          
          {aiHandled && (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <Bot className="h-3 w-3 mr-1" />
              AI Handled
            </Badge>
          )}
        </div>
      </div>
      
      {unread > 0 && (
        <div className="min-w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
          {unread}
        </div>
      )}
    </div>
  );
}

interface ChatMessageProps {
  content: string;
  timestamp: string;
  isOwn: boolean;
  attachment?: {
    type: 'image' | 'file';
    url: string;
    name?: string;
  };
}

function ChatMessage({ content, timestamp, isOwn, attachment }: ChatMessageProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isOwn ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'} rounded-lg px-4 py-2`}>
        <div className="text-sm">{content}</div>
        <div className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-500'}`}>
          {timestamp}
        </div>
      </div>
    </div>
  );
}

function MessageIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
} 