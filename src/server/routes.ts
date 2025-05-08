import express from 'express';
import { z } from 'zod';
import { db } from '@/lib/db';
import { 
  users, 
  clients, 
  integrations, 
  scheduledPosts, 
  automations, 
  campaigns, 
  tasks, 
  taskComments, 
  userActivities,
  insertClientSchema,
  insertIntegrationSchema,
  insertScheduledPostSchema,
  insertAutomationSchema,
  insertCampaignSchema,
  insertTaskSchema,
  insertTaskCommentSchema
} from '@/shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { validateRequest } from '@/lib/middleware/validate';
import { requireAuth } from '@/lib/middleware/auth';
import { generateDashboardStats } from '@/lib/stats';

const router = express.Router();

// Middleware to apply to all routes
router.use(express.json());
router.use(requireAuth);

// Dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await generateDashboardStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// CLIENTS ROUTES
router.get('/clients', async (req, res) => {
  try {
    const userId = req.user.id;
    const allClients = await db.query.clients.findMany({
      where: eq(clients.userId, userId),
      orderBy: [desc(clients.updatedAt)],
      with: {
        integrations: true
      }
    });
    res.json(allClients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

router.get('/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const client = await db.query.clients.findFirst({
      where: and(
        eq(clients.id, id),
        eq(clients.userId, userId)
      ),
      with: {
        integrations: true,
        campaigns: true
      }
    });
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client details' });
  }
});

router.post('/clients', validateRequest(insertClientSchema), async (req, res) => {
  try {
    const userId = req.user.id;
    const clientData = { ...req.body, userId };
    
    const [newClient] = await db.insert(clients).values(clientData).returning();
    res.status(201).json(newClient);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

router.put('/clients/:id', validateRequest(insertClientSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if client exists and belongs to user
    const existingClient = await db.query.clients.findFirst({
      where: and(
        eq(clients.id, id),
        eq(clients.userId, userId)
      ),
    });
    
    if (!existingClient) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    const [updatedClient] = await db
      .update(clients)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    
    res.json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

router.delete('/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if client exists and belongs to user
    const existingClient = await db.query.clients.findFirst({
      where: and(
        eq(clients.id, id),
        eq(clients.userId, userId)
      ),
    });
    
    if (!existingClient) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    await db.delete(clients).where(eq(clients.id, id));
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// INTEGRATIONS ROUTES
router.get('/integrations', async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.query.clientId as string;
    
    let query = db.select().from(integrations);
    
    if (clientId) {
      // If clientId provided, verify it belongs to user
      const clientExists = await db.query.clients.findFirst({
        where: and(
          eq(clients.id, clientId),
          eq(clients.userId, userId)
        ),
      });
      
      if (!clientExists) {
        return res.status(404).json({ error: 'Client not found' });
      }
      
      query = query.where(eq(integrations.clientId, clientId));
    } else {
      // Otherwise get all integrations for all user's clients
      const userClients = await db.select({ id: clients.id }).from(clients).where(eq(clients.userId, userId));
      const clientIds = userClients.map(c => c.id);
      // Only proceed if user has clients
      if (clientIds.length === 0) {
        return res.json([]);
      }
    }
    
    const allIntegrations = await query;
    res.json(allIntegrations);
  } catch (error) {
    console.error('Error fetching integrations:', error);
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
});

router.post('/integrations', validateRequest(insertIntegrationSchema), async (req, res) => {
  try {
    const userId = req.user.id;
    const { clientId } = req.body;
    
    // Check if client exists and belongs to user
    const clientExists = await db.query.clients.findFirst({
      where: and(
        eq(clients.id, clientId),
        eq(clients.userId, userId)
      ),
    });
    
    if (!clientExists) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    const [newIntegration] = await db.insert(integrations).values(req.body).returning();
    res.status(201).json(newIntegration);
  } catch (error) {
    console.error('Error creating integration:', error);
    res.status(500).json({ error: 'Failed to create integration' });
  }
});

// SCHEDULED POSTS ROUTES
router.get('/scheduled-posts', async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.query.clientId as string;
    
    const query = clientId
      ? db.select().from(scheduledPosts).where(
          and(
            eq(scheduledPosts.clientId, clientId),
            eq(scheduledPosts.userId, userId)
          )
        )
      : db.select().from(scheduledPosts).where(eq(scheduledPosts.userId, userId));
    
    const posts = await query;
    res.json(posts);
  } catch (error) {
    console.error('Error fetching scheduled posts:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled posts' });
  }
});

router.post('/scheduled-posts', validateRequest(insertScheduledPostSchema), async (req, res) => {
  try {
    const userId = req.user.id;
    const postData = { ...req.body, userId };
    
    const [newPost] = await db.insert(scheduledPosts).values(postData).returning();
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating scheduled post:', error);
    res.status(500).json({ error: 'Failed to create scheduled post' });
  }
});

// AUTOMATIONS ROUTES
router.get('/automations', async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.query.clientId as string;
    
    const query = clientId
      ? db.select().from(automations).where(
          and(
            eq(automations.clientId, clientId),
            eq(automations.userId, userId)
          )
        )
      : db.select().from(automations).where(eq(automations.userId, userId));
    
    const allAutomations = await query;
    res.json(allAutomations);
  } catch (error) {
    console.error('Error fetching automations:', error);
    res.status(500).json({ error: 'Failed to fetch automations' });
  }
});

router.post('/automations', validateRequest(insertAutomationSchema), async (req, res) => {
  try {
    const userId = req.user.id;
    const automationData = { ...req.body, userId };
    
    const [newAutomation] = await db.insert(automations).values(automationData).returning();
    res.status(201).json(newAutomation);
  } catch (error) {
    console.error('Error creating automation:', error);
    res.status(500).json({ error: 'Failed to create automation' });
  }
});

// CAMPAIGNS ROUTES
router.get('/campaigns', async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.query.clientId as string;
    
    const query = clientId
      ? db.select().from(campaigns).where(
          and(
            eq(campaigns.clientId, clientId),
            eq(campaigns.userId, userId)
          )
        )
      : db.select().from(campaigns).where(eq(campaigns.userId, userId));
    
    const allCampaigns = await query;
    res.json(allCampaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

router.post('/campaigns', validateRequest(insertCampaignSchema), async (req, res) => {
  try {
    const userId = req.user.id;
    const campaignData = { ...req.body, userId };
    
    const [newCampaign] = await db.insert(campaigns).values(campaignData).returning();
    res.status(201).json(newCampaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// TASKS ROUTES
router.get('/tasks', async (req, res) => {
  try {
    const userId = req.user.id;
    const status = req.query.status as string;
    
    let query = db.select().from(tasks).where(
      eq(tasks.createdBy, userId)
    );
    
    if (status) {
      query = query.where(eq(tasks.status, status));
    }
    
    const allTasks = await query;
    res.json(allTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.post('/tasks', validateRequest(insertTaskSchema), async (req, res) => {
  try {
    const userId = req.user.id;
    const taskData = { ...req.body, createdBy: userId };
    
    const [newTask] = await db.insert(tasks).values(taskData).returning();
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// TASK COMMENTS ROUTES
router.get('/tasks/:taskId/comments', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const comments = await db.query.taskComments.findMany({
      where: eq(taskComments.taskId, taskId),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: [taskComments.createdAt]
    });
    
    res.json(comments);
  } catch (error) {
    console.error('Error fetching task comments:', error);
    res.status(500).json({ error: 'Failed to fetch task comments' });
  }
});

router.post('/tasks/:taskId/comments', validateRequest(insertTaskCommentSchema), async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    
    // Verify task exists
    const taskExists = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId)
    });
    
    if (!taskExists) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const commentData = {
      taskId,
      userId,
      content: req.body.content
    };
    
    const [newComment] = await db.insert(taskComments).values(commentData).returning();
    
    // Create the activity for this comment
    await db.insert(userActivities).values({
      type: 'task_comment',
      userId,
      clientId: taskExists.clientId,
      details: `Comment added to task: ${taskExists.title}`,
      status: 'completed'
    });
    
    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error creating task comment:', error);
    res.status(500).json({ error: 'Failed to create task comment' });
  }
});

// USER ACTIVITIES ROUTES
router.get('/activities', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const activities = await db.query.userActivities.findMany({
      where: eq(userActivities.userId, userId),
      orderBy: [desc(userActivities.createdAt)],
      limit: 50
    });
    
    res.json(activities);
  } catch (error) {
    console.error('Error fetching user activities:', error);
    res.status(500).json({ error: 'Failed to fetch user activities' });
  }
});

export default router; 