"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KycTypeEnum } from "@/lib/schemas/kycDocument";
import { trpc } from "@/lib/trpc/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Form schema for document upload
const uploadSchema = z.object({
  type: z.enum(["ID_FRONT", "ID_BACK", "TAX_FORM"], {
    required_error: "Please select a document type",
  }),
  file: z.instanceof(File, { message: "Please select a file to upload" }).refine(
    (file) => file.size <= 5 * 1024 * 1024, // 5MB max
    "File size must be less than 5MB"
  ),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

export default function KycDocumentUploadPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("id-documents");
  
  // Get current user
  const { data: currentUser } = trpc.user.getCurrentUser.useQuery();
  
  // Get user's existing documents
  const { data: userDocuments, isLoading: isLoadingDocuments, refetch } = 
    trpc.kycDocument.getUserKycDocs.useQuery({});
  
  // Submit document mutation
  const submitDocMutation = trpc.kycDocument.submitKycDoc.useMutation({
    onSuccess: () => {
      toast({
        title: "Document uploaded successfully",
        description: "Your document has been submitted for review.",
      });
      reset();
      setUploadedUrl(null);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error submitting document",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
  });
  
  // Watch form values
  const selectedType = watch("type");
  
  // File upload handler - simulating upload to storage
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      
      // In a real implementation, this would upload to your storage service
      // For now, we'll simulate it with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Set the file in the form
      setValue("file", file);
      
      // Create a mock URL for demo purposes
      // In production, this would come from your file storage service (S3, etc.)
      const mockUrl = `https://storage.example.com/kyc-docs/${Date.now()}-${file.name}`;
      setUploadedUrl(mockUrl);
      
      toast({
        title: "File uploaded",
        description: "File is ready to be submitted.",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Form submission handler
  const onSubmit = async (data: UploadFormValues) => {
    if (!currentUser?.id) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to upload documents.",
        variant: "destructive",
      });
      return;
    }
    
    if (!uploadedUrl) {
      toast({
        title: "File not uploaded",
        description: "Please wait for the file to finish uploading.",
        variant: "destructive",
      });
      return;
    }
    
    // Submit the document
    submitDocMutation.mutate({
      userId: currentUser.id,
      type: data.type as any,
      fileUrl: uploadedUrl,
    });
  };
  
  // Helper function to get type label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "ID_FRONT": return "ID Card (Front)";
      case "ID_BACK": return "ID Card (Back)";
      case "TAX_FORM": return "Tax Form";
      default: return type;
    }
  };
  
  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "bg-green-100 text-green-800";
      case "REJECTED": return "bg-red-100 text-red-800";
      case "NEEDS_INFO": return "bg-amber-100 text-amber-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">KYC Document Upload</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="id-documents">ID Documents</TabsTrigger>
          <TabsTrigger value="tax-forms">Tax Forms</TabsTrigger>
          <TabsTrigger value="my-documents">My Documents</TabsTrigger>
        </TabsList>
        
        {/* ID Documents Tab */}
        <TabsContent value="id-documents">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>ID Card (Front)</CardTitle>
                <CardDescription>
                  Upload the front of your government-issued ID or driver's license
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <input type="hidden" {...register("type")} value="ID_FRONT" />
                  
                  <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center">
                    <Input
                      type="file"
                      id="id-front-upload"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileSelect}
                      disabled={isUploading || submitDocMutation.isLoading}
                    />
                    <Label
                      htmlFor="id-front-upload"
                      className="flex flex-col items-center cursor-pointer"
                    >
                      {isUploading ? (
                        <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
                      ) : (
                        <Upload className="h-10 w-10 text-gray-400" />
                      )}
                      <span className="mt-2 text-sm font-medium text-gray-900">
                        {isUploading ? "Uploading..." : "Click to upload or drag and drop"}
                      </span>
                      <span className="mt-1 text-xs text-gray-500">
                        JPG, PNG, or PDF up to 5MB
                      </span>
                    </Label>
                  </div>
                  
                  {errors.file && (
                    <p className="text-sm text-red-500">{errors.file.message}</p>
                  )}
                  
                  {uploadedUrl && selectedType === "ID_FRONT" && (
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitDocMutation.isLoading}
                    >
                      {submitDocMutation.isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit ID Front"
                      )}
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>ID Card (Back)</CardTitle>
                <CardDescription>
                  Upload the back of your government-issued ID or driver's license
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <input type="hidden" {...register("type")} value="ID_BACK" />
                  
                  <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center">
                    <Input
                      type="file"
                      id="id-back-upload"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileSelect}
                      disabled={isUploading || submitDocMutation.isLoading}
                    />
                    <Label
                      htmlFor="id-back-upload"
                      className="flex flex-col items-center cursor-pointer"
                    >
                      {isUploading ? (
                        <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
                      ) : (
                        <Upload className="h-10 w-10 text-gray-400" />
                      )}
                      <span className="mt-2 text-sm font-medium text-gray-900">
                        {isUploading ? "Uploading..." : "Click to upload or drag and drop"}
                      </span>
                      <span className="mt-1 text-xs text-gray-500">
                        JPG, PNG, or PDF up to 5MB
                      </span>
                    </Label>
                  </div>
                  
                  {errors.file && (
                    <p className="text-sm text-red-500">{errors.file.message}</p>
                  )}
                  
                  {uploadedUrl && selectedType === "ID_BACK" && (
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitDocMutation.isLoading}
                    >
                      {submitDocMutation.isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit ID Back"
                      )}
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Tax Forms Tab */}
        <TabsContent value="tax-forms">
          <Card>
            <CardHeader>
              <CardTitle>Tax Form</CardTitle>
              <CardDescription>
                Upload your W-9, W-8BEN, or other required tax documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <input type="hidden" {...register("type")} value="TAX_FORM" />
                
                <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center">
                  <Input
                    type="file"
                    id="tax-form-upload"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileSelect}
                    disabled={isUploading || submitDocMutation.isLoading}
                  />
                  <Label
                    htmlFor="tax-form-upload"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    {isUploading ? (
                      <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
                    ) : (
                      <FileText className="h-10 w-10 text-gray-400" />
                    )}
                    <span className="mt-2 text-sm font-medium text-gray-900">
                      {isUploading ? "Uploading..." : "Click to upload tax document"}
                    </span>
                    <span className="mt-1 text-xs text-gray-500">
                      JPG, PNG, or PDF up to 5MB
                    </span>
                  </Label>
                </div>
                
                {errors.file && (
                  <p className="text-sm text-red-500">{errors.file.message}</p>
                )}
                
                {uploadedUrl && selectedType === "TAX_FORM" && (
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={submitDocMutation.isLoading}
                  >
                    {submitDocMutation.isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Tax Form"
                    )}
                  </Button>
                )}
              </form>
            </CardContent>
            <CardFooter className="text-sm text-gray-500">
              Your tax information is encrypted and securely stored in compliance with data protection regulations.
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* My Documents Tab */}
        <TabsContent value="my-documents">
          <Card>
            <CardHeader>
              <CardTitle>My Submitted Documents</CardTitle>
              <CardDescription>
                View the status of your previously submitted KYC documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDocuments && (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              )}
              
              {!isLoadingDocuments && (!userDocuments || userDocuments.documents.length === 0) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No documents found</AlertTitle>
                  <AlertDescription>
                    You have not submitted any KYC documents yet. Please use the upload tabs to submit your documents.
                  </AlertDescription>
                </Alert>
              )}
              
              {!isLoadingDocuments && userDocuments && userDocuments.documents.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Document Type</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Submitted</th>
                        <th className="text-left py-2">Reviewed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userDocuments.documents.map((doc) => (
                        <tr key={doc.id} className="border-b hover:bg-gray-50">
                          <td className="py-3">{getTypeLabel(doc.type)}</td>
                          <td className="py-3">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                              {doc.status}
                            </span>
                          </td>
                          <td className="py-3">{new Date(doc.submittedAt).toLocaleDateString()}</td>
                          <td className="py-3">
                            {doc.reviewedAt 
                              ? new Date(doc.reviewedAt).toLocaleDateString() 
                              : "Pending"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 