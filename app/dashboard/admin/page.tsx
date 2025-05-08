"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import Forbidden from "@/components/forbidden";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { userId, sessionClaims } = useAuth();
  
  // Get the user role from sessionClaims
  const userRole = sessionClaims?.userRole || "USER";
  
  // Check if the user has admin access
  const hasAccess = userRole === "ADMIN";

  // Admin features
  const adminFeatures = [
    {
      title: "Organization Management",
      description: "Manage organization settings and referral codes",
      icon: <Icons.building className="h-8 w-8" />,
      href: "/dashboard/admin/organization",
      new: true,
    },
    {
      title: "Platform Access",
      description: "Control platform access for models",
      icon: <Icons.shield className="h-8 w-8" />,
      href: "/dashboard/admin/platform-access",
    },
    {
      title: "Performance Reporting",
      description: "View and analyze performance metrics",
      icon: <Icons.barChart className="h-8 w-8" />,
      href: "/dashboard/admin/performance/collective",
    },
    {
      title: "Activity Monitoring",
      description: "Track user activity and interactions",
      icon: <Icons.activity className="h-8 w-8" />,
      href: "/dashboard/admin/activity",
    },
    {
      title: "Notifications",
      description: "Manage system notifications",
      icon: <Icons.bell className="h-8 w-8" />,
      href: "/dashboard/admin/notifications",
    },
    {
      title: "Chatbot Automation",
      description: "Configure AI-powered chatbots",
      icon: <Icons.bot className="h-8 w-8" />,
      href: "/dashboard/admin/chatbot-automation",
    },
  ];

  // If user has no access, show forbidden page
  if (!hasAccess) {
    return <Forbidden />;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your platform and users with these administrative tools
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminFeatures.map((feature) => (
          <Card 
            key={feature.title} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push(feature.href)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="p-2 bg-primary/10 rounded-md">
                  {feature.icon}
                </div>
                {feature.new && (
                  <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-semibold">
                    New
                  </div>
                )}
              </div>
              <CardTitle className="mt-4">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className="w-full" onClick={() => router.push(feature.href)}>
                Manage
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 