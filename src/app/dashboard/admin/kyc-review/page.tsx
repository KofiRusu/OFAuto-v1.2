"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc/client";

export default function KycReviewListPage() {
  const [status, setStatus] = useState<string | undefined>("PENDING");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  // Fetch KYC reviews based on status filter
  const { data, isLoading, error, refetch } = trpc.kycReview.listPending.useQuery({
    status: status as any,
    limit: pageSize,
    offset: currentPage * pageSize,
  });

  const handleTabChange = (value: string) => {
    setStatus(value === "all" ? undefined : value);
    setCurrentPage(0);
  };

  const totalPages = data?.pagination?.total
    ? Math.ceil(data.pagination.total / pageSize)
    : 0;

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>KYC Verification Reviews</CardTitle>
          <CardDescription>
            Manage user verification and review submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="PENDING" onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="PENDING">Pending</TabsTrigger>
              <TabsTrigger value="APPROVED">Approved</TabsTrigger>
              <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
              <TabsTrigger value="ADDITIONAL_INFO_REQUESTED">Additional Info</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value={status || "all"} className="mt-4">
              {isLoading ? (
                <div className="text-center py-4">Loading reviews...</div>
              ) : error ? (
                <div className="text-center py-4 text-red-500">
                  Error: {error.message}
                </div>
              ) : data?.profiles.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No {status?.toLowerCase() || ""} reviews found
                </div>
              ) : (
                <>
                  <div className="border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Submission Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Review Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data?.profiles.map((profile) => {
                          const latestReview = profile.reviews[0];
                          return (
                            <tr key={profile.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    {profile.user?.avatar ? (
                                      <img
                                        className="h-10 w-10 rounded-full"
                                        src={profile.user.avatar}
                                        alt={profile.fullName}
                                      />
                                    ) : (
                                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                        <span className="text-gray-500">
                                          {profile.fullName.charAt(0)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {profile.fullName}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {profile.user?.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant={
                                  profile.kycStatus === "VERIFIED" ? "success" :
                                  profile.kycStatus === "REJECTED" ? "destructive" :
                                  profile.kycStatus === "REVIEW" ? "warning" : "default"
                                }>
                                  {profile.kycStatus}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {format(new Date(profile.createdAt), "PPP")}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {latestReview?.reviewedAt ? (
                                  format(new Date(latestReview.reviewedAt), "PPP")
                                ) : (
                                  "Not reviewed"
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Link
                                  href={`/dashboard/admin/kyc-review/${profile.id}`}
                                  className="text-primary-600 hover:text-primary-900"
                                >
                                  <Button variant="outline" size="sm">
                                    Review
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                        disabled={currentPage === 0}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage + 1} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => 
                          setCurrentPage((prev) => 
                            Math.min(totalPages - 1, prev + 1)
                          )
                        }
                        disabled={currentPage === totalPages - 1}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 