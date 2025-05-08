import { RoleGate } from "@/components/auth/role-gate";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { ShieldAlert, Activity, Bell, BookOpen, BarChart } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = auth();
  
  if (!userId) {
    redirect("/login");
  }
  
  // Fetch user data to check if the current user is an admin
  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true }
  });
  
  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  return (
    <RoleGate allowedRoles={[UserRole.ADMIN]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Portal</h1>
            <p className="text-muted-foreground">
              System monitoring, dashboards, alerts, and operational runbooks
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs">
              <ShieldAlert className="mr-2 h-4 w-4 text-red-500" />
              Admin Only
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="monitor" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="monitor" asChild>
              <Link href="/dashboard/admin/monitor" className="flex items-center justify-center gap-2">
                <Activity className="h-4 w-4" />
                <span>Service Health</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="dashboards" asChild>
              <Link href="/dashboard/admin/dashboards" className="flex items-center justify-center gap-2">
                <BarChart className="h-4 w-4" />
                <span>Dashboards</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="alerts" asChild>
              <Link href="/dashboard/admin/alerts" className="flex items-center justify-center gap-2">
                <Bell className="h-4 w-4" />
                <span>Alerts</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="runbooks" asChild>
              <Link href="/dashboard/admin/runbooks" className="flex items-center justify-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>Runbooks</span>
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="bg-card rounded-lg border p-6">
          {children}
        </div>
      </div>
    </RoleGate>
  );
} 