"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/spinner";
import { toast } from "@/components/ui/use-toast";
import Forbidden from "@/components/forbidden";

export default function OrganizationManagementPage() {
  const router = useRouter();
  const { userId, sessionClaims } = useAuth();
  
  // Get the user role from sessionClaims
  const userRole = sessionClaims?.userRole || "USER";
  
  // Check if the user has manager or admin access
  const hasAccess = userRole === "MANAGER" || userRole === "ADMIN";

  // State for search and filtering
  const [searchQuery, setSearchQuery] = useState("");

  // Query to get all clients with organization data
  const {
    data: clientsData,
    isLoading: isLoadingClients,
    refetch: refetchClients,
  } = trpc.organization.getAllClientsWithOrgData.useQuery(
    undefined,
    {
      enabled: hasAccess,
    }
  );

  // Filtered clients based on search query
  const filteredClients = clientsData?.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Navigate to detailed client organization settings
  const viewClientSettings = (clientId: string) => {
    router.push(`/dashboard/admin/organization/${clientId}`);
  };

  // Generate new referral code for a client
  const generateReferralCodeMutation = trpc.organization.generateReferralCode.useMutation({
    onSuccess: (data) => {
      refetchClients();
      toast({
        title: "Referral Code Generated",
        description: `New referral code: ${data.referralCode}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error Generating Referral Code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle generating a new referral code
  const handleGenerateReferralCode = (clientId: string) => {
    generateReferralCodeMutation.mutate({ clientId });
  };

  // If user has no access, show forbidden page
  if (!hasAccess) {
    return <Forbidden />;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Organization Management</h1>
        <Button variant="outline" onClick={() => router.push('/dashboard/admin')}>
          <Icons.arrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Clients</CardTitle>
          <CardDescription>Manage organization settings and referral codes for clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
          
          {isLoadingClients ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : filteredClients && filteredClients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Referral Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map(client => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email || "N/A"}</TableCell>
                    <TableCell>
                      {client.referralCode ? (
                        <Badge variant="outline">{client.referralCode}</Badge>
                      ) : (
                        <span className="text-muted-foreground">No code</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={client.status === "ACTIVE" ? "success" : "secondary"}
                      >
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateReferralCode(client.id)}
                        disabled={generateReferralCodeMutation.isLoading}
                      >
                        {generateReferralCodeMutation.isLoading && generateReferralCodeMutation.variables?.clientId === client.id ? (
                          <>
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Icons.refresh className="mr-2 h-4 w-4" />
                            {client.referralCode ? "Regenerate Code" : "Generate Code"}
                          </>
                        )}
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => viewClientSettings(client.id)}
                      >
                        <Icons.settings className="mr-2 h-4 w-4" />
                        Settings
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Icons.inbox className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium">No clients found</h3>
              <p className="mt-1">Add clients or adjust your search criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 