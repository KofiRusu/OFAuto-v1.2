import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { LockIcon, MoreVerticalIcon, Globe, Users, User } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { CommentVisibility } from "@prisma/client";

interface CampaignCommentsProps {
  campaignId: string;
}

const CampaignComments = ({ campaignId }: CampaignCommentsProps) => {
  const [newComment, setNewComment] = useState("");
  const [commentVisibility, setCommentVisibility] = useState<CommentVisibility>("PUBLIC");
  const [visibilityFilter, setVisibilityFilter] = useState<"ALL" | "PUBLIC" | "INTERNAL" | "PRIVATE">("ALL");
  const [editingComment, setEditingComment] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [moderationReason, setModerationReason] = useState("");
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);
  const { toast } = useToast();

  const utils = trpc.useContext();

  // Get comments query
  const { data: comments, isLoading } = trpc.comments.listComments.useQuery({
    campaignId,
    visibilityFilter,
  });

  // Create comment mutation
  const createCommentMutation = trpc.comments.createComment.useMutation({
    onSuccess: () => {
      setNewComment("");
      utils.comments.listComments.invalidate({ campaignId });
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update comment mutation
  const updateCommentMutation = trpc.comments.updateComment.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      setEditingComment(null);
      utils.comments.listComments.invalidate({ campaignId });
      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = trpc.comments.deleteComment.useMutation({
    onSuccess: () => {
      utils.comments.listComments.invalidate({ campaignId });
      toast({
        title: "Comment deleted",
        description: "The comment has been deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Set moderator-only mutation
  const setModeratorOnlyMutation = trpc.comments.setModeratorOnly.useMutation({
    onSuccess: (data) => {
      setIsLockDialogOpen(false);
      setModerationReason("");
      utils.comments.listComments.invalidate({ campaignId });
      toast({
        title: data.editableByModeratorOnly ? "Comment locked" : "Comment unlocked",
        description: data.editableByModeratorOnly
          ? "This comment can now only be edited by moderators."
          : "This comment can now be edited by its author.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // User role query
  const { data: userData } = trpc.user.getCurrentUser.useQuery();
  const isModerator = userData?.role === "ADMIN" || userData?.role === "MANAGER";

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    createCommentMutation.mutate({
      content: newComment,
      campaignId,
      visibility: commentVisibility,
    });
  };

  const handleEditComment = (comment: any) => {
    setEditingComment(comment);
    setIsEditing(true);
  };

  const handleUpdateComment = () => {
    if (!editingComment || !editingComment.content.trim()) return;

    updateCommentMutation.mutate({
      id: editingComment.id,
      content: editingComment.content,
      visibility: editingComment.visibility,
    });
  };

  const handleDeleteComment = (commentId: string, reason?: string) => {
    deleteCommentMutation.mutate({
      id: commentId,
      moderationReason: reason,
    });
  };

  const handleLockComment = (commentId: string) => {
    setModeratorOnlyMutation.mutate({
      id: commentId,
      editableByModeratorOnly: true,
      moderationReason: moderationReason,
    });
  };

  const handleUnlockComment = (commentId: string) => {
    setModeratorOnlyMutation.mutate({
      id: commentId,
      editableByModeratorOnly: false,
    });
  };

  // Helper to render visibility badge
  const renderVisibilityBadge = (visibility: CommentVisibility) => {
    switch (visibility) {
      case "PUBLIC":
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                <Globe className="h-3 w-3 mr-1" />
                Public
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Visible to everyone</p>
            </TooltipContent>
          </Tooltip>
        );
      case "INTERNAL":
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                <Users className="h-3 w-3 mr-1" />
                Internal
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Visible only to admins and managers</p>
            </TooltipContent>
          </Tooltip>
        );
      case "PRIVATE":
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                <User className="h-3 w-3 mr-1" />
                Private
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Visible only to you and moderators</p>
            </TooltipContent>
          </Tooltip>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Campaign Discussion</h3>

      {/* Comment filters */}
      <div className="flex items-center justify-between">
        <Tabs
          value={visibilityFilter}
          onValueChange={(value) => setVisibilityFilter(value as any)}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="PUBLIC">Public</TabsTrigger>
            <TabsTrigger value="INTERNAL" disabled={!isModerator}>Internal</TabsTrigger>
            <TabsTrigger value="PRIVATE">Private</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Comment list */}
      <div className="space-y-4 max-h-96 overflow-y-auto p-2">
        {isLoading ? (
          <div className="text-center py-4">Loading comments...</div>
        ) : comments?.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No comments yet. Be the first to comment on this campaign!
          </div>
        ) : (
          comments?.map((comment) => (
            <div
              key={comment.id}
              className={`p-4 rounded-lg border ${
                comment.isDeleted ? "bg-muted/30 opacity-60" : "bg-card"
              } ${comment.editableByModeratorOnly ? "border-amber-300" : ""}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.author.avatar || ""} />
                    <AvatarFallback>
                      {comment.author.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center">
                      <span className="font-medium">
                        {comment.author.name || "Anonymous"}
                      </span>
                      {renderVisibilityBadge(comment.visibility)}
                      {comment.editableByModeratorOnly && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="ml-2">
                              <LockIcon className="h-3 w-3 mr-1" />
                              Locked
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Only moderators can edit this comment</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {comment.isDeleted && (
                        <Badge variant="outline" className="ml-2 bg-destructive/10 text-destructive">
                          Deleted
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </div>
                    {comment.moderatedById && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Moderated by {comment.moderatedBy?.name || "Admin"}
                        {comment.moderationReason && `: "${comment.moderationReason}"`}
                      </div>
                    )}
                    {!comment.isDeleted && (
                      <div className="mt-2">{comment.content}</div>
                    )}
                  </div>
                </div>

                {!comment.isDeleted && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVerticalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* Edit option - visible to author (if not locked) and to moderators */}
                      {((comment.authorId === userData?.id && !comment.editableByModeratorOnly) || isModerator) && (
                        <DropdownMenuItem onClick={() => handleEditComment(comment)}>
                          Edit
                        </DropdownMenuItem>
                      )}

                      {/* Delete option - visible to author (if not locked) and to moderators */}
                      {((comment.authorId === userData?.id && !comment.editableByModeratorOnly) || isModerator) && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      )}

                      {/* Moderator options */}
                      {isModerator && (
                        <>
                          <DropdownMenuSeparator />
                          {comment.editableByModeratorOnly ? (
                            <DropdownMenuItem onClick={() => handleUnlockComment(comment.id)}>
                              Unlock comment
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => {
                              setEditingComment(comment);
                              setIsLockDialogOpen(true);
                            }}>
                              Lock comment
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment editor */}
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editingComment?.content || ""}
            onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
            placeholder="Edit your comment..."
            className="min-h-[100px]"
          />
          <div className="flex justify-between">
            {isModerator && (
              <Select
                value={editingComment?.visibility}
                onValueChange={(value) => setEditingComment({ ...editingComment, visibility: value })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">Public</SelectItem>
                  <SelectItem value="INTERNAL">Internal</SelectItem>
                  <SelectItem value="PRIVATE">Private</SelectItem>
                </SelectContent>
              </Select>
            )}
            <div className="space-x-2 ml-auto">
              <Button variant="outline" onClick={() => {
                setIsEditing(false);
                setEditingComment(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleUpdateComment}>
                Update
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment about this campaign..."
            className="min-h-[100px]"
          />
          <div className="flex justify-between items-center">
            <Select
              value={commentVisibility}
              onValueChange={(value) => setCommentVisibility(value as CommentVisibility)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">
                  <div className="flex items-center">
                    <Globe className="mr-2 h-4 w-4" />
                    Public
                  </div>
                </SelectItem>
                {isModerator && (
                  <SelectItem value="INTERNAL">
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      Internal
                    </div>
                  </SelectItem>
                )}
                <SelectItem value="PRIVATE">
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Private
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSubmitComment}>
              Add Comment
            </Button>
          </div>
        </div>
      )}

      {/* Moderation dialogs */}
      <Dialog open={isLockDialogOpen} onOpenChange={setIsLockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lock Comment</DialogTitle>
            <DialogDescription>
              Locking this comment will prevent the author from editing or deleting it. Only moderators will be able to modify it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Input
                id="reason"
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="e.g., Contains sensitive campaign information"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLockDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => editingComment && handleLockComment(editingComment.id)}>
              Lock Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignComments; 