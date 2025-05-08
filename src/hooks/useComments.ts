import { useState, useCallback, useEffect } from 'react';
import { Comment, CommentVisibility, User } from '@prisma/client';
import { api } from '@/trpc/react';
import { toast } from 'sonner';

export type CommentWithAuthor = Comment & {
  author: Pick<User, 'id' | 'name' | 'email' | 'image' | 'role'>;
};

interface UseCommentsOptions {
  entityId: string;
  entityType: string;
  currentUser: User;
  initialComments?: CommentWithAuthor[];
  onCommentAdded?: (comment: CommentWithAuthor) => void;
  onCommentEdited?: (comment: CommentWithAuthor) => void;
  onCommentDeleted?: (commentId: string) => void;
  onCommentModerated?: (comment: CommentWithAuthor) => void;
}

export function useComments({
  entityId,
  entityType,
  currentUser,
  initialComments = [],
  onCommentAdded,
  onCommentEdited,
  onCommentDeleted,
  onCommentModerated,
}: UseCommentsOptions) {
  const [comments, setComments] = useState<CommentWithAuthor[]>(initialComments);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [addingCommentError, setAddingCommentError] = useState<string | null>(null);
  
  // TRPC hooks
  const getCommentsQuery = api.comments.getComments.useQuery(
    { entityId, entityType },
    { enabled: !initialComments.length }
  );
  
  const addCommentMutation = api.comments.addComment.useMutation({
    onSuccess: (newComment) => {
      setComments((prev) => [newComment as CommentWithAuthor, ...prev]);
      onCommentAdded?.(newComment as CommentWithAuthor);
      setIsAddingComment(false);
      setAddingCommentError(null);
    },
    onError: (error) => {
      setAddingCommentError(error.message);
      setIsAddingComment(false);
      toast.error('Failed to add comment', { description: error.message });
    },
  });
  
  const editCommentMutation = api.comments.updateComment.useMutation({
    onSuccess: (updatedComment) => {
      setComments((prev) => 
        prev.map((comment) => 
          comment.id === updatedComment.id 
            ? { ...comment, ...updatedComment } as CommentWithAuthor
            : comment
        )
      );
      onCommentEdited?.(updatedComment as CommentWithAuthor);
      toast.success('Comment updated');
    },
    onError: (error) => {
      toast.error('Failed to update comment', { description: error.message });
    },
  });
  
  const deleteCommentMutation = api.comments.deleteComment.useMutation({
    onSuccess: (deletedComment) => {
      setComments((prev) => 
        prev.filter((comment) => comment.id !== deletedComment.id)
      );
      onCommentDeleted?.(deletedComment.id);
      toast.success('Comment deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete comment', { description: error.message });
    },
  });
  
  const moderateCommentMutation = api.comments.moderateComment.useMutation({
    onSuccess: (moderatedComment) => {
      setComments((prev) => 
        prev.map((comment) => 
          comment.id === moderatedComment.id 
            ? { ...comment, ...moderatedComment } as CommentWithAuthor
            : comment
        )
      );
      onCommentModerated?.(moderatedComment as CommentWithAuthor);
      toast.success(`Comment ${moderatedComment.isApproved ? 'approved' : 'rejected'}`);
    },
    onError: (error) => {
      toast.error('Failed to moderate comment', { description: error.message });
    },
  });
  
  // Load comments if not provided
  useEffect(() => {
    if (initialComments.length) {
      setComments(initialComments);
      setIsLoading(false);
    } else if (getCommentsQuery.data) {
      setComments(getCommentsQuery.data as CommentWithAuthor[]);
      setIsLoading(false);
    }
  }, [initialComments, getCommentsQuery.data]);
  
  // Actions
  const addComment = useCallback((content: string, visibility: CommentVisibility = 'PUBLIC') => {
    setIsAddingComment(true);
    addCommentMutation.mutate({
      content,
      entityId,
      entityType,
      visibility,
    });
  }, [entityId, entityType, addCommentMutation]);
  
  const editComment = useCallback((id: string, content: string, visibility: CommentVisibility) => {
    editCommentMutation.mutate({
      id,
      content,
      visibility,
    });
  }, [editCommentMutation]);
  
  const deleteComment = useCallback((id: string) => {
    deleteCommentMutation.mutate({ id });
  }, [deleteCommentMutation]);
  
  const moderateComment = useCallback((id: string, isApproved: boolean) => {
    moderateCommentMutation.mutate({
      id,
      isApproved,
      moderationNotes: isApproved ? 'Approved by moderator' : 'Rejected by moderator',
    });
  }, [moderateCommentMutation]);
  
  return {
    comments,
    isLoading: isLoading || getCommentsQuery.isLoading,
    isAddingComment,
    addingCommentError,
    addComment,
    editComment,
    deleteComment,
    moderateComment,
    refetch: getCommentsQuery.refetch,
  };
} 