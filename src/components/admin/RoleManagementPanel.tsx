'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/modal';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Info, Lock, Search, Shield, UserPlus, X } from 'lucide-react';

// Role definitions with permissions
const ROLES = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access with all permissions',
    color: 'bg-red-100 text-red-800 hover:bg-red-200',
    permissions: [
      'manage_users',
      'manage_roles',
      'view_analytics',
      'edit_content',
      'delete_content',
      'manage_settings',
      'view_reports',
      'manage_teams',
    ],
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Team management and content oversight',
    color: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
    permissions: [
      'view_analytics',
      'edit_content',
      'view_reports',
      'manage_teams',
    ],
  },
  {
    id: 'creator',
    name: 'Creator',
    description: 'Content creation and management',
    color: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    permissions: [
      'edit_content',
    ],
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to content',
    color: 'bg-green-100 text-green-800 hover:bg-green-200',
    permissions: [],
  },
];

// List of permissions with descriptions
const PERMISSIONS = [
  { id: 'manage_users', name: 'Manage Users', description: 'Create, edit, and delete user accounts' },
  { id: 'manage_roles', name: 'Manage Roles', description: 'Create, edit, and assign roles' },
  { id: 'view_analytics', name: 'View Analytics', description: 'Access analytics dashboards and reports' },
  { id: 'edit_content', name: 'Edit Content', description: 'Create and edit content' },
  { id: 'delete_content', name: 'Delete Content', description: 'Remove content from the platform' },
  { id: 'manage_settings', name: 'Manage Settings', description: 'Configure system and application settings' },
  { id: 'view_reports', name: 'View Reports', description: 'Access financial and operational reports' },
  { id: 'manage_teams', name: 'Manage Teams', description: 'Create and manage team structures' },
];

// Mock user data
const MOCK_USERS = [
  { id: 1, name: 'Jane Smith', email: 'jane@example.com', role: 'admin', status: 'active' },
  { id: 2, name: 'John Doe', email: 'john@example.com', role: 'manager', status: 'active' },
  { id: 3, name: 'Alice Johnson', email: 'alice@example.com', role: 'creator', status: 'active' },
  { id: 4, name: 'Bob Williams', email: 'bob@example.com', role: 'viewer', status: 'inactive' },
  { id: 5, name: 'Emily Davis', email: 'emily@example.com', role: 'creator', status: 'active' },
  { id: 6, name: 'Michael Brown', email: 'michael@example.com', role: 'manager', status: 'active' },
];

interface RoleManagementPanelProps {
  initialUsers?: typeof MOCK_USERS;
  initialRoles?: typeof ROLES;
  onUserUpdate?: (user: any) => void;
  onRoleUpdate?: (role: any) => void;
}

export function RoleManagementPanel({
  initialUsers = MOCK_USERS,
  initialRoles = ROLES,
  onUserUpdate,
  onRoleUpdate,
}: RoleManagementPanelProps) {
  const [users, setUsers] = useState(initialUsers);
  const [roles, setRoles] = useState(initialRoles);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  
  // Modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingRole, setEditingRole] = useState<any>(null);
  
  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle opening user edit modal
  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setShowUserModal(true);
  };
  
  // Handle opening role edit modal
  const handleEditRole = (role: any) => {
    setEditingRole(role);
    setShowRoleModal(true);
  };
  
  // Handle updating user
  const handleUserUpdate = (updatedUser: any) => {
    const updatedUsers = users.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    );
    setUsers(updatedUsers);
    setShowUserModal(false);
    setEditingUser(null);
    if (onUserUpdate) {
      onUserUpdate(updatedUser);
    }
  };
  
  // Handle updating role
  const handleRoleUpdate = (updatedRole: any) => {
    const updatedRoles = roles.map(role => 
      role.id === updatedRole.id ? updatedRole : role
    );
    setRoles(updatedRoles);
    setShowRoleModal(false);
    setEditingRole(null);
    if (onRoleUpdate) {
      onRoleUpdate(updatedRole);
    }
  };
  
  // Get role by ID
  const getRoleById = (roleId: string) => {
    return roles.find(role => role.id === roleId);
  };
  
  // Render role badge
  const renderRoleBadge = (roleId: string) => {
    const role = getRoleById(roleId);
    if (!role) return null;
    
    return (
      <Badge className={role.color}>
        {role.name}
      </Badge>
    );
  };
  
  // User edit modal
  const UserEditModal = () => {
    if (!editingUser) return null;
    
    const [userData, setUserData] = useState({
      ...editingUser
    });
    
    const handleChange = (field: string, value: any) => {
      setUserData(prev => ({
        ...prev,
        [field]: value
      }));
    };
    
    return (
      <Modal
        open={showUserModal}
        onClose={() => setShowUserModal(false)}
      >
        <ModalHeader>
          <ModalTitle>Edit User</ModalTitle>
          <ModalDescription>Update user details and permissions</ModalDescription>
        </ModalHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="user-name">Name</Label>
            <input
              id="user-name"
              value={userData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="user-email">Email</Label>
            <input
              id="user-email"
              type="email"
              value={userData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="user-role">Role</Label>
            <select
              id="user-role"
              value={userData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground">
              {getRoleById(userData.role)?.description}
            </p>
          </div>
          
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="user-status">Active Status</Label>
              <Switch
                id="user-status"
                checked={userData.status === 'active'}
                onCheckedChange={(checked) => handleChange('status', checked ? 'active' : 'inactive')}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Inactive users cannot log in to the system
            </p>
          </div>
        </div>
        
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowUserModal(false)}>
            Cancel
          </Button>
          <Button onClick={() => handleUserUpdate(userData)}>
            Save Changes
          </Button>
        </ModalFooter>
      </Modal>
    );
  };
  
  // Role edit modal
  const RoleEditModal = () => {
    if (!editingRole) return null;
    
    const [roleData, setRoleData] = useState({
      ...editingRole
    });
    
    const handleTogglePermission = (permissionId: string) => {
      const updatedPermissions = [...roleData.permissions];
      
      if (updatedPermissions.includes(permissionId)) {
        // Remove permission
        const index = updatedPermissions.indexOf(permissionId);
        updatedPermissions.splice(index, 1);
      } else {
        // Add permission
        updatedPermissions.push(permissionId);
      }
      
      setRoleData(prev => ({
        ...prev,
        permissions: updatedPermissions
      }));
    };
    
    return (
      <Modal
        open={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        size="lg"
      >
        <ModalHeader>
          <ModalTitle>Edit Role: {roleData.name}</ModalTitle>
          <ModalDescription>Configure permissions for this role</ModalDescription>
        </ModalHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="role-name">Role Name</Label>
            <input
              id="role-name"
              value={roleData.name}
              onChange={(e) => setRoleData(prev => ({ ...prev, name: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="role-description">Description</Label>
            <input
              id="role-description"
              value={roleData.description}
              onChange={(e) => setRoleData(prev => ({ ...prev, description: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          
          <div className="pt-2">
            <Label className="text-base">Permissions</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Select the permissions granted to users with this role
            </p>
            
            <div className="grid gap-4 mt-2">
              {PERMISSIONS.map(permission => (
                <div 
                  key={permission.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div>
                    <p className="font-medium">{permission.name}</p>
                    <p className="text-sm text-muted-foreground">{permission.description}</p>
                  </div>
                  <Switch
                    id={`permission-${permission.id}`}
                    checked={roleData.permissions.includes(permission.id)}
                    onCheckedChange={() => handleTogglePermission(permission.id)}
                    aria-label={`Toggle ${permission.name} permission`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <ModalFooter className="flex justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              <Info className="h-4 w-4 inline mr-1" />
              Changes will affect all users with this role
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowRoleModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleRoleUpdate(roleData)}>
              Save Changes
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    );
  };
  
  return (
    <div>
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center">
            <Shield className="h-6 w-6 mr-2 text-primary" aria-hidden="true" />
            <CardTitle>Role-Based Access Control</CardTitle>
          </div>
          <CardDescription>
            Manage users, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="roles">Roles</TabsTrigger>
            </TabsList>
            
            <TabsContent value="users">
              <div className="flex justify-between items-center mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex h-10 w-full md:w-[300px] rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm"
                    aria-label="Search users"
                  />
                </div>
                <Button size="sm" onClick={() => {
                  setEditingUser({
                    id: users.length + 1,
                    name: '',
                    email: '',
                    role: 'viewer',
                    status: 'active'
                  });
                  setShowUserModal(true);
                }}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{renderRoleBadge(user.role)}</TableCell>
                          <TableCell>
                            <Badge variant={user.status === 'active' ? 'default' : 'outline'}>
                              {user.status === 'active' ? (
                                <Check className="h-3 w-3 mr-1" />
                              ) : (
                                <X className="h-3 w-3 mr-1" />
                              )}
                              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No users found matching your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="roles">
              <div className="grid gap-4">
                {roles.map(role => (
                  <Card key={role.id} className="w-full">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{role.name}</CardTitle>
                          <Badge className={role.color}>{role.id}</Badge>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleEditRole(role)}>
                          Edit Role
                        </Button>
                      </div>
                      <CardDescription>{role.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <h4 className="text-sm font-medium mb-2">Permissions</h4>
                      <div className="flex flex-wrap gap-2">
                        {role.permissions.length > 0 ? (
                          role.permissions.map(permId => {
                            const permission = PERMISSIONS.find(p => p.id === permId);
                            return permission ? (
                              <Badge key={permId} variant="outline" className="rounded-full">
                                {permission.name}
                              </Badge>
                            ) : null;
                          })
                        ) : (
                          <p className="text-sm text-muted-foreground flex items-center">
                            <Lock className="h-4 w-4 mr-1" />
                            No permissions (view-only access)
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {showUserModal && <UserEditModal />}
      {showRoleModal && <RoleEditModal />}
    </div>
  );
} 