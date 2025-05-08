"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc/client";
import { PostStatus } from "@prisma/client";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, ImagePlus, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { TimePickerDemo } from "@/components/ui/time-picker-demo";

// Create form schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  scheduledFor: z.date({
    required_error: "Please select a date and time",
  }),
  clientId: z.string({
    required_error: "Please select a client",
  }),
  platforms: z.array(z.string()).min(1, "Select at least one platform"),
  mediaUrls: z.array(z.string()).optional(),
  status: z.nativeEnum(PostStatus).default(PostStatus.DRAFT),
});

interface CreateScheduledPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clients: { id: string; name: string }[];
  platforms: {
    id: string;
    type: string;
    name: string;
    clientId: string | null;
  }[];
  userId: string;
}

export function CreateScheduledPostModal({
  isOpen,
  onClose,
  onSuccess,
  clients,
  platforms,
  userId,
}: CreateScheduledPostModalProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [availablePlatforms, setAvailablePlatforms] = useState<typeof platforms>([]);
  
  // Create form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      scheduledFor: new Date(),
      platforms: [],
      mediaUrls: [],
      status: PostStatus.DRAFT,
    },
  });
  
  // Get client ID from form to filter platforms
  const watchClientId = form.watch("clientId");
  
  // Filter platforms when client changes
  useState(() => {
    if (watchClientId) {
      const filtered = platforms.filter(p => p.clientId === watchClientId);
      setAvailablePlatforms(filtered);
      
      // Clear selected platforms if they don't belong to the new client
      const currentSelectedPlatforms = form.getValues("platforms");
      const validPlatforms = currentSelectedPlatforms.filter(id => 
        filtered.some(p => p.id === id)
      );
      
      form.setValue("platforms", validPlatforms);
    }
  });
  
  // Create post mutation
  const createPost = trpc.scheduledPost.create.useMutation({
    onSuccess: () => {
      form.reset();
      onSuccess();
    },
  });
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createPost.mutate({
      ...values,
      createdById: userId,
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule New Post</DialogTitle>
          <DialogDescription>
            Create a new post to be published across multiple platforms.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Post title" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive title for your post
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Write your post content here..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="scheduledFor"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Schedule Date & Time</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "PPP 'at' h:mm a")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="p-4 border-b">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              if (date) {
                                const currentDate = field.value || new Date();
                                const newDate = new Date(date);
                                newDate.setHours(currentDate.getHours());
                                newDate.setMinutes(currentDate.getMinutes());
                                field.onChange(newDate);
                              }
                            }}
                            initialFocus
                          />
                        </div>
                        <div className="p-3 border-t">
                          <div className="flex items-center justify-center">
                            <Clock className="h-4 w-4 mr-2 opacity-70" />
                            <TimePickerDemo 
                              setDate={(date) => field.onChange(date)}
                              date={field.value}
                            />
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="platforms"
              render={() => (
                <FormItem>
                  <div className="mb-2">
                    <FormLabel>Platforms</FormLabel>
                    <FormDescription>
                      Select the platforms where you want to publish this post
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {watchClientId ? (
                      availablePlatforms.length > 0 ? (
                        availablePlatforms.map((platform) => (
                          <FormField
                            key={platform.id}
                            control={form.control}
                            name="platforms"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={platform.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(platform.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, platform.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== platform.id
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {platform.name}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))
                      ) : (
                        <div className="col-span-full text-sm text-gray-500">
                          No platforms available for this client
                        </div>
                      )
                    ) : (
                      <div className="col-span-full text-sm text-gray-500">
                        Select a client to see available platforms
                      </div>
                    )}
                  </div>
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
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={PostStatus.DRAFT}>Draft</SelectItem>
                      <SelectItem value={PostStatus.SCHEDULED}>Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Draft posts won't be automatically published
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="border rounded-md p-4">
              <div className="flex items-center mb-4">
                <ImagePlus className="h-5 w-5 mr-2 text-gray-500" />
                <h4 className="font-medium">Media Attachments</h4>
              </div>
              <div className="text-center p-6 border border-dashed rounded-md">
                <p className="text-sm text-gray-500 mb-2">Media upload feature coming soon</p>
                <p className="text-xs text-gray-400">Drag & drop files or click to browse</p>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createPost.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createPost.isPending}
              >
                {createPost.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Post"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 