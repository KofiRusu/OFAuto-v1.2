import { useUser } from "@clerk/nextjs";
import { UserRole } from "@prisma/client";
import { ReactNode, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shield, ChevronLeft } from "lucide-react";

interface RoleGateProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
  redirectTo?: string;
  focusOnDenied?: boolean;
}

export const RoleGate = ({
  children,
  allowedRoles,
  fallback,
  redirectTo,
  focusOnDenied = true
}: RoleGateProps) => {
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Ref for accessibility focus management
  const accessDeniedRef = useRef<HTMLDivElement>(null);
  const dashboardButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user || !isLoaded) return;

      try {
        // Fetch the user's role from our database API
        const response = await fetch(`/api/user/role?userId=${user.id}`);
        const data = await response.json();

        if (data.role) {
          setUserRole(data.role as UserRole);
          
          // If user doesn't have required role and redirectTo is specified, redirect
          if (redirectTo && data.role && !allowedRoles.includes(data.role)) {
            router.push(redirectTo);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded) {
      fetchUserRole();
    }
  }, [user, isLoaded, allowedRoles, redirectTo, router]);
  
  // Focus management for accessibility
  useEffect(() => {
    if (!loading && !hasRequiredRole && focusOnDenied) {
      // Once loading is complete and access is denied, focus on the access denied message
      // or the dashboard button for better accessibility
      if (dashboardButtonRef.current) {
        dashboardButtonRef.current.focus();
      } else if (accessDeniedRef.current) {
        accessDeniedRef.current.focus();
      }
    }
  }, [loading, userRole, allowedRoles, focusOnDenied]);

  if (!isLoaded || loading) {
    // Show loading state
    return (
      <div className="flex items-center justify-center p-6">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if the user role is allowed
  const hasRequiredRole = userRole && allowedRoles.includes(userRole);

  if (!hasRequiredRole) {
    // If redirectTo is specified, we've already initiated the redirect in the useEffect
    // This fallback will briefly show before the redirect happens
    
    // Show fallback UI or access denied message
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div 
        ref={accessDeniedRef}
        className="p-8 flex flex-col items-center justify-center text-center"
        tabIndex={-1} // Make it focusable for screen readers but not in the normal tab sequence
        role="alert"
        aria-live="assertive"
      >
        <div className="rounded-full bg-red-100 p-3 mb-4">
          <Shield className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6 max-w-md">
          You do not have the required permissions to view this content.
          {userRole && (
            <span className="block mt-2">
              Your current role is <strong>{userRole}</strong>, but you need to be a <strong>{allowedRoles.join(' or ')}</strong>.
            </span>
          )}
        </p>
        <Button 
          ref={dashboardButtonRef}
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Return to Dashboard
        </Button>
      </div>
    );
  }

  // User has the required role, render children
  return <>{children}</>;
}; 