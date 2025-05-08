"use client";

import { useState } from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { trpc } from "@/lib/trpc/client";
import { Loader2, LinkIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { ConnectionStatusBadge } from "@/components/status-badges";

export default function CRMIntegrationPage() {
  const { toast } = useToast();
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>("");
  const [formData, setFormData] = useState({
    apiKey: "",
    domain: "",
  });

  // Get all clients
  const { data: clients, isLoading: loadingClients } = trpc.client.getAll.useQuery();

  // Get client's CRM connections once a client is selected
  const { 
    data: clientCrmConnections,
    isLoading: loadingConnections,
    refetch: refetchConnections
  } = trpc.client.getClientCrmConnections.useQuery(
    { clientId: selectedClientId },
    { enabled: !!selectedClientId }
  );

  // Get CRM status when a connection is selected
  const {
    data: crmStatus,
    isLoading: loadingStatus,
    refetch: refetchStatus
  } = trpc.crm.getCrmStatus.useQuery(
    { connectionId: selectedConnectionId },
    { enabled: !!selectedConnectionId }
  );

  // Get CRM accounts when a connection is selected
  const {
    data: crmAccounts,
    isLoading: loadingAccounts,
    refetch: refetchAccounts
  } = trpc.crm.listCrmAccounts.useQuery(
    { connectionId: selectedConnectionId },
    { 
      enabled: !!selectedConnectionId && !!crmStatus?.connected,
      retry: false
    }
  );

  // Connect CRM mutation
  const connectCrmMutation = trpc.crm.connectCrm.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "CRM Connected",
          description: "Successfully connected to CRM service.",
          variant: "default",
        });
        
        // Set the newly created connection as selected
        setSelectedConnectionId(data.connection.id);
        
        // Refetch the client's connections
        refetchConnections();
      } else {
        toast({
          title: "Connection Failed",
          description: data.message || "Failed to connect to CRM. Please check your credentials.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Connection Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission for connecting CRM
  const handleConnectCrm = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClientId) {
      toast({
        title: "Client Required",
        description: "Please select a client to connect a CRM.",
        variant: "destructive",
      });
      return;
    }
    
    connectCrmMutation.mutate({
      clientId: selectedClientId,
      apiKey: formData.apiKey,
      domain: formData.domain,
    });
  };

  // Handle connection selection change
  const handleConnectionChange = (connectionId: string) => {
    setSelectedConnectionId(connectionId);
    refetchStatus();
    if (crmStatus?.connected) {
      refetchAccounts();
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">CRM Integration</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Client Selection</CardTitle>
            <CardDescription>
              Choose the client to manage CRM integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedClientId}
              onValueChange={setSelectedClientId}
              disabled={loadingClients}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* CRM Connection Form */}
        <Card>
          <CardHeader>
            <CardTitle>Connect CRM</CardTitle>
            <CardDescription>
              Enter your CRM credentials to connect
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleConnectCrm} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">CRM Domain</Label>
                <Input
                  id="domain"
                  name="domain"
                  placeholder="your-company.crm.com"
                  value={formData.domain}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  name="apiKey"
                  type="password"
                  placeholder="Your CRM API Key"
                  value={formData.apiKey}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={
                  !selectedClientId || 
                  connectCrmMutation.isLoading ||
                  !formData.domain ||
                  !formData.apiKey
                }
              >
                {connectCrmMutation.isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {!connectCrmMutation.isLoading && (
                  <LinkIcon className="mr-2 h-4 w-4" />
                )}
                Connect CRM
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* CRM Connections */}
      {selectedClientId && clientCrmConnections && clientCrmConnections.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Active CRM Connections</CardTitle>
            <CardDescription>
              Manage your existing CRM connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="connections" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="connections">Connections</TabsTrigger>
                <TabsTrigger 
                  value="accounts" 
                  disabled={!selectedConnectionId || !crmStatus?.connected}
                >
                  Accounts
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="connections">
                <div className="space-y-4">
                  <div className="my-4">
                    <Select
                      value={selectedConnectionId}
                      onValueChange={handleConnectionChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a connection" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientCrmConnections.map((conn) => (
                          <SelectItem key={conn.id} value={conn.id}>
                            {conn.domain}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedConnectionId && (
                    <div className="rounded-lg border p-4">
                      {loadingStatus ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : crmStatus ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Status:</span>
                            <div className="flex items-center">
                              {crmStatus.connected ? (
                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                              ) : (
                                <AlertCircle className="mr-2 h-4 w-4 text-amber-500" />
                              )}
                              <span>{crmStatus.connected ? "Connected" : "Disconnected"}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Domain:</span>
                            <span>{crmStatus.domain}</span>
                          </div>
                          {crmStatus.lastSyncedAt && (
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Last Synced:</span>
                              <span>{new Date(crmStatus.lastSyncedAt).toLocaleString()}</span>
                            </div>
                          )}
                          {crmStatus.error && (
                            <div className="mt-2 rounded-md bg-red-50 p-2 text-red-600">
                              {crmStatus.error}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          No status information available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="accounts">
                {loadingAccounts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : crmAccounts && crmAccounts.accounts.length > 0 ? (
                  <Table>
                    <TableCaption>
                      {crmAccounts.count} accounts from your CRM
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {crmAccounts.accounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">{account.name}</TableCell>
                          <TableCell>{account.email || "-"}</TableCell>
                          <TableCell>{account.phone || "-"}</TableCell>
                          <TableCell>{account.type || "Standard"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No accounts found in your CRM
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 