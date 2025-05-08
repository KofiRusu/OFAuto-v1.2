'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Image as ImageIcon, 
  DollarSign, 
  BarChart, 
  Users, 
  Settings,
  LogOut,
  Calendar,
  Bot,
  Brain,
  KeyRound,
  FileText,
  Menu,
  ChevronDown,
  Bell,
  Search,
  X,
  GoogleDrive,
  VoiceIcon,
  MessagesSquare,
  PieChart
} from 'lucide-react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserInfo } from '@/components/dashboard/user-info';
import { OnboardingTour } from '@/components/ui/OnboardingTour';
import { HelpAssistant } from '@/components/ui/HelpAssistant';
import { CommandMenuProvider } from '@/components/ui/CommandMenu';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { NotificationCenter } from '@/components/ui/NotificationCenter';
import { DashboardNav } from "@/components/nav/dashboard-nav";
import { UserProfileDropdown } from "@/components/nav/user-profile-dropdown";
import { prisma } from "@/lib/db/prisma";
import { Logo } from "@/components/ui/logo";
import { useFeatureFlag } from "@/lib/hooks/useFeatureFlag";
import { UserRole } from "@prisma/client";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  href: string;
  icon: React.ReactNode;
  text: string;
  id?: string;
  badge?: {
    text: string;
    variant: 'default' | 'destructive' | 'outline' | 'secondary';
  };
  roles?: UserRole[];
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const { userId } = auth();
  
  if (!userId) {
    redirect('/login');
  }
  
  // Get user role for nav customization
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true }
  });
  
  const userRole = user?.role || UserRole.USER;
  
  const navSections: NavSection[] = [
    {
      title: "OVERVIEW",
      items: [
        { 
          href: "/dashboard", 
          icon: <LayoutDashboard size={20} />, 
          text: "Dashboard",
          roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.MODEL]
        },
      ]
    },
    {
      title: "AI STRATEGY",
      items: [
        { 
          href: "/dashboard/strategies", 
          icon: <Brain size={20} />, 
          text: "AI Strategies",
          roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.MODEL]
        },
      ]
    },
    {
      title: "CONTENT & MESSAGING",
      items: [
        { 
          href: "/dashboard/content", 
          icon: <ImageIcon size={20} />, 
          text: "Content Library",
          roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.MODEL]
        },
        // Google Drive integration (MODEL only)
        { 
          href: "/dashboard/media/drive", 
          icon: <GoogleDrive size={20} />, 
          text: "Google Drive", 
          badge: { text: "New", variant: "default" },
          roles: [UserRole.MODEL, UserRole.ADMIN]
        },
        { 
          href: "/dashboard/messages", 
          icon: <MessageSquare size={20} />, 
          text: "Messages",
          roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.MODEL]
        },
        // Unified Messaging (MODEL and MANAGER)
        { 
          href: "/dashboard/messages/unified", 
          icon: <MessagesSquare size={20} />, 
          text: "Unified Inbox", 
          badge: { text: "New", variant: "default" },
          roles: [UserRole.MODEL, UserRole.MANAGER, UserRole.ADMIN]
        },
        { 
          href: "/dashboard/automation", 
          icon: <Bot size={20} />, 
          text: "Execute Actions", 
          badge: { text: "New", variant: "default" },
          roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.MODEL]
        },
      ]
    },
    {
      title: "AUTOMATION",
      items: [
        { 
          href: "/dashboard/scheduler", 
          icon: <Calendar size={20} />, 
          text: "Scheduler", 
          id: "scheduler-button",
          roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.MODEL]
        },
        // Calendar upload UI (MODEL)
        { 
          href: "/dashboard/scheduler/calendar", 
          icon: <Calendar size={20} />, 
          text: "Calendar Upload", 
          badge: { text: "MODEL", variant: "default" },
          roles: [UserRole.MODEL, UserRole.ADMIN]
        },
        { 
          href: "/dashboard/logs", 
          icon: <FileText size={20} />, 
          text: "Execution Logs",
          roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.MODEL]
        },
      ]
    },
    {
      title: "INSIGHTS",
      items: [
        { 
          href: "/dashboard/clients", 
          icon: <Users size={20} />, 
          text: "Audience",
          roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.MODEL]
        },
        { 
          href: "/dashboard/followers", 
          icon: <Users size={20} />, 
          text: "Followers",
          roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.MODEL]
        },
        { 
          href: "/dashboard/insights", 
          icon: <BarChart size={20} />, 
          text: "Analytics",
          roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.MODEL]
        },
        // Unified Analytics Dashboard (MANAGER)
        { 
          href: "/dashboard/analytics/unified", 
          icon: <BarChart size={20} />, 
          text: "Cross-Platform Analytics", 
          badge: { text: "MANAGER", variant: "default" },
          roles: [UserRole.MANAGER, UserRole.ADMIN]
        },
        // Metrics Aggregator (MANAGER)
        { 
          href: "/dashboard/metrics", 
          icon: <PieChart size={20} />, 
          text: "Metrics Dashboard", 
          badge: { text: "MANAGER", variant: "default" },
          roles: [UserRole.MANAGER, UserRole.ADMIN]
        },
        { 
          href: "/dashboard/campaign-insights", 
          icon: <DollarSign size={20} />, 
          text: "Financials",
          roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.MODEL]
        },
        { 
          href: "/dashboard/tax-forms", 
          icon: <FileText size={20} />, 
          text: "Tax Forms",
          roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.MODEL]
        },
      ]
    },
    {
      title: "SYSTEM",
      items: [
        { 
          href: "/dashboard/credentials", 
          icon: <KeyRound size={20} />, 
          text: "Credentials", 
          id: "platform-connect-card",
          roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.MODEL]
        },
        { 
          href: "/dashboard/settings", 
          icon: <Settings size={20} />, 
          text: "Settings",
          roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.MODEL]
        },
        // Voice API settings
        { 
          href: "/dashboard/settings/voice", 
          icon: <VoiceIcon size={20} />, 
          text: "Voice Settings", 
          badge: { text: "New", variant: "default" },
          roles: [UserRole.MODEL, UserRole.MANAGER, UserRole.ADMIN]
        },
        // Chatbot Settings (MODEL only)
        { 
          href: "/dashboard/chatbot/settings", 
          icon: <MessageSquare size={20} />, 
          text: "Chatbot Settings", 
          badge: { text: "MODEL", variant: "default" },
          roles: [UserRole.MODEL, UserRole.ADMIN]
        },
      ]
    }
  ];
  
  // Filter nav sections based on user role
  const filteredNavSections = navSections.map(section => {
    return {
      ...section,
      items: section.items.filter(item => 
        !item.roles || item.roles.includes(userRole)
      )
    };
  }).filter(section => section.items.length > 0);
  
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <div className="flex gap-2 items-center flex-1">
          <Logo />
          <span className="hidden sm:inline-block text-xl font-semibold">OFAuto</span>
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <UserProfileDropdown />
        </div>
      </header>
      
      <div className="flex flex-1">
        <aside className="hidden w-64 border-r bg-background md:block">
          <DashboardNav userRole={user?.role} />
        </aside>
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavItem({ href, icon, text, id, badge }: NavItem) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');
  
  return (
    <Link 
      href={href} 
      id={id}
      className={cn(
        "group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
      )}
    >
      <span className={cn("flex-shrink-0", isActive ? "text-accent-foreground" : "text-muted-foreground")}>
        {icon}
      </span>
      <span className="flex-grow">{text}</span>
      {badge && (
        <Badge
          variant={badge.variant}
          className={cn(
            "ml-auto text-xs font-normal",
            badge.variant === 'outline' && "border border-input bg-background"
          )}
        >
          {badge.text}
        </Badge>
      )}
    </Link>
  );
}

function MobileNavItem({ href, icon, text, id, badge, onClick }: NavItem & { onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');
  
  return (
    <Link 
      href={href} 
      id={id}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
      )}
    >
      <span className={cn("flex-shrink-0", isActive ? "text-accent-foreground" : "text-muted-foreground")}>
        {icon}
      </span>
      <span className="flex-grow">{text}</span>
      {badge && (
        <Badge
          variant={badge.variant}
          className={cn(
            "ml-auto text-xs font-normal",
            badge.variant === 'outline' && "border border-input bg-background"
          )}
        >
          {badge.text}
        </Badge>
      )}
    </Link>
  );
} 