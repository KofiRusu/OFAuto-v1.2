import { auth } from "@clerk/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { UserRole } from "@prisma/client";
import { Settings, Users, Shield, Sliders, Bell, Globe, HelpCircle } from "lucide-react";

export default async function SettingsPage() {
  const { userId } = auth();
  
  if (!userId) {
    redirect("/login");
  }
  
  // Fetch user to check permissions
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  
  if (!user) {
    redirect("/dashboard");
  }
  
  const isAdmin = user.role === UserRole.ADMIN;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Account Settings */}
        <SettingsCard 
          title="Account Settings"
          description="Manage your account preferences and settings."
          icon={<Settings className="h-8 w-8 text-blue-500" />}
          href="/dashboard/settings/account"
        />
        
        {/* User Management - Admin Only */}
        {isAdmin && (
          <SettingsCard 
            title="User Management"
            description="Manage users and permissions."
            icon={<Users className="h-8 w-8 text-purple-500" />}
            href="/dashboard/settings/users"
          />
        )}
        
        {/* Security */}
        <SettingsCard 
          title="Security"
          description="Configure security settings and options."
          icon={<Shield className="h-8 w-8 text-green-500" />}
          href="/dashboard/settings/security"
        />
        
        {/* Preferences */}
        <SettingsCard 
          title="Preferences"
          description="Customize your dashboard experience."
          icon={<Sliders className="h-8 w-8 text-orange-500" />}
          href="/dashboard/settings/preferences"
        />
        
        {/* Notifications */}
        <SettingsCard 
          title="Notifications"
          description="Manage your notification preferences."
          icon={<Bell className="h-8 w-8 text-red-500" />}
          href="/dashboard/settings/notifications"
        />
        
        {/* Integrations */}
        <SettingsCard 
          title="Integrations"
          description="Connect with third-party services."
          icon={<Globe className="h-8 w-8 text-indigo-500" />}
          href="/dashboard/settings/integrations"
        />
        
        {/* Onboarding & Help */}
        <SettingsCard 
          title="Onboarding & Help"
          description="Configure guided tours, tips, and help features."
          icon={<HelpCircle className="h-8 w-8 text-teal-500" />}
          href="/dashboard/settings/onboarding"
        />
      </div>
    </div>
  );
}

interface SettingsCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

function SettingsCard({ title, description, icon, href }: SettingsCardProps) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start">
          <div className="mr-4">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-gray-600 mt-1">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
} 