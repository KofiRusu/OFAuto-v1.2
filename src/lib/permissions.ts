import { Comment, CommentVisibility, UserRole } from "@prisma/client";

/**
 * Check if a user can view a comment based on visibility and roles
 * 
 * @param comment The comment to check
 * @param userId The ID of the current user
 * @param userRole The role of the current user
 * @returns boolean indicating if the user can view the comment
 */
export function canViewComment(
  comment: Comment & { author?: { id: string; role: UserRole } },
  userId: string,
  userRole: string
): boolean {
  // If the comment is deleted and the user is not an admin or the author, they cannot view it
  if (comment.isDeleted) {
    return userRole === UserRole.ADMIN || 
           userRole === UserRole.MANAGER || 
           comment.authorId === userId;
  }

  // Check visibility permissions
  switch (comment.visibility) {
    case CommentVisibility.PUBLIC:
      // Everyone can see public comments
      return true;

    case CommentVisibility.INTERNAL:
      // Only staff and the author can see internal comments
      return userRole === UserRole.ADMIN || 
             userRole === UserRole.MANAGER || 
             userRole === UserRole.STAFF ||
             comment.authorId === userId;

    case CommentVisibility.PRIVATE:
      // Only the author and admin/managers can see private comments
      return userRole === UserRole.ADMIN || 
             userRole === UserRole.MANAGER || 
             comment.authorId === userId;

    default:
      return false;
  }
}

/**
 * Check if a user can edit a comment
 * 
 * @param comment The comment to check
 * @param userId The ID of the current user
 * @param userRole The role of the current user
 * @returns boolean indicating if the user can edit the comment
 */
export function canEditComment(
  comment: Comment,
  userId: string,
  userRole: string
): boolean {
  // Admins and managers can edit any comment
  if (userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) {
    return true;
  }

  // Authors can edit their own comments if they're not deleted or moderated
  if (comment.authorId === userId) {
    return !comment.isDeleted && !comment.isModerated;
  }

  return false;
}

/**
 * Check if a user can delete a comment
 * 
 * @param comment The comment to check
 * @param userId The ID of the current user
 * @param userRole The role of the current user
 * @returns boolean indicating if the user can delete the comment
 */
export function canDeleteComment(
  comment: Comment,
  userId: string,
  userRole: string
): boolean {
  // Admins and managers can delete any comment
  if (userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) {
    return true;
  }

  // Authors can delete their own comments if they're not moderated
  if (comment.authorId === userId) {
    return !comment.isModerated;
  }

  return false;
}

/**
 * Check if a user can moderate comments
 * 
 * @param userRole The role of the current user
 * @returns boolean indicating if the user can moderate comments
 */
export function canModerateComments(userRole: string): boolean {
  return userRole === UserRole.ADMIN || userRole === UserRole.MANAGER;
}

/**
 * Check if a comment needs moderation based on its content
 * 
 * @param content The content to check
 * @returns boolean indicating if the content needs moderation
 */
export function contentNeedsModeration(content: string): boolean {
  // This is a simple example. In a real app, you might:
  // 1. Check for banned words
  // 2. Use sentiment analysis
  // 3. Check for excessive symbols or caps
  // 4. Look for suspicious links
  // 5. Integrate with a content moderation API
  
  const suspiciousTerms = [
    'spam', 'scam', 'illegal', 'drugs', 'hack', 'crack', 'free download',
    'adult content', 'xxx', 'gambling', 'betting'
  ];
  
  const lowerContent = content.toLowerCase();
  
  return suspiciousTerms.some(term => lowerContent.includes(term)) ||
         // Check for excessive symbols (potential spam)
         (content.match(/[!?]{3,}/g) !== null) ||
         // Check for excessive capitalization
         (content.length > 10 && content.toUpperCase() === content);
} 