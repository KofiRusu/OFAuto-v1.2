"use client";

import { useEffect, useState } from "react";
import { Check, ChevronRight, Image, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/lib/trpc/client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AutoDMCampaignStatus } from "@prisma/client";

// Step 1: Campaign metadata schema
const metadataSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  status: z.nativeEnum(AutoDMCampaignStatus).default(AutoDMCampaignStatus.DRAFT),
  platformId: z.string().min(1, "Platform is required"),
  targetAudience: z.string().min(1, "Target audience is required"),
});

// Step 2: Message template schema
const messageSchema = z.object({
  messageTemplate: z.string().min(1, "Message content is required"),
  imageUrl: z.string().optional(),
});

// Step 3: Schedule schema
const scheduleSchema = z.object({
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date().optional().nullable(),
  frequency: z.coerce.number().min(1, "Frequency must be at least 1").max(20, "Frequency cannot exceed 20 messages per day"),
});

// Combined form schema
const formSchema = metadataSchema.merge(messageSchema).merge(scheduleSchema);

interface Platform {
  id: string;
  name: string;
  type: string;
}

interface CreateOrEditDMCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  campaignId?: string;
}

export function CreateOrEditDMCampaignModal({
  isOpen,
  onClose,
  onSuccess,
  campaignId,
}: CreateOrEditDMCampaignModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Get platforms for dropdown
  const { data: platforms, isLoading: loadingPlatforms } = trpc.platform.getAll.useQuery(undefined, {
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch campaign details if editing
  const { data: campaignData, isLoading: loadingCampaign } = trpc.autoDM.getById.useQuery(
    { id: campaignId || "" },
    { 
      enabled: !!campaignId,
      staleTime: 0, // Always fetch fresh data when editing
    }
  );

  // Create mutation
  const createMutation = trpc.autoDM.create.useMutation({
    onSuccess: () => {
      form.reset();
      setImagePreview(null);
      onSuccess();
    }
  });

  // Update mutation
  const updateMutation = trpc.autoDM.update.useMutation({
    onSuccess: () => {
      onSuccess();
    }
  });

  // Create form with zod validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      status: AutoDMCampaignStatus.DRAFT,
      platformId: "",
      targetAudience: "",
      messageTemplate: "",
      imageUrl: "",
      startDate: new Date(),
      endDate: null,
      frequency: 1,
    },
    mode: "onChange",
  });

  // Update form values when campaign data is loaded
  useEffect(() => {
    if (campaignData) {
      form.reset({
        name: campaignData.name,
        status: campaignData.status as AutoDMCampaignStatus,
        platformId: campaignData.platformId,
        targetAudience: campaignData.targetAudience,
        messageTemplate: campaignData.messageTemplate,
        imageUrl: campaignData.imageUrl || "",
        startDate: new Date(campaignData.startDate),
        endDate: campaignData.endDate ? new Date(campaignData.endDate) : null,
        frequency: campaignData.frequency,
      });

      if (campaignData.imageUrl) {
        setImagePreview(campaignData.imageUrl);
      }
    }
  }, [campaignData, form]);

  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (campaignId) {
      updateMutation.mutate({
        id: campaignId,
        ...values,
      });
    } else {
      createMutation.mutate(values);
    }
  };

  // Navigate to next step if current step is valid
  const handleNextStep = async () => {
    if (currentStep === 1) {
      const isValid = await form.trigger(['name', 'status', 'platformId', 'targetAudience']);
      if (isValid) setCurrentStep(2);
    } else if (currentStep === 2) {
      const isValid = await form.trigger(['messageTemplate', 'imageUrl']);
      if (isValid) setCurrentStep(3);
    }
  };

  // Navigate to previous step
  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImagePreview(result);
        form.setValue("imageUrl", result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove image
  const removeImage = () => {
    setImagePreview(null);
    form.setValue("imageUrl", "");
  };

  // Loading state
  const isLoading = loadingPlatforms || loadingCampaign || createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaignId ? "Edit Campaign" : "Create New Campaign"}</DialogTitle>
          <DialogDescription>
            {campaignId 
              ? "Update your automated DM campaign settings." 
              : "Set up a new automated direct messaging campaign."}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex justify-between mb-6">
          <div className="flex space-x-2">
            <StepIndicator 
              isActive={currentStep === 1} 
              isCompleted={currentStep > 1} 
              label="Details" 
            />
            <StepIndicator 
              isActive={currentStep === 2} 
              isCompleted={currentStep > 2} 
              label="Message" 
            />
            <StepIndicator 
              isActive={currentStep === 3} 
              isCompleted={currentStep > 3} 
              label="Schedule" 
            />
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Step 1: Campaign metadata */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter campaign name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="platformId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                        disabled={loadingPlatforms}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {platforms?.map((platform) => (
                            <SelectItem key={platform.id} value={platform.id}>
                              {platform.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the platform where messages will be sent
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetAudience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Audience</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., New followers, Inactive subscribers" {...field} />
                      </FormControl>
                      <FormDescription>
                        Define who will receive these messages
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={AutoDMCampaignStatus.DRAFT}>Draft</SelectItem>
                          <SelectItem value={AutoDMCampaignStatus.SCHEDULED}>Scheduled</SelectItem>
                          {campaignId && (
                            <>
                              <SelectItem value={AutoDMCampaignStatus.ACTIVE}>Active</SelectItem>
                              <SelectItem value={AutoDMCampaignStatus.PAUSED}>Paused</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Draft campaigns won't be automatically scheduled
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: Message template */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="messageTemplate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message Template</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write your message template here..."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        You can use variables like {"{name}"}, {"{username}"}, {"{platform}"} in your template
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel>Image (Optional)</FormLabel>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => document.getElementById("image-upload")?.click()}
                    >
                      <Image className="mr-2 h-4 w-4" />
                      {imagePreview ? "Change Image" : "Upload Image"}
                    </Button>
                    {imagePreview && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  {imagePreview && (
                    <div className="mt-2 relative rounded-md overflow-hidden h-40">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                </FormItem>
              </div>
            )}

            {/* Step 3: Schedule */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>No end date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <div className="p-2">
                              <Button
                                type="button"
                                variant="ghost"
                                className="w-full justify-start text-left mb-2"
                                onClick={() => field.onChange(null)}
                              >
                                No end date
                              </Button>
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                disabled={(date) => {
                                  const startDate = form.getValues("startDate");
                                  return startDate ? date < startDate : false;
                                }}
                                initialFocus
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          If not set, the campaign will run indefinitely
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Messages Per Day</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="20"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Number of messages to send daily (1-20)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <DialogFooter className="flex justify-between">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviousStep}
                  disabled={isLoading}
                >
                  Back
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}

              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  disabled={isLoading}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {campaignId ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    campaignId ? "Update Campaign" : "Create Campaign"
                  )}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface StepIndicatorProps {
  isActive: boolean;
  isCompleted: boolean;
  label: string;
}

function StepIndicator({ isActive, isCompleted, label }: StepIndicatorProps) {
  return (
    <div className="flex items-center space-x-2">
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium",
          isActive && "border-primary bg-primary text-primary-foreground",
          isCompleted && "border-primary bg-primary text-primary-foreground",
          !isActive && !isCompleted && "border-muted bg-muted text-muted-foreground"
        )}
      >
        {isCompleted ? <Check className="h-4 w-4" /> : null}
        {!isCompleted && label.charAt(0)}
      </div>
      <span
        className={cn(
          "text-sm font-medium",
          isActive && "text-foreground",
          !isActive && "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </div>
  );
} 