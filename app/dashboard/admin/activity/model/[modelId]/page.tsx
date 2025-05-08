"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { format } from "date-fns";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Icons } from "@/components/ui/icons";
import Forbidden from "@/components/forbidden";
import { Spinner } from "@/components/spinner";

export default function ModelActivityPage() {
  const { modelId } = useParams();
  const router = useRouter();
  const { userId, sessionId, getToken, orgId, orgRole, orgSlug, actor, has, sessionClaims } = useAuth();
  
  // Get the user role from sessionClaims
  const userRole = sessionClaims?.userRole || "USER";
  
  // Check if the user has manager or admin access
  const hasAccess = userRole === "MANAGER" || userRole === "ADMIN";

  // State for date range and action type filters
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedActionTypes, setSelectedActionTypes] = useState<string[]>([]);
  const [availableActionTypes, setAvailableActionTypes] = useState<string[]>([]);

  // Query for model details
  const { data: userData, isLoading: isLoadingUser } = trpc.user.getById.useQuery(
    { id: modelId as string },
    { enabled: !!modelId && hasAccess }
  );

  // Query for activity logs
  const {
    data: activityData,
    isLoading: isLoadingActivity,
    refetch: refetchActivity,
  } = trpc.activityMonitor.getModelActivity.useQuery(
    {
      modelId: modelId as string,
      dateRange: startDate || endDate ? {
        start: startDate,
        end: endDate,
      } : undefined,
      actionTypes: selectedActionTypes.length > 0 ? selectedActionTypes : undefined,
      limit: 50,
      offset: 0,
    },
    {
      enabled: !!modelId && hasAccess,
      onSuccess: (data) => {
        // Extract unique action types from the logs
        if (data?.logs) {
          const actionTypes = [...new Set(data.logs.map(log => log.actionType))];
          setAvailableActionTypes(actionTypes);
        }
      },
    }
  );

  // Function to handle exporting data
  const handleExport = () => {
    if (!activityData?.logs || activityData.logs.length === 0) return;

    // Convert logs to CSV
    const headers = ["Date", "Action Type", "Metadata"];
    const csvRows = [
      headers.join(","),
      ...activityData.logs.map(log => {
        const date = format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss");
        const actionType = log.actionType;
        const metadata = JSON.stringify(log.metadata || {}).replace(/"/g, '""');
        return `"${date}","${actionType}","${metadata}"`;
      }),
    ];
    
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    // Create download link and trigger click
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `model-activity-${modelId}-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to clear filters
  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedActionTypes([]);
  };

  // Function to handle action type selection
  const toggleActionType = (actionType: string) => {
    setSelectedActionTypes(prev => 
      prev.includes(actionType)
        ? prev.filter(type => type !== actionType)
        : [...prev, actionType]
    );
  };

  // If user has no access, show forbidden page
  if (!hasAccess) {
    return <Forbidden />;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Model Activity</h1>
          {userData && (
            <p className="text-gray-500">
              {userData.name || "Unnamed"} ({userData.email || "No email"})
            </p>
          )}
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <Icons.arrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter activity logs by date and action type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    {startDate ? (
                      format(startDate, "PPP")
                    ) : (
                      <span className="text-muted-foreground">Pick a date</span>
                    )}
                    <Icons.calendar className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => endDate ? date > endDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    {endDate ? (
                      format(endDate, "PPP")
                    ) : (
                      <span className="text-muted-foreground">Pick a date</span>
                    )}
                    <Icons.calendar className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => startDate ? date < startDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Action Types</label>
            <div className="flex flex-wrap gap-2">
              {availableActionTypes.map(actionType => (
                <Button
                  key={actionType}
                  variant={selectedActionTypes.includes(actionType) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleActionType(actionType)}
                >
                  {actionType}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={clearFilters}
              disabled={!startDate && !endDate && selectedActionTypes.length === 0}
            >
              Clear Filters
            </Button>
            <div className="space-x-2">
              <Button 
                variant="outline"
                onClick={() => refetchActivity()}
                disabled={isLoadingActivity}
              >
                {isLoadingActivity ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Icons.refresh className="mr-2 h-4 w-4" />
                    Refresh
                  </>
                )}
              </Button>
              <Button 
                onClick={handleExport}
                disabled={!activityData?.logs || activityData.logs.length === 0}
              >
                <Icons.download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
          <CardDescription>
            {activityData?.total 
              ? `Showing ${activityData.logs.length} of ${activityData.total} logs`
              : "No logs found"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingActivity || isLoadingUser ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : activityData?.logs && activityData.logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Action Type</TableHead>
                  <TableHead>Metadata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityData.logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {format(new Date(log.createdAt), "PPP HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{log.actionType}</span>
                    </TableCell>
                    <TableCell>
                      {log.metadata ? (
                        <pre className="text-xs overflow-auto max-w-xs max-h-24 bg-gray-50 p-2 rounded">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-gray-400">No metadata</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No activity logs found. Try adjusting your filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 