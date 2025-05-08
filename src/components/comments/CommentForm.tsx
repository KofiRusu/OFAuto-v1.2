import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CommentVisibility } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Users, Lock } from "lucide-react";

interface CommentFormProps {
  initialContent?: string;
  initialVisibility?: CommentVisibility;
  onSubmit: (content: string, visibility: CommentVisibility) => void;
  onCancel?: () => void;
  isEditing?: boolean;
  isSubmitting?: boolean;
  showVisibilityOptions?: boolean;
}

export default function CommentForm({
  initialContent = "",
  initialVisibility = "PUBLIC",
  onSubmit,
  onCancel,
  isEditing = false,
  isSubmitting = false,
  showVisibilityOptions = false,
}: CommentFormProps) {
  const [content, setContent] = useState(initialContent);
  const [visibility, setVisibility] = useState<CommentVisibility>(initialVisibility);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit(content, visibility);
    if (!isEditing) {
      setContent("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        className="min-h-[100px]"
        disabled={isSubmitting}
      />
      
      <div className="flex items-center justify-between">
        {showVisibilityOptions && (
          <div className="flex items-center">
            <Select
              value={visibility}
              onValueChange={(value) => setVisibility(value as CommentVisibility)}
              disabled={isSubmitting}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    <span>Public</span>
                  </div>
                </SelectItem>
                <SelectItem value="INTERNAL">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Internal</span>
                  </div>
                </SelectItem>
                <SelectItem value="PRIVATE">
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    <span>Private</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="flex space-x-2 ml-auto">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : isEditing ? "Update" : "Comment"}
          </Button>
        </div>
      </div>
    </form>
  );
} 