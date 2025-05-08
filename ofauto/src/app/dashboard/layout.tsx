import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SignOutButton, UserButton } from '@clerk/nextjs';
import DemoModeBanner from '@/components/DemoModeBanner';
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Users,
  Settings,
  Calendar,
  FileText,
  LineChart,
  Layers,
  Workflow,
  Globe,
  Lightbulb,
  Beaker,
  Zap
} from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  text: string;
}

function NavItem({ href, icon, text }: NavItemProps) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
      >
        <span className="mr-3 text-gray-500 dark:text-gray-400">{icon}</span>
        <span>{text}</span>
      </Link>
    </li>
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-slate-950">
      {/* Demo Mode Banner */}
      <DemoModeBanner />
      
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r transition-all dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="flex h-14 items-center border-b px-4 dark:border-slate-700">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-semibold"
            >
              <Image
                src="/logo.png"
                alt="OFAuto Logo"
                width={30}
                height={30}
                className="rounded"
              />
              <span>OFAuto</span>
            </Link>
          </div>
          <nav className="h-[calc(100vh-3.5rem)] overflow-y-auto py-4">
            <ul className="space-y-2 px-2">
              <NavItem href="/dashboard" icon={<LayoutDashboard size={20} />} text="Overview" />
              <NavItem href="/dashboard/analytics" icon={<BarChart3 size={20} />} text="Analytics" />
              <NavItem href="/dashboard/insights" icon={<Lightbulb size={20} />} text="AI Insights" />
              <NavItem href="/dashboard/experiments" icon={<Beaker size={20} />} text="A/B Testing" />
              <NavItem href="/dashboard/personalization" icon={<Zap size={20} />} text="Personalization" />
              <NavItem href="/dashboard/messages" icon={<MessageSquare size={20} />} text="Messages" />
              <NavItem href="/dashboard/scheduler" icon={<Calendar size={20} />} text="Scheduler" />
              <NavItem href="/dashboard/followers" icon={<Users size={20} />} text="Followers" />
              <NavItem href="/dashboard/integrations" icon={<Layers size={20} />} text="Integrations" />
              <NavItem href="/dashboard/automation" icon={<Workflow size={20} />} text="Automation" />
              <NavItem href="/dashboard/strategies" icon={<LineChart size={20} />} text="Strategies" />
              <NavItem href="/dashboard/logs" icon={<FileText size={20} />} text="Logs" />
              <NavItem href="/dashboard/settings" icon={<Settings size={20} />} text="Settings" />
            </ul>
          </nav>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 ml-64">
          {/* Header/Topbar */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white px-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-1 items-center gap-2">
              {/* Search placeholder */}
              <div className="relative flex-1 md:max-w-sm">
                {/* Search input would go here */}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <UserButton afterSignOutUrl="/" />
            </div>
          </header>
          
          {/* Page Content */}
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
} 