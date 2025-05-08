'use client';

import { UserRole } from "@prisma/client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Settings,
  BarChart,
  Calendar,
  FileText,
  MessageSquare,
  Globe,
  Shield,
  ShieldAlert,
  FileImage,
  LogOut,
  Send,
  MessageCircle,
  Activity,
  Bell,
  BookOpen,
  Database,
  GoogleDrive,
  VoiceIcon,
  MessagesSquare,
  PieChart
} from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { Permission } from "@/components/auth/permission-required";
import { RoleIndicator } from "@/components/auth/role-indicator";
import { useFeatureFlag } from "@/lib/hooks/useFeatureFlag";

interface DashboardNavProps {
  userRole?: UserRole;
}

export function DashboardNav({ userRole = UserRole.USER }: DashboardNavProps) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  
  // Feature flags for MODEL-specific features
  const showGoogleDrive = useFeatureFlag(userRole, 'MODEL_GOOGLE_DRIVE');
  const showCalendarUpload = useFeatureFlag(userRole, 'MODEL_CALENDAR_UPLOAD');
  const showPersonaSettings = useFeatureFlag(userRole, 'MODEL_CHATBOT_PERSONA');
  
  // Feature flags for MANAGER-specific features
  const showManagerAnalytics = useFeatureFlag(userRole, 'MANAGER_ANALYTICS');
  const showMetricsAggregator = useFeatureFlag(userRole, 'MANAGER_METRICS');
  
  // Feature flags for shared features
  const showUnifiedMessaging = useFeatureFlag(userRole, 'UNIFIED_MESSAGING');
  const showVoiceApi = useFeatureFlag(userRole, 'VOICE_API');
  
  // Define navigation items with their permission requirements
  const navItems = [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: <LayoutDashboard className="h-4 w-4" />,
          roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.MODEL]
        },
        {
          title: "Calendar",
          href: "/dashboard/calendar",
          icon: <Calendar className="h-4 w-4" />,
          roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.MODEL]
        },
        {
          title: "Content",
          href: "/dashboard/content",
          icon: <FileImage className="h-4 w-4" />,
          roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.MODEL]
        },
        {
          title: "Analytics",
          href: "/dashboard/insights",
          icon: <BarChart className="h-4 w-4" />,
          roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.MODEL]
        }
      ]
    },
    {
      title: "Management",
      items: [
        {
          title: "Posts",
          href: "/dashboard/posts",
          icon: <Send className="h-4 w-4" />,
          roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.MODEL]
        },
        {
          title: "Scheduler",
          href: "/dashboard/scheduler",
          icon: <Calendar className="h-4 w-4" />,
          roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.MODEL],
          newBadge: true
        },
        // MODEL-specific items
        ...(showCalendarUpload ? [{
          title: "Calendar Upload",
          href: "/dashboard/scheduler/calendar",
          icon: <Calendar className="h-4 w-4" />,
          roles: [UserRole.MODEL, UserRole.ADMIN],
          newBadge: true,
          modelBadge: true
        }] : []),
        {
          title: "DM Campaigns",
          href: "/dashboard/automation/dm-campaigns",
          icon: <MessageCircle className="h-4 w-4" />,
          roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.MODEL],
          newBadge: true
        },
        // MODEL-specific Google Drive integration
        ...(showGoogleDrive ? [{
          title: "Google Drive",
          href: "/dashboard/media/drive",
          icon: <GoogleDrive className="h-4 w-4" />,
          roles: [UserRole.MODEL, UserRole.ADMIN],
          newBadge: true,
          modelBadge: true
        }] : []),
        {
          title: "Users",
          href: "/dashboard/users",
          icon: <Users className="h-4 w-4" />,
          roles: [UserRole.ADMIN],
          adminBadge: true
        },
        {
          title: "Platforms",
          href: "/dashboard/platforms",
          icon: <Globe className="h-4 w-4" />,
          roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.MODEL]
        },
        {
          title: "Messages",
          href: "/dashboard/messages",
          icon: <MessageSquare className="h-4 w-4" />,
          roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.MODEL]
        },
        // Unified messaging feature
        ...(showUnifiedMessaging ? [{
          title: "Unified Messages",
          href: "/dashboard/messages/unified",
          icon: <MessagesSquare className="h-4 w-4" />,
          roles: [UserRole.MODEL, UserRole.MANAGER, UserRole.ADMIN],
          newBadge: true
        }] : []),
        {
          title: "Tax Forms",
          href: "/dashboard/tax-forms",
          icon: <FileText className="h-4 w-4" />,
          roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.MODEL]
        }
      ]
    },
    {
      title: "Analytics",
      items: [
        ...(showManagerAnalytics ? [{
          title: "Cross-Platform Analytics",
          href: "/dashboard/analytics/unified",
          icon: <BarChart className="h-4 w-4" />,
          roles: [UserRole.MANAGER, UserRole.ADMIN],
          managerBadge: true,
          newBadge: true
        }] : []),
        ...(showMetricsAggregator ? [{
          title: "Metrics Dashboard",
          href: "/dashboard/metrics",
          icon: <PieChart className="h-4 w-4" />,
          roles: [UserRole.MANAGER, UserRole.ADMIN],
          managerBadge: true,
          newBadge: true
        }] : [])
      ]
    },
    {
      title: "Admin",
      items: [
        {
          title: "Service Health",
          href: "/dashboard/admin/monitor",
          icon: <Activity className="h-4 w-4" />,
          roles: [UserRole.ADMIN],
          adminBadge: true
        },
        {
          title: "Dashboards",
          href: "/dashboard/admin/dashboards",
          icon: <BarChart className="h-4 w-4" />,
          roles: [UserRole.ADMIN],
          adminBadge: true
        },
        {
          title: "Alerts",
          href: "/dashboard/admin/alerts",
          icon: <Bell className="h-4 w-4" />,
          roles: [UserRole.ADMIN],
          adminBadge: true
        },
        {
          title: "Runbooks",
          href: "/dashboard/admin/runbooks",
          icon: <BookOpen className="h-4 w-4" />,
          roles: [UserRole.ADMIN],
          adminBadge: true
        },
        {
          title: "Database",
          href: "/dashboard/admin/database",
          icon: <Database className="h-4 w-4" />,
          roles: [UserRole.ADMIN],
          adminBadge: true
        }
      ]
    },
    {
      title: "Settings",
      items: [
        {
          title: "Profile",
          href: "/dashboard/profile",
          icon: <Users className="h-4 w-4" />,
          roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.MODEL]
        },
        {
          title: "Settings",
          href: "/dashboard/settings",
          icon: <Settings className="h-4 w-4" />,
          roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.MODEL]
        },
        // Voice API settings (shared)
        ...(showVoiceApi ? [{
          title: "Voice Settings",
          href: "/dashboard/settings/voice",
          icon: <VoiceIcon className="h-4 w-4" />,
          roles: [UserRole.MODEL, UserRole.MANAGER, UserRole.ADMIN],
          newBadge: true
        }] : []),
        // MODEL-specific chatbot persona settings
        ...(showPersonaSettings ? [{
          title: "Chatbot Settings",
          href: "/dashboard/chatbot/settings",
          icon: <MessageSquare className="h-4 w-4" />,
          roles: [UserRole.MODEL, UserRole.ADMIN],
          modelBadge: true,
          newBadge: true
        }] : []),
        {
          title: "Roles & Permissions",
          href: "/dashboard/settings/roles",
          icon: <Shield className="h-4 w-4" />,
          roles: [UserRole.MANAGER, UserRole.ADMIN],
          managerBadge: true
        },
        {
          title: "Audit Logs",
          href: "/dashboard/settings/audit",
          icon: <ShieldAlert className="h-4 w-4" />,
          roles: [UserRole.ADMIN],
          adminBadge: true
        }
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto py-2">
        <div className="flex flex-col h-full justify-between">
          <div className="px-3 py-2">
            <div className="mb-4 px-4 py-2">
              {userRole && (
                <div className="mb-2">
                  <span className="text-xs font-medium text-muted-foreground block mb-1">
                    Your Access Level
                  </span>
                  <RoleIndicator role={userRole} size="md" />
                </div>
              )}
            </div>
            
            {navItems.map((section) => {
              // Filter items based on user role
              const sectionItems = section.items.filter(
                (item) => item.roles.includes(userRole)
              );
              
              // Only render section if it has visible items
              if (sectionItems.length === 0) return null;
              
              return (
                <div key={section.title} className="mb-6">
                  <h3 className="px-4 text-xs font-semibold text-muted-foreground mb-2">
                    {section.title}
                  </h3>
                  <nav className="space-y-1">
                    {sectionItems.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                      
                      return (
                        <Link 
                          key={item.href} 
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                            isActive 
                              ? "bg-accent text-accent-foreground font-medium" 
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          {item.icon}
                          <span>{item.title}</span>
                          
                          {/* Admin-only badge */}
                          {item.adminBadge && (
                            <span className="ml-auto text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                              Admin
                            </span>
                          )}
                          
                          {/* Manager+ badge */}
                          {item.managerBadge && (
                            <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                              Manager+
                            </span>
                          )}
                          
                          {/* Model badge */}
                          {item.modelBadge && (
                            <span className="ml-auto text-xs bg-pink-100 text-pink-800 px-1.5 py-0.5 rounded">
                              Model
                            </span>
                          )}
                          
                          {/* New feature badge */}
                          {item.newBadge && !item.adminBadge && !item.managerBadge && !item.modelBadge && (
                            <span className="ml-auto text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                              New
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="mt-auto p-4 border-t">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2"
          onClick={() => signOut(() => window.location.href = "/")}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
} 