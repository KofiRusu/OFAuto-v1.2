"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/lib/trpc/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, LinkIcon, FileText } from "lucide-react";

const createContractSchema = z.object({
  modelId: z.string().min(1, "Please select a model"),
  documentUrl: z.string().url("Please enter a valid document URL"),
});

type FormValues = z.infer<typeof createContractSchema>;

export default function ContractCreationPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  
  // Get the current user ID for managerId
  const { data: currentUser } = trpc.user.getCurrentUser.useQuery();
  
  // Fetch models (users with USER role)
  const { data: models, isLoading: isLoadingModels } = trpc.user.getUsersByRole.useQuery({ role: "USER" });
  
  // Setup form with validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(createContractSchema),
    defaultValues: {
      modelId: "",
      documentUrl: "",
    },
  });
  
  // Upload handler - in a real implementation, this would upload to your storage service
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      
      // Normally, you would use your file upload service here
      // This is a simplified example that generates a fake URL
      // In a real implementation, you would use:
      // 1. Get a presigned URL from your backend
      // 2. Upload the file to S3 or your storage provider
      // 3. Set the final document URL to the form
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock URL - in real implementation this would be the actual document URL
      const documentUrl = `https://storage.example.com/contracts/${Date.now()}-${file.name}`;
      
      setValue("documentUrl", documentUrl);
      toast({
        title: "File uploaded successfully",
        description: "The contract document is ready to be linked to a model.",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Create contract mutation
  const createContractMutation = trpc.contract.createContract.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Contract created",
        description: "The contract has been successfully created and sent to the model.",
      });
      reset();
      
      // Redirect to a success page or list of contracts
      router.push(`/onboarding/contract/success?id=${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error creating contract",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = async (data: FormValues) => {
    if (!currentUser?.id) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to create contracts.",
        variant: "destructive",
      });
      return;
    }
    
    // Submit the form data
    createContractMutation.mutate({
      modelId: data.modelId,
      managerId: currentUser.id,
      documentUrl: data.documentUrl,
    });
  };
  
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create Contract</CardTitle>
          <CardDescription>
            Upload a contract document and assign it to a model for signing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="modelId">Select Model</Label>
              <select
                id="modelId"
                className="w-full p-2 border rounded"
                {...register("modelId")}
                disabled={isLoadingModels}
              >
                <option value="">Select a model...</option>
                {models?.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name || model.email || model.id}
                  </option>
                ))}
              </select>
              {errors.modelId && (
                <p className="text-sm text-red-500">{errors.modelId.message}</p>
              )}
              {isLoadingModels && <p className="text-sm text-gray-500">Loading models...</p>}
            </div>
            
            <div className="space-y-2">
              <Label>Upload Contract Document</Label>
              <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center">
                <Input
                  type="file"
                  id="contract-upload"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <Label
                  htmlFor="contract-upload"
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
                    PDF, DOC, or DOCX up to 10MB
                  </span>
                </Label>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="documentUrl">Document URL</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                  <LinkIcon className="h-4 w-4" />
                </span>
                <Input
                  id="documentUrl"
                  type="url"
                  placeholder="https://storage.example.com/contracts/document.pdf"
                  {...register("documentUrl")}
                  className="rounded-l-none"
                />
              </div>
              {errors.documentUrl && (
                <p className="text-sm text-red-500">{errors.documentUrl.message}</p>
              )}
              <p className="text-xs text-gray-500">
                You can also directly enter a URL if you've already uploaded the contract elsewhere.
              </p>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || createContractMutation.isLoading}
            >
              {isSubmitting || createContractMutation.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Contract...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Create Contract
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-sm text-gray-500">
          Note: The model will receive a notification and must sign the contract before it becomes active.
        </CardFooter>
      </Card>
    </div>
  );
} 