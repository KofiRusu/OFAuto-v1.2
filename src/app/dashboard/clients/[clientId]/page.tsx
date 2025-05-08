import { auth } from "@clerk/nextjs";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { formatDate } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import { PlatformConnections } from "@/components/platform/PlatformConnections";

interface ClientDetailsPageProps {
  params: {
    clientId: string;
  };
}

export default async function ClientDetailsPage({ params }: ClientDetailsPageProps) {
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
  
  // Check if user has access to this client
  if (currentUser.role !== UserRole.ADMIN && client.userId !== userId) {
    redirect("/dashboard/clients");
  }
  
  const canManage = [UserRole.ADMIN, UserRole.MANAGER].includes(currentUser.role);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link 
            href="/dashboard/clients" 
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← Back to Clients
          </Link>
          <h1 className="text-2xl font-bold mt-2">{client.name}</h1>
        </div>
        
        {canManage && (
          <Link
            href={`/dashboard/clients/${client.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Edit Client
          </Link>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold">Contact Information</h2>
            <div className="mt-4 space-y-3">
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div>{client.email || "—"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Phone</div>
                <div>{client.phone || "—"}</div>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold">Client Details</h2>
            <div className="mt-4 space-y-3">
              {currentUser.role === UserRole.ADMIN && (
                <div>
                  <div className="text-sm text-gray-500">Managed By</div>
                  <div>{client.user?.name || client.user?.email || "—"}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-500">Created</div>
                <div>{formatDate(client.createdAt)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Last Updated</div>
                <div>{formatDate(client.updatedAt)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Platform Connections */}
      <PlatformConnections clientId={clientId} />
    </div>
  );
} 