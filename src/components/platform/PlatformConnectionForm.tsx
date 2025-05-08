import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Define the form schema based on platform type
const getFormSchema = (platformType: string) => {
  // Common base schema
  const baseSchema = z.object({
    username: z.string().optional(),
  });

  // Platform-specific credentials
  switch (platformType) {
    case "onlyfans":
      return baseSchema.extend({
        email: z.string().email("Valid email is required"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      });
    case "patreon":
      return baseSchema.extend({
        accessToken: z.string().min(1, "Access token is required"),
        refreshToken: z.string().optional(),
      });
    case "fansly":
      return baseSchema.extend({
        email: z.string().email("Valid email is required"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      });
    case "kofi":
      return baseSchema.extend({
        apiKey: z.string().min(1, "API key is required"),
      });
    default:
      return baseSchema;
  }
};

interface PlatformConnectionFormProps {
  clientId: string;
  platformType: string;
  onSuccess: () => void;
}

export function PlatformConnectionForm({
  clientId,
  platformType,
  onSuccess,
}: PlatformConnectionFormProps) {
  const { toast } = useToast();
  
  // Get the schema for the specific platform
  const schema = getFormSchema(platformType);
  type FormValues = z.infer<typeof schema>;

  // Create the form
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
    },
  });

  // Platform connection mutation
  const connectPlatform = trpc.platform.upsert.useMutation({
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect platform",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    // Transform form values into credentials array
    const credentials = Object.entries(values)
      .filter(([key, value]) => 
        key !== "username" && value !== undefined && value !== "")
      .map(([key, value]) => ({
        key,
        value: String(value),
      }));

    connectPlatform.mutate({
      clientId,
      platformType,
      username: values.username,
      credentials,
    });
  };

  // Get form fields based on platform type
  const renderFormFields = () => {
    switch (platformType) {
      case "onlyfans":
      case "fansly":
        return (
          <>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your public username on the platform
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input placeholder="••••••••" type="password" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your credentials are encrypted and stored securely
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      case "patreon":
        return (
          <>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accessToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Token</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="refreshToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Refresh Token (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      case "kofi":
        return (
          <>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    You can find your API key in your Ko-fi account settings
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      default:
        return (
          <div className="text-gray-500">
            Connection form for {platformType} is not available yet.
          </div>
        );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {renderFormFields()}
        
        {connectPlatform.error && (
          <div className="bg-red-50 text-red-600 p-3 rounded">
            {connectPlatform.error.message}
          </div>
        )}
        
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={connectPlatform.isPending}
          >
            {connectPlatform.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
} 