"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";

export default function KycReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch KYC review data
  const { data: profile, isLoading, error, refetch } = trpc.kycReview.getByProfileId.useQuery({
    profileId: params.id,
  });

  // Get the latest review
  const latestReview = profile?.reviews?.[0];

  // Setup mutations
  const approveReviewMutation = trpc.kycReview.approve.useMutation({
    onSuccess: () => {
      toast({
        title: "Profile approved",
        description: "The KYC profile has been successfully approved.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectReviewMutation = trpc.kycReview.reject.useMutation({
    onSuccess: () => {
      toast({
        title: "Profile rejected",
        description: "The KYC profile has been rejected.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const requestInfoMutation = trpc.kycReview.requestAdditionalInfo.useMutation({
    onSuccess: () => {
      toast({
        title: "Additional information requested",
        description: "The request has been sent to the user.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="p-4">Loading profile data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error.message}</div>;
  }

  if (!profile) {
    return <div className="p-4">Profile not found</div>;
  }

  const handleApprove = () => {
    if (!latestReview) return;
    approveReviewMutation.mutate({
      id: latestReview.id,
      reason: reason,
    });
  };

  const handleReject = () => {
    if (!latestReview || !rejectionReason) return;
    rejectReviewMutation.mutate({
      id: latestReview.id,
      rejectionReason: rejectionReason,
      reason: reason,
    });
  };

  const handleRequestInfo = () => {
    if (!latestReview || !reason) return;
    requestInfoMutation.mutate({
      id: latestReview.id,
      reason: reason,
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Personal details submitted for verification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{profile.fullName}</h3>
              <Badge variant={
                profile.kycStatus === "VERIFIED" ? "success" :
                profile.kycStatus === "REJECTED" ? "destructive" :
                profile.kycStatus === "REVIEW" ? "warning" : "default"
              }>
                {profile.kycStatus}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <div>{profile.user?.email || "N/A"}</div>
              </div>
              <div>
                <Label>Phone</Label>
                <div>{profile.phoneNumber}</div>
              </div>
              <div>
                <Label>Date of Birth</Label>
                <div>{format(new Date(profile.dateOfBirth), "PPP")}</div>
              </div>
              <div>
                <Label>Address</Label>
                <div>{profile.address}</div>
              </div>
              <div>
                <Label>City</Label>
                <div>{profile.city}</div>
              </div>
              <div>
                <Label>State/Province</Label>
                <div>{profile.state}</div>
              </div>
              <div>
                <Label>Zip/Postal Code</Label>
                <div>{profile.zipCode}</div>
              </div>
              <div>
                <Label>Country</Label>
                <div>{profile.country}</div>
              </div>
            </div>

            {latestReview?.reviewedAt && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <Label className="block mb-1">Last Reviewed</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {format(new Date(latestReview.reviewedAt), "PPP 'at' p")}
                  </Badge>
                  <span>by {latestReview.reviewer?.name || "Admin"}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Review Actions</CardTitle>
            <CardDescription>Approve or request additional information</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="approve">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="approve">Approve</TabsTrigger>
                <TabsTrigger value="reject">Reject</TabsTrigger>
                <TabsTrigger value="request">Request Info</TabsTrigger>
              </TabsList>
              
              <TabsContent value="approve" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reason">Reason (Optional)</Label>
                    <Textarea 
                      id="reason" 
                      placeholder="Add any notes about this approval"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleApprove}
                    disabled={approveReviewMutation.isLoading}
                    className="w-full"
                  >
                    {approveReviewMutation.isLoading ? "Approving..." : "Approve Profile"}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="reject" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="rejectionReason" className="text-red-500">Rejection Reason (Required)</Label>
                    <Textarea 
                      id="rejectionReason" 
                      placeholder="Explain why this profile is being rejected"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="border-red-200"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reason">Additional Notes (Optional)</Label>
                    <Textarea 
                      id="reason" 
                      placeholder="Any additional context or instructions"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleReject}
                    disabled={rejectReviewMutation.isLoading || !rejectionReason}
                    variant="destructive"
                    className="w-full"
                  >
                    {rejectReviewMutation.isLoading ? "Rejecting..." : "Reject Profile"}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="request" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reason" className="text-amber-500">
                      Request Details (Required)
                    </Label>
                    <Textarea 
                      id="reason" 
                      placeholder="Specify what additional information is needed"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="border-amber-200"
                    />
                  </div>
                  <Button 
                    onClick={handleRequestInfo}
                    disabled={requestInfoMutation.isLoading || !reason}
                    variant="outline"
                    className="w-full border-amber-500 text-amber-500 hover:bg-amber-50"
                  >
                    {requestInfoMutation.isLoading ? "Requesting..." : "Request Additional Information"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            All review actions are logged and cannot be undone.
          </CardFooter>
        </Card>

        {latestReview && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Review History</CardTitle>
              <CardDescription>Past reviews and status changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviewer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {profile.reviews.map((review) => (
                      <tr key={review.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={
                            review.status === "APPROVED" ? "success" :
                            review.status === "REJECTED" ? "destructive" :
                            review.status === "ADDITIONAL_INFO_REQUESTED" ? "warning" : "default"
                          }>
                            {review.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {review.reviewedAt 
                            ? format(new Date(review.reviewedAt), "PPP 'at' p")
                            : format(new Date(review.createdAt), "PPP 'at' p")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {review.reviewer?.name || "System"}
                        </td>
                        <td className="px-6 py-4">
                          {review.status === "REJECTED" && review.rejectionReason 
                            ? <span className="text-red-500">{review.rejectionReason}</span>
                            : review.reason || "No reason provided"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 