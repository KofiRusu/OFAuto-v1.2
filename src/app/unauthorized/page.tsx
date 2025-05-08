'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronLeft, Shield } from "lucide-react";

export default function UnauthorizedPage() {
  const router = useRouter();
  
  return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-red-100 p-3">
            <Shield className="h-12 w-12 text-red-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">
          You don't have permission to access this page or resource.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button 
            onClick={() => router.push('/dashboard')}
            className="mx-auto flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Return to Dashboard
          </Button>
          <div className="mt-4 flex items-center justify-center rounded-lg bg-yellow-50 p-3">
            <AlertCircle className="mr-2 h-4 w-4 text-yellow-600" />
            <p className="text-sm text-yellow-700">
              If you believe this is a mistake, please contact your administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 