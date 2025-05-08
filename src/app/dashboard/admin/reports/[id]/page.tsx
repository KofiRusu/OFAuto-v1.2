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
import { Button } from '@/components/ui/button';
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { trpc } from '@/lib/trpc/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ReportUpdateSchema, TakedownRequestCreateSchema } from '@/lib/schemas/compliance';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Flag,
  Info,
  MessageSquare,
  Shield,
  ShieldAlert,
  ThumbsDown,
  User
} from 'lucide-react';

// Helper for report type icons
const ReportTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'DM_CONTENT':
      return <MessageSquare className="h-4 w-4" />;
    case 'POST_CONTENT':
      return <Flag className="h-4 w-4" />;
    case 'PROFILE_CONTENT':
      return <User className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

// Helper for status badges
const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'PENDING':
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">Pending</Badge>;
    case 'REVIEWED':
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">Reviewed</Badge>;
    case 'RESOLVED':
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">Resolved</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Custom schemas for the forms
const ReviewFormSchema = ReportUpdateSchema.omit({ 
  id: true 
}).extend({
  adminNotes: z.string().min(10, "Please provide detailed notes about your review").max(1000),
});

type ReviewFormValues = z.infer<typeof ReviewFormSchema>;

const TakedownFormSchema = TakedownRequestCreateSchema.omit({ 
  reportId: true,
  requestedBy: true 
}).extend({
  reason: z.string().min(10, "Please provide a detailed reason for the takedown").max(1000),
});

type TakedownFormValues = z.infer<typeof TakedownFormSchema>;

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoaded } = useUser();
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [isTakedownSubmitting, setIsTakedownSubmitting] = useState(false);
  
  // Get the report details
  const { 
    data: reportData, 
    isLoading: reportLoading,
    refetch: refetchReport
  } = trpc.compliance.getReportById.useQuery({ 
    id: params.id 
  });

  // Review report mutation
  const reviewReportMutation = trpc.compliance.reviewReport.useMutation({
    onSuccess: () => {
      setIsReviewSubmitting(false);
      toast({
        title: "Report reviewed",
        description: "The report status has been updated successfully.",
      });
      refetchReport();
    },
    onError: (error) => {
      setIsReviewSubmitting(false);
      toast({
        title: "Failed to review report",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Create takedown request mutation
  const createTakedownMutation = trpc.compliance.createTakedownRequest.useMutation({
    onSuccess: () => {
      setIsTakedownSubmitting(false);
      toast({
        title: "Takedown request created",
        description: "A takedown request has been submitted successfully.",
      });
      refetchReport();
    },
    onError: (error) => {
      setIsTakedownSubmitting(false);
      toast({
        title: "Failed to create takedown request",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Set up the review form
  const reviewForm = useForm<ReviewFormValues>({
    resolver: zodResolver(ReviewFormSchema),
    defaultValues: {
      status: 'REVIEWED',
      adminNotes: '',
    }
  });

  // Set up the takedown form
  const takedownForm = useForm<TakedownFormValues>({
    resolver: zodResolver(TakedownFormSchema),
    defaultValues: {
      reason: '',
    }
  });

  // Form submission handlers
  const onReviewSubmit = (values: ReviewFormValues) => {
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "You must be logged in as an admin to review reports.",
        variant: "destructive"
      });
      return;
    }

    setIsReviewSubmitting(true);

    reviewReportMutation.mutate({
      id: params.id,
      status: values.status,
      adminNotes: values.adminNotes,
    });
  };

  const onTakedownSubmit = (values: TakedownFormValues) => {
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "You must be logged in as an admin to create takedown requests.",
        variant: "destructive"
      });
      return;
    }

    setIsTakedownSubmitting(true);

    createTakedownMutation.mutate({
      reportId: params.id,
      requestedBy: user.id,
      reason: values.reason,
    });
  };

  const handleBack = () => {
    router.push('/dashboard/admin/reports');
  };

  // Function to get content type description
  const getContentTypeDescription = (type: string) => {
    switch (type) {
      case 'DM_CONTENT':
        return 'Direct Message Content';
      case 'POST_CONTENT':
        return 'Post Content';
      case 'PROFILE_CONTENT':
        return 'Profile Content';
      default:
        return type;
    }
  };

  if (reportLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!reportData?.report) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Report Not Found</CardTitle>
            <CardDescription>
              The report you're looking for doesn't exist or you don't have permission to view it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Unable to find the requested report. Please return to the reports list.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button onClick={handleBack}>
              Return to Reports List
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const { report } = reportData;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row items-start gap-6">
        <div className="w-full md:w-2/3">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <ReportTypeIcon type={report.type} />
                    <CardTitle>{getContentTypeDescription(report.type)} Report</CardTitle>
                    <StatusBadge status={report.status} />
                  </div>
                  <CardDescription>
                    Submitted on {format(new Date(report.createdAt), 'MMMM d, yyyy h:mm a')}
                  </CardDescription>
                </div>
                <div>
                  <Badge variant="outline" className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {report.status === 'PENDING' ? 'Awaiting Review' : 
                     report.status === 'REVIEWED' ? 'Under Review' : 
                     'Case Closed'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-sm mb-2">Reporter Information</h3>
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-md">
                  <Avatar>
                    <AvatarImage src={''} alt={report.reporter.name || 'User'} />
                    <AvatarFallback>{report.reporter.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{report.reporter.name || 'Anonymous User'}</div>
                    <div className="text-sm text-muted-foreground">{report.reporter.email}</div>
                  </div>
                </div>
              </div>
              
              {report.contentId && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">Content Reference</h3>
                  <div className="p-3 bg-muted rounded-md">
                    <div className="text-sm">
                      <span className="font-medium">Content ID:</span> {report.contentId}
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="font-semibold text-sm mb-2">Report Details</h3>
                <div className="p-4 border rounded-md">
                  <p className="whitespace-pre-wrap">
                    {report.details}
                  </p>
                </div>
              </div>
              
              {report.takedowns.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">Takedown Requests</h3>
                  <div className="space-y-3">
                    {report.takedowns.map((takedown) => (
                      <div key={takedown.id} className="p-3 border rounded-md">
                        <div className="flex justify-between">
                          <Badge variant="outline" className={
                            takedown.status === 'PENDING' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                            takedown.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/20' :
                            'bg-red-100 dark:bg-red-900/20'
                          }>
                            {takedown.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(takedown.createdAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <p className="text-sm mt-2">
                          Takedown request ID: {takedown.id}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Report ID: {report.id}
              </div>
            </CardFooter>
          </Card>
          
          {report.status !== 'RESOLVED' && (
            <Card>
              <CardHeader>
                <CardTitle>Create Takedown Request</CardTitle>
                <CardDescription>
                  Request content removal if this report is valid
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20">
                  <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    Takedown requests should only be created for content that clearly violates our
                    terms of service. All takedowns are logged and audited.
                  </AlertDescription>
                </Alert>
                
                <Form {...takedownForm}>
                  <form onSubmit={takedownForm.handleSubmit(onTakedownSubmit)} className="space-y-6">
                    <FormField
                      control={takedownForm.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Takedown Reason</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Explain why this content should be removed. Include specific violations of our terms of service." 
                              className="h-32"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Provide a clear explanation for the content removal
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            type="button" 
                            variant="destructive"
                            disabled={isTakedownSubmitting}
                          >
                            <ThumbsDown className="h-4 w-4 mr-2" />
                            {isTakedownSubmitting ? "Processing..." : "Request Takedown"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Takedown Request</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to create a takedown request? This action will
                              initiate the process to remove the content from the platform.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={(e) => {
                                e.preventDefault();
                                takedownForm.handleSubmit(onTakedownSubmit)();
                              }}
                            >
                              Confirm Takedown
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="w-full md:w-1/3">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Review Report</CardTitle>
              <CardDescription>
                Update the status and provide notes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...reviewForm}>
                <form onSubmit={reviewForm.handleSubmit(onReviewSubmit)} className="space-y-6">
                  <FormField
                    control={reviewForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="REVIEWED">Reviewed</SelectItem>
                            <SelectItem value="RESOLVED">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Update the report status
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={reviewForm.control}
                    name="adminNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add notes about your review of this report" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Internal notes about the report (not visible to users)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isReviewSubmitting}
                  >
                    {isReviewSubmitting ? "Saving..." : "Update Status"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Help & Guidelines</CardTitle>
              <CardDescription>
                Review process guidelines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Evaluation Steps</h4>
                <ul className="text-sm space-y-1">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                    <span>Verify the reported content exists</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                    <span>Assess if it violates our terms of service</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                    <span>Determine if a takedown is required</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                    <span>Document your review process in notes</span>
                  </li>
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold text-sm mb-2">Common Violations</h4>
                <ul className="text-sm space-y-1">
                  <li>• Harassment or bullying</li>
                  <li>• Non-consensual intimate content</li>
                  <li>• Impersonation</li>
                  <li>• Violent threats</li>
                  <li>• Spam or scams</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 