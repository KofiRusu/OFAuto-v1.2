'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRole } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldAlert, 
  Shield, 
  User as UserIcon, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// This page should only be accessible in development
export default function DebugMePage() {
  const { isLoaded, user } = useUser();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProduction, setIsProduction] = useState(false);
  
  useEffect(() => {
    // Check if we're in production environment
    if (process.env.NODE_ENV === 'production') {
      setIsProduction(true);
      setIsLoading(false);
      return;
    }
    
    if (!isLoaded || !user) return;
    
    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/user/role?userId=${user.id}`);
        if (!response.ok) {
          throw new Error(`Error fetching user role: ${response.statusText}`);
        }
        
        const data = await response.json();
        setUserRole(data.role as UserRole);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [isLoaded, user]);
  
  // Get role badge
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            <ShieldAlert className="h-3 w-3 mr-1" /> ADMIN
          </Badge>
        );
      case 'MANAGER':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Shield className="h-3 w-3 mr-1" /> MANAGER
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <UserIcon className="h-3 w-3 mr-1" /> USER
          </Badge>
        );
    }
  };
  
  if (isProduction) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader className="bg-red-50">
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Access Denied
            </CardTitle>
            <CardDescription className="text-red-600">
              This debugging page is not available in production.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <p>This page is only accessible in development environments for security reasons.</p>
            <Button
              onClick={() => window.history.back()}
              className="mt-4 w-full"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (error || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader className="bg-red-50">
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" /> Error
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p>{error || 'User not authenticated'}</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4 w-full"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-4xl py-10">
      <Card>
        <CardHeader className="bg-amber-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" /> 
                Developer Debug View
              </CardTitle>
              <CardDescription>
                Current user information for development purposes
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
              DEV ONLY
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">Auth Info:</h3>
              <div className="space-y-1">
                <p>
                  <span className="font-medium text-sm">User ID:</span>{' '}
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">{user?.id}</code>
                </p>
                <p>
                  <span className="font-medium text-sm">Email:</span>{' '}
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
                {user?.firstName && (
                  <p>
                    <span className="font-medium text-sm">Name:</span>{' '}
                    {user?.firstName} {user?.lastName}
                  </p>
                )}
                <p>
                  <span className="font-medium text-sm">Status:</span>{' '}
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" /> Authenticated
                  </Badge>
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">Role Info:</h3>
              <div className="space-y-3">
                <p>
                  <span className="font-medium text-sm">Current Role:</span>{' '}
                  {userRole && getRoleBadge(userRole)}
                </p>
                <div className="text-sm">
                  <p className="font-medium">Role Grants Access To:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
                    {userRole === 'ADMIN' && (
                      <>
                        <li>All system features and settings</li>
                        <li>User management</li>
                        <li>Advanced analytics</li>
                        <li>System configuration</li>
                      </>
                    )}
                    {userRole === 'MANAGER' && (
                      <>
                        <li>Content management across all clients</li>
                        <li>Basic user viewing</li>
                        <li>Analytics and reports</li>
                        <li>Platform settings</li>
                      </>
                    )}
                    {userRole === 'USER' && (
                      <>
                        <li>Basic platform access</li>
                        <li>Own content management</li>
                        <li>Basic analytics</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-md">
            <h3 className="font-medium mb-2">Raw User Object:</h3>
            <pre className="bg-gray-800 text-gray-100 p-4 rounded-md text-xs overflow-auto max-h-64">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
          
          <div className="mt-4 p-4 bg-amber-50 rounded-md flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              This page is only visible in development mode for security purposes. Use it to debug
              authentication and role-based access control issues.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 