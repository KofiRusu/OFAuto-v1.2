'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { trpc } from '@/lib/trpc/client';
import { ComplianceReportCreateSchema } from '@/lib/schemas/compliance';
import { z } from 'zod';
import {
  AlertCircle,
  CheckCircle2,
  Flag,
  Info,
  MessageSquare,
  ShieldAlert,
  User
} from 'lucide-react';

// Custom schema for the form that doesn't require reporterId
// (we'll add that from the current user context)
const ReportFormSchema = ComplianceReportCreateSchema.omit({ 
  reporterId: true 
});

type ReportFormValues = z.infer<typeof ReportFormSchema>;

export default function ReportPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Set up the mutation
  const submitReportMutation = trpc.compliance.submitReport.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setIsSubmitting(false);
      toast({
        title: "Report submitted",
        description: "Your report has been submitted successfully. Our team will review it shortly.",
      });
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: "Failed to submit report",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Set up the form with validation
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(ReportFormSchema),
    defaultValues: {
      type: undefined,
      contentId: '',
      details: '',
    }
  });

  // Form submission handler
  const onSubmit = async (values: ReportFormValues) => {
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to submit a report.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // Add the reporter ID from the current user
    submitReportMutation.mutate({
      ...values,
      reporterId: user.id,
    });
  };

  // If form was submitted successfully, show a success message
  if (submitted) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <CardTitle>Report Submitted</CardTitle>
            </div>
            <CardDescription>
              Thank you for helping us maintain platform safety
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 mb-4">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle>Report Received</AlertTitle>
              <AlertDescription>
                Our team will review your report and take appropriate action if necessary.
              </AlertDescription>
            </Alert>
            <p className="text-muted-foreground mb-4">
              We take all reports seriously and will investigate the issue as soon as possible.
              If we need more information, we'll contact you directly.
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Return to Dashboard
            </Button>
            <Button onClick={() => {
              setSubmitted(false);
              form.reset();
            }}>
              Submit Another Report
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Report Content</h1>
          <p className="text-muted-foreground">
            Submit a report for inappropriate or concerning content
          </p>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Flag className="h-5 w-5 text-red-500" />
            <CardTitle>Content Report Form</CardTitle>
          </div>
          <CardDescription>
            Use this form to report content that violates our community guidelines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>Report Responsibly</AlertTitle>
            <AlertDescription>
              Please only report content that genuinely violates our terms of service or community guidelines.
              False or malicious reports may result in account restrictions.
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select what you're reporting" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DM_CONTENT">
                          <div className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            <span>Direct Message Content</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="POST_CONTENT">
                          <div className="flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            <span>Post Content</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="PROFILE_CONTENT">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            <span>Profile Content</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the type of content you're reporting
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content ID (if applicable)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter post ID, message ID, or profile ID" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      If known, provide the specific ID of the content you're reporting
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Details</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Please describe the issue in detail. Include what happened, when it occurred, and why you believe it violates our guidelines." 
                        className="h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a clear explanation of what you're reporting and why
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-muted p-4 rounded-md">
                <div className="flex items-start space-x-3">
                  <ShieldAlert className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Our commitment to safety</h4>
                    <p className="text-sm text-muted-foreground">
                      We take all reports seriously and aim to review them within 24 hours.
                      Your identity will be kept confidential during the review process.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !isLoaded}
                  className="w-full md:w-auto"
                >
                  {isSubmitting ? "Submitting..." : "Submit Report"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 