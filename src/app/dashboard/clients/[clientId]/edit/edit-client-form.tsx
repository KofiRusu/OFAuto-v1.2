"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  userId: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

type Manager = {
  id: string;
  name: string | null;
  email: string;
};

interface EditClientFormProps {
  client: Client;
  isAdmin: boolean;
  managers?: Manager[];
}

export function EditClientForm({ client, isAdmin, managers }: EditClientFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: client.name,
    email: client.email || "",
    phone: client.phone || "",
    userId: client.userId,
  });
  
  // Get tRPC utils for cache invalidation
  const utils = trpc.useUtils();
  
  // Update client mutation
  const updateClient = trpc.client.update.useMutation({
    onSuccess: (updatedClient) => {
      // Invalidate queries
      utils.client.getAll.invalidate();
      utils.client.getById.invalidate({ id: client.id });
      
      // Redirect to client details
      router.push(`/dashboard/clients/${client.id}`);
      router.refresh();
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    updateClient.mutate({
      id: client.id,
      ...formData,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {updateClient.error && (
        <div className="bg-red-50 text-red-600 p-3 rounded">
          {updateClient.error.message || "An error occurred while updating the client"}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Client Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {isAdmin && managers && (
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
              Assigned Manager
            </label>
            <select
              id="userId"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name || manager.email}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          disabled={updateClient.isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={updateClient.isPending}
        >
          {updateClient.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
} 