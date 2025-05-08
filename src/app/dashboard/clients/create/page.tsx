"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { CreateClientForm } from "./create-client-form";

export default function CreateClientPage() {
  const { user, isAuthenticated, isLoading, mockLogin } = useAuth();

  // Set up mock authentication for development
  useEffect(() => {
    // Only mock login if not already authenticated
    if (!isAuthenticated && !isLoading) {
      mockLogin({
        id: "user-123",
        name: "Demo User",
        email: "demo@example.com",
        role: "ADMIN"
      });
    }
  }, [isAuthenticated, isLoading, mockLogin]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin opacity-70" />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Create New Client</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>
            Add a new client to your account. Fill in the required fields below.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {user && <CreateClientForm userId={user.id} />}
        </CardContent>
      </Card>
    </div>
  );
} 