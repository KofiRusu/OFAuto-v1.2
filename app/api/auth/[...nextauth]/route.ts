import { clerkClient } from "@clerk/nextjs";
import { authMiddleware } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const GET = async (req: NextRequest) => {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const user = await clerkClient.users.getUser(userId);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Check if user exists in our database
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    
    // If not, create the user
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          clerkId: userId,
          email: user.emailAddresses[0]?.emailAddress || "",
          name: `${user.firstName} ${user.lastName}`,
        },
      });
    }
    
    return NextResponse.json({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
    });
  } catch (error) {
    console.error("Error in auth route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};

// Import auth function from Clerk
import { auth } from "@clerk/nextjs";

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}; 