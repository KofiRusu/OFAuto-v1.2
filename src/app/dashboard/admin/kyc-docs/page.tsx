"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import { Loader2, FileText, Search, Filter, ArrowRight } from "lucide-react";

export default function KycDocumentsAdminPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  
  // Fetch KYC documents with filter
  const { data: documents, isLoading, refetch } = trpc.kycDocument.getPendingKycDocs.useQuery({
    status: statusFilter as any,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  
  // Helper function to get document type label
  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "ID_FRONT": return "ID Card (Front)";
      case "ID_BACK": return "ID Card (Back)";
      case "TAX_FORM": return "Tax Form";
      default: return type;
    }
  };
  
  // Helper function to get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "APPROVED": return "success";
      case "REJECTED": return "destructive";
      case "NEEDS_INFO": return "warning";
      default: return "default";
    }
  };
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1); // Reset to first page when filter changes
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">KYC Documents Review</h1>
          <p className="text-gray-500">Review and approve user identity and tax documents</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select 
            value={statusFilter} 
            onValueChange={handleStatusFilterChange}
          >
            <SelectTrigger className="w-[180px]">
              <span className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter status" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="NEEDS_INFO">Needs Info</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>
            {statusFilter === "PENDING" ? "Documents Awaiting Review" : 
             statusFilter === "APPROVED" ? "Approved Documents" :
             statusFilter === "REJECTED" ? "Rejected Documents" : "Documents Requiring More Information"}
          </CardTitle>
          <CardDescription>
            {statusFilter === "PENDING" ? 
              "Review these documents to approve or reject them" : 
              `Showing documents with status: ${statusFilter}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center space-x-4 py-4 border-b">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))
          ) : documents?.documents.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-medium">No documents found</h3>
              <p className="text-gray-500 mt-1">
                {statusFilter === "PENDING" ? 
                  "There are no documents waiting for review." : 
                  `No documents with status ${statusFilter} were found.`}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Type</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {documents?.documents.map((document) => (
                      <tr key={document.id} className="hover:bg-gray-50">
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {document.user?.name || "Unknown"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {document.user?.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getDocumentTypeLabel(document.type)}
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <Badge variant={getStatusBadgeVariant(document.status) as any}>
                            {document.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(document.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/admin/kyc-docs/${document.id}`)}
                          >
                            Review<ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {documents && documents.pagination.total > 0 && (
                <div className="mt-6 flex justify-center">
                  <Pagination
                    currentPage={page}
                    pageCount={Math.ceil(documents.pagination.total / pageSize)}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 