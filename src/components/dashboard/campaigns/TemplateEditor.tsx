'use client';

import React, { useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";

interface TemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TemplateEditor({ value, onChange, placeholder }: TemplateEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Highlight variable placeholders in the textarea
  const highlightVariables = () => {
    if (!textareaRef.current) return;
    
    const content = textareaRef.current.value;
    const variableRegex = /\{\{([^}]+)\}\}/g;
    
    // Get all variable positions
    const matches: { start: number; end: number; value: string }[] = [];
    let match;
    while ((match = variableRegex.exec(content)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        value: match[0]
      });
    }
    
    // Cannot directly style textarea content, so we just update the text
    // In a real implementation, this would use a more sophisticated editor
    // like CodeMirror, Monaco, or a contenteditable div with styling
  };
  
  // Apply highlighting whenever content changes
  useEffect(() => {
    highlightVariables();
  }, [value]);
  
  // Insert a variable at cursor position
  const insertVariable = (variable: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newValue = 
      value.substring(0, start) + 
      `{{${variable}}}` + 
      value.substring(end);
    
    onChange(newValue);
    
    // Set cursor position after the inserted variable
    setTimeout(() => {
      textarea.focus();
      const newCursorPosition = start + variable.length + 4; // +4 for the {{ and }}
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };
  
  return (
    <div className="relative space-y-2">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Write your message here..."}
        className="min-h-[200px] font-mono text-sm resize-y"
      />
      
      <div className="flex gap-1 flex-wrap">
        <button
          type="button"
          onClick={() => insertVariable("name")}
          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
        >
          +name
        </button>
        <button
          type="button"
          onClick={() => insertVariable("creator_name")}
          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
        >
          +creator_name
        </button>
        <button
          type="button"
          onClick={() => insertVariable("subscription_end")}
          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
        >
          +subscription_end
        </button>
        <button
          type="button"
          onClick={() => insertVariable("last_login")}
          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
        >
          +last_login
        </button>
      </div>
    </div>
  );
} 