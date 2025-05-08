"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LinktreeUpdateSchema, LinkItem } from "@/lib/schemas/linktree";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { toast } from "sonner";

interface LinktreeEditorProps {
  initialLinks?: LinkItem[];
  initialTheme?: string | null;
  onSave: (data: { links: LinkItem[]; theme?: string }) => Promise<void>;
  onRequestSuggestions?: () => Promise<LinkItem[]>;
}

// Available themes
const THEMES = [
  { id: "default", name: "Default" },
  { id: "dark", name: "Dark Mode" },
  { id: "light", name: "Light Mode" },
  { id: "gradient", name: "Gradient" },
  { id: "minimal", name: "Minimal" },
  { id: "neon", name: "Neon" },
];

export function LinktreeEditor({
  initialLinks = [],
  initialTheme = null,
  onSave,
  onRequestSuggestions,
}: LinktreeEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize form with React Hook Form
  const form = useForm({
    resolver: zodResolver(LinktreeUpdateSchema),
    defaultValues: {
      links: initialLinks.length > 0 ? initialLinks : [{ title: "", url: "" }],
      theme: initialTheme || undefined,
    },
  });

  // Use field array for managing dynamic links
  const { fields, append, remove } = useFieldArray({
    name: "links",
    control: form.control,
  });

  // Submit handler
  const onSubmit = async (data: { links: LinkItem[]; theme?: string }) => {
    try {
      setIsSaving(true);
      
      // Filter out empty links
      const filteredLinks = data.links.filter(
        (link) => link.title.trim() !== "" && link.url.trim() !== ""
      );
      
      if (filteredLinks.length === 0) {
        toast.error("You need at least one link");
        setIsSaving(false);
        return;
      }
      
      // Call the save function with filtered data
      await onSave({
        links: filteredLinks,
        theme: data.theme,
      });
      
      toast.success("Linktree saved successfully");
    } catch (error) {
      console.error("Error saving linktree:", error);
      toast.error("Failed to save linktree");
    } finally {
      setIsSaving(false);
    }
  };

  // Generate suggestions handler
  const handleGenerateSuggestions = async () => {
    if (!onRequestSuggestions) return;
    
    try {
      setIsGenerating(true);
      const suggestedLinks = await onRequestSuggestions();
      
      // Replace form values with suggestions
      form.setValue("links", suggestedLinks);
      
      toast.success("Generated link suggestions");
    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast.error("Failed to generate suggestions");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Theme selection */}
          <FormField
            control={form.control}
            name="theme"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Theme</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a theme" />
                    </SelectTrigger>
                    <SelectContent>
                      {THEMES.map((theme) => (
                        <SelectItem key={theme.id} value={theme.id}>
                          {theme.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>
                  Choose a theme for your Linktree page
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Links section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Links</h3>
              {onRequestSuggestions && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateSuggestions}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Icons.sparkles className="mr-2 h-4 w-4" />
                      Generate Suggestions
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Link items */}
            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-1 space-y-4">
                        <FormField
                          control={form.control}
                          name={`links.${index}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Link Title</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="My Instagram"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`links.${index}.url`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://instagram.com/myusername"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="mt-8"
                      >
                        <Icons.trash className="h-4 w-4" />
                        <span className="sr-only">Remove link</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Add link button */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => append({ title: "", url: "" })}
            >
              <Icons.plus className="mr-2 h-4 w-4" />
              Add Link
            </Button>
          </div>

          {/* Save button */}
          <Button type="submit" disabled={isSaving} className="w-full">
            {isSaving ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
} 