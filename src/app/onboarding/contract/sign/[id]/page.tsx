"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/lib/trpc/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Check, X, FileText } from "lucide-react";

const updateContractSchema = z.object({
  status: z.enum(["SIGNED", "REJECTED"]),
  agreedToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions",
    path: ["agreedToTerms"],
  }).optional().default(false),
});

type FormValues = z.infer<typeof updateContractSchema>;

export default function ContractSigningPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("review");
  const contractId = params.id;
  
  // Fetch contract details
  const { data: contract, isLoading, error, refetch } = trpc.contract.getContract.useQuery({
    id: contractId,
  });
  
  // Setup form with validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(updateContractSchema),
    defaultValues: {
      status: "SIGNED",
      agreedToTerms: false,
    },
  });
  
  // Watch the agreement checkbox
  const agreedToTerms = watch("agreedToTerms");
  
  // Update contract status mutation
  const updateContractMutation = trpc.contract.updateContractStatus.useMutation({
    onSuccess: () => {
      toast({
        title: "Contract updated",
        description: "Your decision has been recorded successfully.",
      });
      
      // Refetch the contract to show updated status
      refetch();
      
      // Redirect to completion page after a short delay
      setTimeout(() => {
        router.push("/onboarding/contract/complete");
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Error updating contract",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = async (data: FormValues) => {
    // For signing, we need agreement to terms
    if (data.status === "SIGNED" && !data.agreedToTerms) {
      toast({
        title: "Agreement required",
        description: "You must agree to the terms and conditions to sign the contract.",
        variant: "destructive",
      });
      return;
    }
    
    // Submit the decision
    updateContractMutation.mutate({
      id: contractId,
      status: data.status,
    });
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
        <span className="ml-2">Loading contract...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error.message}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/onboarding")}>
              Return to Onboarding
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (!contract) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Contract Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested contract could not be found.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/onboarding")}>
              Return to Onboarding
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // If contract is already signed or rejected, show the status
  if (contract.status !== "PENDING") {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Contract Details</CardTitle>
              <Badge
                variant={contract.status === "SIGNED" ? "success" : "destructive"}
              >
                {contract.status}
              </Badge>
            </div>
            <CardDescription>
              This contract has already been processed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Contract signed on</Label>
                <p className="text-lg">
                  {contract.signedAt 
                    ? format(new Date(contract.signedAt), "PPP 'at' p") 
                    : "Not signed"}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Document</Label>
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(contract.documentUrl, "_blank")}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    View Document
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/onboarding")}>
              Return to Onboarding
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Review and Sign Contract</CardTitle>
            <Badge>PENDING</Badge>
          </div>
          <CardDescription>
            Please review the contract carefully before signing.
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="review" value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="review">1. Review</TabsTrigger>
              <TabsTrigger value="decision" disabled={activeTab === "review"}>2. Decision</TabsTrigger>
              <TabsTrigger value="confirmation" disabled={activeTab !== "confirmation"}>3. Confirmation</TabsTrigger>
            </TabsList>
          </div>
          
          <CardContent className="pt-6">
            <TabsContent value="review" className="space-y-4">
              <div className="border rounded-md overflow-hidden">
                <iframe 
                  src={contract.documentUrl}
                  className="w-full h-[60vh]"
                  title="Contract Document"
                ></iframe>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => setActiveTab("decision")}>
                  Continue to Decision
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="decision">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label>Your Decision</Label>
                  <div className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="sign"
                        value="SIGNED"
                        {...register("status")}
                        defaultChecked
                      />
                      <Label htmlFor="sign" className="cursor-pointer">
                        Sign the contract
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="reject"
                        value="REJECTED"
                        {...register("status")}
                      />
                      <Label htmlFor="reject" className="cursor-pointer">
                        Reject the contract
                      </Label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="agreedToTerms"
                      {...register("agreedToTerms")}
                    />
                    <Label
                      htmlFor="agreedToTerms"
                      className="text-sm cursor-pointer"
                    >
                      I have read and agree to the terms and conditions in this contract
                    </Label>
                  </div>
                  {errors.agreedToTerms && (
                    <p className="text-sm text-red-500">{errors.agreedToTerms.message}</p>
                  )}
                </div>
                
                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("review")}
                  >
                    Back to Review
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || updateContractMutation.isLoading}
                  >
                    {isSubmitting || updateContractMutation.isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Submit Decision"
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="confirmation">
              <div className="flex flex-col items-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">Decision Recorded</h3>
                <p className="mt-2 text-center text-gray-500">
                  Your decision has been successfully recorded. You will be redirected shortly.
                </p>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
        
        <CardFooter className="text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>
              This is a legally binding agreement between you and {contract.manager?.name || "the company"}.
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 