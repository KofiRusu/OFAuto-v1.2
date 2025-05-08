"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { createBankAccountSchema } from "@/lib/schemas/onboarding";
import { api } from "@/lib/trpc/client";

import type { CreateBankAccount } from "@/lib/schemas/onboarding";

export default function BankInfoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // tRPC queries and mutations
  const { data: bankAccounts, isLoading, refetch } = api.onboarding.getBankAccounts.useQuery();
  
  const { mutate: addBankAccount } = api.onboarding.uploadBankInfo.useMutation({
    onSuccess: () => {
      toast({
        title: "Bank account added",
        description: "Your bank information has been saved successfully.",
      });
      setIsSubmitting(false);
      form.reset();
      refetch();
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: error.message || "Failed to save bank information.",
        variant: "destructive",
      });
    },
  });
  
  const { mutate: deleteBankAccount } = api.onboarding.deleteBankAccount.useMutation({
    onSuccess: () => {
      toast({
        title: "Bank account removed",
        description: "The bank account has been removed successfully.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove bank account.",
        variant: "destructive",
      });
    },
  });
  
  const { mutate: setPrimaryAccount } = api.onboarding.setPrimaryBankAccount.useMutation({
    onSuccess: () => {
      toast({
        title: "Primary account updated",
        description: "Your primary bank account has been updated.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update primary account.",
        variant: "destructive",
      });
    },
  });
  
  // Form definition
  const form = useForm<CreateBankAccount>({
    resolver: zodResolver(createBankAccountSchema),
    defaultValues: {
      accountHolderName: "",
      accountNumber: "",
      routingNumber: "",
      bankName: "",
      accountType: "CHECKING",
    },
  });
  
  // Form submission handler
  const onSubmit = (data: CreateBankAccount) => {
    setIsSubmitting(true);
    addBankAccount(data);
  };
  
  const handleDeleteAccount = (id: string) => {
    if (confirm("Are you sure you want to remove this bank account?")) {
      deleteBankAccount({ id });
    }
  };
  
  const handleSetPrimary = (id: string) => {
    setPrimaryAccount({ id });
  };
  
  const continueToPlatform = () => {
    if (!bankAccounts || bankAccounts.length === 0) {
      toast({
        title: "Bank account required",
        description: "Please add at least one bank account to continue.",
        variant: "destructive",
      });
      return;
    }
    
    router.push('/onboarding/invite');
  };
  
  return (
    <div className="container py-10">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Banking Information</CardTitle>
            <CardDescription>
              Add your bank account details for commission payouts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="accountHolderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Holder Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Bank of America" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="accountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CHECKING">Checking</SelectItem>
                          <SelectItem value="SAVINGS">Savings</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="routingNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Routing Number</FormLabel>
                      <FormControl>
                        <Input placeholder="123456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input placeholder="12345678901234" type="password" {...field} />
                      </FormControl>
                      <FormDescription>
                        Your account information is encrypted for security.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <CardFooter className="flex justify-end px-0">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add Bank Account"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Bank Accounts</CardTitle>
            <CardDescription>
              Manage your saved bank accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-6 text-center">Loading...</div>
            ) : bankAccounts && bankAccounts.length > 0 ? (
              <div className="space-y-4">
                {bankAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{account.bankName}</h3>
                        {account.primary && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {account.accountType} •••• {account.accountNumber.slice(-4)}
                      </p>
                      <p className="text-xs text-muted-foreground">{account.accountHolderName}</p>
                    </div>
                    <div className="flex gap-2">
                      {!account.primary && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetPrimary(account.id)}
                          title="Set as primary account"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAccount(account.id)}
                        title="Delete account"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-muted-foreground">
                No bank accounts added yet.
                <p className="mt-2 text-sm">
                  Add at least one bank account to receive payments.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.push('/onboarding/profile')}
        >
          Back to Profile
        </Button>
        <Button
          onClick={continueToPlatform}
        >
          Continue
        </Button>
      </div>
    </div>
  );
} 