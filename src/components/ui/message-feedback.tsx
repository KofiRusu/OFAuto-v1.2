"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface MessageFeedbackProps {
  messageId: string;
  personaId: string;
  messageText: string;
  onFeedbackGiven?: (feedbackType: string) => void;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
}

export function MessageFeedback({
  messageId,
  personaId,
  messageText,
  onFeedbackGiven,
  size = "md",
  showLabels = false,
}: MessageFeedbackProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"positive" | "negative" | null>(null);
  const [comment, setComment] = useState("");

  // Button sizes based on the size prop
  const buttonSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20,
  };

  const handleFeedback = async (type: "positive" | "negative") => {
    setFeedbackType(type);
    
    // For negative feedback, show comment dialog
    if (type === "negative") {
      setShowCommentDialog(true);
    } else {
      // For positive feedback, submit directly
      await submitFeedback(type);
    }
  };

  const submitFeedback = async (type: "positive" | "negative", commentText: string = "") => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/chatbot/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personaId,
          messageId,
          messageText,
          feedback: type,
          comment: commentText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit feedback");
      }

      toast.success(
        type === "positive" 
          ? "Thanks for the positive feedback!" 
          : "Thanks for helping us improve!"
      );
      
      // Notify parent component
      if (onFeedbackGiven) {
        onFeedbackGiven(type);
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsLoading(false);
      setShowCommentDialog(false);
      setComment("");
    }
  };

  const handleCommentSubmit = () => {
    if (feedbackType) {
      submitFeedback(feedbackType, comment);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full ${buttonSizes[size]} text-gray-400 hover:text-green-500 hover:bg-green-50`}
          onClick={() => handleFeedback("positive")}
          disabled={isLoading}
        >
          {isLoading && feedbackType === "positive" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ThumbsUp size={iconSizes[size]} />
          )}
          <span className="sr-only">Like</span>
        </Button>
        
        {showLabels && <span className="text-sm">Like</span>}
        
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full ${buttonSizes[size]} text-gray-400 hover:text-red-500 hover:bg-red-50`}
          onClick={() => handleFeedback("negative")}
          disabled={isLoading}
        >
          {isLoading && feedbackType === "negative" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ThumbsDown size={iconSizes[size]} />
          )}
          <span className="sr-only">Dislike</span>
        </Button>
        
        {showLabels && <span className="text-sm">Dislike</span>}
      </div>

      {/* Comment Dialog for Negative Feedback */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tell us what could be improved</DialogTitle>
            <DialogDescription>
              Your feedback helps us improve the message quality.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              placeholder="What didn't you like about this message? (Optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCommentDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCommentSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Feedback"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 