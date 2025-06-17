import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { mockClients } from './data/clients';
import { mockIntegrations } from './data/integrations';
import { mockScheduledPosts } from './data/scheduled-posts';
import { mockCampaigns } from './data/campaigns';
import { mockAutomations, mockTasks } from './data/automations';

export const handlers = [
  // Client API endpoints
  http.get('/api/clients', ({ request }) => {
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('search') || '';
    const sortBy = url.searchParams.get('sortBy') || 'name';
    const sortOrder = url.searchParams.get('sortOrder') || 'asc';
    
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
    
    return HttpResponse.json(clients);
  }),
  
  http.post('/api/clients', async ({ request }) => {
    const body = await request.json();
    const newClient = {
      id: `client-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...body
    };
    
    mockClients.push(newClient);
    return HttpResponse.json(newClient);
  }),
  
  http.get('/api/clients/:id', ({ params }) => {
    const { id } = params;
    const client = mockClients.find(c => c.id === id);
    
    if (client) {
      return HttpResponse.json(client);
    }
    
    return HttpResponse.json({ error: 'Client not found' }, { status: 404 });
  }),
  
  http.put('/api/clients/:id', async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();
    const clientIndex = mockClients.findIndex(c => c.id === id);
    
    if (clientIndex !== -1) {
      const updatedClient = {
        ...mockClients[clientIndex],
        ...body,
        updatedAt: new Date().toISOString()
      };
      
      mockClients[clientIndex] = updatedClient;
      return HttpResponse.json(updatedClient);
    }
    
    return HttpResponse.json({ error: 'Client not found' }, { status: 404 });
  }),
  
  http.delete('/api/clients/:id', ({ params }) => {
    const { id } = params;
    const clientIndex = mockClients.findIndex(c => c.id === id);
    
    if (clientIndex !== -1) {
      mockClients.splice(clientIndex, 1);
      return HttpResponse.json({ message: 'Client deleted successfully' });
    }
    
    return HttpResponse.json({ error: 'Client not found' }, { status: 404 });
  }),
  
  // Integration API endpoints
  http.get('/api/integrations', ({ request }) => {
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');
    let integrations = [...mockIntegrations];
    
    if (clientId) {
      integrations = integrations.filter(i => i.clientId === clientId);
    }
    
    return HttpResponse.json(integrations);
  }),
  
  http.post('/api/integrations', async ({ request }) => {
    const body = await request.json();
    const newIntegration = {
      id: `integration-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...body
    };
    
    mockIntegrations.push(newIntegration);
    return HttpResponse.json(newIntegration);
  }),
  
  http.put('/api/integrations/:id', async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();
    const integrationIndex = mockIntegrations.findIndex(i => i.id === id);
    
    if (integrationIndex !== -1) {
      const updatedIntegration = {
        ...mockIntegrations[integrationIndex],
        ...body,
        updatedAt: new Date().toISOString()
      };
      
      mockIntegrations[integrationIndex] = updatedIntegration;
      return HttpResponse.json(updatedIntegration);
    }
    
    return HttpResponse.json({ error: 'Integration not found' }, { status: 404 });
  }),
  
  http.delete('/api/integrations/:id', ({ params }) => {
    const { id } = params;
    const integrationIndex = mockIntegrations.findIndex(i => i.id === id);
    
    if (integrationIndex !== -1) {
      mockIntegrations.splice(integrationIndex, 1);
      return HttpResponse.json({ message: 'Integration deleted successfully' });
    }
    
    return HttpResponse.json({ error: 'Integration not found' }, { status: 404 });
  }),
  
  // Scheduled posts API endpoints
  http.get('/api/scheduled-posts', ({ request }) => {
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');
    const platform = url.searchParams.get('platform');
    const status = url.searchParams.get('status');
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');
    
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
    
    return HttpResponse.json(posts);
  }),
  
  http.post('/api/scheduled-posts', async ({ request }) => {
    const body = await request.json();
    const newPost = {
      id: `post-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...body
    };
    
    mockScheduledPosts.push(newPost);
    return HttpResponse.json(newPost);
  }),
  
  http.get('/api/scheduled-posts/:id', ({ params }) => {
    const { id } = params;
    const post = mockScheduledPosts.find(p => p.id === id);
    
    if (post) {
      return HttpResponse.json(post);
    }
    
    return HttpResponse.json({ error: 'Scheduled post not found' }, { status: 404 });
  }),
  
  http.put('/api/scheduled-posts/:id', async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();
    const postIndex = mockScheduledPosts.findIndex(p => p.id === id);
    
    if (postIndex !== -1) {
      const updatedPost = {
        ...mockScheduledPosts[postIndex],
        ...body,
        updatedAt: new Date().toISOString()
      };
      
      mockScheduledPosts[postIndex] = updatedPost;
      return HttpResponse.json(updatedPost);
    }
    
    return HttpResponse.json({ error: 'Scheduled post not found' }, { status: 404 });
  }),
  
  http.delete('/api/scheduled-posts/:id', ({ params }) => {
    const { id } = params;
    const postIndex = mockScheduledPosts.findIndex(p => p.id === id);
    
    if (postIndex !== -1) {
      mockScheduledPosts.splice(postIndex, 1);
      return HttpResponse.json({ message: 'Scheduled post deleted successfully' });
    }
    
    return HttpResponse.json({ error: 'Scheduled post not found' }, { status: 404 });
  }),
  
  // Campaign API endpoints
  http.get('/api/campaigns', ({ request }) => {
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');
    const platform = url.searchParams.get('platform');
    const status = url.searchParams.get('status');
    
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
    
    return HttpResponse.json(campaigns);
  }),
  
  http.post('/api/campaigns', async ({ request }) => {
    const body = await request.json();
    const newCampaign = {
      id: `campaign-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...body
    };
    
    mockCampaigns.push(newCampaign);
    return HttpResponse.json(newCampaign);
  }),
  
  http.get('/api/campaigns/:id', ({ params }) => {
    const { id } = params;
    const campaign = mockCampaigns.find(c => c.id === id);
    
    if (campaign) {
      return HttpResponse.json(campaign);
    }
    
    return HttpResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }),
  
  http.put('/api/campaigns/:id', async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();
    const campaignIndex = mockCampaigns.findIndex(c => c.id === id);
    
    if (campaignIndex !== -1) {
      const updatedCampaign = {
        ...mockCampaigns[campaignIndex],
        ...body,
        updatedAt: new Date().toISOString()
      };
      
      mockCampaigns[campaignIndex] = updatedCampaign;
      return HttpResponse.json(updatedCampaign);
    }
    
    return HttpResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }),
  
  http.delete('/api/campaigns/:id', ({ params }) => {
    const { id } = params;
    const campaignIndex = mockCampaigns.findIndex(c => c.id === id);
    
    if (campaignIndex !== -1) {
      mockCampaigns.splice(campaignIndex, 1);
      return HttpResponse.json({ message: 'Campaign deleted successfully' });
    }
    
    return HttpResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }),
  
  // Automation API endpoints
  http.get('/api/automations', ({ request }) => {
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');
    const triggerType = url.searchParams.get('triggerType');
    const isActive = url.searchParams.get('isActive');
    
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
    
    return HttpResponse.json(automations);
  }),
  
  http.post('/api/automations', async ({ request }) => {
    const body = await request.json();
    const newAutomation = {
      id: `automation-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...body
    };
    
    mockAutomations.push(newAutomation);
    return HttpResponse.json(newAutomation);
  }),
  
  http.get('/api/automations/:id', ({ params }) => {
    const { id } = params;
    const automation = mockAutomations.find(a => a.id === id);
    
    if (automation) {
      return HttpResponse.json(automation);
    }
    
    return HttpResponse.json({ error: 'Automation not found' }, { status: 404 });
  }),
  
  http.put('/api/automations/:id', async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();
    const automationIndex = mockAutomations.findIndex(a => a.id === id);
    
    if (automationIndex !== -1) {
      const updatedAutomation = {
        ...mockAutomations[automationIndex],
        ...body,
        updatedAt: new Date().toISOString()
      };
      
      mockAutomations[automationIndex] = updatedAutomation;
      return HttpResponse.json(updatedAutomation);
    }
    
    return HttpResponse.json({ error: 'Automation not found' }, { status: 404 });
  }),
  
  http.delete('/api/automations/:id', ({ params }) => {
    const { id } = params;
    const automationIndex = mockAutomations.findIndex(a => a.id === id);
    
    if (automationIndex !== -1) {
      mockAutomations.splice(automationIndex, 1);
      return HttpResponse.json({ message: 'Automation deleted successfully' });
    }
    
    return HttpResponse.json({ error: 'Automation not found' }, { status: 404 });
  }),
  
  http.post('/api/automations/:id/execute', ({ params }) => {
    const { id } = params;
    const automation = mockAutomations.find(a => a.id === id);
    
    if (!automation) {
      return HttpResponse.json({ error: 'Automation not found' }, { status: 404 });
    }
    
    if (!automation.isActive) {
      return HttpResponse.json({ error: 'Cannot execute inactive automation' }, { status: 400 });
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
    
    return HttpResponse.json({
      message: 'Automation execution initiated',
      taskIds,
      executedAt: new Date().toISOString()
    });
  }),
  
  http.get('/api/automations/tasks', ({ request }) => {
    const url = new URL(request.url);
    const automationId = url.searchParams.get('automationId');
    const status = url.searchParams.get('status');
    const platform = url.searchParams.get('platform');
    
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
    
    return HttpResponse.json({
      tasks,
      pagination: {
        total: tasks.length,
        limit: 50,
        offset: 0,
        hasMore: false
      }
    });
  }),
];

export const server = setupServer(...handlers); 