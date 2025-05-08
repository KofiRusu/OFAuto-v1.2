'use client';

import { UserRole } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldAlert, 
  Shield, 
  User as UserIcon
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RoleIndicatorProps {
  role: UserRole;
  showTooltip?: boolean;
  size?: "sm" | "md" | "lg";
}

const ROLE_DESCRIPTIONS = {
  [UserRole.ADMIN]: "Full system access with user management capabilities",
  [UserRole.MANAGER]: "Enhanced access to manage content and clients",
  [UserRole.USER]: "Standard access to manage own content"
};

export function RoleIndicator({ 
  role, 
  showTooltip = true,
  size = "md" 
}: RoleIndicatorProps) {
  // Define sizes
  const iconSizes = {
    sm: "h-3 w-3 mr-1",
    md: "h-4 w-4 mr-1.5", 
    lg: "h-5 w-5 mr-2"
  };
  
  // Define badge styles based on role
  const getBadgeContent = () => {
    switch (role) {
      case UserRole.ADMIN:
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
            <ShieldAlert className={iconSizes[size]} /> ADMIN
          </Badge>
        );
      case UserRole.MANAGER:
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            <Shield className={iconSizes[size]} /> MANAGER
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            <UserIcon className={iconSizes[size]} /> USER
          </Badge>
        );
    }
  };

  if (showTooltip) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>{getBadgeContent()}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">
              {ROLE_DESCRIPTIONS[role]}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return getBadgeContent();
} 