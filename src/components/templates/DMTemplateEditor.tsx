'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, Wand2, AlertCircle, Info } from "lucide-react";
import { parseTemplateVariables, applyTemplate, createTemplateSamplePreview } from "@/lib/utils/template";
import { generateTemplateVariations } from "@/lib/openai/variationGenerator";

interface DMTemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  onVariablesChange?: (variables: string[]) => void;
  placeholder?: string;
  previewValues?: Record<string, string>;
  commonVariables?: string[];
  useSampleValues?: boolean;
}

export function DMTemplateEditor({ 
  value, 
  onChange, 
  onVariablesChange,
  placeholder = "Write your message template here...",
  previewValues = {},
  commonVariables = ["username", "platform", "creator_name", "day", "date", "offer"],
  useSampleValues = false
}: DMTemplateEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [variables, setVariables] = useState<string[]>([]);
  const [preview, setPreview] = useState<string>("");
  const [customVariable, setCustomVariable] = useState<string>("");
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [variations, setVariations] = useState<string[]>([]);
  const [showVariations, setShowVariations] = useState(false);
  
  // Extract variables whenever template changes
  useEffect(() => {
    const extractedVariables = parseTemplateVariables(value);
    setVariables(extractedVariables);
    
    if (onVariablesChange) {
      onVariablesChange(extractedVariables);
    }
    
    // Generate preview
    if (useSampleValues) {
      setPreview(createTemplateSamplePreview(value));
    } else {
      setPreview(applyTemplate(value, previewValues));
    }
  }, [value, previewValues, useSampleValues, onVariablesChange]);
  
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
  
  // Add custom variable
  const addCustomVariable = () => {
    if (!customVariable.trim()) return;
    
    insertVariable(customVariable.trim());
    setCustomVariable("");
  };
  
  // Generate variations using AI
  const generateVariations = async () => {
    if (!value.trim()) return;
    
    setIsGeneratingVariations(true);
    setShowVariations(true);
    
    try {
      const newVariations = await generateTemplateVariations(value, 3);
      setVariations(newVariations);
    } catch (error) {
      console.error("Error generating variations:", error);
    } finally {
      setIsGeneratingVariations(false);
    }
  };
  
  // Apply a variation as the new template
  const applyVariation = (variation: string) => {
    onChange(variation);
  };
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Editor Panel */}
        <div className="space-y-2">
          <Label htmlFor="template-editor">Message Template</Label>
          <Textarea
            id="template-editor"
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-[200px] font-mono text-sm resize-y"
          />
          
          {/* Variables detected */}
          {variables.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center text-xs text-muted-foreground">
              <span>Variables:</span>
              {variables.map((variable) => (
                <Badge key={variable} variant="outline" className="text-xs">
                  {variable}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Common Variables */}
          <div>
            <Label className="text-xs mb-1 block">Insert Variable:</Label>
            <div className="flex flex-wrap gap-1">
              {commonVariables.map((variable) => (
                <Button
                  key={variable}
                  type="button"
                  onClick={() => insertVariable(variable)}
                  variant="secondary"
                  size="sm"
                  className="h-7 text-xs"
                >
                  {variable}
                </Button>
              ))}
              
              {/* Custom Variable Input */}
              <div className="flex items-center gap-1 mt-1 w-full">
                <Input 
                  value={customVariable}
                  onChange={(e) => setCustomVariable(e.target.value)}
                  placeholder="Custom variable"
                  className="h-7 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomVariable();
                    }
                  }}
                />
                <Button 
                  onClick={addCustomVariable}
                  variant="outline" 
                  size="sm"
                  className="h-7"
                  disabled={!customVariable.trim()}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Preview Panel */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Message Preview</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    This shows how your message will look with variables filled in.
                    {useSampleValues && " Sample values are used for preview."}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Card>
            <CardContent className="p-4 min-h-[200px] whitespace-pre-wrap text-sm">
              {preview || 
                <span className="text-muted-foreground italic">
                  Preview will appear here as you type...
                </span>
              }
            </CardContent>
          </Card>
          
          {/* AI Generation Tools */}
          <div className="flex items-center justify-between">
            <Button 
              onClick={generateVariations}
              disabled={isGeneratingVariations || !value.trim()}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {isGeneratingVariations ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-3 w-3" />
                  Generate Variations
                </>
              )}
            </Button>
            
            <Button
              onClick={() => setShowVariations(!showVariations)}
              variant="ghost"
              size="sm"
              className="text-xs"
              disabled={variations.length === 0}
            >
              {showVariations ? "Hide Variations" : "Show Variations"}
              <RefreshCw className="ml-2 h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* AI Generated Variations */}
      {showVariations && variations.length > 0 && (
        <div className="space-y-2 mt-4">
          <Label className="text-sm">AI-Generated Variations</Label>
          <div className="grid grid-cols-1 gap-3">
            {variations.map((variation, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="mb-1">Variation {index + 1}</Badge>
                    <Button 
                      onClick={() => applyVariation(variation)}
                      variant="ghost" 
                      size="sm"
                      className="h-6 text-xs"
                    >
                      Use This
                    </Button>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{variation}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 