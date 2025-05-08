import { useState } from "react";
import { UserRole, CommentVisibility, User } from "@prisma/client";
import { useComments, CommentWithAuthor } from "@/hooks/useComments";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";
import { Plus, MessageSquare } from "lucide-react";
import { canModerateComments } from "@/lib/permissions";

interface CommentListProps {
  entityId: string;
  entityType: string;
  currentUser: User;
  initialComments?: CommentWithAuthor[];
  showAddComment?: boolean;
  limit?: number;
  onCommentAdded?: (comment: CommentWithAuthor) => void;
  onCommentEdited?: (comment: CommentWithAuthor) => void;
  onCommentDeleted?: (commentId: string) => void;
  onCommentModerated?: (comment: CommentWithAuthor) => void;
}

export default function CommentList({
  entityId,
  entityType,
  currentUser,
  initialComments,
  showAddComment = true,
  limit,
  onCommentAdded,
  onCommentEdited,
  onCommentDeleted,
  onCommentModerated,
}: CommentListProps) {
  const [isAddingComment, setIsAddingComment] = useState(false);
  
  const { 
    comments, 
    isLoading, 
    addComment, 
    editComment, 
    deleteComment, 
    moderateComment, 
    refetch,
    isAddingComment: isSubmitting
  } = useComments({
    entityId,
    entityType,
    currentUser,
    initialComments,
    onCommentAdded: (comment) => {
      onCommentAdded?.(comment);
      setIsAddingComment(false);
    },
    onCommentEdited,
    onCommentDeleted,
    onCommentModerated,
  });

  // Check if the current user can moderate comments
  const userCanModerate = canModerateComments(currentUser.role);
  
  // Get filtered comments based on visibility permissions
  const getFilteredComments = () => {
    if (!comments) return [];
    
    // Admins and managers can see all comments
    if (userCanModerate) {
      return comments;
    }
    
    // Filter based on visibility and user role
    return comments.filter(comment => {
      // Always include user's own comments 
      if (comment.authorId === currentUser.id) {
        return true;
      }
      
      // For others, filter by visibility
      switch (comment.visibility) {
        case CommentVisibility.PUBLIC:
          return true;
        case CommentVisibility.INTERNAL:
          return currentUser.role === UserRole.STAFF;
        case CommentVisibility.PRIVATE:
          return false;
        default:
          return false;
      }
    });
  };
  
  const filteredComments = getFilteredComments();
  const displayComments = limit ? filteredComments.slice(0, limit) : filteredComments;
  
  // Handle form submission
  const handleSubmitComment = (content: string, visibility: CommentVisibility) => {
    addComment(content, visibility);
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {showAddComment && (
        isAddingComment ? (
          <div className="mb-6">
            <CommentForm 
              onSubmit={handleSubmitComment}
              onCancel={() => setIsAddingComment(false)}
              showVisibilityOptions={true}
              isSubmitting={isSubmitting}
            />
          </div>
        ) : (
          <Button 
            variant="outline" 
            className="mb-4 w-full" 
            onClick={() => setIsAddingComment(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Comment
          </Button>
        )
      )}
      
      {displayComments.length === 0 ? (
        <div className="text-center p-8 border rounded-md text-muted-foreground flex flex-col items-center justify-center">
          <MessageSquare className="h-10 w-10 mb-2 opacity-50" />
          <p className="mb-2">No comments yet</p>
          {showAddComment && !isAddingComment && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAddingComment(true)}
            >
              Add the first comment
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayComments.map((comment) => (
            <CommentItem 
              key={comment.id} 
              comment={comment} 
              currentUser={currentUser}
              onEdit={editComment}
              onDelete={deleteComment}
              onModerate={userCanModerate ? moderateComment : undefined}
            />
          ))}
          
          {limit && filteredComments.length > limit && (
            <div className="text-center">
              <Button 
                variant="ghost" 
                onClick={() => refetch()}
                className="text-muted-foreground"
              >
                View all {filteredComments.length} comments
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 