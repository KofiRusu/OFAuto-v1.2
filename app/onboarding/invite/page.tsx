"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const inviteModelSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  percentage: z.number().min(1).max(100),
  startDate: z.date().optional(),
  endDate: z.date().nullable().optional(),
});

type InviteModelFormValues = z.infer<typeof inviteModelSchema>;

export default function InviteModelPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get existing commission splits
  const { data: commissionSplits, isLoading, refetch } = api.onboarding.getOwnedCommissionSplits.useQuery();
  
  // tRPC mutations
  const { mutate: inviteModel } = api.onboarding.inviteModel.useMutation({
    onSuccess: () => {
      toast({
        title: "Model invited successfully",
        description: "Your invitation has been sent to the model.",
      });
      setIsSubmitting(false);
      form.reset({
        email: "",
        percentage: 50,
        startDate: new Date(),
        endDate: null,
      });
      refetch();
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: error.message || "Failed to invite model.",
        variant: "destructive",
      });
    },
  });
  
  // Form definition
  const form = useForm<InviteModelFormValues>({
    resolver: zodResolver(inviteModelSchema),
    defaultValues: {
      email: "",
      percentage: 50,
      startDate: new Date(),
      endDate: null,
    },
  });
  
  // Form submission handler
  const onSubmit = (data: InviteModelFormValues) => {
    setIsSubmitting(true);
    inviteModel(data);
  };
  
  return (
    <div className="container py-10">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invite a Model</CardTitle>
            <CardDescription>
              Invite models to share commission with you. You can specify the percentage of commission they'll receive.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model Email</FormLabel>
                      <FormControl>
                        <Input placeholder="model@example.com" type="email" {...field} />
                      </FormControl>
                      <FormDescription>
                        The model must have an existing account in the system.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission Percentage ({field.value}%)</FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={100}
                          step={1}
                          defaultValue={[field.value]}
                          onValueChange={(values) => {
                            field.onChange(values[0]);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Percentage of commission the model will receive
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value) : undefined;
                              field.onChange(date);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value) : null;
                              field.onChange(date);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Leave empty for indefinite agreements
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <CardFooter className="flex justify-end px-0">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Inviting..." : "Send Invitation"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Commission Splits</CardTitle>
            <CardDescription>
              Active commission sharing arrangements with models
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-6 text-center">Loading...</div>
            ) : commissionSplits && commissionSplits.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissionSplits.map((split) => (
                    <TableRow key={split.id}>
                      <TableCell>{split.sharer?.name || split.sharer?.email || 'Unknown'}</TableCell>
                      <TableCell>{split.percentage}%</TableCell>
                      <TableCell>{format(new Date(split.startDate), 'MM/dd/yyyy')}</TableCell>
                      <TableCell>{split.active ? 'Active' : 'Inactive'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-10 text-center text-muted-foreground">
                No commission splits configured yet.
                <p className="mt-2 text-sm">
                  Invite models to start sharing commissions.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.push('/onboarding/bank-info')}
        >
          Back to Bank Info
        </Button>
        <Button
          onClick={() => router.push('/dashboard')}
        >
          Complete Onboarding
        </Button>
      </div>
    </div>
  );
} 