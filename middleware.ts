import { authMiddleware, clerkClient } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { prisma } from "./lib/prisma";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/api/health",
    "/login",
    "/register",
    "/api/webhook/clerk",
    "/api/webhook/stripe",
  ],
  afterAuth: async (auth, req) => {
    // If the user is authenticated and accessing a protected route
    if (auth.userId && !auth.isPublicRoute) {
      try {
        // Check if the user exists in our database
        const dbUser = await prisma.user.findUnique({
          where: { clerkId: auth.userId },
          select: { id: true, role: true },
        });

        // If the user doesn't exist in our database yet, create them
        if (!dbUser) {
          const clerkUser = await clerkClient.users.getUser(auth.userId);
          
          await prisma.user.create({
            data: {
              clerkId: auth.userId,
              email: clerkUser.emailAddresses[0]?.emailAddress || "",
              name: `${clerkUser.firstName} ${clerkUser.lastName}`,
            },
          });
        }

        // Add user ID to headers for downstream use
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set("x-user-id", auth.userId);
        
        // Add audit logging for sensitive operations
        if (
          ["POST", "PUT", "PATCH", "DELETE"].includes(req.method) &&
          req.nextUrl.pathname.startsWith("/api/")
        ) {
          // Log the request for auditing
          await prisma.auditLog.create({
            data: {
              action: `${req.method}_REQUEST`,
              entityType: "API",
              entityId: req.nextUrl.pathname,
              userId: dbUser?.id,
              ipAddress: req.ip,
              userAgent: req.headers.get("user-agent") || "",
            },
          });
        }

        // Continue with the modified request
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } catch (error) {
        console.error("Error in middleware:", error);
        // Continue without modifications in case of error
        return NextResponse.next();
      }
    }

    // For public routes or unauthenticated users
    return NextResponse.next();
  },
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}; 