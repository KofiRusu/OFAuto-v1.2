import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface PublishPostButtonProps {
  postId: string;
  disabled?: boolean;
  small?: boolean;
  onSuccess?: () => void;
}

export function PublishPostButton({ 
  postId, 
  disabled = false,
  small = false,
  onSuccess
}: PublishPostButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();
  
  const simulatePublish = async () => {
    setIsPublishing(true);
    
    try {
      // Introduce some random delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
      
      // Randomly succeed or fail (80% success rate)
      const success = Math.random() > 0.2;
      
      // Update the post status via API
      const response = await fetch(`/api/scheduled-posts/${postId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: success ? 'published' : 'failed',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update post status');
      }
      
      // Call the success callback if provided
      if (success && onSuccess) {
        onSuccess();
      }
      
      // Show toast message
      toast({
        title: success ? 'Post Published' : 'Publishing Failed',
        description: success 
          ? 'Your post has been published successfully.'
          : 'There was an issue publishing your post. Please try again.',
        variant: success ? 'default' : 'destructive',
      });
    } catch (error) {
      console.error('Error publishing post:', error);
      toast({
        title: 'Error',
        description: 'Failed to publish post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };
  
  return (
    <Button
      variant={small ? "outline" : "default"}
      size={small ? "sm" : "default"}
      className={small ? "h-8 px-2" : ""}
      onClick={simulatePublish}
      disabled={disabled || isPublishing}
    >
      {isPublishing ? (
        <>
          <Loader2 className={`${small ? 'mr-1 h-3 w-3' : 'mr-2 h-4 w-4'} animate-spin`} />
          {small ? 'Publishing...' : 'Publishing Post...'}
        </>
      ) : (
        <>
          <Send className={small ? 'mr-1 h-3 w-3' : 'mr-2 h-4 w-4'} />
          {small ? 'Publish' : 'Publish Now'}
        </>
      )}
    </Button>
  );
} 