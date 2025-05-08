"use client";

import { ScheduledPost } from "./create-scheduled-post-modal";
import { ScheduledPostCard } from "./scheduled-post-card";

interface GridViewProps {
  posts: ScheduledPost[];
  onEditPost: (post: ScheduledPost) => void;
  onDeletePost: (postId: string) => void;
}

export function GridView({ posts, onEditPost, onDeletePost }: GridViewProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-lg p-8">
        <h3 className="text-xl font-medium text-muted-foreground mb-2">No scheduled posts</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          You haven't scheduled any posts for this period. Click the "Create Post" button to schedule a new post.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {posts.map((post) => (
        <ScheduledPostCard
          key={post.id}
          post={post}
          onEdit={() => onEditPost(post)}
          onDelete={() => onDeletePost(post.id)}
        />
      ))}
    </div>
  );
} 