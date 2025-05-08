import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  boolean, 
  integer, 
  jsonb,
  uuid,
  primaryKey,
  varchar,
  date
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
  tasks: many(tasks),
  taskComments: many(taskComments),
  userActivities: many(userActivities),
}));

// Clients table
export const clients = pgTable('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  status: text('status').notNull().default('active'),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  integrations: many(integrations),
  campaigns: many(campaigns),
}));

// Integrations (platform connections) table
export const integrations = pgTable('integrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  platform: text('platform').notNull(),
  status: text('status').notNull().default('disconnected'),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  username: text('username'),
  credentials: jsonb('credentials'),
  lastSynced: timestamp('last_synced'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const integrationsRelations = relations(integrations, ({ one }) => ({
  client: one(clients, {
    fields: [integrations.clientId],
    references: [clients.id],
  }),
}));

// Scheduled posts table
export const scheduledPosts = pgTable('scheduled_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  platforms: text('platforms').array().notNull(),
  scheduledFor: timestamp('scheduled_for').notNull(),
  status: text('status').notNull().default('pending'),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  mediaUrls: text('media_urls').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const scheduledPostsRelations = relations(scheduledPosts, ({ one }) => ({
  client: one(clients, {
    fields: [scheduledPosts.clientId],
    references: [clients.id],
  }),
  user: one(users, {
    fields: [scheduledPosts.userId],
    references: [users.id],
  }),
}));

// Automations table
export const automations = pgTable('automations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  trigger: text('trigger').notNull(),
  action: text('action').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  config: jsonb('config'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const automationsRelations = relations(automations, ({ one }) => ({
  client: one(clients, {
    fields: [automations.clientId],
    references: [clients.id],
  }),
  user: one(users, {
    fields: [automations.userId],
    references: [users.id],
  }),
}));

// Campaigns table
export const campaigns = pgTable('campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  platform: text('platform').notNull(),
  budget: integer('budget'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  status: text('status').notNull().default('draft'),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  metrics: jsonb('metrics'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const campaignsRelations = relations(campaigns, ({ one }) => ({
  client: one(clients, {
    fields: [campaigns.clientId],
    references: [clients.id],
  }),
  user: one(users, {
    fields: [campaigns.userId],
    references: [users.id],
  }),
}));

// Tasks table
export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  status: text('status').notNull().default('pending'),
  dueDate: timestamp('due_date'),
  platform: text('platform'),
  assignedTo: uuid('assigned_to').references(() => users.id),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  description: text('description'),
  priority: text('priority').default('medium'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [tasks.clientId],
    references: [clients.id],
  }),
  comments: many(taskComments),
}));

// Task comments table
export const taskComments = pgTable('task_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const taskCommentsRelations = relations(taskComments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskComments.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskComments.userId],
    references: [users.id],
  }),
}));

// User activities table
export const userActivities = pgTable('user_activities', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: text('type').notNull(),
  platform: text('platform'),
  details: text('details'),
  status: text('status').notNull().default('pending'),
  userId: uuid('user_id').notNull().references(() => users.id),
  clientId: uuid('client_id').references(() => clients.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userActivitiesRelations = relations(userActivities, ({ one }) => ({
  user: one(users, {
    fields: [userActivities.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [userActivities.clientId],
    references: [clients.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertClientSchema = createInsertSchema(clients);
export const selectClientSchema = createSelectSchema(clients);

export const insertIntegrationSchema = createInsertSchema(integrations);
export const selectIntegrationSchema = createSelectSchema(integrations);

export const insertScheduledPostSchema = createInsertSchema(scheduledPosts);
export const selectScheduledPostSchema = createSelectSchema(scheduledPosts);

export const insertAutomationSchema = createInsertSchema(automations);
export const selectAutomationSchema = createSelectSchema(automations);

export const insertCampaignSchema = createInsertSchema(campaigns);
export const selectCampaignSchema = createSelectSchema(campaigns);

export const insertTaskSchema = createInsertSchema(tasks);
export const selectTaskSchema = createSelectSchema(tasks);

export const insertTaskCommentSchema = createInsertSchema(taskComments);
export const selectTaskCommentSchema = createSelectSchema(taskComments);

export const insertUserActivitySchema = createInsertSchema(userActivities);
export const selectUserActivitySchema = createSelectSchema(userActivities); 