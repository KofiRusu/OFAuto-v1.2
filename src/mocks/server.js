import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { mockClients } from './data/clients';
import { mockIntegrations } from './data/integrations';
import { mockScheduledPosts } from './data/scheduled-posts';
import { mockCampaigns } from './data/campaigns';
import { mockAutomations, mockTasks } from './data/automations';

export const handlers = [
  // Client API endpoints
  rest.get('/api/clients', (req, res, ctx) => {
    const searchTerm = req.url.searchParams.get('search') || '';
    const sortBy = req.url.searchParams.get('sortBy') || 'name';
    const sortOrder = req.url.searchParams.get('sortOrder') || 'asc';
    
    let clients = [...mockClients];
    
    // Apply search filter
    if (searchTerm) {
      clients = clients.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort clients
    clients.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return res(ctx.status(200), ctx.json(clients));
  }),
  
  rest.post('/api/clients', (req, res, ctx) => {
    const newClient = {
      id: `client-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...req.body
    };
    
    mockClients.push(newClient);
    return res(ctx.status(201), ctx.json(newClient));
  }),
  
  rest.get('/api/clients/:id', (req, res, ctx) => {
    const { id } = req.params;
    const client = mockClients.find(c => c.id === id);
    
    if (client) {
      return res(ctx.status(200), ctx.json(client));
    }
    
    return res(ctx.status(404), ctx.json({ error: 'Client not found' }));
  }),
  
  rest.put('/api/clients/:id', (req, res, ctx) => {
    const { id } = req.params;
    const clientIndex = mockClients.findIndex(c => c.id === id);
    
    if (clientIndex !== -1) {
      const updatedClient = {
        ...mockClients[clientIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      
      mockClients[clientIndex] = updatedClient;
      return res(ctx.status(200), ctx.json(updatedClient));
    }
    
    return res(ctx.status(404), ctx.json({ error: 'Client not found' }));
  }),
  
  rest.delete('/api/clients/:id', (req, res, ctx) => {
    const { id } = req.params;
    const clientIndex = mockClients.findIndex(c => c.id === id);
    
    if (clientIndex !== -1) {
      mockClients.splice(clientIndex, 1);
      return res(ctx.status(200), ctx.json({ message: 'Client deleted successfully' }));
    }
    
    return res(ctx.status(404), ctx.json({ error: 'Client not found' }));
  }),
  
  // Integration API endpoints
  rest.get('/api/integrations', (req, res, ctx) => {
    const clientId = req.url.searchParams.get('clientId');
    let integrations = [...mockIntegrations];
    
    if (clientId) {
      integrations = integrations.filter(i => i.clientId === clientId);
    }
    
    return res(ctx.status(200), ctx.json(integrations));
  }),
  
  rest.post('/api/integrations', (req, res, ctx) => {
    const newIntegration = {
      id: `integration-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...req.body
    };
    
    mockIntegrations.push(newIntegration);
    return res(ctx.status(201), ctx.json(newIntegration));
  }),
  
  rest.put('/api/integrations/:id', (req, res, ctx) => {
    const { id } = req.params;
    const integrationIndex = mockIntegrations.findIndex(i => i.id === id);
    
    if (integrationIndex !== -1) {
      const updatedIntegration = {
        ...mockIntegrations[integrationIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      
      mockIntegrations[integrationIndex] = updatedIntegration;
      return res(ctx.status(200), ctx.json(updatedIntegration));
    }
    
    return res(ctx.status(404), ctx.json({ error: 'Integration not found' }));
  }),
  
  rest.delete('/api/integrations/:id', (req, res, ctx) => {
    const { id } = req.params;
    const integrationIndex = mockIntegrations.findIndex(i => i.id === id);
    
    if (integrationIndex !== -1) {
      mockIntegrations.splice(integrationIndex, 1);
      return res(ctx.status(200), ctx.json({ message: 'Integration deleted successfully' }));
    }
    
    return res(ctx.status(404), ctx.json({ error: 'Integration not found' }));
  }),
  
  // Scheduled posts API endpoints
  rest.get('/api/scheduled-posts', (req, res, ctx) => {
    const clientId = req.url.searchParams.get('clientId');
    const platform = req.url.searchParams.get('platform');
    const status = req.url.searchParams.get('status');
    const fromDate = req.url.searchParams.get('fromDate');
    const toDate = req.url.searchParams.get('toDate');
    
    let posts = [...mockScheduledPosts];
    
    // Apply filters
    if (clientId) {
      posts = posts.filter(post => post.clientId === clientId);
    }
    
    if (platform) {
      posts = posts.filter(post => post.platform === platform);
    }
    
    if (status) {
      posts = posts.filter(post => post.status === status);
    }
    
    if (fromDate) {
      const fromDateObj = new Date(fromDate);
      posts = posts.filter(post => new Date(post.scheduledFor) >= fromDateObj);
    }
    
    if (toDate) {
      const toDateObj = new Date(toDate);
      posts = posts.filter(post => new Date(post.scheduledFor) <= toDateObj);
    }
    
    return res(ctx.status(200), ctx.json(posts));
  }),
  
  rest.post('/api/scheduled-posts', (req, res, ctx) => {
    const newPost = {
      id: `post-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...req.body
    };
    
    mockScheduledPosts.push(newPost);
    return res(ctx.status(201), ctx.json(newPost));
  }),
  
  rest.get('/api/scheduled-posts/:id', (req, res, ctx) => {
    const { id } = req.params;
    const post = mockScheduledPosts.find(p => p.id === id);
    
    if (post) {
      return res(ctx.status(200), ctx.json(post));
    }
    
    return res(ctx.status(404), ctx.json({ error: 'Scheduled post not found' }));
  }),
  
  rest.put('/api/scheduled-posts/:id', (req, res, ctx) => {
    const { id } = req.params;
    const postIndex = mockScheduledPosts.findIndex(p => p.id === id);
    
    if (postIndex !== -1) {
      const updatedPost = {
        ...mockScheduledPosts[postIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      
      mockScheduledPosts[postIndex] = updatedPost;
      return res(ctx.status(200), ctx.json(updatedPost));
    }
    
    return res(ctx.status(404), ctx.json({ error: 'Scheduled post not found' }));
  }),
  
  rest.delete('/api/scheduled-posts/:id', (req, res, ctx) => {
    const { id } = req.params;
    const postIndex = mockScheduledPosts.findIndex(p => p.id === id);
    
    if (postIndex !== -1) {
      mockScheduledPosts.splice(postIndex, 1);
      return res(ctx.status(200), ctx.json({ message: 'Scheduled post deleted successfully' }));
    }
    
    return res(ctx.status(404), ctx.json({ error: 'Scheduled post not found' }));
  }),
  
  // Campaign API endpoints
  rest.get('/api/campaigns', (req, res, ctx) => {
    const clientId = req.url.searchParams.get('clientId');
    const platform = req.url.searchParams.get('platform');
    const status = req.url.searchParams.get('status');
    
    let campaigns = [...mockCampaigns];
    
    if (clientId) {
      campaigns = campaigns.filter(c => c.clientId === clientId);
    }
    
    if (platform) {
      campaigns = campaigns.filter(c => c.platforms.includes(platform));
    }
    
    if (status) {
      campaigns = campaigns.filter(c => c.status === status);
    }
    
    return res(ctx.status(200), ctx.json(campaigns));
  }),
  
  rest.post('/api/campaigns', (req, res, ctx) => {
    const newCampaign = {
      id: `campaign-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...req.body
    };
    
    mockCampaigns.push(newCampaign);
    return res(ctx.status(201), ctx.json(newCampaign));
  }),
  
  rest.get('/api/campaigns/:id', (req, res, ctx) => {
    const { id } = req.params;
    const campaign = mockCampaigns.find(c => c.id === id);
    
    if (campaign) {
      return res(ctx.status(200), ctx.json(campaign));
    }
    
    return res(ctx.status(404), ctx.json({ error: 'Campaign not found' }));
  }),
  
  rest.put('/api/campaigns/:id', (req, res, ctx) => {
    const { id } = req.params;
    const campaignIndex = mockCampaigns.findIndex(c => c.id === id);
    
    if (campaignIndex !== -1) {
      const updatedCampaign = {
        ...mockCampaigns[campaignIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      
      mockCampaigns[campaignIndex] = updatedCampaign;
      return res(ctx.status(200), ctx.json(updatedCampaign));
    }
    
    return res(ctx.status(404), ctx.json({ error: 'Campaign not found' }));
  }),
  
  rest.delete('/api/campaigns/:id', (req, res, ctx) => {
    const { id } = req.params;
    const campaignIndex = mockCampaigns.findIndex(c => c.id === id);
    
    if (campaignIndex !== -1) {
      mockCampaigns.splice(campaignIndex, 1);
      return res(ctx.status(200), ctx.json({ message: 'Campaign deleted successfully' }));
    }
    
    return res(ctx.status(404), ctx.json({ error: 'Campaign not found' }));
  }),
  
  // Automation API endpoints
  rest.get('/api/automations', (req, res, ctx) => {
    const clientId = req.url.searchParams.get('clientId');
    const triggerType = req.url.searchParams.get('triggerType');
    const isActive = req.url.searchParams.get('isActive');
    
    let automations = [...mockAutomations];
    
    if (clientId) {
      automations = automations.filter(a => a.clientId === clientId);
    }
    
    if (triggerType) {
      automations = automations.filter(a => a.triggerType === triggerType);
    }
    
    if (isActive !== null) {
      const active = isActive === 'true';
      automations = automations.filter(a => a.isActive === active);
    }
    
    return res(ctx.status(200), ctx.json(automations));
  }),
  
  rest.post('/api/automations', (req, res, ctx) => {
    const newAutomation = {
      id: `automation-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...req.body
    };
    
    mockAutomations.push(newAutomation);
    return res(ctx.status(201), ctx.json(newAutomation));
  }),
  
  rest.get('/api/automations/:id', (req, res, ctx) => {
    const { id } = req.params;
    const automation = mockAutomations.find(a => a.id === id);
    
    if (automation) {
      return res(ctx.status(200), ctx.json(automation));
    }
    
    return res(ctx.status(404), ctx.json({ error: 'Automation not found' }));
  }),
  
  rest.put('/api/automations/:id', (req, res, ctx) => {
    const { id } = req.params;
    const automationIndex = mockAutomations.findIndex(a => a.id === id);
    
    if (automationIndex !== -1) {
      const updatedAutomation = {
        ...mockAutomations[automationIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      
      mockAutomations[automationIndex] = updatedAutomation;
      return res(ctx.status(200), ctx.json(updatedAutomation));
    }
    
    return res(ctx.status(404), ctx.json({ error: 'Automation not found' }));
  }),
  
  rest.delete('/api/automations/:id', (req, res, ctx) => {
    const { id } = req.params;
    const automationIndex = mockAutomations.findIndex(a => a.id === id);
    
    if (automationIndex !== -1) {
      mockAutomations.splice(automationIndex, 1);
      return res(ctx.status(200), ctx.json({ message: 'Automation deleted successfully' }));
    }
    
    return res(ctx.status(404), ctx.json({ error: 'Automation not found' }));
  }),
  
  rest.post('/api/automations/:id/execute', (req, res, ctx) => {
    const { id } = req.params;
    const automation = mockAutomations.find(a => a.id === id);
    
    if (!automation) {
      return res(ctx.status(404), ctx.json({ error: 'Automation not found' }));
    }
    
    if (!automation.isActive) {
      return res(ctx.status(400), ctx.json({ error: 'Cannot execute inactive automation' }));
    }
    
    // Create mock tasks for this automation execution
    const taskIds = automation.actions.map((action, index) => {
      const taskId = `task-${Date.now()}-${index}`;
      const newTask = {
        id: taskId,
        automationId: id,
        title: `Execute ${action.type} on ${action.platform}`,
        description: automation.description,
        actionType: action.type,
        platform: action.platform,
        status: 'queued',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockTasks.push(newTask);
      return taskId;
    });
    
    // Update last triggered time
    const automationIndex = mockAutomations.findIndex(a => a.id === id);
    mockAutomations[automationIndex] = {
      ...automation,
      lastTriggeredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return res(ctx.status(200), ctx.json({
      message: 'Automation execution initiated',
      taskIds,
      executedAt: new Date().toISOString()
    }));
  }),
  
  rest.get('/api/automations/tasks', (req, res, ctx) => {
    const automationId = req.url.searchParams.get('automationId');
    const status = req.url.searchParams.get('status');
    const platform = req.url.searchParams.get('platform');
    
    let tasks = [...mockTasks];
    
    if (automationId) {
      tasks = tasks.filter(t => t.automationId === automationId);
    }
    
    if (status) {
      tasks = tasks.filter(t => t.status === status);
    }
    
    if (platform) {
      tasks = tasks.filter(t => t.platform === platform);
    }
    
    return res(ctx.status(200), ctx.json({
      tasks,
      pagination: {
        total: tasks.length,
        limit: 50,
        offset: 0,
        hasMore: false
      }
    }));
  }),
];

export const server = setupServer(...handlers); 