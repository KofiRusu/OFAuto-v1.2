import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleGate } from "@/components/auth/role-gate";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Check, X, AlertCircle, ShieldAlert, Shield, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function RolesAndPermissionsPage() {
  const { userId: clerkId } = auth();
  
  if (!clerkId) {
    redirect("/login");
  }
  
  // Fetch user data to check if the current user is a manager or admin
  const currentUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { role: true }
  });
  
  if (!currentUser || (currentUser.role !== UserRole.MANAGER && currentUser.role !== UserRole.ADMIN)) {
    redirect("/unauthorized");
  }
  
  // Define the permissions matrix
  const permissions = [
    { 
      category: "User Management",
      permissions: [
        { name: "View Users", user: false, manager: true, admin: true },
        { name: "Create Users", user: false, manager: false, admin: true },
        { name: "Modify User Roles", user: false, manager: false, admin: true },
        { name: "Delete Users", user: false, manager: false, admin: true }
      ]
    },
    {
      category: "Client Management",
      permissions: [
        { name: "View Clients", user: true, manager: true, admin: true },
        { name: "Create Clients", user: true, manager: true, admin: true },
        { name: "Edit Own Clients", user: true, manager: true, admin: true },
        { name: "Edit All Clients", user: false, manager: true, admin: true },
        { name: "Delete Clients", user: false, manager: true, admin: true }
      ]
    },
    {
      category: "Content & Campaigns",
      permissions: [
        { name: "View Content", user: true, manager: true, admin: true },
        { name: "Create Content", user: true, manager: true, admin: true },
        { name: "Schedule Posts", user: true, manager: true, admin: true },
        { name: "Create Campaigns", user: true, manager: true, admin: true },
        { name: "Modify All Campaigns", user: false, manager: true, admin: true }
      ]
    },
    {
      category: "Platform Settings",
      permissions: [
        { name: "Configure Own Platforms", user: true, manager: true, admin: true },
        { name: "Configure All Platforms", user: false, manager: true, admin: true },
        { name: "System Settings", user: false, manager: false, admin: true },
        { name: "API Configuration", user: false, manager: false, admin: true }
      ]
    },
    {
      category: "Analytics & Insights",
      permissions: [
        { name: "View Basic Analytics", user: true, manager: true, admin: true },
        { name: "View Advanced Analytics", user: false, manager: true, admin: true },
        { name: "Export Reports", user: false, manager: true, admin: true },
        { name: "Custom Reports", user: false, manager: false, admin: true }
      ]
    }
  ];

  return (
    <RoleGate 
      allowedRoles={[UserRole.MANAGER, UserRole.ADMIN]} 
      redirectTo="/unauthorized"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground">
            Learn about the different roles and their permissions in the OFAuto platform
          </p>
        </div>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Understanding User Roles</CardTitle>
              <CardDescription>
                OFAuto has three user roles with increasing levels of permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <UserIcon className="h-5 w-5" /> USER
                    </CardTitle>
                    <CardDescription>
                      Basic access role
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Users have access to basic platform features and can manage their own content, clients, and campaigns.
                      They cannot access administrative features or settings.
                    </p>
                    <ul className="mt-4 space-y-2 text-sm">
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>Create and manage own content</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>Schedule posts for connected platforms</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>View basic analytics for own content</span>
                      </li>
                      <li className="flex items-start">
                        <X className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                        <span>Cannot access administrative features</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-blue-200">
                  <CardHeader className="pb-2 bg-blue-50">
                    <CardTitle className="flex items-center gap-2 text-lg text-blue-700">
                      <Shield className="h-5 w-5" /> MANAGER
                    </CardTitle>
                    <CardDescription>
                      Elevated access role
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Managers have elevated access to platform features and can manage content across multiple users.
                      They can access most settings but cannot manage user roles.
                    </p>
                    <ul className="mt-4 space-y-2 text-sm">
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>All USER permissions</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>Manage content across all clients</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>Access advanced analytics and reports</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>Configure platform settings</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-purple-200">
                  <CardHeader className="pb-2 bg-purple-50">
                    <CardTitle className="flex items-center gap-2 text-lg text-purple-700">
                      <ShieldAlert className="h-5 w-5" /> ADMIN
                    </CardTitle>
                    <CardDescription>
                      Full access role
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Administrators have full access to all platform features and settings.
                      They can manage users, assign roles, and configure system-wide settings.
                    </p>
                    <ul className="mt-4 space-y-2 text-sm">
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>All MANAGER permissions</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>Manage users and assign roles</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>Configure system-wide settings</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>Access all platform data and metrics</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Detailed Permissions Matrix</CardTitle>
              <CardDescription>
                Breakdown of specific permissions by role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={permissions[0].category}>
                <TabsList className="mb-4 flex flex-wrap">
                  {permissions.map((group) => (
                    <TabsTrigger key={group.category} value={group.category}>
                      {group.category}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {permissions.map((group) => (
                  <TabsContent key={group.category} value={group.category}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[300px]">Permission</TableHead>
                          <TableHead className="text-center">
                            <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                              <UserIcon className="h-3 w-3 mr-1" /> USER
                            </Badge>
                          </TableHead>
                          <TableHead className="text-center">
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                              <Shield className="h-3 w-3 mr-1" /> MANAGER
                            </Badge>
                          </TableHead>
                          <TableHead className="text-center">
                            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                              <ShieldAlert className="h-3 w-3 mr-1" /> ADMIN
                            </Badge>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.permissions.map((permission, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{permission.name}</TableCell>
                            <TableCell className="text-center">
                              {permission.user ? 
                                <Check className="h-5 w-5 text-green-500 mx-auto" /> : 
                                <X className="h-5 w-5 text-red-500 mx-auto" />}
                            </TableCell>
                            <TableCell className="text-center">
                              {permission.manager ? 
                                <Check className="h-5 w-5 text-green-500 mx-auto" /> : 
                                <X className="h-5 w-5 text-red-500 mx-auto" />}
                            </TableCell>
                            <TableCell className="text-center">
                              {permission.admin ? 
                                <Check className="h-5 w-5 text-green-500 mx-auto" /> : 
                                <X className="h-5 w-5 text-red-500 mx-auto" />}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Important Notes About Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                    <Shield className="h-4 w-4 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-medium">Role Assignment</p>
                    <p className="text-sm text-muted-foreground">
                      Only administrators can assign or change user roles. Be cautious when assigning the ADMIN role as it grants full system access.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                    <Shield className="h-4 w-4 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-medium">Role Hierarchy</p>
                    <p className="text-sm text-muted-foreground">
                      Roles follow a hierarchical structure where each higher role includes all permissions from lower roles, plus additional capabilities.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                    <Shield className="h-4 w-4 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-medium">Feature Access</p>
                    <p className="text-sm text-muted-foreground">
                      Some features in the OFAuto platform are only visible to users with appropriate roles. The UI adapts automatically based on the user's role.
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGate>
  );
} 