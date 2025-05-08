"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle, XCircle, AlertCircle, ArrowLeft, Download, User, Calendar } from "lucide-react";

// Form schema for document review
const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "NEEDS_INFO"], {
    required_error: "Please select a review decision",
  }),
  notes: z.string().optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

export default function KycDocumentReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const documentId = params.id;
  const [activeTab, setActiveTab] = useState("document-preview");
  
  // Fetch the document details
  const { data: document, isLoading, error, refetch } = trpc.kycDocument.getKycDoc.useQuery({
    id: documentId,
  });
  
  // Setup form with validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      status: "APPROVED",
    },
  });
  
  // Get currently selected status
  const selectedStatus = watch("status");
  
  // Submit review mutation
  const reviewDocMutation = trpc.kycDocument.reviewKycDoc.useMutation({
    onSuccess: () => {
      toast({
        title: "Review submitted successfully",
        description: "The document has been reviewed.",
      });
      
      // Go back to the documents list
      setTimeout(() => {
        router.push("/dashboard/admin/kyc-docs");
      }, 1000);
    },
    onError: (error) => {
      toast({
        title: "Error submitting review",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = async (data: ReviewFormValues) => {
    reviewDocMutation.mutate({
      id: documentId,
      status: data.status as any,
      reviewerId: "", // This will be replaced with the current user ID in the backend
      notes: data.notes,
    });
  };
  
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
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
        <span className="ml-2">Loading document...</span>
      </div>
    );
  }
  
  // Error state
  if (error || !document) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error?.message || "Document not found"}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/dashboard/admin/kyc-docs")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Documents
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="mb-2"
              onClick={() => router.push("/dashboard/admin/kyc-docs")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Documents
            </Button>
            <Badge variant={getStatusBadgeVariant(document.status) as any}>
              {document.status}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold">{getDocumentTypeLabel(document.type)}</h1>
          <p className="text-gray-500 flex items-center gap-1">
            <User className="h-4 w-4" /> 
            Submitted by {document.user?.name || "Unknown"} 
            ({document.user?.email})
          </p>
          <p className="text-gray-500 flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Submitted on {new Date(document.submittedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Document Preview</CardTitle>
              <CardDescription>
                Review the submitted document
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Document viewer - would typically be an iframe or embed */}
              {document.fileUrl.endsWith(".pdf") ? (
                <iframe 
                  src={document.fileUrl}
                  className="w-full h-[60vh] border rounded"
                  title="Document Preview"
                ></iframe>
              ) : (
                <div className="w-full flex justify-center">
                  <img 
                    src={document.fileUrl} 
                    alt="Document Preview" 
                    className="max-w-full max-h-[60vh] object-contain border rounded"
                  />
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="flex justify-between w-full">
                <Button variant="outline" onClick={() => window.open(document.fileUrl, "_blank")}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Document
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
        
        {/* Review Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Review Decision</CardTitle>
              <CardDescription>
                Approve or reject this document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <Label>Decision</Label>
                  <RadioGroup 
                    defaultValue="APPROVED" 
                    className="space-y-2"
                    {...register("status")}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="APPROVED" id="approve" />
                      <Label htmlFor="approve" className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        Approve
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="REJECTED" id="reject" />
                      <Label htmlFor="reject" className="flex items-center">
                        <XCircle className="mr-2 h-4 w-4 text-red-500" />
                        Reject
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="NEEDS_INFO" id="needs-info" />
                      <Label htmlFor="needs-info" className="flex items-center">
                        <AlertCircle className="mr-2 h-4 w-4 text-amber-500" />
                        Needs More Information
                      </Label>
                    </div>
                  </RadioGroup>
                  {errors.status && (
                    <p className="text-sm text-red-500">{errors.status.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes {selectedStatus !== "APPROVED" && "(Required)"}</Label>
                  <Textarea
                    id="notes"
                    {...register("notes")}
                    placeholder={
                      selectedStatus === "REJECTED" ? 
                        "Please explain why this document is being rejected..." :
                      selectedStatus === "NEEDS_INFO" ?
                        "Please specify what additional information is needed..." :
                        "Optional notes about this approval..."
                    }
                    rows={4}
                  />
                  {errors.notes && (
                    <p className="text-sm text-red-500">{errors.notes.message}</p>
                  )}
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || reviewDocMutation.isLoading}
                >
                  {isSubmitting || reviewDocMutation.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      {selectedStatus === "APPROVED" ? "Approve" : 
                       selectedStatus === "REJECTED" ? "Reject" : 
                       "Request More Information"}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 