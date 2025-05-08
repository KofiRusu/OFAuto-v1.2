"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

interface ClientListProps {
  initialClients: Client[];
  role: UserRole;
}

export function ClientList({ initialClients, role }: ClientListProps) {
  const { toast } = useToast();
  
  // Query to fetch all clients
  const { 
    data: clients = initialClients,
    isLoading,
    error: fetchError
  } = trpc.client.getAll.useQuery(undefined, {
    initialData: initialClients,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Get tRPC utils for cache invalidation
  const utils = trpc.useUtils();
  
  // Delete client mutation
  const deleteClient = trpc.client.delete.useMutation({
    onSuccess: () => {
      // Refetch clients after deletion
      utils.client.getAll.invalidate();
      toast({
        title: "Client deleted",
        description: "The client has been successfully deleted."
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete client",
        description: error.message || "An error occurred while deleting the client.",
        variant: "destructive"
      });
    }
  });
  
  const handleDeleteClient = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete client "${name}"?`)) {
      deleteClient.mutate({ id });
    }
  };
  
  // Check if user can manage clients
  const canManage = [UserRole.ADMIN, UserRole.MANAGER].includes(role);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          Error loading clients: {fetchError.message}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-4 font-semibold text-sm text-gray-600">Name</th>
              <th className="p-4 font-semibold text-sm text-gray-600">Email</th>
              <th className="p-4 font-semibold text-sm text-gray-600">Phone</th>
              {role === UserRole.ADMIN && (
                <th className="p-4 font-semibold text-sm text-gray-600">Manager</th>
              )}
              <th className="p-4 font-semibold text-sm text-gray-600">Created</th>
              <th className="p-4 font-semibold text-sm text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium">
                  <Link href={`/dashboard/clients/${client.id}`} className="text-blue-600 hover:text-blue-800">
                    {client.name}
                  </Link>
                </td>
                <td className="p-4">{client.email || "—"}</td>
                <td className="p-4">{client.phone || "—"}</td>
                {role === UserRole.ADMIN && (
                  <td className="p-4">
                    {client.user?.name || client.user?.email || "—"}
                  </td>
                )}
                <td className="p-4 text-sm text-gray-600">
                  {formatDate(client.createdAt)}
                </td>
                <td className="p-4">
                  <div className="flex space-x-2">
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      View
                    </Link>
                    {canManage && (
                      <>
                        <Link
                          href={`/dashboard/clients/${client.id}/edit`}
                          className="text-green-600 hover:text-green-800 text-xs font-medium"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteClient(client.id, client.name)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                          disabled={deleteClient.isPending}
                        >
                          {deleteClient.isPending && deleteClient.variables?.id === client.id ? (
                            <span className="flex items-center">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Deleting...
                            </span>
                          ) : (
                            "Delete"
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {clients.length === 0 && (
        <div className="p-6 text-center text-gray-500">
          No clients found. {canManage && (
            <Link href="/dashboard/clients/create" className="text-blue-600 hover:text-blue-800">
              Add your first client
            </Link>
          )}
        </div>
      )}
    </div>
  );
} 