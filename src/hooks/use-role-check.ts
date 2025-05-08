import { useUser } from "@clerk/nextjs";
import { UserRole } from "@prisma/client";
import { useEffect, useState } from "react";

interface UseRoleCheckOptions {
  fallbackRole?: UserRole;
  onRoleLoaded?: (role: UserRole) => void;
}

export function useRoleCheck(
  requiredRole?: UserRole | UserRole[],
  options: UseRoleCheckOptions = {}
) {
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Convert required role to array for easier comparison
  const requiredRoles = requiredRole
    ? Array.isArray(requiredRole)
      ? requiredRole
      : [requiredRole]
    : [];

  useEffect(() => {
    if (!isLoaded || !user) {
      // If user is not loaded or authenticated, set loading to false
      setIsLoadingRole(false);
      return;
    }

    const fetchUserRole = async () => {
      try {
        const response = await fetch(`/api/user/role?userId=${user.id}`);
        if (!response.ok) {
          throw new Error(`Error fetching user role: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.role) {
          const role = data.role as UserRole;
          setUserRole(role);
          
          // Call onRoleLoaded callback if provided
          if (options.onRoleLoaded) {
            options.onRoleLoaded(role);
          }
        } else {
          // If role is not found in response, use fallback if provided
          if (options.fallbackRole) {
            setUserRole(options.fallbackRole);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error);
        setError(error instanceof Error ? error : new Error(String(error)));
        
        // Use fallback role if provided
        if (options.fallbackRole) {
          setUserRole(options.fallbackRole);
        }
      } finally {
        setIsLoadingRole(false);
      }
    };

    fetchUserRole();
  }, [isLoaded, user, options.fallbackRole, options.onRoleLoaded]);

  // Check if user has required role
  const hasRequiredRole = Boolean(
    userRole && 
    (requiredRoles.length === 0 || requiredRoles.includes(userRole))
  );
  
  // Return role and permission information
  return {
    userRole,                 // The user's role
    isLoading: isLoadingRole, // If we're still loading the role
    isLoadingUser: !isLoaded, // If we're still loading the user from Clerk
    hasRequiredRole,          // If the user has the required role
    isAdmin: userRole === UserRole.ADMIN,
    isManager: userRole === UserRole.MANAGER || userRole === UserRole.ADMIN, // Managers and above
    isUser: Boolean(userRole), // Any authenticated user with a role
    error                     // Any error that occurred
  };
} 