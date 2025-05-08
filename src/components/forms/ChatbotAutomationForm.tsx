'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from '@/lib/trpc/client';
import { toast } from '@/components/ui/use-toast';
import { TriggerTypeEnum, ActionTypeEnum } from '@/lib/schemas/chatbotAutomation';
import { z } from 'zod';

// UI components
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';

// Create a simplified schema for the form
const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  personaId: z.string().uuid('Please select a valid persona'),
  triggerType: z.enum(['ON_SCHEDULE', 'ON_EVENT', 'ON_DEMAND', 'ON_CONDITION']),
  cronExpression: z.string().optional(),
  eventType: z.string().optional(),
  actions: z.array(
    z.object({
      type: z.enum(['SEND_MESSAGE', 'GENERATE_CONTENT', 'API_CALL', 'UPDATE_DATA', 'NOTIFICATION']),
      name: z.string().min(1, 'Action name is required'),
      config: z.record(z.string(), z.any()).optional(),
      order: z.number().int().min(0),
    })
  ).min(1, 'At least one action is required'),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface ChatbotAutomationFormProps {
  automationId?: string; // If provided, form is in edit mode
  onSuccess?: () => void;
}

export function ChatbotAutomationForm({ automationId, onSuccess }: ChatbotAutomationFormProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [actions, setActions] = useState<any[]>([]);
  
  // Get personas for the dropdown
  const { data: personasData, isLoading: isLoadingPersonas } = 
    trpc.persona.listPersonas.useQuery(); // Assumes a persona router exists
  
  // Get automation details if in edit mode
  const { data: automationData, isLoading: isLoadingAutomation } = 
    trpc.chatbotAutomation.getAutomation.useQuery(
      { id: automationId! },
      { 
        enabled: !!automationId,
        onSuccess: (data) => {
          if (data?.automation) {
            // Populate actions from the automation data
            setActions(data.automation.actions as any[] || []);
          }
        }
      }
    );
  
  // Create mutation
  const createMutation = trpc.chatbotAutomation.createAutomation.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Automation created successfully',
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create automation',
        variant: 'destructive',
      });
    },
  });
  
  // Update mutation
  const updateMutation = trpc.chatbotAutomation.updateAutomation.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Automation updated successfully',
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update automation',
        variant: 'destructive',
      });
    },
  });
  
  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      personaId: '',
      triggerType: 'ON_DEMAND',
      actions: [],
      isActive: true,
    },
  });
  
  // Populate form when editing and data is loaded
  useEffect(() => {
    if (automationId && automationData?.automation) {
      const automation = automationData.automation;
      
      form.reset({
        name: automation.name,
        personaId: automation.personaId,
        triggerType: automation.triggerType as any,
        actions: automation.actions as any[] || [],
        isActive: automation.isActive,
      });
      
      // Handle specific trigger types
      if (automation.triggerType === 'ON_SCHEDULE') {
        form.setValue(
          'cronExpression', 
          (automation.triggerData as any)?.cronExpression || ''
        );
      } else if (automation.triggerType === 'ON_EVENT') {
        form.setValue(
          'eventType', 
          (automation.triggerData as any)?.eventType || ''
        );
      }
    }
  }, [automationId, automationData, form]);
  
  // Add a new action
  const addAction = () => {
    const newAction = {
      type: 'SEND_MESSAGE',
      name: `action_${actions.length + 1}`,
      config: {},
      order: actions.length,
    };
    setActions([...actions, newAction]);
  };
  
  // Remove an action
  const removeAction = (index: number) => {
    const updatedActions = [...actions];
    updatedActions.splice(index, 1);
    
    // Update orders
    const reorderedActions = updatedActions.map((action, idx) => ({
      ...action,
      order: idx,
    }));
    
    setActions(reorderedActions);
  };
  
  // Update an action
  const updateAction = (index: number, field: string, value: any) => {
    const updatedActions = [...actions];
    updatedActions[index] = {
      ...updatedActions[index],
      [field]: value,
    };
    setActions(updatedActions);
  };
  
  // Form submission
  const onSubmit = (values: FormValues) => {
    // Format the data for the mutation
    const formattedActions = actions.map((action) => ({
      ...action,
      config: action.config || {},
    }));
    
    // Build the triggerData based on the trigger type
    let triggerData: any = {};
    
    switch (values.triggerType) {
      case 'ON_SCHEDULE':
        triggerData = {
          type: 'ON_SCHEDULE',
          cronExpression: values.cronExpression || '0 0 * * *', // Default to daily at midnight
          timezone: 'UTC',
        };
        break;
        
      case 'ON_EVENT':
        triggerData = {
          type: 'ON_EVENT',
          eventType: values.eventType || 'DEFAULT_EVENT',
        };
        break;
        
      case 'ON_CONDITION':
        triggerData = {
          type: 'ON_CONDITION',
          condition: {},
          evaluationFrequency: 'hourly',
        };
        break;
        
      case 'ON_DEMAND':
      default:
        triggerData = {
          type: 'ON_DEMAND',
        };
        break;
    }
    
    // Prepare the mutation data
    const mutationData = {
      name: values.name,
      personaId: values.personaId,
      triggerType: values.triggerType,
      triggerData,
      actions: formattedActions,
      isActive: values.isActive,
    };
    
    if (automationId) {
      // Update existing automation
      updateMutation.mutate({
        id: automationId,
        ...mutationData,
      });
    } else {
      // Create new automation
      createMutation.mutate(mutationData as any);
    }
  };
  
  // Show loading state
  if ((automationId && isLoadingAutomation) || isLoadingPersonas) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="trigger">Trigger</TabsTrigger>
            <TabsTrigger value="actions">
              Actions{' '}
              <Badge variant="outline" className="ml-2">
                {actions.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
          
          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Automation Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a name" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this automation.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="personaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chatbot Persona</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a persona" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {personasData?.personas?.map((persona: any) => (
                        <SelectItem key={persona.id} value={persona.id}>
                          {persona.name}
                        </SelectItem>
                      )) || []}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The chatbot personality to use for this automation.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>
                      Enable or disable this automation.
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
          </TabsContent>
          
          {/* Trigger Tab */}
          <TabsContent value="trigger" className="space-y-4">
            <FormField
              control={form.control}
              name="triggerType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trigger Type</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Reset any trigger-specific fields
                      if (value === 'ON_SCHEDULE') {
                        form.setValue('cronExpression', '0 0 * * *');
                      } else if (value === 'ON_EVENT') {
                        form.setValue('eventType', 'message_received');
                      }
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a trigger type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(TriggerTypeEnum.Values).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    When should this automation be triggered.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Conditional fields based on trigger type */}
            {form.watch('triggerType') === 'ON_SCHEDULE' && (
              <FormField
                control={form.control}
                name="cronExpression"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule (Cron Expression)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0 0 * * *"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      When to run this automation using CRON syntax.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {form.watch('triggerType') === 'ON_EVENT' && (
              <FormField
                control={form.control}
                name="eventType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="message_received"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The event that will trigger this automation.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </TabsContent>
          
          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-4">
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={addAction}
                variant="outline"
              >
                Add Action
              </Button>
            </div>
            
            {actions.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground">
                  No actions added yet. Click "Add Action" to create your first action.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {actions.map((action, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-[3fr,1fr] gap-4">
                        <div>
                          <FormItem>
                            <FormLabel>Action Name</FormLabel>
                            <FormControl>
                              <Input
                                value={action.name}
                                onChange={(e) =>
                                  updateAction(index, 'name', e.target.value)
                                }
                                placeholder="Enter action name"
                              />
                            </FormControl>
                          </FormItem>
                        </div>
                        
                        <div>
                          <FormItem>
                            <FormLabel>Action Type</FormLabel>
                            <Select
                              value={action.type}
                              onValueChange={(value) =>
                                updateAction(index, 'type', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(ActionTypeEnum.Values).map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type.replace('_', ' ')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        </div>
                      </div>
                      
                      {/* Action-specific fields */}
                      <div className="mt-4">
                        {action.type === 'SEND_MESSAGE' && (
                          <div className="space-y-4">
                            <FormItem>
                              <FormLabel>Recipient</FormLabel>
                              <FormControl>
                                <Input
                                  value={action.config?.recipient || ''}
                                  onChange={(e) =>
                                    updateAction(index, 'config', {
                                      ...action.config,
                                      recipient: e.target.value,
                                    })
                                  }
                                  placeholder="Enter recipient"
                                />
                              </FormControl>
                            </FormItem>
                            
                            <FormItem>
                              <FormLabel>Message</FormLabel>
                              <FormControl>
                                <Textarea
                                  value={action.config?.message || ''}
                                  onChange={(e) =>
                                    updateAction(index, 'config', {
                                      ...action.config,
                                      message: e.target.value,
                                    })
                                  }
                                  placeholder="Enter message template"
                                  rows={3}
                                />
                              </FormControl>
                            </FormItem>
                            
                            <FormItem>
                              <FormLabel>Channel</FormLabel>
                              <Select
                                value={action.config?.channel || 'email'}
                                onValueChange={(value) =>
                                  updateAction(index, 'config', {
                                    ...action.config,
                                    channel: value,
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="sms">SMS</SelectItem>
                                  <SelectItem value="push">Push</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          </div>
                        )}
                        
                        {action.type === 'GENERATE_CONTENT' && (
                          <div className="space-y-4">
                            <FormItem>
                              <FormLabel>Prompt Template</FormLabel>
                              <FormControl>
                                <Textarea
                                  value={action.config?.promptTemplate || ''}
                                  onChange={(e) =>
                                    updateAction(index, 'config', {
                                      ...action.config,
                                      promptTemplate: e.target.value,
                                    })
                                  }
                                  placeholder="Enter prompt template"
                                  rows={4}
                                />
                              </FormControl>
                            </FormItem>
                            
                            <FormItem>
                              <FormLabel>Model</FormLabel>
                              <Select
                                value={action.config?.model || 'gpt-4-turbo'}
                                onValueChange={(value) =>
                                  updateAction(index, 'config', {
                                    ...action.config,
                                    model: value,
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          </div>
                        )}
                        
                        {/* Add similar sections for other action types */}
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeAction(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              createMutation.isPending ||
              updateMutation.isPending ||
              actions.length === 0
            }
          >
            {automationId ? 'Update' : 'Create'} Automation
          </Button>
        </div>
      </form>
    </Form>
  );
} 