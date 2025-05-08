import { RoleGate } from "@/components/auth/role-gate";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs";
import { AuditLogView } from "./audit-log-view";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default async function AuditLogPage() {
  const { userId: clerkId } = auth();
  
  if (!clerkId) {
    redirect("/login");
  }
  
  // Fetch user data to check if the current user is an admin
  const currentUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { role: true }
  });
  
  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    redirect("/unauthorized");
  }
  
  // Try to fetch recent audit logs - 
  // We'll need to check if the table exists first as it might be a new addition
  let auditLogs = [];
  try {
    auditLogs = await prisma.auditLog.findMany({
      take: 100, // Limit to 100 most recent logs
      orderBy: {
        createdAt: "desc"
      },
      include: {
        performedBy: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        },
        targetUser: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    });
  } catch (error) {
    // If this fails (e.g. because the table doesn't exist yet), we'll just show an empty log
    console.error("Error fetching audit logs:", error);
  }

  return (
    <RoleGate allowedRoles={[UserRole.ADMIN]} redirectTo="/unauthorized">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Security Audit Log</h1>
          <p className="text-muted-foreground">
            Monitor security events and role changes across the platform
          </p>
        </div>
        
        {auditLogs.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                No Audit Logs Available
              </CardTitle>
              <CardDescription>
                Audit logging has been added to the system, but no events have been recorded yet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The audit log will track important security events including:
              </p>
              <ul className="mt-2 list-disc pl-5 text-sm">
                <li>User role changes</li>
                <li>User creation and deletion</li>
                <li>Authentication events</li>
                <li>System settings changes</li>
              </ul>
              <p className="mt-4 text-sm">
                Events will appear here as they occur. You may need to run a database migration
                to create the audit log table if this is a new installation.
              </p>
            </CardContent>
          </Card>
        ) : (
          <AuditLogView initialAuditLogs={auditLogs} />
        )}
      </div>
    </RoleGate>
  );
} 