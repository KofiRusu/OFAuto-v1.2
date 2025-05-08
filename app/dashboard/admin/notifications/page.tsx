"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { NotificationType } from "@/lib/schemas/notifications";
import { CheckCircle2, SendHorizontal, Users } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { format } from "date-fns";

// Schema for notification form
const formSchema = z.object({
  recipients: z.enum(["all_models", "all_managers", "specific"]),
  specificUsers: z.array(z.string()).optional(),
  type: z.enum(Object.values(NotificationType.enum) as [string, ...string[]]),
  title: z.string().min(3).max(100),
  message: z.string().min(5).max(500),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("send");
  const [sentSuccess, setSentSuccess] = useState(false);
  
  // Get users for the recipient selection
  const { data: userData, isLoading: isLoadingUsers } = trpc.user.getAll.useQuery(undefined, {
    enabled: activeTab === "send",
  });
  
  // Get recent notifications sent by the current user
  const { data: recentNotifications, isLoading: isLoadingRecent } = 
    trpc.notifications.getRecentSent.useQuery(undefined, {
      enabled: activeTab === "history",
      refetchOnWindowFocus: true,
    });
  
  // Send notification mutation
  const sendNotification = trpc.notifications.sendNotification.useMutation({
    onSuccess: () => {
      toast({
        title: "Notification sent successfully",
        description: "Your notification has been sent to the selected recipients",
        variant: "default",
      });
      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 3000);
      
      // Reset form
      form.reset({
        recipients: "all_models",
        type: NotificationType.enum.SYSTEM_ALERT,
        title: "",
        message: "",
      });
      
      // Refetch recent notifications if we're in that tab
      if (activeTab === "history") {
        utils.notifications.getRecentSent.invalidate();
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to send notification",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const utils = trpc.useContext();
  
  // Setup form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipients: "all_models",
      type: NotificationType.enum.SYSTEM_ALERT,
      title: "",
      message: "",
    },
  });
  
  const onSubmit = (values: FormValues) => {
    // Determine which user IDs to send to
    let userIds: string[] = [];
    
    if (values.recipients === "all_models") {
      // Get all model users
      userIds = userData?.filter(user => user.role === "MODEL").map(user => user.id) || [];
    } else if (values.recipients === "all_managers") {
      // Get all manager users
      userIds = userData?.filter(user => user.role === "MANAGER").map(user => user.id) || [];
    } else if (values.specificUsers) {
      // Use specific users provided
      userIds = values.specificUsers;
    }
    
    if (userIds.length === 0) {
      toast({
        title: "No recipients selected",
        description: "Please select at least one recipient for the notification",
        variant: "destructive",
      });
      return;
    }
    
    // Send the notification
    sendNotification.mutate({
      userIds,
      type: values.type as any,
      title: values.title,
      message: values.message,
    });
  };
  
  // Function to get display name for notification type
  const getDisplayType = (type: string) => {
    return type.replace(/_/g, " ");
  };
  
  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notification Management</h1>
        <p className="text-muted-foreground">
          Send notifications to models and managers
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="send">Send Notifications</TabsTrigger>
          <TabsTrigger value="history">Notification History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="send" className="space-y-6 mt-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Send New Notification</CardTitle>
              <CardDescription>Create and send notifications to users</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="recipients"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipients</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select recipients" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all_models">All Models</SelectItem>
                              <SelectItem value="all_managers">All Managers</SelectItem>
                              <SelectItem value="specific">Specific Users</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          Choose who will receive this notification
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("recipients") === "specific" && (
                    <FormField
                      control={form.control}
                      name="specificUsers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Users</FormLabel>
                          <FormControl>
                            <Select
                              // This would be replaced with a multi-select component in a real app
                              value={field.value?.[0] || ""}
                              onValueChange={(value) => field.onChange([value])}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a user" />
                              </SelectTrigger>
                              <SelectContent>
                                {isLoadingUsers ? (
                                  <div className="flex justify-center p-2">
                                    <Spinner size="sm" />
                                  </div>
                                ) : userData && userData.length > 0 ? (
                                  userData.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.name || user.email} ({user.role})
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="no-users" disabled>
                                    No users available
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>
                            Select specific users to receive this notification
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notification Type</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(NotificationType.enum).map((type) => (
                                <SelectItem key={type} value={type}>
                                  {getDisplayType(type)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          Choose the type of notification
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Notification title" {...field} />
                        </FormControl>
                        <FormDescription>
                          A clear, concise title for the notification
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notification message"
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          The main content of your notification
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="submit"
                    disabled={sendNotification.isLoading || sentSuccess}
                    className="w-full"
                  >
                    {sendNotification.isLoading ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Sending...
                      </>
                    ) : sentSuccess ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Sent Successfully
                      </>
                    ) : (
                      <>
                        <SendHorizontal className="h-4 w-4 mr-2" />
                        Send Notification
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>Recent notifications you've sent</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRecent ? (
                <div className="flex justify-center items-center h-40">
                  <Spinner size="lg" />
                </div>
              ) : recentNotifications && recentNotifications.length > 0 ? (
                <div className="space-y-4">
                  {recentNotifications.map((notification) => (
                    <Card key={notification.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{notification.title}</CardTitle>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(notification.createdAt), "PPp")}
                          </div>
                        </div>
                        <CardDescription className="flex items-center gap-2">
                          <span className="uppercase text-xs">{getDisplayType(notification.type)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {notification.recipientCount} recipients
                          </span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>{notification.message}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No notifications sent yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 