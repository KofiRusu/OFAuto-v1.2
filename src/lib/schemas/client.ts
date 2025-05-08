import { z } from 'zod';

// Base schema for client data
export const clientSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  status: z.string().default('active'),
  userId: z.string().min(1, 'User ID is required'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Schema for creating a new client
export const createClientSchema = clientSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema for updating an existing client
export const updateClientSchema = clientSchema
  .partial()
  .omit({
    id: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
  });

// Schema for client response with additional nested fields
export const clientResponseSchema = clientSchema.extend({
  platforms: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
    })
  ).optional(),
});

// Export types
export type Client = z.infer<typeof clientSchema>;
export type CreateClient = z.infer<typeof createClientSchema>;
export type UpdateClient = z.infer<typeof updateClientSchema>;
export type ClientResponse = z.infer<typeof clientResponseSchema>; 