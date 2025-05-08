'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { format } from 'date-fns';
import { useFeatureFlag } from '@/lib/hooks/useFeatureFlag';
import { UserRole } from '@prisma/client';
import { useUser } from '@clerk/nextjs';
import { toast } from '@/components/ui/use-toast';

// UI components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function ActivityMonitorPage() {
  const router = useRouter();
  const { user } = useUser();
  
  // Get user role from Clerk metadata for feature flag
  const userRole = user?.publicMetadata?.role as UserRole | undefined;
  
  // Check if user is allowed to access this page
  const canAccessPage = useFeatureFlag(userRole, 'MANAGER_ANALYTICS');
  
  // Filter state
  const [filters, setFilters] = useState({
    userId: '',
    actionType: '',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    page: 1,
    limit: 20,
    sortBy: 'timestamp' as 'timestamp' | 'actionType' | 'userId',
    sortOrder: 'desc' as 'asc' | 'desc',
  });
  
  // Selected activity log for details dialog
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  
  // Get users for filter dropdown
  const { data: usersData } = trpc.user.listUsers.useQuery(undefined, {
    enabled: !!canAccessPage,
  });
  
  // Query activity logs
  const {
    data: activityData,
    isLoading: isLoadingActivity,
    isError: isActivityError,
    refetch: refetchActivity,
  } = trpc.activityMonitor.getActivityFeed.useQuery(
    {
      ...filters,
      startDate: filters.startDate,
      endDate: filters.endDate,
    },
    {
      enabled: !!canAccessPage,
    }
  );
  
  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      // Reset page when filters change
      ...(key !== 'page' ? { page: 1 } : {}),
    }));
  };
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    handleFilterChange('page', newPage);
  };
  
  // Handle viewing log details
  const handleViewDetails = (log: any) => {
    setSelectedLog(log);
  };
  
  // Get unique action types from the data for the filter dropdown
  const actionTypes = Array.from(
    new Set(
      activityData?.data?.map(log => log.actionType) || []
    )
  );
  
  // Helper function to format metadata for display
  const formatMetadata = (metadata: any) => {
    if (!metadata) return 'No metadata';
    
    try {
      if (typeof metadata === 'string') {
        return metadata;
      }
      return JSON.stringify(metadata, null, 2);
    } catch (error) {
      return 'Invalid metadata format';
    }
  };
  
  // If user doesn't have access, show permission error
  if (!canAccessPage) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Permission Denied</CardTitle>
            <CardDescription>
              You do not have permission to access the activity monitoring page.
              This feature is available only to managers and administrators.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Show loading state
  if (isLoadingActivity) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  
  // Show error state
  if (isActivityError) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              Failed to load activity logs. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => refetchActivity()} className="w-full">
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Activity Monitor</h1>
        <p className="text-muted-foreground">
          Track and monitor user activities across the platform.
        </p>
      </div>
      
      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">User</label>
              <Select
                value={filters.userId}
                onValueChange={(value) => handleFilterChange('userId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Users</SelectItem>
                  {usersData?.users?.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email || user.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Action Type</label>
              <Select
                value={filters.actionType}
                onValueChange={(value) => handleFilterChange('actionType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Actions</SelectItem>
                  {actionTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Date Range</label>
              <div className="flex space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      {filters.startDate ? format(filters.startDate, 'PP') : 'Start Date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.startDate}
                      onSelect={(date) => handleFilterChange('startDate', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      {filters.endDate ? format(filters.endDate, 'PP') : 'End Date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.endDate}
                      onSelect={(date) => handleFilterChange('endDate', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                {(filters.startDate || filters.endDate) && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      handleFilterChange('startDate', undefined);
                      handleFilterChange('endDate', undefined);
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Activity Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
          <CardDescription>
            All user activities logged in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activityData?.data?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No activity logs found with the current filters.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Metadata</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityData?.data?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {format(new Date(log.timestamp), 'dd MMM yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      {log.user?.name || log.user?.email || log.userId}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.actionType}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {log.description}
                    </TableCell>
                    <TableCell>
                      {log.metadata ? (
                        <Badge variant="secondary">Has metadata</Badge>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(log)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {/* Pagination */}
          {activityData?.pagination && activityData.pagination.totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => {
                        if (activityData.pagination.page > 1) {
                          handlePageChange(activityData.pagination.page - 1);
                        }
                      }}
                      disabled={activityData.pagination.page === 1}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: activityData.pagination.totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      const currentPage = activityData.pagination.page;
                      return (
                        page === 1 ||
                        page === activityData.pagination.totalPages ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, i, arr) => {
                      // Add ellipsis
                      if (i > 0 && arr[i - 1] !== page - 1) {
                        return (
                          <PaginationItem key={`ellipsis-${page}`}>
                            <span className="px-4">...</span>
                          </PaginationItem>
                        );
                      }
                      
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={page === activityData.pagination.page}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => {
                        if (activityData.pagination.page < activityData.pagination.totalPages) {
                          handlePageChange(activityData.pagination.page + 1);
                        }
                      }}
                      disabled={activityData.pagination.page === activityData.pagination.totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Details Dialog */}
      {selectedLog && (
        <Dialog
          open={!!selectedLog}
          onOpenChange={(open) => !open && setSelectedLog(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Activity Log Details</DialogTitle>
              <DialogDescription>
                Detailed information about the selected activity log.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">ID</h3>
                  <p className="text-sm text-muted-foreground">{selectedLog.id}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Timestamp</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedLog.timestamp), 'PPpp')}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">User</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedLog.user?.name || selectedLog.user?.email || selectedLog.userId}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Action Type</h3>
                  <p className="text-sm">
                    <Badge variant="outline">{selectedLog.actionType}</Badge>
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Description</h3>
                <p className="text-sm text-muted-foreground">{selectedLog.description}</p>
              </div>
              
              {selectedLog.metadata && (
                <div>
                  <h3 className="text-sm font-medium">Metadata</h3>
                  <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-60">
                    {formatMetadata(selectedLog.metadata)}
                  </pre>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 