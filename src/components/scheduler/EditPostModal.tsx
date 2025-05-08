"use client";

import { useState, useEffect } from "react";
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
import { Calendar, Clock, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { TimePickerDemo } from "@/components/ui/time-picker-demo";

// Edit form schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  scheduledFor: z.date({
    required_error: "Please select a date and time",
  }),
  status: z.nativeEnum(PostStatus),
});

interface EditPostModalProps {
  post: {
    id: string;
    title: string;
    content: string;
    status: PostStatus;
    scheduledFor: Date;
    createdAt: Date;
    updatedAt: Date;
    createdById: string;
    clientId: string | null;
    client?: {
      name: string;
    } | null;
    mediaUrls: string[];
    platforms: {
      platformId: string;
      platform: {
        type: string;
        name: string;
      };
    }[];
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditPostModal({
  post,
  isOpen,
  onClose,
  onSuccess,
}: EditPostModalProps) {
  // Create form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: post.title,
      content: post.content,
      scheduledFor: new Date(post.scheduledFor),
      status: post.status,
    },
  });
  
  // Update post mutation
  const updatePost = trpc.scheduledPost.update.useMutation({
    onSuccess: () => {
      onSuccess();
    },
  });
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updatePost.mutate({
      id: post.id,
      ...values,
    });
  };
  
  // Get platform names for display
  const platformNames = post.platforms.map(p => p.platform.name).join(", ");
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Scheduled Post</DialogTitle>
          <DialogDescription>
            Make changes to your scheduled post.
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
              <div>
                <h3 className="text-sm font-medium mb-2">Platforms</h3>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">{platformNames}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Platforms can't be changed after creation
                  </p>
                </div>
              </div>
              
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={PostStatus.DRAFT}>Draft</SelectItem>
                      <SelectItem value={PostStatus.SCHEDULED}>Scheduled</SelectItem>
                      {/* Only show these options if the post already has these statuses */}
                      {post.status === PostStatus.POSTED && (
                        <SelectItem value={PostStatus.POSTED}>Posted</SelectItem>
                      )}
                      {post.status === PostStatus.FAILED && (
                        <SelectItem value={PostStatus.FAILED}>Failed</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Change the status of your post
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updatePost.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={updatePost.isPending}
              >
                {updatePost.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 