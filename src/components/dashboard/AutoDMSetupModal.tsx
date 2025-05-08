'use client';

import React from 'react';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertCircle, 
  Loader2,
  MessageSquare,
  Info
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/ui/use-toast";
import { logger } from '@/lib/logger';

// Define the form schema
const autoDMSchema = z.object({
  platformType: z.string().min(1, "Platform is required"),
  trigger: z.string().min(1, "Trigger is required"),
  message: z.string().min(1, "Message content is required").max(1000, "Message cannot exceed 1000 characters"),
  isRecurring: z.boolean().default(false),
});

type FormData = z.infer<typeof autoDMSchema>;

// Define trigger options
const TRIGGERS = [
  { id: 'new_follower', name: 'New Follower', platforms: ['twitter', 'instagram'] },
  { id: 'new_subscriber', name: 'New Subscriber', platforms: ['onlyfans', 'fansly', 'patreon'] },
  { id: 'renewal', name: 'Subscription Renewal', platforms: ['onlyfans', 'fansly', 'patreon'] },
  { id: 'tip_received', name: 'Tip Received', platforms: ['onlyfans', 'fansly', 'kofi'] },
  { id: 'purchase_confirmation', name: 'Purchase Confirmation', platforms: ['gumroad'] },
];

interface AutoDMSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
}

export default function AutoDMSetupModal({ isOpen, onClose, clientId }: AutoDMSetupModalProps) {
  const { toast } = useToast();
  
  // Get the connected platforms
  const { 
    data: connectedPlatforms,
    isLoading: platformsLoading
  } = trpc.platformConnections.getStatus.useQuery(
    { clientId },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (err) => {
        logger.error({ err, clientId }, "Failed to fetch platform statuses");
        toast({ title: "Error", description: "Could not load platform connections.", variant: "destructive" });
      }
    }
  );
  
  // Create auto DM task mutation
  const createDMMutation = trpc.marketing.createAutoDMTask.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Automated DM task has been set up." });
      form.reset();
      onClose();
    },
    onError: (err) => {
      logger.error({ err, clientId }, "Failed to create auto DM task");
      toast({ title: "Error", description: `Failed to set up auto DM: ${err.message}`, variant: "destructive" });
    }
  });
  
  // Set up form with validation
  const form = useForm<FormData>({
    resolver: zodResolver(autoDMSchema),
    defaultValues: {
      platformType: "",
      trigger: "",
      message: "",
      isRecurring: false,
    },
  });
  
  const { 
    formState: { errors },
    watch,
    setValue,
    reset
  } = form;
  
  // Watch for platform change
  const selectedPlatform = watch('platformType');
  
  // Filter triggers based on selected platform
  const availableTriggers = selectedPlatform 
    ? TRIGGERS.filter(trigger => trigger.platforms.includes(selectedPlatform))
    : [];
  
  // Reset trigger when platform changes
  React.useEffect(() => {
    setValue('trigger', '');
  }, [selectedPlatform, setValue]);
  
  // Submit handler
  const onSubmit = async (values: FormData) => {
    createDMMutation.mutate({
      clientId,
      platformType: values.platformType,
      trigger: values.trigger,
      message: values.message,
      isRecurring: values.isRecurring
    });
  };
  
  // Handle modal close
  const handleClose = () => {
    reset();
    onClose();
  };

  // Get connected platforms as options for select
  const getConnectedPlatformOptions = () => {
    if (!connectedPlatforms) return [];
    
    return Object.entries(connectedPlatforms)
      .filter(([_, status]) => status.connected)
      .map(([id]) => {
        return {
          id,
          // Format name with first letter uppercase
          name: id.charAt(0).toUpperCase() + id.slice(1)
        };
      });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[550px] dark:bg-slate-900 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle>Set Up Automated DM</DialogTitle>
          <DialogDescription>
            Create rules to automatically send direct messages to users based on their actions.
          </DialogDescription>
        </DialogHeader>
        
        {platformsLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Platform Selection */}
              <FormField
                control={form.control}
                name="platformType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getConnectedPlatformOptions().map(platform => (
                          <SelectItem key={platform.id} value={platform.id}>
                            {platform.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the platform where you want to set up automated DMs.
                    </FormDescription>
                    {errors.platformType && (
                      <FormMessage>{errors.platformType.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />
              
              {/* Trigger Selection */}
              {selectedPlatform && (
                <FormField
                  control={form.control}
                  name="trigger"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trigger Event</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={availableTriggers.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select when to send the message" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableTriggers.length > 0 ? (
                            availableTriggers.map(trigger => (
                              <SelectItem key={trigger.id} value={trigger.id}>
                                {trigger.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              No triggers available for this platform
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the event that will trigger the automated message.
                      </FormDescription>
                      {errors.trigger && (
                        <FormMessage>{errors.trigger.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />
              )}
              
              {/* Message Content */}
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Enter your automated message here..."
                        className="min-h-[120px] resize-y dark:bg-slate-800"
                      />
                    </FormControl>
                    <FormDescription>
                      Use {{name}} to insert the recipient's name if available.
                    </FormDescription>
                    {errors.message && (
                      <FormMessage>{errors.message.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />
              
              {/* Recurring Option */}
              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Recurring
                      </FormLabel>
                      <FormDescription>
                        If checked, this message will be sent every time the trigger occurs. Otherwise, it will only be sent once per user.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              {/* Info Box */}
              <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle>Messaging Limits</AlertTitle>
                <AlertDescription className="text-sm">
                  Platform messaging limits apply. Automated messages count towards your daily DM limits on each platform.
                </AlertDescription>
              </Alert>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={createDMMutation.isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createDMMutation.isLoading}
                >
                  {createDMMutation.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Setting up...
                    </>
                  ) : (
                    <>Set Up Auto-DM</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
} 