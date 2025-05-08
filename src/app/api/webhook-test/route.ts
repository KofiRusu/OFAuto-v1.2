import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { prisma } from "@/lib/db/prisma";
import { UserRole } from "@prisma/client";

// This is a development-only endpoint for testing webhook functionality
export async function POST(req: NextRequest) {
  // Only allow in development environment
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }
  
  const { userId: clerkId } = auth();
  
  if (!clerkId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  // Verify that the requesting user is an admin
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, role: true }
  });
  
  if (!user || user.role !== UserRole.ADMIN) {
    return NextResponse.json(
      { error: "Forbidden: Administrator access required" },
      { status: 403 }
    );
  }
  
  try {
    const body = await req.json();
    const { type, data } = body;
    
    if (!type || !data) {
      return NextResponse.json(
        { error: "Missing required fields: type, data" },
        { status: 400 }
      );
    }
    
    let result;
    
    // Simulate the Clerk webhook handler
    switch (type) {
      case "user.created": {
        // Create a user record as if Clerk had sent the webhook
        const newUser = await prisma.user.create({
          data: {
            clerkId: data.id || `sim-${Date.now()}`,
            email: data.email || `test-${Date.now()}@example.com`,
            name: data.name || `Test User ${Date.now()}`,
            role: UserRole.USER  // Default role for new users
          }
        });
        
        result = { 
          success: true, 
          message: "Simulated user creation successful", 
          user: newUser 
        };
        break;
      }
      
      case "user.updated": {
        // Update an existing user
        if (!data.id) {
          return NextResponse.json(
            { error: "Missing user ID for update" },
            { status: 400 }
          );
        }
        
        const updatedUser = await prisma.user.update({
          where: { clerkId: data.id },
          data: {
            email: data.email,
            name: data.name
          }
        });
        
        result = { 
          success: true, 
          message: "Simulated user update successful", 
          user: updatedUser 
        };
        break;
      }
      
      case "user.deleted": {
        // Delete a user
        if (!data.id) {
          return NextResponse.json(
            { error: "Missing user ID for deletion" },
            { status: 400 }
          );
        }
        
        const deletedUser = await prisma.user.delete({
          where: { clerkId: data.id }
        });
        
        result = { 
          success: true, 
          message: "Simulated user deletion successful", 
          user: deletedUser 
        };
        break;
      }
      
      default:
        return NextResponse.json(
          { error: `Unsupported webhook type: ${type}` },
          { status: 400 }
        );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in webhook test:", error);
    
    return NextResponse.json(
      { 
        error: "Error processing webhook test", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 