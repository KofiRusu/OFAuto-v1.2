import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs";
import { UserRole } from "@prisma/client";

/**
 * Middleware for checking user roles
 * @param request Next.js request object
 * @param requiredRoles Array of allowed roles
 * @returns Response or null (null means authorized)
 */
export async function checkUserRole(
  request: NextRequest,
  requiredRoles: UserRole[]
): Promise<NextResponse | null> {
  try {
    const { userId: clerkId } = auth();
    
    if (!clerkId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Find user by Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkId as string },
      select: { id: true, role: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Check if user has one of the required roles
    if (!requiredRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }
    
    // User is authorized
    return null;
  } catch (error) {
    console.error("Error checking user role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Higher-order function to create role-based middleware
 * @param requiredRoles Array of allowed roles
 * @returns Middleware function
 */
export function withRoles(requiredRoles: UserRole[]) {
  return async function(request: NextRequest) {
    return await checkUserRole(request, requiredRoles);
  };
}

// Common role checks
export const isAdmin = withRoles([UserRole.ADMIN]);
export const isManagerOrAdmin = withRoles([UserRole.MANAGER, UserRole.ADMIN]);
export const isAuthenticated = withRoles([UserRole.USER, UserRole.MANAGER, UserRole.ADMIN]); 