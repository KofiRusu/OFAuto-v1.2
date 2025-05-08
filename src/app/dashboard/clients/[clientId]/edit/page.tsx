import { auth } from "@clerk/nextjs";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { UserRole } from "@prisma/client";
import { EditClientForm } from "./edit-client-form";

interface EditClientPageProps {
  params: {
    clientId: string;
  };
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const { clientId } = params;
  const { userId } = auth();
  
  if (!userId) {
    redirect("/login");
  }
  
  // Get user role
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  
  if (!currentUser) {
    redirect("/dashboard");
  }
  
  // Check if the user can edit clients
  const canManage = [UserRole.ADMIN, UserRole.MANAGER].includes(currentUser.role);
  
  if (!canManage) {
    redirect("/dashboard/clients");
  }
  
  // Fetch client details
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      }
    }
  });
  
  if (!client) {
    notFound();
  }
  
  // Check if the user has access to this client
  if (currentUser.role !== UserRole.ADMIN && client.userId !== userId) {
    redirect("/dashboard/clients");
  }
  
  // If admin, fetch all possible managers
  let managers = undefined;
  
  if (currentUser.role === UserRole.ADMIN) {
    managers = await prisma.user.findMany({
      where: {
        role: {
          in: [UserRole.ADMIN, UserRole.MANAGER]
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc"
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link 
            href={`/dashboard/clients/${clientId}`} 
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← Back to Client
          </Link>
          <h1 className="text-2xl font-bold mt-2">Edit {client.name}</h1>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <EditClientForm 
          client={client} 
          isAdmin={currentUser.role === UserRole.ADMIN} 
          managers={managers}
        />
      </div>
    </div>
  );
} 