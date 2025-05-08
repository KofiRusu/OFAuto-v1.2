import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Comment, CommentVisibility, User, UserRole } from "@prisma/client";
import { Globe, Users, Lock, MoreVertical, Edit, Trash2, Flag, CheckCircle, XCircle } from "lucide-react";
import CommentForm from "./CommentForm";
import { Badge } from "@/components/ui/badge";

interface CommentWithAuthor extends Comment {
  author: User;
}

interface CommentItemProps {
  comment: CommentWithAuthor;
  currentUser: User;
  onEdit: (id: string, content: string, visibility: CommentVisibility) => void;
  onDelete: (id: string) => void;
  onModerate?: (id: string, isApproved: boolean) => void;
}

export default function CommentItem({
  comment,
  currentUser,
  onEdit,
  onDelete,
  onModerate,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const isAuthor = comment.authorId === currentUser.id;
  const canModerate = currentUser.role === UserRole.ADMIN || 
                      currentUser.role === UserRole.MANAGER;
  
  // Format date as "2 hours ago", "3 days ago", etc.
  const formattedDate = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });
  
  // Visual indicator for comment visibility
  const VisibilityIcon = () => {
    switch(comment.visibility) {
      case "PUBLIC":
        return <Globe className="h-3.5 w-3.5 text-green-500" />;
      case "INTERNAL":
        return <Users className="h-3.5 w-3.5 text-blue-500" />;
      case "PRIVATE":
        return <Lock className="h-3.5 w-3.5 text-amber-500" />;
      default:
        return null;
    }
  };

  // Show different badges based on moderation status
  const ModerationBadge = () => {
    if (comment.isDeleted) {
      return <Badge variant="destructive">Deleted</Badge>;
    }
    
    if (comment.needsModeration) {
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Needs Review</Badge>;
    }
    
    if (comment.isModerated) {
      return comment.isApproved 
        ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>
        : <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
    }
    
    return null;
  };

  const handleEdit = (content: string, visibility: CommentVisibility) => {
    onEdit(comment.id, content, visibility);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-4 rounded-md border">
        <div className="flex items-center mb-3">
          <UserAvatar user={comment.author} className="h-8 w-8" />
          <div className="ml-2">
            <p className="text-sm font-medium">{comment.author.name}</p>
          </div>
        </div>
        <CommentForm
          initialContent={comment.content}
          initialVisibility={comment.visibility}
          onSubmit={handleEdit}
          onCancel={() => setIsEditing(false)}
          isEditing={true}
          showVisibilityOptions={isAuthor}
        />
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-md border ${comment.needsModeration ? 'bg-amber-50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <UserAvatar user={comment.author} className="h-8 w-8" />
          <div className="ml-2">
            <div className="flex items-center">
              <p className="text-sm font-medium">{comment.author.name}</p>
              <div className="flex items-center ml-2">
                <VisibilityIcon />
                <ModerationBadge />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </div>
        </div>
        
        {(isAuthor || canModerate) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isAuthor && (
                <>
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
              
              {canModerate && onModerate && (
                <>
                  {(isAuthor && canModerate) && <DropdownMenuSeparator />}
                  
                  {comment.needsModeration && (
                    <>
                      <DropdownMenuItem onClick={() => onModerate(comment.id, true)}>
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        Approve
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onModerate(comment.id, false)}>
                        <XCircle className="h-4 w-4 mr-2 text-red-500" />
                        Reject
                      </DropdownMenuItem>
                    </>
                  )}

                  {!comment.needsModeration && !comment.isModerated && (
                    <DropdownMenuItem onClick={() => onModerate(comment.id, false)}>
                      <Flag className="h-4 w-4 mr-2 text-amber-500" />
                      Mark for review
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      <div className="mt-2">
        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
      </div>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              onDelete(comment.id);
              setShowDeleteDialog(false);
            }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 