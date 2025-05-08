'use client';

import React, { useState } from 'react';
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertCircle, 
  Loader2, 
  Calendar as CalendarIcon, 
  Clock, 
  ImageIcon,
  Upload,
  X,
  Check
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/ui/use-toast";
import { logger } from '@/lib/logger';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

// Define the form schema
const postSchedulerSchema = z.object({
  platforms: z.array(z.string()).min(1, "Select at least one platform"),
  content: z.string().min(1, "Post content is required").max(2000, "Content cannot exceed 2000 characters"),
  mediaUrl: z.string().optional(),
  scheduleNow: z.boolean().default(false),
  scheduledAt: z.date().optional().nullable(),
});

type FormData = z.infer<typeof postSchedulerSchema>;

// Define the platforms
const PLATFORMS = [
  { id: 'twitter', name: 'Twitter', maxCharacters: 280 },
  { id: 'instagram', name: 'Instagram', requiresMedia: true },
  { id: 'gumroad', name: 'Gumroad' },
  { id: 'patreon', name: 'Patreon' },
  { id: 'onlyfans', name: 'OnlyFans' },
  { id: 'fansly', name: 'Fansly' },
];

interface PostSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
}

export default function PostSchedulerModal({ isOpen, onClose, clientId }: PostSchedulerModalProps) {
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
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
  
  // Create scheduled post mutation
  const scheduleMutation = trpc.marketing.createScheduledPost.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Post has been scheduled." });
      form.reset();
      onClose();
    },
    onError: (err) => {
      logger.error({ err, clientId }, "Failed to schedule post");
      toast({ title: "Error", description: `Failed to schedule post: ${err.message}`, variant: "destructive" });
    }
  });
  
  // Set up form with validation
  const form = useForm<FormData>({
    resolver: zodResolver(postSchedulerSchema),
    defaultValues: {
      platforms: [],
      content: '',
      mediaUrl: '',
      scheduleNow: false,
      scheduledAt: null,
    },
  });
  
  const { 
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset
  } = form;
  
  // Watch for form values
  const selectedPlatforms = watch('platforms');
  const scheduleNow = watch('scheduleNow');
  const scheduledAt = watch('scheduledAt');
  const content = watch('content');
  
  // Calculate maximum character limit based on selected platforms
  const getMaxCharacterLimit = () => {
    if (selectedPlatforms.includes('twitter')) return 280;
    return 2000; // Default limit for other platforms
  };
  
  // Check if selected platforms require media
  const requiresMedia = () => {
    return selectedPlatforms.includes('instagram');
  };
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // For demo purposes, we're just storing the file locally
    // In a real implementation, this would upload to a storage service
    setUploadedFile(file);
    setIsUploading(true);
    
    // Simulate upload
    setTimeout(() => {
      setIsUploading(false);
      // Set a fake URL for demo purposes
      setValue('mediaUrl', URL.createObjectURL(file));
      toast({ title: "Upload complete", description: `${file.name} uploaded successfully.` });
    }, 1500);
  };
  
  // Remove uploaded file
  const removeUploadedFile = () => {
    setUploadedFile(null);
    setValue('mediaUrl', '');
  };
  
  // Submit handler
  const onSubmit = async (values: FormData) => {
    // Validation checks
    if (!values.scheduleNow && !values.scheduledAt) {
      toast({ 
        title: "Validation Error", 
        description: "Please select a date and time for the scheduled post", 
        variant: "destructive" 
      });
      return;
    }
    
    if (requiresMedia() && !values.mediaUrl) {
      toast({ 
        title: "Validation Error", 
        description: "Instagram posts require media attachment", 
        variant: "destructive" 
      });
      return;
    }
    
    // Set scheduledAt to now if scheduleNow is true
    if (values.scheduleNow) {
      values.scheduledAt = new Date();
    }
    
    // Submit the scheduled post
    const payload = {
      clientId,
      platforms: values.platforms,
      content: values.content,
      mediaUrl: values.mediaUrl,
      scheduledAt: values.scheduledAt as Date,
    };
    
    scheduleMutation.mutate(payload);
  };
  
  // Handle modal close
  const handleClose = () => {
    reset();
    setUploadedFile(null);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px] dark:bg-slate-900 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle>Schedule a Post</DialogTitle>
          <DialogDescription>
            Create and schedule content across your connected platforms.
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
                name="platforms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platforms</FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PLATFORMS.map((platform) => {
                        // Check if platform is connected
                        const isConnected = connectedPlatforms?.[platform.id]?.connected;
                        
                        return (
                          <div key={platform.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`platform-${platform.id}`}
                              disabled={!isConnected}
                              checked={field.value?.includes(platform.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...field.value, platform.id]);
                                } else {
                                  field.onChange(field.value?.filter(
                                    (value) => value !== platform.id
                                  ));
                                }
                              }}
                            />
                            <label 
                              htmlFor={`platform-${platform.id}`}
                              className={cn(
                                "text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                                !isConnected && "text-gray-400 dark:text-gray-600"
                              )}
                            >
                              {platform.name}
                              {!isConnected && (
                                <span className="ml-1 text-xs">(Not connected)</span>
                              )}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                    {errors.platforms && (
                      <FormMessage>{errors.platforms.message}</FormMessage>
                    )}
                    <FormDescription>
                      Select the platforms where you want to post.
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              {/* Content */}
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Post Content</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Textarea 
                          {...field} 
                          placeholder="Write your post here..."
                          className="min-h-[120px] resize-y dark:bg-slate-800"
                        />
                        <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                          {content.length} / {getMaxCharacterLimit()}
                        </div>
                      </div>
                    </FormControl>
                    {errors.content && (
                      <FormMessage>{errors.content.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />
              
              {/* Media Upload */}
              <FormField
                control={form.control}
                name="mediaUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Media Attachment</FormLabel>
                    {requiresMedia() && (
                      <Alert variant="warning" className="mb-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Media Required</AlertTitle>
                        <AlertDescription>
                          Instagram posts require an image or video.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {!uploadedFile ? (
                      <div className="flex items-center justify-center border-2 border-dashed rounded-md p-6 dark:border-slate-700">
                        <label htmlFor="file-upload" className="cursor-pointer text-center">
                          <div className="flex flex-col items-center">
                            <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Click to upload image or video</span>
                            <span className="text-xs text-gray-500 mt-1">PNG, JPG, MP4 up to 10MB</span>
                          </div>
                          <input 
                            id="file-upload" 
                            type="file" 
                            className="hidden" 
                            accept="image/png,image/jpeg,image/jpg,video/mp4"
                            onChange={handleFileUpload}
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="border rounded-md p-3 flex justify-between items-center dark:border-slate-700">
                        <div className="flex items-center">
                          <ImageIcon className="h-5 w-5 text-gray-500 mr-2" />
                          <span className="text-sm truncate max-w-[200px]">{uploadedFile.name}</span>
                          {isUploading ? (
                            <Loader2 className="h-4 w-4 ml-2 animate-spin text-blue-500" />
                          ) : (
                            <Check className="h-4 w-4 ml-2 text-green-500" />
                          )}
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={removeUploadedFile}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </FormItem>
                )}
              />
              
              {/* Schedule */}
              <div className="grid gap-4 pt-4">
                <FormField
                  control={form.control}
                  name="scheduleNow"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Post now
                        </FormLabel>
                        <FormDescription>
                          If checked, the post will be scheduled immediately.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                {!scheduleNow && (
                  <FormField
                    control={form.control}
                    name="scheduledAt"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Schedule Date and Time</FormLabel>
                        <div className="flex gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-[240px] pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value as Date || undefined}
                                onSelect={field.onChange}
                                initialFocus
                                disabled={(date) => date < new Date()}
                              />
                            </PopoverContent>
                          </Popover>
                          
                          <div className="flex items-center gap-2">
                            <Input
                              type="time"
                              className="w-[150px]"
                              value={field.value ? format(field.value, "HH:mm") : ""}
                              onChange={(e) => {
                                const currentDate = field.value || new Date();
                                const [hours, minutes] = e.target.value.split(':').map(Number);
                                
                                const newDate = new Date(currentDate);
                                newDate.setHours(hours);
                                newDate.setMinutes(minutes);
                                
                                field.onChange(newDate);
                              }}
                            />
                          </div>
                        </div>
                        <FormDescription>
                          Select when you want your post to be published.
                        </FormDescription>
                        {errors.scheduledAt && (
                          <FormMessage>{errors.scheduledAt.message}</FormMessage>
                        )}
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={scheduleMutation.isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={scheduleMutation.isLoading || isUploading}
                >
                  {scheduleMutation.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Scheduling...
                    </>
                  ) : scheduleNow ? (
                    <>Post Now</>
                  ) : (
                    <>Schedule Post</>
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