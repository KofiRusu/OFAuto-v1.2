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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertCircle, 
  Loader2, 
  Calendar as CalendarIcon, 
  Clock, 
  ImageIcon,
  Upload,
  X,
  Check,
  EyeIcon,
  Stamp
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/ui/use-toast";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WatermarkPreview } from "@/components/watermarking/WatermarkPreview";

// Define the form schema
const postSchedulerSchema = z.object({
  title: z.string().min(1, "Title is required"),
  platforms: z.array(z.string()).min(1, "Select at least one platform"),
  content: z.string().min(1, "Post content is required").max(2000, "Content cannot exceed 2000 characters"),
  mediaUrls: z.array(z.string()).optional().default([]),
  scheduleNow: z.boolean().default(false),
  scheduledAt: z.date().optional().nullable(),
  isDraft: z.boolean().default(false),
  watermarkProfileId: z.string().optional(),
});

type FormData = z.infer<typeof postSchedulerSchema>;

// Define the platforms
const PLATFORMS = [
  { id: 'onlyfans', name: 'OnlyFans', icon: '/icons/onlyfans.svg', maxCharacters: 1000 },
  { id: 'fansly', name: 'Fansly', icon: '/icons/fansly.svg', maxCharacters: 1000 },
  { id: 'instagram', name: 'Instagram', icon: '/icons/instagram.svg', maxCharacters: 2200, requiresMedia: true },
  { id: 'twitter', name: 'Twitter', icon: '/icons/twitter.svg', maxCharacters: 280 },
];

interface PostSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  initialData?: FormData;
  isEditing?: boolean;
  onPostCreated?: () => void;
}

export default function PostSchedulerModal({ 
  isOpen, 
  onClose, 
  clientId, 
  initialData, 
  isEditing = false,
  onPostCreated
}: PostSchedulerModalProps) {
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadingStatus, setUploadingStatus] = useState<{ [key: string]: boolean }>({});
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'media' | 'watermark' | 'schedule'>('content');
  const [mediaIds, setMediaIds] = useState<string[]>([]);
  
  // Get the connected platforms
  const { 
    data: connectedPlatforms,
    isLoading: platformsLoading,
    isError: platformsError
  } = trpc.platformConnections.getStatus.useQuery(
    { clientId },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (err) => {
        toast({ title: "Error", description: "Could not load platform connections.", variant: "destructive" });
      }
    }
  );
  
  // Create scheduled post mutation
  const createMutation = trpc.marketing.createScheduledPost.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: isEditing ? "Post has been updated." : "Post has been created." });
      form.reset();
      onPostCreated?.();
    },
    onError: (err) => {
      toast({ title: "Error", description: `Failed to ${isEditing ? 'update' : 'create'} post: ${err.message}`, variant: "destructive" });
    }
  });
  
  // Set up form with validation
  const form = useForm<FormData>({
    resolver: zodResolver(postSchedulerSchema),
    defaultValues: initialData || {
      title: '',
      platforms: [],
      content: '',
      mediaUrls: [],
      scheduleNow: false,
      scheduledAt: null,
      isDraft: false,
      watermarkProfileId: '',
    },
  });
  
  const { 
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
    trigger
  } = form;
  
  // Watch for form values
  const selectedPlatforms = watch('platforms');
  const scheduleNow = watch('scheduleNow');
  const scheduledAt = watch('scheduledAt');
  const content = watch('content');
  const isDraft = watch('isDraft');
  const mediaUrls = watch('mediaUrls');
  const watermarkProfileId = watch('watermarkProfileId');
  
  // Calculate maximum character limit based on selected platforms
  const getMaxCharacterLimit = () => {
    if (selectedPlatforms.length === 0) return 2000;
    
    return selectedPlatforms.reduce((minLimit, platformId) => {
      const platform = PLATFORMS.find(p => p.id === platformId);
      if (platform && platform.maxCharacters) {
        return Math.min(minLimit, platform.maxCharacters);
      }
      return minLimit;
    }, 2000);
  };
  
  // Check if any selected platform requires media
  const requiresMedia = () => {
    return selectedPlatforms.some(platformId => {
      const platform = PLATFORMS.find(p => p.id === platformId);
      return platform?.requiresMedia;
    });
  };
  
  // Media upload and watermark apply mutations
  const uploadMediaMutation = trpc.media.uploadMedia.useMutation({
    onSuccess: (data) => {
      // Add the media ID to our state
      setMediaIds(prev => [...prev, data.id]);
      setValue('mediaUrls', [...mediaUrls, data.url]);
      
      toast({ title: "Success", description: "Media uploaded successfully." });
    },
    onError: (err) => {
      toast({ title: "Error", description: `Failed to upload media: ${err.message}`, variant: "destructive" });
    }
  });

  const applyWatermarkMutation = trpc.media.applyWatermark.useMutation({
    onSuccess: (data) => {
      // Replace the original URL with the watermarked URL
      const originalUrlIndex = mediaUrls.findIndex(url => 
        url === data.originalUrl);
      
      if (originalUrlIndex !== -1) {
        const newMediaUrls = [...mediaUrls];
        newMediaUrls[originalUrlIndex] = data.url;
        setValue('mediaUrls', newMediaUrls);
      }
      
      toast({ title: "Success", description: "Watermark applied successfully." });
    },
    onError: (err) => {
      toast({ title: "Error", description: `Failed to apply watermark: ${err.message}`, variant: "destructive" });
    }
  });

  // Handle file upload with actual API integration
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newFiles: File[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      newFiles.push(file);
      
      // Track upload status
      setUploadingStatus(prev => ({
        ...prev,
        [file.name]: true
      }));
      
      // Read file as base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        
        // Upload via mutation
        uploadMediaMutation.mutate({
          base64Data: base64data,
          fileName: file.name,
          contentType: file.type
        });
        
        // Update upload status
        setUploadingStatus(prev => ({
          ...prev,
          [file.name]: false
        }));
      };
      
      reader.readAsDataURL(file);
    }
    
    setUploadedFiles([...uploadedFiles, ...newFiles]);
    
    // Clear the input value
    e.target.value = '';
  };
  
  // Apply watermark to an image
  const handleApplyWatermark = async (mediaId: string, watermarkId: string) => {
    await applyWatermarkMutation.mutateAsync({
      mediaId,
      watermarkProfileId: watermarkId,
      options: {
        position: 'bottomRight',
        opacity: 0.5
      }
    });
  };
  
  // Submit handler
  const onSubmit = async (values: FormData) => {
    // Skip validation for drafts
    if (!values.isDraft) {
      // Validation checks
      if (!values.scheduleNow && !values.scheduledAt) {
        toast({ 
          title: "Validation Error", 
          description: "Please select a date and time for the scheduled post", 
          variant: "destructive" 
        });
        return;
      }
      
      if (requiresMedia() && values.mediaUrls.length === 0) {
        toast({ 
          title: "Validation Error", 
          description: "At least one selected platform requires media attachment", 
          variant: "destructive" 
        });
        return;
      }
    }
    
    // Set scheduledAt to now if scheduleNow is true
    if (values.scheduleNow) {
      values.scheduledAt = new Date();
    }
    
    // Prepare payload
    const payload = {
      id: initialData?.title ? initialData.title : undefined, // Use existing ID if editing
      clientId,
      title: values.title,
      platforms: values.platforms,
      content: values.content,
      mediaUrls: values.mediaUrls,
      scheduledAt: values.isDraft ? null : values.scheduledAt as Date,
      isDraft: values.isDraft,
    };
    
    // Submit to API
    createMutation.mutate(payload);
  };
  
  // Handle modal close
  const handleClose = () => {
    setPreviewMode(false);
    reset();
    setUploadedFiles([]);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto dark:bg-slate-900 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Post' : 'Create New Post'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update your post content and settings.' : 'Create and schedule content across your connected platforms.'}
          </DialogDescription>
        </DialogHeader>
        
        {platformsError && (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load available platforms. Please try again.
            </AlertDescription>
          </Alert>
        )}
        
        {platformsLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  {previewMode ? (
                    <>Edit Post</>
                  ) : (
                    <>
                      <EyeIcon className="mr-2 h-4 w-4" />
                      Preview
                    </>
                  )}
                </Button>
              </div>
              
              {!previewMode ? (
                <>
                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Post Title</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter a title for your post"
                          />
                        </FormControl>
                        {errors.title && (
                          <FormMessage>{errors.title.message}</FormMessage>
                        )}
                        <FormDescription>
                          This title is for your reference only and won't be published.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                
                  {/* Platform Selection */}
                  <FormField
                    control={form.control}
                    name="platforms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platforms</FormLabel>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {PLATFORMS.map((platform) => {
                            // Check if platform is connected
                            const isConnected = connectedPlatforms?.[platform.id]?.connected;
                            
                            return (
                              <div 
                                key={platform.id} 
                                className={cn(
                                  "flex flex-col items-center justify-center p-3 border rounded-md cursor-pointer transition-all",
                                  field.value?.includes(platform.id) 
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                                    : "border-gray-200 dark:border-gray-700",
                                  !isConnected && "opacity-50 cursor-not-allowed"
                                )}
                                onClick={() => {
                                  if (!isConnected) return;
                                  
                                  if (field.value?.includes(platform.id)) {
                                    field.onChange(field.value?.filter(
                                      (value) => value !== platform.id
                                    ));
                                  } else {
                                    field.onChange([...field.value, platform.id]);
                                  }
                                }}
                              >
                                <div className="h-10 w-10 mb-2 flex items-center justify-center">
                                  {platform.icon ? (
                                    <img src={platform.icon} alt={platform.name} className="h-8 w-8" />
                                  ) : (
                                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                                  )}
                                </div>
                                <span className="text-sm font-medium">{platform.name}</span>
                                {!isConnected && (
                                  <span className="text-xs text-gray-500">Not connected</span>
                                )}
                                {platform.maxCharacters && (
                                  <span className="text-xs text-gray-500 mt-1">Max {platform.maxCharacters} chars</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {errors.platforms && (
                          <FormMessage>{errors.platforms.message}</FormMessage>
                        )}
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
                              className="min-h-[180px] resize-y dark:bg-slate-800"
                            />
                            <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                              {content.length} / {getMaxCharacterLimit()}
                              {content.length > getMaxCharacterLimit() && (
                                <span className="text-red-500 ml-1">
                                  (exceeds limit for selected platforms)
                                </span>
                              )}
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
                    name="mediaUrls"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Media Attachments</FormLabel>
                        {requiresMedia() && mediaUrls.length === 0 && (
                          <Alert variant="warning" className="mb-3">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Media Required</AlertTitle>
                            <AlertDescription>
                              At least one of your selected platforms requires media attachment.
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        {mediaUrls.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                            {mediaUrls.map((url, index) => (
                              <div key={index} className="relative aspect-square border rounded-md overflow-hidden">
                                <img 
                                  src={url} 
                                  alt={`Media ${index + 1}`} 
                                  className="w-full h-full object-cover"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-1 right-1 h-6 w-6"
                                  onClick={() => {
                                    const newUrls = [...mediaUrls];
                                    newUrls.splice(index, 1);
                                    field.onChange(newUrls);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                                {uploadingStatus[uploadedFiles[index]?.name] && (
                                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-center border-2 border-dashed rounded-md p-6 dark:border-slate-700">
                          <label htmlFor="file-upload" className="cursor-pointer text-center">
                            <div className="flex flex-col items-center">
                              <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {mediaUrls.length > 0 ? 'Add more media' : 'Click to upload image or video'}
                              </span>
                              <span className="text-xs text-gray-500 mt-1">PNG, JPG, MP4 up to 10MB</span>
                            </div>
                            <input 
                              id="file-upload" 
                              type="file" 
                              className="hidden" 
                              accept="image/png,image/jpeg,image/jpg,video/mp4"
                              onChange={handleFileUpload}
                              multiple
                            />
                          </label>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {/* Scheduling Options */}
                  <div className="space-y-4 pt-4">
                    <div className="flex flex-col space-y-2">
                      <h3 className="text-base font-medium">Publishing Options</h3>
                      
                      {/* Save as Draft */}
                      <FormField
                        control={form.control}
                        name="isDraft"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  if (checked) {
                                    setValue('scheduleNow', false);
                                  }
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Save as draft
                              </FormLabel>
                              <FormDescription>
                                Save this post as a draft to edit later.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      {!isDraft && (
                        <>
                          {/* Publish Now */}
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
                                    Publish immediately
                                  </FormLabel>
                                  <FormDescription>
                                    If checked, the post will be published right away.
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                          
                          {/* Schedule For Later */}
                          {!scheduleNow && (
                            <FormField
                              control={form.control}
                              name="scheduledAt"
                              render={({ field }) => (
                                <FormItem className="flex flex-col pt-2">
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
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                // Preview Mode
                <div className="space-y-6">
                  <div className="border rounded-lg p-4 dark:border-gray-700">
                    <h3 className="font-semibold text-lg mb-2">{form.getValues('title')}</h3>
                    
                    <div className="flex gap-1 mb-4">
                      {selectedPlatforms.map((platformId) => {
                        const platform = PLATFORMS.find(p => p.id === platformId);
                        return (
                          <div key={platformId} className="flex items-center space-x-1 text-sm text-gray-500">
                            {platform?.icon ? (
                              <img src={platform.icon} alt={platform.name} className="h-4 w-4" />
                            ) : null}
                            <span>{platform?.name}</span>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mb-4 whitespace-pre-wrap">{content}</div>
                    
                    {mediaUrls.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {mediaUrls.map((url, index) => (
                          <div key={index} className="rounded-md overflow-hidden aspect-square">
                            <img 
                              src={url} 
                              alt={`Media ${index + 1}`} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-4 text-sm text-gray-500">
                      {isDraft ? (
                        <span>This post will be saved as a draft</span>
                      ) : scheduleNow ? (
                        <span>This post will be published immediately</span>
                      ) : scheduledAt ? (
                        <span>Scheduled for: {format(scheduledAt, "PPP 'at' p")}</span>
                      ) : (
                        <span>No schedule set</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="media">Media</TabsTrigger>
                  <TabsTrigger value="watermark">Watermark</TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                </TabsList>
                
                <TabsContent value="content">
                  {/* ... existing content tab ... */}
                </TabsContent>
                
                <TabsContent value="media">
                  {/* ... existing media tab ... */}
                </TabsContent>
                
                <TabsContent value="watermark">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Add Watermark</h3>
                      <p className="text-sm text-gray-500">Protect your content with watermarks</p>
                    </div>
                    
                    {mediaUrls.length === 0 ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>No media</AlertTitle>
                        <AlertDescription>
                          Upload media first before applying watermarks.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="watermarkProfileId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Watermark Profile</FormLabel>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <FormControl>
                                    <Select
                                      value={field.value || ''}
                                      onValueChange={field.onChange}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select watermark profile" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="profile-1">Company Logo</SelectItem>
                                        <SelectItem value="profile-2">Copyright Text</SelectItem>
                                        <SelectItem value="profile-3">Branded Watermark</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormDescription>
                                    Choose a watermark profile to apply to your media.
                                  </FormDescription>
                                </div>
                                
                                <div>
                                  {mediaUrls.length > 0 && (
                                    <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
                                      <WatermarkPreview
                                        mediaUrl={mediaUrls[0]}
                                        selectedWatermarkId={field.value || null}
                                        onApplyWatermark={handleApplyWatermark}
                                        mediaId={mediaIds[0]}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {watermarkProfileId && (
                          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900">
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <AlertTitle>Watermark will be applied</AlertTitle>
                            <AlertDescription>
                              The selected watermark will be applied to all media when posting.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="schedule">
                  {/* ... existing schedule tab ... */}
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={createMutation.isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isLoading || Object.values(uploadingStatus).some(status => status)}
                >
                  {createMutation.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      {isEditing ? 'Updating...' : 'Creating...'}
                    </>
                  ) : isDraft ? (
                    <>Save Draft</>
                  ) : scheduleNow ? (
                    <>Publish Now</>
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