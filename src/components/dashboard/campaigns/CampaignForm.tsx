'use client';

import { useState } from 'react';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { TemplateEditor } from './TemplateEditor';
import { TemplatePreview } from './TemplatePreview';
import { 
  Clock, 
  User, 
  AlertTriangle,
  MessageSquare,
  User2,
  RefreshCw,
  Sparkles,
  Settings
} from 'lucide-react';

// Define the form schema
const campaignFormSchema = z.object({
  name: z.string().min(1, "Campaign name is required").max(100, "Name cannot exceed 100 characters"),
  description: z.string().max(250, "Description cannot exceed 250 characters").optional(),
  platform: z.string().min(1, "Platform is required"),
  triggerType: z.string().min(1, "Trigger type is required"),
  
  // Template data
  templateData: z.object({
    subject: z.string().min(1, "Subject is required").max(100, "Subject cannot exceed 100 characters"),
    message: z.string().min(1, "Message content is required").max(2000, "Message cannot exceed 2000 characters"),
    includeMedia: z.boolean().default(false),
    mediaUrls: z.array(z.string()).optional().default([]),
  }),
  
  // Trigger settings
  triggerSettings: z.object({
    delay: z.number().min(0, "Delay cannot be negative").max(168, "Delay cannot exceed 168 hours (7 days)"),
    sendOnlyOnce: z.boolean().default(true),
    sendTimeRestrictions: z.boolean().default(false),
    restrictedTimeStart: z.string().optional(),
    restrictedTimeEnd: z.string().optional(),
  }),
  
  // Save as draft
  saveAsDraft: z.boolean().default(false),
});

type FormData = z.infer<typeof campaignFormSchema>;

// Platform options
const PLATFORMS = [
  { value: 'onlyfans', label: 'OnlyFans' },
  { value: 'fansly', label: 'Fansly' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter' }
];

// Trigger type options
const TRIGGER_TYPES = [
  { value: 'new_subscriber', label: 'New Subscriber', icon: <User className="h-4 w-4" />, description: 'Trigger when someone subscribes to your content' },
  { value: 'renewal', label: 'Subscription Renewal', icon: <RefreshCw className="h-4 w-4" />, description: 'Trigger when a subscriber renews their subscription' },
  { value: 'inactivity', label: 'Subscriber Inactivity', icon: <Clock className="h-4 w-4" />, description: 'Trigger when a subscriber has been inactive for a set period' },
  { value: 'segment', label: 'Subscriber Segment', icon: <User2 className="h-4 w-4" />, description: 'Target a specific segment of your audience' },
  { value: 'manual', label: 'Manual Trigger', icon: <Sparkles className="h-4 w-4" />, description: 'Manually activate for selected subscribers' }
];

interface CampaignFormProps {
  initialData?: any;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export function CampaignForm({ initialData, onSubmit, onCancel, isEditing = false }: CampaignFormProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [previewMode, setPreviewMode] = useState(false);
  
  // Default values for the form
  const defaultValues: FormData = {
    name: '',
    description: '',
    platform: '',
    triggerType: '',
    templateData: {
      subject: '',
      message: '',
      includeMedia: false,
      mediaUrls: [],
    },
    triggerSettings: {
      delay: 0,
      sendOnlyOnce: true,
      sendTimeRestrictions: false,
      restrictedTimeStart: '22:00',
      restrictedTimeEnd: '08:00',
    },
    saveAsDraft: false,
  };
  
  // Set up form with validation
  const form = useForm<FormData>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: initialData || defaultValues,
  });
  
  // Watch for form values
  const platform = form.watch('platform');
  const triggerType = form.watch('triggerType');
  const templateData = form.watch('templateData');
  const sendTimeRestrictions = form.watch('triggerSettings.sendTimeRestrictions');
  
  // Calculate progress through the form
  const calculateProgress = () => {
    const steps = [
      // Step 1: Basic details
      !!form.getValues('name') && !!form.getValues('platform') && !!form.getValues('triggerType'),
      
      // Step 2: Template
      !!form.getValues('templateData.subject') && !!form.getValues('templateData.message'),
      
      // Step 3: Trigger settings
      true, // Always considered "complete" since it has defaults
    ];
    
    return Math.round((steps.filter(Boolean).length / steps.length) * 100);
  };
  
  // Submit handler
  const handleSubmit = (data: FormData) => {
    onSubmit(data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-0.5">
            <h2 className="text-xl font-bold">
              {isEditing ? "Edit Campaign" : "Create New Campaign"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {calculateProgress() < 100 
                ? `Complete all required fields (${calculateProgress()}% complete)`
                : "All required fields are complete"}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <FormField
              control={form.control}
              name="saveAsDraft"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal">Save as draft</FormLabel>
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>Campaign Details</span>
            </TabsTrigger>
            <TabsTrigger value="template" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>Message Template</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Trigger Settings</span>
            </TabsTrigger>
          </TabsList>
          
          {/* STEP 1: Campaign Details */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Name field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Name*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., New Subscriber Welcome"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Give your campaign a descriptive name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Description field */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Briefly describe what this campaign does..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description to help you remember the campaign's purpose
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Platform field */}
              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform*</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PLATFORMS.map((platform) => (
                          <SelectItem key={platform.value} value={platform.value}>
                            {platform.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose which platform this campaign will run on
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Trigger Type field */}
              <FormField
                control={form.control}
                name="triggerType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Trigger Type*</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                        className="flex flex-col space-y-2"
                      >
                        {TRIGGER_TYPES.map((type) => (
                          <div key={type.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={type.value} id={type.value} />
                            <label
                              htmlFor={type.value}
                              className="flex flex-col cursor-pointer"
                            >
                              <div className="flex items-center">
                                <span className="font-medium mr-2">{type.label}</span>
                                <span className="flex">{type.icon}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">{type.description}</span>
                            </label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormDescription>
                      Select when this automated message should be sent
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-between mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveTab("template")}
                >
                  Next: Message Template
                </Button>
              </div>
            </div>
          </TabsContent>
          
          {/* STEP 2: Message Template */}
          <TabsContent value="template" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Message Template</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? "Edit Template" : "Preview"}
              </Button>
            </div>
            
            {previewMode ? (
              <div className="border rounded-md p-6">
                <TemplatePreview template={templateData} />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Subject field */}
                <FormField
                  control={form.control}
                  name="templateData.subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject Line*</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Welcome to my OnlyFans!"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The subject line of your message
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Message content field */}
                <FormField
                  control={form.control}
                  name="templateData.message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message Content*</FormLabel>
                      <FormControl>
                        <TemplateEditor
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Write your message here..."
                        />
                      </FormControl>
                      <FormDescription>
                        You can use variables like {"{{name}}"} that will be replaced with subscriber data.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Include media field */}
                <FormField
                  control={form.control}
                  name="templateData.includeMedia"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Include Media</FormLabel>
                        <FormDescription>
                          Attach images or videos to your message
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {/* Media Upload - would be implemented separately in a real app */}
                {form.watch('templateData.includeMedia') && (
                  <div className="border border-dashed rounded-md p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Media upload would be implemented here
                    </p>
                    <Button variant="outline" size="sm" className="mt-2" disabled>
                      Upload Media
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="p-3 border rounded-md">
                <p className="text-sm font-medium mb-2">Available Variables</p>
                <div className="grid grid-cols-2 gap-y-1 gap-x-4">
                  <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded inline-block">{"{{name}}"}</code>
                  <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded inline-block">{"{{creator_name}}"}</code>
                  <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded inline-block">{"{{subscription_end}}"}</code>
                  <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded inline-block">{"{{last_login}}"}</code>
                </div>
              </div>
              <div className="p-3 border rounded-md">
                <p className="text-sm font-medium mb-2">Tips</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>Keep messages personal and friendly</li>
                  <li>Include a clear call to action</li>
                  <li>Use variables to personalize your message</li>
                </ul>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab("details")}
              >
                Back: Campaign Details
              </Button>
              <Button
                type="button"
                onClick={() => setActiveTab("settings")}
              >
                Next: Trigger Settings
              </Button>
            </div>
          </TabsContent>
          
          {/* STEP 3: Trigger Settings */}
          <TabsContent value="settings" className="space-y-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Trigger Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Configure when and how your messages will be sent
                </p>
              </div>
              
              {/* Delay field */}
              <FormField
                control={form.control}
                name="triggerSettings.delay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delay Before Sending</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input 
                          type="number"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          className="w-20"
                          min={0}
                          max={168}
                        />
                      </FormControl>
                      <span>hour(s)</span>
                    </div>
                    <FormDescription>
                      Wait this many hours after the trigger event before sending the message
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Send only once field */}
              <FormField
                control={form.control}
                name="triggerSettings.sendOnlyOnce"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-base">
                        Send Only Once
                      </FormLabel>
                      <FormDescription>
                        Each subscriber will only receive this message once, even if the trigger conditions are met again.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              {/* Time restrictions field */}
              <FormField
                control={form.control}
                name="triggerSettings.sendTimeRestrictions"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-base">
                          Time Restrictions
                        </FormLabel>
                        <FormDescription>
                          Prevent messages from being sent during specific hours
                        </FormDescription>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Time restriction range fields */}
              {sendTimeRestrictions && (
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-md ml-6">
                  <FormField
                    control={form.control}
                    name="triggerSettings.restrictedTimeStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Don't send from</FormLabel>
                        <FormControl>
                          <Input 
                            type="time"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="triggerSettings.restrictedTimeEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Until</FormLabel>
                        <FormControl>
                          <Input 
                            type="time"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab("template")}
              >
                Back: Message Template
              </Button>
              <Button type="submit">
                {isEditing ? "Update Campaign" : "Create Campaign"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
} 