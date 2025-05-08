import { mockClients } from '../../mocks/data/clients';
import { mockIntegrations } from '../../mocks/data/integrations';
import { mockScheduledPosts } from '../../mocks/data/scheduled-posts';
import { mockCampaigns } from '../../mocks/data/campaigns';
import { mockAutomations, mockTasks } from '../../mocks/data/automations';

// Store original data for reset
const originalData = {
  clients: [...mockClients],
  integrations: [...mockIntegrations],
  scheduledPosts: [...mockScheduledPosts],
  campaigns: [...mockCampaigns],
  automations: [...mockAutomations],
  tasks: [...mockTasks]
};

/**
 * Resets all mock data to its original state
 */
export function resetDb() {
  // Reset clients
  mockClients.length = 0;
  mockClients.push(...originalData.clients.map(client => ({ ...client })));
  
  // Reset integrations
  mockIntegrations.length = 0;
  mockIntegrations.push(...originalData.integrations.map(integration => ({ ...integration })));
  
  // Reset scheduled posts
  mockScheduledPosts.length = 0;
  mockScheduledPosts.push(...originalData.scheduledPosts.map(post => ({ ...post })));
  
  // Reset campaigns
  mockCampaigns.length = 0;
  mockCampaigns.push(...originalData.campaigns.map(campaign => ({ ...campaign })));
  
  // Reset automations
  mockAutomations.length = 0;
  mockAutomations.push(...originalData.automations.map(automation => ({ ...automation })));
  
  // Reset tasks
  mockTasks.length = 0;
  mockTasks.push(...originalData.tasks.map(task => ({ ...task })));
}

/**
 * Get a clean copy of a client for testing
 * @param {string} clientId - The ID of the client to get
 * @returns {Object} A clean copy of the client
 */
export function getTestClient(clientId) {
  const client = originalData.clients.find(c => c.id === clientId);
  return client ? { ...client } : null;
}

/**
 * Get clean copies of integrations for a client
 * @param {string} clientId - The ID of the client
 * @returns {Array} Clean copies of the client's integrations
 */
export function getTestIntegrations(clientId) {
  return originalData.integrations
    .filter(i => i.clientId === clientId)
    .map(integration => ({ ...integration }));
}

/**
 * Get clean copies of scheduled posts for a client
 * @param {string} clientId - The ID of the client
 * @returns {Array} Clean copies of the client's scheduled posts
 */
export function getTestScheduledPosts(clientId) {
  return originalData.scheduledPosts
    .filter(p => p.clientId === clientId)
    .map(post => ({ ...post }));
}

/**
 * Get clean copies of campaigns for a client
 * @param {string} clientId - The ID of the client
 * @returns {Array} Clean copies of the client's campaigns
 */
export function getTestCampaigns(clientId) {
  return originalData.campaigns
    .filter(c => c.clientId === clientId)
    .map(campaign => ({ ...campaign }));
}

/**
 * Get clean copies of automations for a client
 * @param {string} clientId - The ID of the client
 * @returns {Array} Clean copies of the client's automations
 */
export function getTestAutomations(clientId) {
  return originalData.automations
    .filter(a => a.clientId === clientId)
    .map(automation => ({ ...automation }));
}

/**
 * Get clean copies of tasks for an automation
 * @param {string} automationId - The ID of the automation
 * @returns {Array} Clean copies of the automation's tasks
 */
export function getTestTasks(automationId) {
  return originalData.tasks
    .filter(t => t.automationId === automationId)
    .map(task => ({ ...task }));
} 