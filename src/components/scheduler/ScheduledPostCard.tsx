"use client";

import { useState } from "react";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/ui/use-toast";
import { PostStatus } from "@prisma/client";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, Edit, Loader2, MoreVertical, Trash } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EditPostModal } from "./EditPostModal";

interface ScheduledPostCardProps {
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
  onDelete: () => void;
  onUpdate: () => void;
  canManage: boolean;
}

// Helper to get color based on post status
const getStatusColor = (status: PostStatus) => {
  switch (status) {
    case "DRAFT":
      return "bg-gray-100 text-gray-800 border-gray-300";
    case "SCHEDULED":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "POSTED":
      return "bg-green-100 text-green-800 border-green-300";
    case "FAILED":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

// Helper to get platform icons
const getPlatformIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "onlyfans":
      return "💸";
    case "patreon":
      return "🎭";
    case "fansly":
      return "👑";
    case "kofi":
      return "☕";
    case "twitter":
      return "🐦";
    case "instagram":
      return "📸";
    default:
      return "🌐";
  }
};

export function ScheduledPostCard({ post, onDelete, onUpdate, canManage }: ScheduledPostCardProps) {
  const { toast } = useToast();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Delete post mutation
  const deletePost = trpc.scheduledPost.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Post deleted",
        description: "The scheduled post has been deleted successfully",
      });
      onDelete();
    },
    onError: (error) => {
      toast({
        title: "Error deleting post",
        description: error.message || "Failed to delete the post",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deletePost.mutate({ id: post.id });
    setIsDeleteConfirmOpen(false);
  };

  // Calculate if the post is overdue (failed status but scheduled time is in the past)
  const isOverdue = post.status === "SCHEDULED" && new Date(post.scheduledFor) < new Date();

  return (
    <>
      <Card className={
        isOverdue
          ? "border-red-200 shadow-sm shadow-red-100"
          : post.status === "DRAFT"
          ? "border-gray-200 shadow-sm shadow-gray-100"
          : post.status === "FAILED"
          ? "border-red-200 shadow-sm shadow-red-100"
          : "border-gray-200 shadow-sm"
      }>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="line-clamp-1">{post.title || "Untitled Post"}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                {post.client?.name || "No Client"} 
                <span className="mx-1">•</span> 
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(post.scheduledFor), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </CardDescription>
            </div>
            
            <Badge variant="outline" className={getStatusColor(post.status)}>
              {post.status}
              {isOverdue && " (Overdue)"}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pb-2">
          <div className="space-y-2">
            <div className="line-clamp-3 text-sm text-gray-600">
              {post.content}
            </div>
            
            {post.mediaUrls && post.mediaUrls.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {post.mediaUrls.map((url, index) => (
                  <div 
                    key={index} 
                    className="w-10 h-10 bg-gray-100 rounded overflow-hidden relative"
                    style={{ 
                      backgroundImage: url.startsWith('http') ? `url(${url})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center' 
                    }}
                  >
                    {!url.startsWith('http') && (
                      <div className="flex items-center justify-center h-full text-xs">
                        Media
                      </div>
                    )}
                  </div>
                ))}
                {post.mediaUrls.length > 3 && (
                  <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex items-center justify-center text-xs">
                    +{post.mediaUrls.length - 3}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex flex-wrap gap-1 mt-2">
              {post.platforms.map((platform) => (
                <div
                  key={platform.platformId}
                  className="flex items-center text-xs bg-gray-100 px-2 py-1 rounded"
                >
                  <span className="mr-1">{getPlatformIcon(platform.platform.type)}</span>
                  {platform.platform.name}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        
        {canManage && (
          <CardFooter className="pt-2 flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Post
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="flex items-center text-red-600"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardFooter>
        )}
      </Card>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this scheduled post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deletePost.isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deletePost.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Edit post modal */}
      {isEditModalOpen && (
        <EditPostModal
          post={post}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false);
            onUpdate();
          }}
        />
      )}
    </>
  );
} 