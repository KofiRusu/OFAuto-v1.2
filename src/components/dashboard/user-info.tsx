"use client";

import { UserButton } from "@clerk/nextjs";
import { trpc } from "@/lib/trpc/client";

export function UserInfo() {
  const { data: user, isLoading } = trpc.user.current.useQuery();

  return (
    <div className="flex items-center gap-4">
      {isLoading ? (
        <div className="text-sm text-gray-600">Loading...</div>
      ) : user ? (
        <div className="text-sm text-gray-600">
          <span className="font-medium">{user.name || user.email}</span>
          <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
            {user.role}
          </span>
        </div>
      ) : null}
      <UserButton afterSignOutUrl="/" />
    </div>
  );
} 