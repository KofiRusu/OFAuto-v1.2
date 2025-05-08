"use client";

import { useState } from "react";
import { UserRole } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  UserCog, 
  ShieldAlert, 
  Shield, 
  User as UserIcon,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

type User = {
  id: string;
  clerkId: string;
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
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("all");
  
  // Get all users query to enable automatic refetching
  const { data: fetchedUsers, isLoading } = trpc.user.getAll.useQuery(undefined, {
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
      
      // Reset the selected user and close the dialog
      setSelectedUser(null);
      setIsConfirmOpen(false);
      
      toast({
        title: "Role updated successfully",
        description: `${updatedUser.email} is now a ${updatedUser.role}`,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle role change confirmation
  const handleRoleChange = async () => {
    if (!selectedUser) return;
    updateRole.mutate({ userId: selectedUser.id, role: selectedUser.role });
  };
  
  // Get role badge styling
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
            <ShieldAlert className="h-3 w-3 mr-1" /> ADMIN
          </Badge>
        );
      case UserRole.MANAGER:
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            <Shield className="h-3 w-3 mr-1" /> MANAGER
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            <UserIcon className="h-3 w-3 mr-1" /> USER
          </Badge>
        );
    }
  };
  
  // Filter users based on search query and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
      
    const matchesRole = 
      selectedRoleFilter === "all" || 
      user.role === selectedRoleFilter;
      
    return matchesSearch && matchesRole;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" /> User Management
        </CardTitle>
        <CardDescription>
          Manage user roles and permissions. Only administrators can change user roles.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or name"
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedRoleFilter} onValueChange={setSelectedRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
              <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
              <SelectItem value={UserRole.USER}>User</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {updateRole.isError && (
          <div className="bg-red-50 text-red-600 p-3 mb-4 rounded flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {updateRole.error.message}
          </div>
        )}
        
        {updateRole.isSuccess && (
          <div className="bg-green-50 text-green-600 p-3 mb-4 rounded flex items-center">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            User role updated successfully
          </div>
        )}
        
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No users found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.name || "N/A"}</div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            Change Role
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change User Role</DialogTitle>
                            <DialogDescription>
                              Change the role and permissions for {user.email}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedUser && (
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <h4 className="font-medium">Current Role: {getRoleBadge(selectedUser.role)}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Select a new role to assign to this user.
                                </p>
                              </div>
                              
                              <Select
                                value={selectedUser.role}
                                onValueChange={(role) => 
                                  setSelectedUser({ ...selectedUser, role: role as UserRole })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={UserRole.USER}>User</SelectItem>
                                  <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                                  <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <div className="bg-yellow-50 p-3 rounded text-sm">
                                <h5 className="font-medium text-yellow-800">Role Permissions:</h5>
                                <ul className="mt-1 list-disc list-inside text-yellow-700">
                                  {selectedUser.role === UserRole.ADMIN && (
                                    <>
                                      <li>Full access to all system features</li>
                                      <li>Can manage users and assign roles</li>
                                      <li>Can access all client data and settings</li>
                                    </>
                                  )}
                                  {selectedUser.role === UserRole.MANAGER && (
                                    <>
                                      <li>Can manage content and campaigns</li>
                                      <li>Limited access to settings</li>
                                      <li>Cannot manage users or roles</li>
                                    </>
                                  )}
                                  {selectedUser.role === UserRole.USER && (
                                    <>
                                      <li>Basic access to the platform</li>
                                      <li>Can use assigned features only</li>
                                      <li>No access to advanced settings</li>
                                    </>
                                  )}
                                </ul>
                              </div>
                            </div>
                          )}
                          <DialogFooter>
                            <Button 
                              variant="outline" 
                              onClick={() => setSelectedUser(null)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              variant="default"
                              onClick={() => setIsConfirmOpen(true)}
                            >
                              Update Role
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Confirmation Dialog */}
        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Role Change</DialogTitle>
              <DialogDescription>
                Are you sure you want to change this user's role? This will modify their permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {selectedUser && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedUser.email}</p>
                    <p className="text-sm text-muted-foreground">
                      New role: {getRoleBadge(selectedUser.role)}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRoleChange}
                disabled={updateRole.isPending}
              >
                {updateRole.isPending ? "Updating..." : "Confirm Change"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
} 