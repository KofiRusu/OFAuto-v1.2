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
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function KpiDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { userId, sessionClaims } = useAuth();
  const { id } = params;

  // Get the user role from sessionClaims
  const userRole = sessionClaims?.userRole || "USER";

  // Check if the user has manager or admin access
  const isManager = userRole === "MANAGER" || userRole === "ADMIN";
  
  // State for form values
  const [kpiName, setKpiName] = useState("");
  const [targetValue, setTargetValue] = useState<string>("");
  const [currentValue, setCurrentValue] = useState<string>("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState<string>("IN_PROGRESS");
  const [ownerName, setOwnerName] = useState<string>("");
  const [ownerEmail, setOwnerEmail] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);

  // Query for KPI details
  const {
    data: kpi,
    isLoading: isLoadingKpi,
    refetch: refetchKpi,
  } = trpc.kpi.updateKpi.useQuery(
    { id },
    {
      enabled: !!id,
      onSuccess: (data) => {
        if (data) {
          setKpiName(data.name);
          setTargetValue(data.targetValue.toString());
          setCurrentValue(data.currentValue.toString());
          setDueDate(data.dueDate || undefined);
          setStatus(data.status);
          setOwnerName(data.user?.name || "");
          setOwnerEmail(data.user?.email || "");
        }
      },
    }
  );

  // Mutation for updating a KPI
  const updateKpiMutation = trpc.kpi.updateKpi.useMutation({
    onSuccess: () => {
      toast({
        title: "KPI Updated",
        description: "KPI has been successfully updated.",
      });
      setIsEditing(false);
      refetchKpi();
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
      router.push("/dashboard/admin/kpi");
    },
    onError: (error) => {
      toast({
        title: "Error Deleting KPI",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle updating a KPI
  const handleUpdateKpi = (e: React.FormEvent) => {
    e.preventDefault();

    if (!kpiName || !targetValue) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    updateKpiMutation.mutate({
      id,
      name: kpiName,
      targetValue: parseFloat(targetValue),
      currentValue: parseFloat(currentValue),
      status: status as any,
      dueDate,
    });
  };

  // Handle deleting a KPI
  const handleDeleteKpi = () => {
    if (confirm("Are you sure you want to delete this KPI?")) {
      deleteKpiMutation.mutate({ id });
    }
  };

  // Calculate progress percentage
  const calculateProgress = (current: number, target: number) => {
    const progress = (current / target) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  // Get badge color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "AT_RISK":
        return "bg-red-100 text-red-800";
      case "IN_PROGRESS":
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  // Get progress color based on percentage
  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 75) return "bg-emerald-500";
    if (percentage >= 50) return "bg-yellow-500";
    if (percentage >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  // If user has no permission, show forbidden page
  const canEdit = isManager || (kpi && kpi.userId === userId);
  
  if (!userId) {
    return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
  }
  
  if (isLoadingKpi) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!kpi && !isLoadingKpi) {
    return (
      <div className="container mx-auto py-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>KPI Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested KPI could not be found.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => router.push('/dashboard/admin/kpi')}>
              <Icons.arrowLeft className="mr-2 h-4 w-4" /> Back to KPI List
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const progressPercentage = calculateProgress(
    parseFloat(currentValue),
    parseFloat(targetValue)
  );

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">KPI Details</h1>
        <Button variant="outline" onClick={() => router.push('/dashboard/admin/kpi')}>
          <Icons.arrowLeft className="mr-2 h-4 w-4" /> Back to KPI List
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>{kpiName}</CardTitle>
              <CardDescription>
                Assigned to {ownerName} ({ownerEmail})
              </CardDescription>
            </div>
            <Badge className={getStatusColor(status)}>{status.replace("_", " ")}</Badge>
          </CardHeader>
          <CardContent>
            <div className="mt-2 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm font-medium">
                    {currentValue} / {targetValue} ({Math.round(progressPercentage)}%)
                  </span>
                </div>
                <Progress
                  value={progressPercentage}
                  className="h-2"
                  indicatorClassName={getProgressColor(progressPercentage)}
                />
              </div>

              <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Created</Label>
                  <p className="text-sm font-medium">
                    {kpi?.createdAt ? format(new Date(kpi.createdAt), "PPP") : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Due Date</Label>
                  <p className="text-sm font-medium">
                    {kpi?.dueDate ? format(new Date(kpi.dueDate), "PPP") : "No due date"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Last Updated</Label>
                  <p className="text-sm font-medium">
                    {kpi?.updatedAt ? format(new Date(kpi.updatedAt), "PPP") : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <p className="text-sm font-medium">{status.replace("_", " ")}</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-4 border-t">
            {canEdit && (
              <>
                {isEditing ? (
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    <Icons.edit className="mr-2 h-4 w-4" /> Edit KPI
                  </Button>
                )}
                {isManager && (
                  <Button variant="destructive" onClick={handleDeleteKpi}>
                    <Icons.trash className="mr-2 h-4 w-4" /> Delete KPI
                  </Button>
                )}
              </>
            )}
          </CardFooter>
        </Card>

        {isEditing && (
          <Card>
            <CardHeader>
              <CardTitle>Edit KPI</CardTitle>
              <CardDescription>Update KPI details and progress</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateKpi} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={kpiName}
                    onChange={(e) => setKpiName(e.target.value)}
                    placeholder="KPI Name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetValue">Target Value</Label>
                    <Input
                      id="targetValue"
                      type="number"
                      step="0.01"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      placeholder="Target Value"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentValue">Current Value</Label>
                    <Input
                      id="currentValue"
                      type="number"
                      step="0.01"
                      value={currentValue}
                      onChange={(e) => setCurrentValue(e.target.value)}
                      placeholder="Current Value"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="AT_RISK">At Risk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          id="dueDate"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, "PPP") : "No due date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={setDueDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <Button variant="outline" type="button" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 