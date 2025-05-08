import { z } from 'zod';

/**
 * ChatbotAutomation Trigger Types
 */
export const TriggerTypeEnum = z.enum([
  'ON_SCHEDULE', // Run on a regular schedule
  'ON_EVENT',    // Run in response to an event
  'ON_DEMAND',   // Run manually when requested
  'ON_CONDITION' // Run when a specific condition is met
]);

export type TriggerType = z.infer<typeof TriggerTypeEnum>;

/**
 * Schema for schedule-based triggers
 */
export const ScheduleTriggerSchema = z.object({
  type: z.literal('ON_SCHEDULE'),
  cronExpression: z.string().min(1),
  timezone: z.string().optional(),
});

/**
 * Schema for event-based triggers
 */
export const EventTriggerSchema = z.object({
  type: z.literal('ON_EVENT'),
  eventType: z.string().min(1),
  eventFilter: z.record(z.string(), z.any()).optional(),
});

/**
 * Schema for condition-based triggers
 */
export const ConditionTriggerSchema = z.object({
  type: z.literal('ON_CONDITION'),
  condition: z.record(z.string(), z.any()),
  evaluationFrequency: z.string().optional(), // e.g., "hourly", "daily"
});

/**
 * Union of all trigger data schemas
 */
export const TriggerDataSchema = z.discriminatedUnion('type', [
  ScheduleTriggerSchema,
  EventTriggerSchema,
  ConditionTriggerSchema,
  z.object({ type: z.literal('ON_DEMAND') })
]);

export type TriggerData = z.infer<typeof TriggerDataSchema>;

/**
 * Action types that can be performed by the automation
 */
export const ActionTypeEnum = z.enum([
  'SEND_MESSAGE',
  'GENERATE_CONTENT',
  'API_CALL',
  'UPDATE_DATA',
  'NOTIFICATION'
]);

export type ActionType = z.infer<typeof ActionTypeEnum>;

/**
 * Schema for an individual action in the automation sequence
 */
export const ActionSchema = z.object({
  type: ActionTypeEnum,
  name: z.string().min(1),
  config: z.record(z.string(), z.any()),
  order: z.number().int().min(0),
  dependsOn: z.array(z.string()).optional(), // IDs of actions this depends on
});

export type Action = z.infer<typeof ActionSchema>;

/**
 * Schema for a sequence of actions
 */
export const ActionsSchema = z.array(ActionSchema);

/**
 * Schema for creating a new ChatbotAutomation
 */
export const ChatbotAutomationCreateSchema = z.object({
  name: z.string().min(3).max(100),
  personaId: z.string().uuid(),
  triggerType: TriggerTypeEnum,
  triggerData: TriggerDataSchema,
  actions: ActionsSchema.min(1),
  isActive: z.boolean().default(true),
});

export type ChatbotAutomationCreate = z.infer<typeof ChatbotAutomationCreateSchema>;

/**
 * Schema for updating an existing ChatbotAutomation
 */
export const ChatbotAutomationUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3).max(100).optional(),
  personaId: z.string().uuid().optional(),
  triggerType: TriggerTypeEnum.optional(),
  triggerData: TriggerDataSchema.optional(),
  actions: ActionsSchema.min(1).optional(),
  isActive: z.boolean().optional(),
});

export type ChatbotAutomationUpdate = z.infer<typeof ChatbotAutomationUpdateSchema>;

/**
 * Schema for ChatbotAutomation response
 */
export const ChatbotAutomationResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  personaId: z.string(),
  triggerType: z.string(),
  triggerData: z.record(z.string(), z.any()),
  actions: z.array(z.record(z.string(), z.any())),
  isActive: z.boolean(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ChatbotAutomationResponse = z.infer<typeof ChatbotAutomationResponseSchema>;

/**
 * Schema for ChatbotAutomation list item (simplified response)
 */
export const ChatbotAutomationListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  personaId: z.string(),
  triggerType: z.string(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ChatbotAutomationListItem = z.infer<typeof ChatbotAutomationListItemSchema>;

/**
 * Schema for querying ChatbotAutomations
 */
export const ChatbotAutomationQuerySchema = z.object({
  personaId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});

export type ChatbotAutomationQuery = z.infer<typeof ChatbotAutomationQuerySchema>;

/**
 * Schema for triggering an automation manually
 */
export const ChatbotAutomationTriggerSchema = z.object({
  id: z.string().uuid(),
  inputs: z.record(z.string(), z.any()).optional(), // Additional inputs for the automation
});

export type ChatbotAutomationTrigger = z.infer<typeof ChatbotAutomationTriggerSchema>;

/**
 * Schema for creating a ChatbotAutomation from a natural language prompt
 */
export const ChatbotAutomationFromPromptSchema = z.object({
  prompt: z.string().min(10, "Please provide a detailed prompt with at least 10 characters"),
  personaId: z.string().uuid().optional(), // Optional persona ID to associate with
});

export type ChatbotAutomationFromPrompt = z.infer<typeof ChatbotAutomationFromPromptSchema>;

/**
 * Schema for listing automation ideas from a natural language prompt
 */
export const ChatbotAutomationListFromPromptSchema = z.object({
  prompt: z.string().min(10, "Please provide a detailed prompt with at least 10 characters"),
  count: z.number().int().min(1).max(10).default(3), // Number of suggestions to generate
});

export type ChatbotAutomationListFromPrompt = z.infer<typeof ChatbotAutomationListFromPromptSchema>;

/**
 * Schema for executing an automation with context
 */
export const ChatbotAutomationExecuteSchema = z.object({
  automationId: z.string().uuid(),
  context: z.record(z.string(), z.any()).optional(),
});

export type ChatbotAutomationExecute = z.infer<typeof ChatbotAutomationExecuteSchema>;

/**
 * Schema for automation suggestion
 */
export const AutomationSuggestionSchema = z.object({
  name: z.string(),
  description: z.string(),
  triggerType: TriggerTypeEnum,
});

export type AutomationSuggestion = z.infer<typeof AutomationSuggestionSchema>;

/**
 * Schema for results of executing an automation
 */
export const AutomationExecutionResultSchema = z.object({
  success: z.boolean(),
  results: z.array(z.record(z.string(), z.any())),
});

export type AutomationExecutionResult = z.infer<typeof AutomationExecutionResultSchema>; 