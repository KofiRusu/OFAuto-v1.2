"use client";

import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { toast } from 'sonner';

interface IdeaCardProps {
  title: string;
  description: string;
  onSave?: () => void;
  onDiscard?: () => void;
}

export function IdeaCard({ title, description, onSave, onDiscard }: IdeaCardProps) {
  const [saved, setSaved] = useState(false);
  
  const handleSave = () => {
    setSaved(true);
    toast.success('Idea saved to your campaigns');
    if (onSave) onSave();
  };
  
  const handleDiscard = () => {
    if (onDiscard) onDiscard();
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(`${title}\n\n${description}`);
    toast.success('Idea copied to clipboard');
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg line-clamp-2">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base text-foreground/80 whitespace-pre-line">
          {description}
        </CardDescription>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopy}
          >
            <Icons.copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          {onDiscard && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleDiscard}
            >
              <Icons.trash className="h-4 w-4 mr-2" />
              Discard
            </Button>
          )}
        </div>
        
        {onSave && (
          <Button 
            variant={saved ? "secondary" : "default"} 
            size="sm"
            onClick={handleSave}
            disabled={saved}
          >
            {saved ? (
              <>
                <Icons.check className="h-4 w-4 mr-2" />
                Saved
              </>
            ) : (
              <>
                <Icons.plus className="h-4 w-4 mr-2" />
                Save Idea
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 