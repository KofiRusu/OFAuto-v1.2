"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, List, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserRole } from "@prisma/client";
import { ScheduledPostCard } from "./ScheduledPostCard";
import { CreateScheduledPostModal } from "./CreateScheduledPostModal";
import { CalendarView } from "./CalendarView";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// Define types for the component
type Platform = {
  id: string;
  type: string;
  name: string;
  clientId: string | null;
  client: { name: string } | null;
};

type Client = {
  id: string;
  name: string;
};

interface ContentSchedulerProps {
  userId: string;
  userRole: UserRole;
  initialClients: Client[];
  initialPlatforms: Platform[];
}

export function ContentScheduler({ 
  userId, 
  userRole, 
  initialClients, 
  initialPlatforms 
}: ContentSchedulerProps) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  
  // Query all scheduled posts
  const {
    data: scheduledPosts,
    isLoading,
    error,
  } = trpc.scheduledPost.getAll.useQuery(
    {
      clientId: selectedClient !== "all" ? selectedClient : undefined,
      platformType: selectedPlatform !== "all" ? selectedPlatform : undefined,
      status: selectedStatus !== "all" ? selectedStatus : undefined,
    },
    {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60, // 1 minute
    }
  );
  
  // Get tRPC utils for cache invalidation
  const utils = trpc.useUtils();
  
  const handleCreateSuccess = () => {
    setIsCreatingPost(false);
    utils.scheduledPost.getAll.invalidate();
    toast({
      title: "Post scheduled",
      description: "Your post has been scheduled successfully",
    });
  };
  
  const handleDeleteSuccess = () => {
    utils.scheduledPost.getAll.invalidate();
    toast({
      title: "Post deleted",
      description: "The scheduled post has been deleted",
    });
  };
  
  const handleUpdateSuccess = () => {
    utils.scheduledPost.getAll.invalidate();
    toast({
      title: "Post updated",
      description: "The scheduled post has been updated",
    });
  };
  
  const isAdminOrManager = userRole === UserRole.ADMIN || userRole === UserRole.MANAGER;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as "list" | "calendar")}
            className="w-[400px]"
          >
            <TabsList>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                List View
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Calendar View
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <Button onClick={() => setIsCreatingPost(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule New Post
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-4">
        <div className="w-full sm:w-auto">
          <Select
            value={selectedClient}
            onValueChange={setSelectedClient}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {initialClients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full sm:w-auto">
          <Select
            value={selectedPlatform}
            onValueChange={setSelectedPlatform}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {initialPlatforms.map((platform) => (
                <SelectItem key={platform.id} value={platform.type}>
                  {platform.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full sm:w-auto">
          <Select
            value={selectedStatus}
            onValueChange={setSelectedStatus}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="POSTED">Posted</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-60">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          Error loading scheduled posts: {error.message}
        </div>
      ) : (
        <>
          {viewMode === "list" ? (
            scheduledPosts && scheduledPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scheduledPosts.map((post) => (
                  <ScheduledPostCard
                    key={post.id}
                    post={post}
                    onDelete={handleDeleteSuccess}
                    onUpdate={handleUpdateSuccess}
                    canManage={isAdminOrManager || post.createdById === userId}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">No scheduled posts found. Create a new post to get started!</p>
              </div>
            )
          ) : (
            <CalendarView 
              posts={scheduledPosts || []}
              onDelete={handleDeleteSuccess}
              onUpdate={handleUpdateSuccess}
              userId={userId}
              userRole={userRole}
            />
          )}
        </>
      )}
      
      <CreateScheduledPostModal
        isOpen={isCreatingPost}
        onClose={() => setIsCreatingPost(false)}
        onSuccess={handleCreateSuccess}
        clients={initialClients}
        platforms={initialPlatforms}
        userId={userId}
      />
    </div>
  );
} 