"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
}

interface UserAvatarProps {
  user: User;
  className?: string;
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
  status?: "online" | "offline" | "busy" | "away";
}

export function UserAvatar({
  user,
  className,
  size = "md",
  showStatus = false,
  status
}: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14"
  };

  const statusColors = {
    online: "bg-green-500",
    offline: "bg-gray-400",
    busy: "bg-red-500",
    away: "bg-yellow-500"
  };

  // Get initials from name or email
  const getInitials = () => {
    if (user.name) {
      return user.name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    } else if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <div className="relative">
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarImage src={user.avatar || undefined} alt={user.name || "User"} />
        <AvatarFallback>
          {getInitials()}
        </AvatarFallback>
      </Avatar>
      {showStatus && status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-white",
            sizeClasses.sm === sizeClasses[size] ? "h-2.5 w-2.5" : "h-3.5 w-3.5",
            statusColors[status]
          )}
        />
      )}
    </div>
  );
} 