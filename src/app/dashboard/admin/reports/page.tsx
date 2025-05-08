'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { trpc } from '@/lib/trpc/client';
import { ReportStatusSchema, ReportTypeSchema } from '@/lib/schemas/compliance';
import { format } from 'date-fns';
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Eye,
  Flag,
  MoreHorizontal,
  Search,
  Shield,
  User
} from 'lucide-react';

// Helper for report type icons
const ReportTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'DM_CONTENT':
      return <AlertCircle className="h-4 w-4" />;
    case 'POST_CONTENT':
      return <Flag className="h-4 w-4" />;
    case 'PROFILE_CONTENT':
      return <User className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

// Helper for status badges
const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'PENDING':
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">Pending</Badge>;
    case 'REVIEWED':
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">Reviewed</Badge>;
    case 'RESOLVED':
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">Resolved</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function AdminReportsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get reports with filters
  const { 
    data: reportsData, 
    isLoading: reportsLoading,
    refetch: refetchReports
  } = trpc.compliance.getReports.useQuery({
    status: statusFilter as any,
    type: typeFilter as any,
    limit: 50
  });

  // Navigate to report details
  const handleViewReport = (reportId: string) => {
    router.push(`/dashboard/admin/reports/${reportId}`);
  };

  // Filter change handlers
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === 'ALL' ? undefined : value);
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value === 'ALL' ? undefined : value);
  };

  // Local search filter (client-side)
  const filteredReports = reportsData?.reports.filter(report => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      report.details.toLowerCase().includes(query) ||
      (report.contentId?.toLowerCase().includes(query)) ||
      (report.reporter.name?.toLowerCase().includes(query)) ||
      (report.reporter.email?.toLowerCase().includes(query))
    );
  });

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Shield className="mr-2 h-8 w-8 text-primary" />
            Compliance Reports
          </h1>
          <p className="text-muted-foreground">
            Review and manage user-submitted reports
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={() => refetchReports()}>
            Refresh Reports
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filter Reports</CardTitle>
          <CardDescription>
            Use these filters to find specific reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <Select 
                value={statusFilter || 'ALL'} 
                onValueChange={handleStatusFilterChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REVIEWED">Reviewed</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-1/3">
              <Select 
                value={typeFilter || 'ALL'} 
                onValueChange={handleTypeFilterChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="DM_CONTENT">Direct Messages</SelectItem>
                  <SelectItem value="POST_CONTENT">Post Content</SelectItem>
                  <SelectItem value="PROFILE_CONTENT">Profile Content</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-1/3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Reports</CardTitle>
          <CardDescription>
            {reportsLoading 
              ? 'Loading reports...' 
              : `${filteredReports?.length || 0} reports found`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredReports && filteredReports.length > 0 ? (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <ReportTypeIcon type={report.type} />
                          <span className="ml-2">
                            {report.type === 'DM_CONTENT' ? 'Direct Message' : 
                             report.type === 'POST_CONTENT' ? 'Post Content' : 
                             report.type === 'PROFILE_CONTENT' ? 'Profile Content' : 
                             report.type}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{report.reporter.name || 'Anonymous'}</div>
                        <div className="text-sm text-muted-foreground">{report.reporter.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {report.details}
                        </div>
                        {report.contentId && (
                          <div className="text-xs text-muted-foreground mt-1">
                            ID: {report.contentId}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={report.status} />
                      </TableCell>
                      <TableCell>
                        {format(new Date(report.createdAt), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewReport(report.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No reports found</h2>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? "No reports match your search criteria" 
                  : "There are no reports matching your filters"}
              </p>
              <Button onClick={() => {
                setStatusFilter(undefined);
                setTypeFilter(undefined);
                setSearchQuery('');
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 