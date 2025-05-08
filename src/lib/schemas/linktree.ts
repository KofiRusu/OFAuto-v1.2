import { z } from 'zod';

/**
 * Schema for a single link in the Linktree
 */
export const LinkItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Must be a valid URL"),
});

export type LinkItem = z.infer<typeof LinkItemSchema>;

/**
 * Schema for creating/configuring a Linktree
 */
export const LinktreeConfigSchema = z.object({
  userId: z.string().uuid(),
  links: z.array(LinkItemSchema),
  theme: z.string().optional(),
});

export type LinktreeConfig = z.infer<typeof LinktreeConfigSchema>;

/**
 * Schema for updating an existing Linktree
 */
export const LinktreeUpdateSchema = z.object({
  links: z.array(LinkItemSchema),
  theme: z.string().optional(),
});

export type LinktreeUpdate = z.infer<typeof LinktreeUpdateSchema>;

/**
 * Schema for Linktree response
 */
export const LinktreeResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  links: z.array(LinkItemSchema),
  theme: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type LinktreeResponse = z.infer<typeof LinktreeResponseSchema>;

/**
 * Schema for generating Linktree suggestions
 */
export const GenerateSuggestionsSchema = z.object({
  userId: z.string().uuid(),
});

export type GenerateSuggestions = z.infer<typeof GenerateSuggestionsSchema>;

/**
 * Schema for suggestions response
 */
export const SuggestionsResponseSchema = z.object({
  suggestions: z.array(LinkItemSchema),
});

export type SuggestionsResponse = z.infer<typeof SuggestionsResponseSchema>; 