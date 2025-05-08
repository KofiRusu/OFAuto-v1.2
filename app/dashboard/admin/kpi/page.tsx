"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@clerk/nextjs";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Icons } from "@/components/ui/icons";
import { toast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/spinner";
import Forbidden from "@/components/forbidden";

export default function KpiManagementPage() {
  const router = useRouter();
  const { userId, sessionClaims } = useAuth();
  
  // Get the user role from sessionClaims
  const userRole = sessionClaims?.userRole || "USER";
  
  // Check if the user has manager or admin access
  const hasAccess = userRole === "MANAGER" || userRole === "ADMIN";

  // Form state for creating new KPI
  const [name, setName] = useState("");
  const [targetValue, setTargetValue] = useState<string>("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  // Query for user list (models)
  const {
    data: users,
    isLoading: isLoadingUsers,
  } = trpc.user.getUsers.useQuery(
    { role: "MODEL" },
    { enabled: hasAccess }
  );

  // Query for KPIs
  const {
    data: kpis,
    isLoading: isLoadingKpis,
    refetch: refetchKpis,
  } = trpc.kpi.listKpis.useQuery(
    { 
      userId: selectedUser,
      status: statusFilter as any,
    },
    { enabled: hasAccess }
  );

  // Mutation for creating a KPI
  const createKpiMutation = trpc.kpi.createKpi.useMutation({
    onSuccess: () => {
      toast({
        title: "KPI Created",
        description: "New KPI has been successfully created.",
      });
      // Reset form
      setName("");
      setTargetValue("");
      setDueDate(undefined);
      // Refresh KPI list
      refetchKpis();
    },
    onError: (error) => {
      toast({
        title: "Error Creating KPI",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating a KPI
  const updateKpiMutation = trpc.kpi.updateKpi.useMutation({
    onSuccess: () => {
      toast({
        title: "KPI Updated",
        description: "KPI has been successfully updated.",
      });
      refetchKpis();
    },
    onError: (error) => {
      toast({
        title: "Error Updating KPI",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting a KPI
  const deleteKpiMutation = trpc.kpi.deleteKpi.useMutation({
    onSuccess: () => {
      toast({
        title: "KPI Deleted",
        description: "KPI has been successfully deleted.",
      });
      refetchKpis();
    },
    onError: (error) => {
      toast({
        title: "Error Deleting KPI",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle creating a new KPI
  const handleCreateKpi = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      toast({
        title: "Error",
        description: "Please select a user",
        variant: "destructive",
      });
      return;
    }

    if (!name || !targetValue) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createKpiMutation.mutate({
      userId: selectedUser,
      name,
      targetValue: parseFloat(targetValue),
      dueDate,
    });
  };

  // Handle viewing KPI details
  const handleViewKpi = (kpiId: string) => {
    router.push(`/dashboard/admin/kpi/${kpiId}`);
  };

  // Handle updating KPI status
  const handleUpdateStatus = (kpiId: string, status: string) => {
    updateKpiMutation.mutate({
      id: kpiId,
      status: status as any,
    });
  };

  // Handle deleting a KPI
  const handleDeleteKpi = (kpiId: string) => {
    if (confirm("Are you sure you want to delete this KPI?")) {
      deleteKpiMutation.mutate({ id: kpiId });
    }
  };

  // Calculate progress percentage
  const calculateProgress = (current: number, target: number) => {
    const progress = (current / target) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  // Get badge variant based on status
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "AT_RISK":
        return "destructive";
      case "IN_PROGRESS":
      default:
        return "default";
    }
  };

  // If user has no access, show forbidden page
  if (!hasAccess) {
    return <Forbidden />;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">KPI & Objective Management</h1>
        <Button variant="outline" onClick={() => router.push('/dashboard/admin')}>
          <Icons.arrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Create KPI Form */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Create New KPI</CardTitle>
            <CardDescription>Set measurable objectives for your team</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateKpi} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user">User</Label>
                <Select 
                  value={selectedUser} 
                  onValueChange={setSelectedUser}
                >
                  <SelectTrigger id="user">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingUsers ? (
                      <div className="flex justify-center p-2">
                        <Spinner size="sm" />
                      </div>
                    ) : (
                      users?.users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">KPI Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Monthly Subscribers"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetValue">Target Value</Label>
                <Input
                  id="targetValue"
                  type="number"
                  placeholder="e.g., 1000"
                  min="0"
                  step="any"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      {dueDate ? (
                        format(dueDate, "PPP")
                      ) : (
                        <span className="text-muted-foreground">Select a date</span>
                      )}
                      <Icons.calendar className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={createKpiMutation.isLoading}
              >
                {createKpiMutation.isLoading ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create KPI"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* KPI List */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>KPI List</CardTitle>
            <CardDescription>Manage and track your team's objectives</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col sm:flex-row gap-2">
              <Select
                value={selectedUser}
                onValueChange={setSelectedUser}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={undefined}>All Users</SelectItem>
                  {!isLoadingUsers && users?.users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={undefined}>All Statuses</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="AT_RISK">At Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {isLoadingKpis ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : kpis && kpis.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>KPI</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kpis.map((kpi) => (
                    <TableRow key={kpi.id}>
                      <TableCell className="font-medium">
                        {kpi.name}
                        <div className="text-xs text-muted-foreground">
                          Target: {kpi.targetValue}
                        </div>
                      </TableCell>
                      <TableCell>
                        {kpi.user?.name || kpi.user?.email || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <div className="w-full space-y-1">
                          <Progress 
                            value={calculateProgress(kpi.currentValue, kpi.targetValue)} 
                            className="h-2"
                          />
                          <div className="text-xs text-muted-foreground">
                            {kpi.currentValue} / {kpi.targetValue} ({Math.round(calculateProgress(kpi.currentValue, kpi.targetValue))}%)
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(kpi.status)}>
                          {kpi.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {kpi.dueDate ? format(new Date(kpi.dueDate), "MMM d, yyyy") : "No deadline"}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewKpi(kpi.id)}
                          title="View Details"
                        >
                          <Icons.eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteKpi(kpi.id)}
                          title="Delete KPI"
                        >
                          <Icons.trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Icons.inbox className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium">No KPIs found</h3>
                <p className="mt-1">Create your first KPI using the form.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 