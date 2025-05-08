import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs";
import { UserRole } from "@prisma/client";

// Log role changes for audit purposes
async function logRoleChange(
  userId: string, 
  oldRole: UserRole, 
  newRole: UserRole, 
  changedBy: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        action: 'ROLE_CHANGE',
        entityType: 'USER',
        entityId: userId,
        details: JSON.stringify({
          oldRole,
          newRole,
          changedBy
        }),
        performedById: changedBy
      }
    });
    
    console.log(`[AUDIT] User ${userId} role changed from ${oldRole} to ${newRole} by ${changedBy}`);
  } catch (error) {
    // If the audit log table doesn't exist yet, just log to console
    console.log(`[AUDIT] User ${userId} role changed from ${oldRole} to ${newRole} by ${changedBy}`);
    console.error("Error creating audit log:", error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkUserId } = auth();
    
    // Get the user ID from the query parameter or from the authenticated user
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || clerkUserId;
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if the requesting user is the same as the target user or is an admin
    if (clerkUserId !== userId) {
      // Verify the requester has admin rights
      const requester = await prisma.user.findUnique({
        where: { id: clerkUserId as string }
      });
      
      if (!requester || requester.role !== UserRole.ADMIN) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }
    }
    
    // Get user's role from the database
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
      select: { role: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ role: user.role });
  } catch (error) {
    console.error("Error fetching user role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkUserId } = auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify the requester has admin rights
    const requester = await prisma.user.findUnique({
      where: { id: clerkUserId as string }
    });
    
    if (!requester || requester.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Forbidden: Administrator access required" },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const { userId, role } = body;
    
    if (!userId || !role) {
      return NextResponse.json(
        { error: "User ID and role are required" },
        { status: 400 }
      );
    }
    
    // Validate the role
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(role as UserRole)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Get current user role before update
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // If role is unchanged, return early
    if (currentUser.role === role) {
      return NextResponse.json({
        message: "No change required - user already has this role",
        user: { id: userId, role: currentUser.role }
      });
    }
    
    // Update the user's role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: role as UserRole },
      select: { id: true, email: true, role: true }
    });
    
    // Log the role change for audit purposes
    await logRoleChange(
      userId, 
      currentUser.role, 
      role as UserRole,
      clerkUserId
    );
    
    return NextResponse.json({
      message: "User role updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    
    // Handle Prisma errors
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 