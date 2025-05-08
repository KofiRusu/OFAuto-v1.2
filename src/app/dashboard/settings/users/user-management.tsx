"use client";

import { useState } from "react";
import { UserRole } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

interface UserManagementProps {
  initialUsers: User[];
}

export function UserManagement({ initialUsers }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Get all users query to enable automatic refetching
  const { data: fetchedUsers } = trpc.user.getAll.useQuery(undefined, {
    initialData: initialUsers,
    onSuccess: (data) => {
      setUsers(data);
    },
  });
  
  // Update user role mutation
  const updateRole = trpc.user.updateRole.useMutation({
    onSuccess: (updatedUser) => {
      // Update the local state
      setUsers(users.map(user => 
        user.id === updatedUser.id ? { ...user, role: updatedUser.role } : user
      ));
      
      // Reset the selected user
      if (selectedUser && selectedUser.id === updatedUser.id) {
        setSelectedUser({ ...selectedUser, role: updatedUser.role });
      }
      
      setIsEditing(false);
    },
  });

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    updateRole.mutate({ userId, role: newRole });
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {updateRole.error && (
        <div className="bg-red-50 text-red-600 p-3 mb-4 rounded">
          {updateRole.error.message}
        </div>
      )}
      
      {updateRole.isSuccess && (
        <div className="bg-green-50 text-green-600 p-3 mb-4 rounded">
          User role updated successfully
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-4 font-semibold text-sm text-gray-600">Name</th>
              <th className="p-4 font-semibold text-sm text-gray-600">Email</th>
              <th className="p-4 font-semibold text-sm text-gray-600">Role</th>
              <th className="p-4 font-semibold text-sm text-gray-600">Created</th>
              <th className="p-4 font-semibold text-sm text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="p-4">{user.name || "N/A"}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4">
                  {isEditing && selectedUser?.id === user.id ? (
                    <select
                      className="border rounded p-1"
                      value={selectedUser.role}
                      onChange={(e) => setSelectedUser({ 
                        ...selectedUser, 
                        role: e.target.value as UserRole 
                      })}
                      disabled={updateRole.isPending}
                    >
                      {Object.values(UserRole).map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      user.role === UserRole.ADMIN 
                        ? "bg-purple-100 text-purple-800" 
                        : user.role === UserRole.MANAGER 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-gray-100 text-gray-800"
                    }`}>
                      {user.role}
                    </span>
                  )}
                </td>
                <td className="p-4 text-sm text-gray-600">
                  {formatDate(user.createdAt)}
                </td>
                <td className="p-4">
                  {isEditing && selectedUser?.id === user.id ? (
                    <div className="flex space-x-2">
                      <button
                        className="text-green-600 hover:text-green-800 text-xs font-medium"
                        onClick={() => {
                          if (selectedUser.role !== user.role) {
                            handleRoleChange(user.id, selectedUser.role);
                          } else {
                            setIsEditing(false);
                          }
                        }}
                        disabled={updateRole.isPending}
                      >
                        {updateRole.isPending ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="text-gray-600 hover:text-gray-800 text-xs font-medium"
                        onClick={() => {
                          setIsEditing(false);
                          setSelectedUser(null);
                        }}
                        disabled={updateRole.isPending}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      onClick={() => {
                        setSelectedUser(user);
                        setIsEditing(true);
                      }}
                    >
                      Edit Role
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {users.length === 0 && (
        <div className="p-6 text-center text-gray-500">
          No users found.
        </div>
      )}
    </div>
  );
} 