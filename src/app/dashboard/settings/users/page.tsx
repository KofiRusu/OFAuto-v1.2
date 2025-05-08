import { RoleGate } from "@/components/auth/role-gate";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs";
import { UserManagement } from "./user-management";

export default async function UsersPage() {
  const { userId } = auth();
  
  if (!userId) {
    redirect("/login");
  }
  
  // Fetch user data to check if the current user is an admin
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  
  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }
  
  // Fetch all users for the admin panel
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return (
    <RoleGate allowedRoles={[UserRole.ADMIN]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <UserManagement initialUsers={users} />
      </div>
    </RoleGate>
  );
} 