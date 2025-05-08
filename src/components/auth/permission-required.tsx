'use client';

import { UserRole } from "@prisma/client";
import { ReactNode, ButtonHTMLAttributes, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUser } from "@clerk/nextjs";

interface PermissionRequiredProps {
  children: ReactNode;
  requiredRole: UserRole | UserRole[];
  fallback?: ReactNode;
  tooltipText?: string;
  className?: string;
  asButton?: boolean;
  buttonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
}

export function PermissionRequired({
  children,
  requiredRole,
  fallback,
  tooltipText,
  className,
  asButton = false,
  buttonProps
}: PermissionRequiredProps) {
  const { isLoaded, user } = useUser();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Convert requiredRole to array for consistency
  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  
  // Default tooltip text based on required role
  const defaultTooltipText = () => {
    if (requiredRoles.length === 1) {
      return `This action requires ${requiredRoles[0].toLowerCase()} permissions`;
    }
    return `This action requires elevated permissions`;
  };
  
  const actualTooltipText = tooltipText || defaultTooltipText();
  
  // Fetch user role
  useEffect(() => {
    if (!isLoaded || !user) {
      setLoading(false);
      return;
    }
    
    const fetchUserRole = async () => {
      try {
        const response = await fetch(`/api/user/role?userId=${user.id}`);
        const data = await response.json();
        
        if (data.role) {
          setUserRole(data.role as UserRole);
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserRole();
  }, [isLoaded, user]);
  
  // Check if user has required role
  const hasPermission = userRole && requiredRoles.includes(userRole);
  
  // If loading, show nothing temporarily
  if (loading) {
    return null;
  }
  
  // If user has permission, show the children
  if (hasPermission) {
    return <>{children}</>;
  }
  
  // If fallback is provided, show it
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Show disabled version with tooltip
  if (asButton) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={cn(
                "inline-flex items-center gap-1 opacity-60 cursor-not-allowed",
                className
              )}
              disabled
              aria-disabled="true"
              {...buttonProps}
            >
              <Lock className="h-3 w-3" />
              {children}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-sm">{actualTooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Default case for non-button elements
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "inline-flex items-center gap-1 opacity-60 cursor-not-allowed", 
              className
            )}
            aria-disabled="true"
          >
            <Lock className="h-3 w-3" />
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-sm">{actualTooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 