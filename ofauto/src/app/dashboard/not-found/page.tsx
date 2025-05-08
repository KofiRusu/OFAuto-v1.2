'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardNotFound() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] text-center px-4">
      <div className="space-y-6 max-w-md">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Page Not Found</h2>
        
        <p className="text-gray-600 dark:text-gray-400">
          The dashboard page you are looking for doesn&apos;t exist or has been moved.
        </p>
        
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800 text-left">
          <p className="text-amber-800 dark:text-amber-300 text-sm">
            <strong>Requested Path:</strong> {pathname}
          </p>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-500">Available Dashboard Sections:</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="w-full">
                Overview
              </Button>
            </Link>
            <Link href="/dashboard/followers">
              <Button variant="outline" size="sm" className="w-full">
                Followers
              </Button>
            </Link>
            <Link href="/dashboard/messages">
              <Button variant="outline" size="sm" className="w-full">
                Messages
              </Button>
            </Link>
            <Link href="/dashboard/analytics">
              <Button variant="outline" size="sm" className="w-full">
                Analytics
              </Button>
            </Link>
            <Link href="/dashboard/scheduler">
              <Button variant="outline" size="sm" className="w-full">
                Scheduler
              </Button>
            </Link>
            <Link href="/dashboard/queue">
              <Button variant="outline" size="sm" className="w-full">
                Queue
              </Button>
            </Link>
            <Link href="/dashboard/strategies">
              <Button variant="outline" size="sm" className="w-full">
                Strategies
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="outline" size="sm" className="w-full">
                Settings
              </Button>
            </Link>
          </div>
        </div>
        
        <Link href="/dashboard">
          <Button className="w-full">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
} 