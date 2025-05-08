import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Strategy } from "@/lib/ai-strategy/types";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  metrics: z.object({
    revenue: z.number().min(0, "Revenue must be a positive number"),
    engagement: z.number().min(0, "Engagement must be a positive number"),
    retention: z.number().min(0, "Retention must be a positive number"),
    conversionRate: z.number().min(0, "Conversion rate must be a positive number"),
    timeToROI: z.number().min(1, "Time to ROI must be at least 1 day"),
  }),
  testimonial: z.string().optional(),
  featured: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface SuccessStoryFormProps {
  strategy: Strategy;
  onSuccess?: () => void;
}

export function SuccessStoryForm({ strategy, onSuccess }: SuccessStoryFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: `${strategy.type} Strategy Success Case Study`,
      description: "",
      metrics: {
        revenue: 0,
        engagement: 0,
        retention: 0,
        conversionRate: 0,
        timeToROI: 30,
      },
      testimonial: "",
      featured: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/strategies/success-stories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          strategyId: strategy.id,
          ...data,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create success story");
      }

      toast({
        title: "Success story created",
        description: "Your success story has been added to the case studies.",
      });

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Error creating success story:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create success story",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                A catchy title for this success story
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} rows={4} />
              </FormControl>
              <FormDescription>
                Describe the success story in detail, including challenges and solutions
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="metrics.revenue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Revenue Increase (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value))} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="metrics.engagement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Engagement Increase (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value))} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="metrics.retention"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Retention Increase (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value))} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="metrics.conversionRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conversion Rate (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value))} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="metrics.timeToROI"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time to ROI (days)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value))} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="testimonial"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Testimonial (optional)</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} />
              </FormControl>
              <FormDescription>
                A quote from the client about their experience with this strategy
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="featured"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Feature This Story</FormLabel>
                <FormDescription>
                  Featured stories will be highlighted and shown prominently
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Success Story"
          )}
        </Button>
      </form>
    </Form>
  );
} 