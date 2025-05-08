'use client';

import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

interface TemplatePreviewProps {
  template: {
    subject: string;
    message: string;
    includeMedia?: boolean;
    mediaUrls?: string[];
  };
  previewValues?: Record<string, string>;
}

export function TemplatePreview({ template, previewValues }: TemplatePreviewProps) {
  // Default preview values for variables
  const defaultPreviewValues = {
    name: 'John',
    creator_name: 'Creator Name',
    subscription_end: format(new Date(Date.now() + 86400000 * 30), 'MMMM d, yyyy'), // 30 days from now
    last_login: format(new Date(Date.now() - 86400000 * 3), 'MMMM d, yyyy'), // 3 days ago
  };
  
  // Use provided values or defaults
  const values = { ...defaultPreviewValues, ...previewValues };
  
  // Replace variables in text
  const replaceVariables = (text: string) => {
    return text.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
      return values[variableName.trim()] || match;
    });
  };
  
  const subjectWithVariables = replaceVariables(template.subject);
  const messageWithVariables = replaceVariables(template.message);
  
  // Format message with line breaks
  const formattedMessage = messageWithVariables.split('\n').map((line, index) => (
    <React.Fragment key={index}>
      {line}
      <br />
    </React.Fragment>
  ));
  
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center">
          <Badge variant="outline" className="mr-2">Subject</Badge>
          <h3 className="font-medium">{subjectWithVariables}</h3>
        </div>
      </div>
      
      <Card className="p-4 text-sm">
        <div className="space-y-4">
          <div>{formattedMessage}</div>
          
          {template.includeMedia && template.mediaUrls && template.mediaUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-2 mt-2 border-t">
              {template.mediaUrls.map((url, index) => (
                <div key={index} className="aspect-square rounded-md overflow-hidden border">
                  <img src={url} alt={`Media ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
      
      <div className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 p-2 rounded">
        <p>
          Preview shows how your message will appear with variables replaced by actual subscriber data.
          The values shown here are examples only.
        </p>
      </div>
    </div>
  );
} 