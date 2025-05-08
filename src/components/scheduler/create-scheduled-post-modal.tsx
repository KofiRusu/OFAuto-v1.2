"use client";

import { useEffect, useState } from "react";
import { Calendar as CalendarIcon, Image, X } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/lib/trpc/client";
import { Spinner } from "@/components/spinner";

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
import { Checkbox } from "@/components/ui/checkbox";
import { UserAssigneeSelect } from "@/components/user-assignee-select";
import { PLATFORM_CONFIGS } from "@/constants/platforms";

export interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  scheduledDate: Date;
  platform: string;
  platforms?: string[];
  imageUrl?: string;
  assignedToId?: string;
  author?: {
    name: string;
    avatar: string;
  };
}

interface CreateScheduledPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (post: Omit<ScheduledPost, "id" | "author">) => void;
  editingPost?: ScheduledPost;
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  scheduledDate: z.date(),
  platform: z.string().min(1, "Platform is required"),
  platforms: z.array(z.string()).min(1, "At least one platform must be selected").optional(),
  isMultiPlatform: z.boolean().default(false),
  imageUrl: z.string().optional(),
  assignedToId: z.string().optional(),
});

export function CreateScheduledPostModal({
  isOpen,
  onClose,
  onSubmit,
  editingPost,
}: CreateScheduledPostModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch available platforms using the new endpoint
  const { data: platformsData, isLoading: isLoadingPlatforms } = trpc.scheduledPost.getAvailablePlatforms.useQuery(
    {},
    {
      enabled: isOpen, // Only fetch when modal is open
      refetchOnWindowFocus: false,
    }
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      scheduledDate: new Date(),
      platform: "",
      platforms: [],
      isMultiPlatform: false,
      imageUrl: "",
      assignedToId: undefined,
    },
  });

  const isMultiPlatform = form.watch("isMultiPlatform");

  useEffect(() => {
    if (editingPost) {
      form.reset({
        title: editingPost.title,
        content: editingPost.content,
        scheduledDate: editingPost.scheduledDate,
        platform: editingPost.platform,
        platforms: editingPost.platforms || [editingPost.platform],
        isMultiPlatform: editingPost.platforms?.length > 0 || false,
        imageUrl: editingPost.imageUrl || "",
        assignedToId: editingPost.assignedToId,
      });
      
      if (editingPost.imageUrl) {
        setImagePreview(editingPost.imageUrl);
      }
    } else {
      // Set default platform if available platforms are loaded
      if (platformsData?.platforms && platformsData.platforms.length > 0) {
        const defaultPlatform = platformsData.platforms[0].id;
        form.reset({
          title: "",
          content: "",
          scheduledDate: new Date(),
          platform: defaultPlatform,
          platforms: [],
          isMultiPlatform: false,
          imageUrl: "",
          assignedToId: undefined,
        });
      } else {
        form.reset({
          title: "",
          content: "",
          scheduledDate: new Date(),
          platform: "",
          platforms: [],
          isMultiPlatform: false,
          imageUrl: "",
          assignedToId: undefined,
        });
      }
      setImagePreview(null);
    }
  }, [editingPost, form, isOpen, platformsData]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (values.isMultiPlatform && values.platforms && values.platforms.length > 0) {
      // For the first platform, use the regular submission process
      const firstPlatform = values.platforms[0];
      onSubmit({
        title: values.title,
        content: values.content,
        scheduledDate: values.scheduledDate,
        platform: firstPlatform,
        platforms: values.platforms,
        imageUrl: values.imageUrl,
        assignedToId: values.assignedToId,
      });

      // For remaining platforms, submit individual posts with the same content
      if (values.platforms.length > 1) {
        for (let i = 1; i < values.platforms.length; i++) {
          onSubmit({
            title: values.title,
            content: values.content,
            scheduledDate: values.scheduledDate,
            platform: values.platforms[i],
            platforms: values.platforms,
            imageUrl: values.imageUrl,
            assignedToId: values.assignedToId, // Same assignee for all platforms
          });
        }
      }
    } else {
      // Regular single platform submission
      onSubmit({
        title: values.title,
        content: values.content,
        scheduledDate: values.scheduledDate,
        platform: values.platform,
        imageUrl: values.imageUrl,
        assignedToId: values.assignedToId,
      });
    }
    
    onClose();
  };

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

  const removeImage = () => {
    setImagePreview(null);
    form.setValue("imageUrl", "");
  };

  const togglePlatform = (platform: string) => {
    const currentPlatforms = form.getValues("platforms") || [];
    const newPlatforms = currentPlatforms.includes(platform)
      ? currentPlatforms.filter(p => p !== platform)
      : [...currentPlatforms, platform];
    
    form.setValue("platforms", newPlatforms);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingPost ? "Edit Scheduled Post" : "Schedule New Post"}</DialogTitle>
          <DialogDescription>
            {editingPost 
              ? "Edit the details of your scheduled post."
              : "Create a new post to be scheduled for publication."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                      className="h-24 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule Date</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isMultiPlatform"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-8">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Post to multiple platforms</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            {!isMultiPlatform ? (
              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoadingPlatforms}
                    >
                      <FormControl>
                        <SelectTrigger id="platform-select">
                          <SelectValue placeholder="Select a platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingPlatforms ? (
                          <div className="flex items-center justify-center p-4">
                            <Spinner size="sm" />
                          </div>
                        ) : platformsData?.platforms && platformsData.platforms.length > 0 ? (
                          platformsData.platforms.map((platform) => (
                            <SelectItem key={platform.id} value={platform.id}>
                              <div className="flex items-center">
                                {PLATFORM_CONFIGS.find(p => p.value === platform.type.toLowerCase())?.icon && (
                                  <span className="mr-2">
                                    {PLATFORM_CONFIGS.find(p => p.value === platform.type.toLowerCase())?.icon}
                                  </span>
                                )}
                                {platform.name}
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-platforms" disabled>
                            No platforms available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="platforms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platforms</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {isLoadingPlatforms ? (
                        <div className="col-span-2 flex items-center justify-center p-4">
                          <Spinner size="sm" />
                        </div>
                      ) : platformsData?.platforms && platformsData.platforms.length > 0 ? (
                        platformsData.platforms.map((platform) => (
                          <div
                            key={platform.id}
                            className={`p-2 border rounded-md cursor-pointer ${
                              field.value?.includes(platform.id)
                                ? "border-primary bg-primary/10"
                                : "border-gray-300 dark:border-gray-600"
                            }`}
                            onClick={() => togglePlatform(platform.id)}
                          >
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value?.includes(platform.id)}
                                onCheckedChange={() => togglePlatform(platform.id)}
                              />
                              <div className="flex items-center">
                                {PLATFORM_CONFIGS.find(p => p.value === platform.type.toLowerCase())?.icon && (
                                  <span className="mr-2">
                                    {PLATFORM_CONFIGS.find(p => p.value === platform.type.toLowerCase())?.icon}
                                  </span>
                                )}
                                <span>{platform.name}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-center text-gray-500 p-4">
                          No platforms available
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="assignedToId"
              render={({ field }) => (
                <FormItem>
                  <UserAssigneeSelect
                    selectedUserId={field.value}
                    onUserSelect={(userId) => field.onChange(userId)}
                  />
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
            <DialogFooter>
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={
                  // Disable submit if no platforms available
                  (isMultiPlatform && (!form.getValues("platforms") || form.getValues("platforms").length === 0)) ||
                  (!isMultiPlatform && !form.getValues("platform"))
                }
              >
                {editingPost ? "Update" : "Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 