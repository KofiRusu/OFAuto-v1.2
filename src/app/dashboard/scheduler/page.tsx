"use client";

import { useState, useEffect } from "react";
import { CalendarRange, LayoutGrid, Plus, Filter, Users, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateScheduledPostModal } from "@/components/scheduler/create-scheduled-post-modal";
import { CalendarView } from "@/components/scheduler/calendar-view";
import { GridView } from "@/components/scheduler/grid-view";
import { useScheduledPosts, ScheduledPost } from "@/hooks/useScheduledPosts";
import { PLATFORM_CONFIGS } from "@/constants/platforms";
import { User } from "@/components/user-avatar";
import { UserAssigneeSelect } from "@/components/user-assignee-select";
import { useAuth } from "@/hooks/useAuth";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Get assignable users (to be replaced with actual API)
const getAssignableUsers = async (): Promise<User[]> => {
  // Mock data - should be replaced with actual API call
  return [
    { id: "1", name: "John Doe", email: "john@example.com", avatar: "/avatars/01.png" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", avatar: "/avatars/02.png" },
    { id: "3", name: "Alex Johnson", email: "alex@example.com", avatar: "/avatars/03.png" },
    { id: "4", name: "Sam Williams", email: "sam@example.com", avatar: "/avatars/04.png" },
  ];
};

export default function SchedulerPage() {
  // Authentication
  const { user, isAuthenticated, isLoading: authLoading, mockLogin } = useAuth();
  
  // State for view type (grid or calendar)
  const [viewType, setViewType] = useState<"grid" | "calendar">("grid");
  
  // State for modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | undefined>(undefined);
  
  // State for users
  const [users, setUsers] = useState<User[]>([]);
  
  // State for date and filtering
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  
  // Confirmation dialog
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean;
    postId: string;
    title: string;
  }>({ open: false, postId: "", title: "" });

  // Load scheduled posts with our custom hook
  const {
    posts,
    isLoading: postsLoading,
    createPost,
    updatePost,
    deletePost,
    notification,
    dismissNotification
  } = useScheduledPosts({
    platform: selectedPlatform !== "all" ? selectedPlatform : undefined,
    status: selectedStatus !== "all" ? selectedStatus : undefined,
    // Note: client filtering would need to be implemented if we had that requirement
  });

  // Set up mock authentication for development
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      mockLogin({
        id: "user-123",
        name: "Demo User",
        email: "demo@example.com",
        role: "ADMIN"
      });
    }
  }, [isAuthenticated, authLoading, mockLogin]);

  useEffect(() => {
    // Load users for filtering
    const loadUsers = async () => {
      const fetchedUsers = await getAssignableUsers();
      setUsers(fetchedUsers);
    };
    
    loadUsers();
  }, []);

  // Filter posts based on selectedDate for calendar view
  const filteredPosts = posts.filter((post) => {
    const postDate = new Date(post.scheduledFor);
    
    // Apply assignee filter if selected
    const matchesAssignee = 
      !selectedAssigneeId || 
      post.userId === selectedAssigneeId;
    
    if (viewType === "grid") {
      // For grid view, filter by month
      const isSameMonth = 
        postDate.getMonth() === selectedDate.getMonth() && 
        postDate.getFullYear() === selectedDate.getFullYear();
      
      return isSameMonth && matchesAssignee;
    }
    
    return matchesAssignee;
  });

  // Handle post edit
  const handleEditPost = (post: ScheduledPost) => {
    setEditingPost(post);
    setModalOpen(true);
  };

  // Handle post delete
  const handleDeletePost = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    setConfirmDelete({
      open: true,
      postId,
      title: post.title
    });
  };
  
  // Confirm post deletion
  const confirmDeletePost = () => {
    deletePost.mutate(confirmDelete.postId);
    setConfirmDelete({ open: false, postId: "", title: "" });
  };

  // Handle modal submit (create or update)
  const handleModalSubmit = (postData: any) => {
    if (editingPost) {
      updatePost.mutate({ 
        id: editingPost.id, 
        data: {
          ...postData,
          userId: user?.id
        } 
      });
    } else {
      createPost.mutate({
        ...postData,
        userId: user?.id,
        status: "scheduled",
        clientId: "default-client" // This would normally come from client selection
      });
    }
    
    setModalOpen(false);
    setEditingPost(undefined);
  };
  
  // Loading state
  if (authLoading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {notification && (
        <Alert 
          className={notification.status === 'failed' ? 'border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-green-600 bg-green-50 dark:bg-green-900/20'}
          onClose={dismissNotification}
        >
          <AlertCircle className={notification.status === 'failed' ? 'text-red-600' : 'text-green-600'} />
          <AlertTitle>{notification.status === 'failed' ? 'Publishing Failed' : 'Post Published'}</AlertTitle>
          <AlertDescription>
            {notification.title} {notification.status === 'failed' ? 'failed to publish' : 'was published successfully'}.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Social Media Scheduler</h1>
          <p className="text-muted-foreground">
            Schedule and manage your social media posts.
          </p>
        </div>
        <Button size="sm" onClick={() => {
          setEditingPost(undefined);
          setModalOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Create Post
        </Button>
      </div>

      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-start sm:items-center justify-between gap-4">
        <Tabs
          defaultValue="grid"
          value={viewType}
          onValueChange={(value) => setViewType(value as "grid" | "calendar")}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid w-full grid-cols-2 sm:w-auto">
            <TabsTrigger value="grid">
              <LayoutGrid className="mr-2 h-4 w-4" />
              Grid
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <CalendarRange className="mr-2 h-4 w-4" />
              Calendar
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <Select 
            value={selectedPlatform} 
            onValueChange={setSelectedPlatform}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {PLATFORM_CONFIGS.map(platform => (
                <SelectItem key={platform.value} value={platform.value}>
                  <div className="flex items-center">
                    <platform.icon className="mr-2 h-4 w-4" />
                    {platform.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={selectedStatus} 
            onValueChange={setSelectedStatus}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="w-full sm:w-[180px]">
            <UserAssigneeSelect
              selectedUserId={selectedAssigneeId}
              onUserSelect={setSelectedAssigneeId}
              label=""
              placeholder="Filter by assignee"
            />
          </div>
        </div>
      </div>

      <div className="pt-2">
        {postsLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : viewType === "grid" ? (
          <GridView
            posts={filteredPosts.map(post => ({
              id: post.id,
              title: post.title,
              content: post.content,
              scheduledDate: new Date(post.scheduledFor),
              platform: post.platforms[0] || '',
              platforms: post.platforms,
              imageUrl: post.mediaUrls?.[0],
              status: post.status
            }))}
            onEditPost={handleEditPost}
            onDeletePost={handleDeletePost}
          />
        ) : (
          <CalendarView
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            posts={filteredPosts.map(post => ({
              id: post.id,
              title: post.title,
              content: post.content,
              scheduledDate: new Date(post.scheduledFor),
              platform: post.platforms[0] || '',
              platforms: post.platforms,
              imageUrl: post.mediaUrls?.[0],
              status: post.status
            }))}
            onEditPost={handleEditPost}
            onDeletePost={handleDeletePost}
          />
        )}
      </div>

      <CreateScheduledPostModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingPost(undefined);
        }}
        onSubmit={handleModalSubmit}
        editingPost={editingPost}
      />
      
      {/* Confirm delete dialog */}
      <Dialog open={confirmDelete.open} onOpenChange={(open) => !open && setConfirmDelete({ ...confirmDelete, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the post "{confirmDelete.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setConfirmDelete({ open: false, postId: "", title: "" })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeletePost}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 