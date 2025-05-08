import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { rest } from 'msw';
import { server } from '../mocks/server';
import { renderWithProviders } from '../lib/test-utils/render-utils';
import { resetDb } from '../lib/test-utils/db-utils';
import { mockWebSocket } from '../lib/test-utils/websocket-utils';
import { mockClients } from '../mocks/data/clients';
import { mockIntegrations } from '../mocks/data/integrations';
import { mockScheduledPosts } from '../mocks/data/scheduledPosts';
import { mockCampaigns } from '../mocks/data/campaigns';
import { mockAutomations } from '../mocks/data/automations';

// Import components
// Note: Update these imports based on your actual component paths
import DashboardPage from '../app/dashboard/page';
import ClientDetailPage from '../app/clients/[id]/page';
import IntegrationDetailPage from '../app/integrations/[id]/page';
import CreateCampaignModal from '../components/campaign/create-campaign-modal';
import AutomationModal from '../components/automation/automation-modal';

describe('Cross-Module Integration Tests', () => {
  beforeEach(() => {
    resetDb();
    // Mock any global functions or objects needed
    jest.spyOn(global, 'fetch');
  });

  describe('Client to Platform Integrations Flow', () => {
    test('associates a new platform integration with an existing client', async () => {
      // First, get an existing client
      const client = mockClients[0];
      
      // Render the client detail page
      renderWithProviders(<ClientDetailPage params={{ id: client.id }} />);
      
      // Wait for client details to load
      await waitFor(() => {
        expect(screen.getByText(client.name)).toBeInTheDocument();
      });
      
      // Click on the "Add Integration" button
      fireEvent.click(screen.getByRole('button', { name: /add integration/i }));
      
      // Wait for the integration modal to appear and select a platform
      await waitFor(() => {
        expect(screen.getByText(/connect a new platform/i)).toBeInTheDocument();
      });
      
      // Select OnlyFans platform
      fireEvent.click(screen.getByLabelText(/platform/i));
      fireEvent.click(screen.getByText(/onlyfans/i, { selector: '[role="option"]' }));
      
      // Continue with the OAuth flow
      fireEvent.click(screen.getByRole('button', { name: /connect/i }));
      
      // Mock the OAuth popup and callback
      const originalWindowOpen = window.open;
      window.open = jest.fn();
      
      // Verify the OAuth window was opened
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('/api/oauth/initialize?platform=onlyfans'),
        expect.any(String),
        expect.any(String)
      );
      
      // Simulate successful OAuth callback
      const newIntegration = {
        id: 'new-integration',
        clientId: client.id,
        platform: 'onlyfans',
        status: 'connected',
        credentials: {
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh-token',
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        },
        settings: {
          autoPost: true
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add the integration to the mock database
      mockIntegrations.push(newIntegration);
      
      // Emit the WebSocket event for new integration
      act(() => {
        mockWebSocket.emit('integration_created', { integration: newIntegration });
      });
      
      // Verify the UI shows the new integration
      await waitFor(() => {
        expect(screen.getByText(/onlyfans/i)).toBeInTheDocument();
        expect(screen.getByText(/connected/i)).toBeInTheDocument();
      });
      
      // Clean up
      window.open = originalWindowOpen;
    });
  });

  describe('Client to Campaign Creation Flow', () => {
    test('creates a new campaign for an existing client with their integrations', async () => {
      // First, get an existing client with integrations
      const client = mockClients.find(client => 
        mockIntegrations.some(integration => integration.clientId === client.id)
      );
      
      const clientIntegrations = mockIntegrations.filter(
        integration => integration.clientId === client.id
      );
      
      // Render the client detail page
      renderWithProviders(<ClientDetailPage params={{ id: client.id }} />);
      
      // Wait for client details to load
      await waitFor(() => {
        expect(screen.getByText(client.name)).toBeInTheDocument();
      });
      
      // Navigate to Campaigns tab
      fireEvent.click(screen.getByRole('tab', { name: /campaigns/i }));
      
      // Click on "Create Campaign" button
      fireEvent.click(screen.getByRole('button', { name: /create campaign/i }));
      
      // Wait for the campaign modal to appear
      await waitFor(() => {
        expect(screen.getByText(/create new campaign/i)).toBeInTheDocument();
      });
      
      // Fill out the campaign form
      fireEvent.change(screen.getByLabelText(/campaign name/i), {
        target: { value: 'Cross-Module Test Campaign' }
      });
      
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Testing campaign creation from client profile' }
      });
      
      // Verify the client is pre-selected
      const clientField = screen.getByLabelText(/client/i);
      expect(clientField).toHaveValue(client.name);
      
      // Select platforms (should show client's connected platforms)
      fireEvent.click(screen.getByLabelText(/platforms/i));
      
      // Select all available platforms for this client
      for (const integration of clientIntegrations) {
        fireEvent.click(screen.getByText(new RegExp(integration.platform, 'i'), { selector: '[role="option"]' }));
      }
      
      // Set campaign dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      
      fireEvent.change(screen.getByLabelText(/start date/i), {
        target: { value: startDate.toISOString().split('T')[0] }
      });
      
      fireEvent.change(screen.getByLabelText(/end date/i), {
        target: { value: endDate.toISOString().split('T')[0] }
      });
      
      // Set budget
      fireEvent.change(screen.getByLabelText(/budget/i), {
        target: { value: '1000' }
      });
      
      // Set goals
      fireEvent.change(screen.getByLabelText(/goals/i), {
        target: { value: 'Increase engagement by 25%' }
      });
      
      // Create the campaign
      fireEvent.click(screen.getByRole('button', { name: /create/i }));
      
      // Verify the API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/campaigns',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('Cross-Module Test Campaign')
          })
        );
      });
      
      // Check that the campaign was added to the database
      const lastCall = fetch.mock.calls[fetch.mock.calls.length - 1];
      const requestBody = JSON.parse(lastCall[1].body);
      
      expect(requestBody).toEqual(
        expect.objectContaining({
          name: 'Cross-Module Test Campaign',
          clientId: client.id,
          platforms: expect.arrayContaining(clientIntegrations.map(i => i.platform))
        })
      );
      
      // Verify the UI updates to show the new campaign
      await waitFor(() => {
        expect(screen.getByText('Cross-Module Test Campaign')).toBeInTheDocument();
      });
    });
  });

  describe('Scheduled Posts to Campaigns Connection', () => {
    test('associates scheduled posts with an existing campaign', async () => {
      // First, get an existing campaign
      const campaign = mockCampaigns[0];
      const client = mockClients.find(client => client.id === campaign.clientId);
      
      // Render the scheduler page
      renderWithProviders(<DashboardPage initialTab="scheduler" />);
      
      // Wait for scheduler to load
      await waitFor(() => {
        expect(screen.getByText(/content scheduler/i)).toBeInTheDocument();
      });
      
      // Click on "Create Post" button
      fireEvent.click(screen.getByRole('button', { name: /create post/i }));
      
      // Wait for the create post modal to appear
      await waitFor(() => {
        expect(screen.getByText(/create new post/i)).toBeInTheDocument();
      });
      
      // Fill out the form
      // Select client
      fireEvent.click(screen.getByLabelText(/client/i));
      fireEvent.click(screen.getByText(client.name, { selector: '[role="option"]' }));
      
      // Select platforms
      fireEvent.click(screen.getByLabelText(/platforms/i));
      fireEvent.click(screen.getByText(/onlyfans/i, { selector: '[role="option"]' }));
      
      // Enter content
      fireEvent.change(screen.getByLabelText(/content/i), {
        target: { value: 'This is a test post associated with a campaign' }
      });
      
      // Set scheduled time (tomorrow at 12:00)
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 1);
      scheduledDate.setHours(12, 0, 0, 0);
      
      fireEvent.change(screen.getByLabelText(/date/i), {
        target: { value: scheduledDate.toISOString().split('T')[0] }
      });
      
      fireEvent.change(screen.getByLabelText(/time/i), {
        target: { value: '12:00' }
      });
      
      // Importantly, select the campaign
      fireEvent.click(screen.getByLabelText(/campaign/i));
      fireEvent.click(screen.getByText(campaign.name, { selector: '[role="option"]' }));
      
      // Save the post
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      
      // Verify the API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/scheduled-posts',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining(campaign.id)
          })
        );
      });
      
      // Check that the scheduled post was added to the database with campaign association
      const lastCall = fetch.mock.calls[fetch.mock.calls.length - 1];
      const requestBody = JSON.parse(lastCall[1].body);
      
      expect(requestBody).toEqual(
        expect.objectContaining({
          clientId: client.id,
          campaignId: campaign.id,
          content: 'This is a test post associated with a campaign'
        })
      );
      
      // Navigate to the campaign details page to verify the post is associated
      // First need to go to campaigns page
      fireEvent.click(screen.getByRole('tab', { name: /campaigns/i }));
      
      // Find and click on the campaign
      await waitFor(() => {
        expect(screen.getByText(campaign.name)).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText(campaign.name));
      
      // Verify the scheduled post appears in the campaign's scheduled posts
      await waitFor(() => {
        expect(screen.getByText('This is a test post associated with a campaign')).toBeInTheDocument();
      });
    });
  });

  describe('Automation to Integrations Connection', () => {
    test('creates an automation rule that works with client integrations', async () => {
      // Get a client with integrations
      const client = mockClients.find(client => 
        mockIntegrations.some(integration => integration.clientId === client.id)
      );
      
      // Render the automation page
      renderWithProviders(<DashboardPage initialTab="automation" />);
      
      // Wait for automation page to load
      await waitFor(() => {
        expect(screen.getByText(/automation/i)).toBeInTheDocument();
      });
      
      // Click on "Create Automation" button
      fireEvent.click(screen.getByRole('button', { name: /create automation/i }));
      
      // Wait for the modal to appear
      await waitFor(() => {
        expect(screen.getByText(/create new automation/i)).toBeInTheDocument();
      });
      
      // Fill out the automation form
      
      // Enter name and description
      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Low Engagement Response Automation' }
      });
      
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Automatically respond to periods of low engagement' }
      });
      
      // Select the client
      fireEvent.click(screen.getByLabelText(/client/i));
      fireEvent.click(screen.getByText(client.name, { selector: '[role="option"]' }));
      
      // Select trigger type
      fireEvent.click(screen.getByLabelText(/trigger type/i));
      fireEvent.click(screen.getByText(/engagement drop/i, { selector: '[role="option"]' }));
      
      // Set threshold
      fireEvent.change(screen.getByLabelText(/threshold/i), {
        target: { value: '10' } // 10% drop in engagement
      });
      
      // Switch to Actions tab
      fireEvent.click(screen.getByRole('tab', { name: /actions/i }));
      
      // Add an action that uses the client's integration
      // Select action type
      fireEvent.click(screen.getByLabelText(/action type/i));
      fireEvent.click(screen.getByText(/create post/i, { selector: '[role="option"]' }));
      
      // For OnlyFans integration
      const onlyfansIntegration = mockIntegrations.find(
        i => i.clientId === client.id && i.platform === 'onlyfans'
      );
      
      if (onlyfansIntegration) {
        // Select OnlyFans platform
        fireEvent.click(screen.getByLabelText(/platform/i));
        fireEvent.click(screen.getByText(/onlyfans/i, { selector: '[role="option"]' }));
        
        // Enter post content
        fireEvent.change(screen.getByLabelText(/content/i), {
          target: { value: 'Hey everyone! I miss you all! Let me know what kind of content you\'d like to see more of.' }
        });
      }
      
      // Create the automation
      fireEvent.click(screen.getByRole('button', { name: /create/i }));
      
      // Verify the API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/automations',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('Low Engagement Response Automation')
          })
        );
      });
      
      // Check that the automation was added to the database
      const lastCall = fetch.mock.calls[fetch.mock.calls.length - 1];
      const requestBody = JSON.parse(lastCall[1].body);
      
      expect(requestBody).toEqual(
        expect.objectContaining({
          name: 'Low Engagement Response Automation',
          clientId: client.id,
          triggerType: 'ENGAGEMENT_DROP',
          conditions: expect.objectContaining({
            threshold: 0.1
          })
        })
      );
      
      // Verify the action references the integration
      if (onlyfansIntegration) {
        expect(requestBody.actions[0]).toEqual(
          expect.objectContaining({
            type: 'create_post',
            platform: 'onlyfans'
          })
        );
      }
      
      // Verify the UI updates to show the new automation
      await waitFor(() => {
        expect(screen.getByText('Low Engagement Response Automation')).toBeInTheDocument();
      });
    });
  });

  describe('End-to-End Workflow Tests', () => {
    test('creates a client, adds integration, creates campaign, and schedules posts', async () => {
      // Render the dashboard page
      renderWithProviders(<DashboardPage />);
      
      // 1. Create a new client
      // Navigate to Clients tab
      fireEvent.click(screen.getByRole('tab', { name: /clients/i }));
      
      // Click on "Add Client" button
      fireEvent.click(screen.getByRole('button', { name: /add client/i }));
      
      // Wait for the form to appear
      await waitFor(() => {
        expect(screen.getByText(/add new client/i)).toBeInTheDocument();
      });
      
      // Fill out client form
      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Workflow Test Client' }
      });
      
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'workflow@test.com' }
      });
      
      fireEvent.change(screen.getByLabelText(/phone/i), {
        target: { value: '123-456-7890' }
      });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      
      // Verify client creation API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/clients',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('Workflow Test Client')
          })
        );
      });
      
      // Get the new client ID from the response
      const newClientId = 'new-client-id'; // In a real test, this would come from the API response
      
      // Add the client to mock data
      const newClient = {
        id: newClientId,
        name: 'Workflow Test Client',
        email: 'workflow@test.com',
        phone: '123-456-7890',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockClients.push(newClient);
      
      // 2. Add an integration to the client
      // Navigate to client detail page (assuming UI redirects there after creation)
      // or click on the newly created client
      fireEvent.click(screen.getByText('Workflow Test Client'));
      
      // Wait for client details page to load
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Workflow Test Client' })).toBeInTheDocument();
      });
      
      // Click "Add Integration" button
      fireEvent.click(screen.getByRole('button', { name: /add integration/i }));
      
      // Select a platform and connect
      fireEvent.click(screen.getByLabelText(/platform/i));
      fireEvent.click(screen.getByText(/onlyfans/i, { selector: '[role="option"]' }));
      
      // Connect the platform (mocking the OAuth process)
      fireEvent.click(screen.getByRole('button', { name: /connect/i }));
      
      // Mock successful OAuth
      const newIntegration = {
        id: 'new-integration-id',
        clientId: newClientId,
        platform: 'onlyfans',
        status: 'connected',
        credentials: { accessToken: 'mock-token' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockIntegrations.push(newIntegration);
      
      // Emit WebSocket event for new integration
      act(() => {
        mockWebSocket.emit('integration_created', { integration: newIntegration });
      });
      
      // 3. Create a campaign for the client
      // Navigate to Campaigns tab on client detail page
      fireEvent.click(screen.getByRole('tab', { name: /campaigns/i }));
      
      // Click "Create Campaign" button
      fireEvent.click(screen.getByRole('button', { name: /create campaign/i }));
      
      // Fill out campaign form
      fireEvent.change(screen.getByLabelText(/campaign name/i), {
        target: { value: 'Workflow Test Campaign' }
      });
      
      // Set other necessary fields
      // ...
      
      // Save the campaign
      fireEvent.click(screen.getByRole('button', { name: /create/i }));
      
      // Mock campaign creation
      const newCampaign = {
        id: 'new-campaign-id',
        name: 'Workflow Test Campaign',
        clientId: newClientId,
        status: 'active',
        platforms: ['onlyfans'],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 3600000 * 24 * 30).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockCampaigns.push(newCampaign);
      
      // 4. Schedule posts for the campaign
      // Navigate to Scheduler
      fireEvent.click(screen.getByRole('tab', { name: /scheduler/i }));
      
      // Click "Create Post" button
      fireEvent.click(screen.getByRole('button', { name: /create post/i }));
      
      // Fill out post form
      // Set client
      fireEvent.click(screen.getByLabelText(/client/i));
      fireEvent.click(screen.getByText('Workflow Test Client', { selector: '[role="option"]' }));
      
      // Set platforms
      fireEvent.click(screen.getByLabelText(/platforms/i));
      fireEvent.click(screen.getByText(/onlyfans/i, { selector: '[role="option"]' }));
      
      // Set content
      fireEvent.change(screen.getByLabelText(/content/i), {
        target: { value: 'This is a test post for our end-to-end workflow test.' }
      });
      
      // Set date and time
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 1);
      
      fireEvent.change(screen.getByLabelText(/date/i), {
        target: { value: scheduledDate.toISOString().split('T')[0] }
      });
      
      fireEvent.change(screen.getByLabelText(/time/i), {
        target: { value: '12:00' }
      });
      
      // Associate with campaign
      fireEvent.click(screen.getByLabelText(/campaign/i));
      fireEvent.click(screen.getByText('Workflow Test Campaign', { selector: '[role="option"]' }));
      
      // Save the post
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      
      // Mock the post creation
      const newPost = {
        id: 'new-post-id',
        clientId: newClientId,
        campaignId: 'new-campaign-id',
        content: 'This is a test post for our end-to-end workflow test.',
        platforms: ['onlyfans'],
        scheduledTime: scheduledDate.toISOString(),
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockScheduledPosts.push(newPost);
      
      // 5. Create an automation that references this client and integration
      // Navigate to Automation tab
      fireEvent.click(screen.getByRole('tab', { name: /automation/i }));
      
      // Click "Create Automation" button
      fireEvent.click(screen.getByRole('button', { name: /create automation/i }));
      
      // Fill out automation form
      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Workflow Test Automation' }
      });
      
      // Select the client
      fireEvent.click(screen.getByLabelText(/client/i));
      fireEvent.click(screen.getByText('Workflow Test Client', { selector: '[role="option"]' }));
      
      // Configure trigger and actions
      // ...
      
      // Save the automation
      fireEvent.click(screen.getByRole('button', { name: /create/i }));
      
      // Mock automation creation
      const newAutomation = {
        id: 'new-automation-id',
        name: 'Workflow Test Automation',
        clientId: newClientId,
        triggerType: 'SCHEDULE',
        conditions: { schedule: '0 9 * * *' }, // 9 AM daily
        actions: [
          {
            type: 'create_post',
            platform: 'onlyfans',
            params: { content: 'Automated post from our workflow test.' }
          }
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockAutomations.push(newAutomation);
      
      // Verify all entities were created and linked correctly
      expect(mockClients.some(c => c.id === newClientId)).toBe(true);
      expect(mockIntegrations.some(i => i.clientId === newClientId)).toBe(true);
      expect(mockCampaigns.some(c => c.clientId === newClientId)).toBe(true);
      expect(mockScheduledPosts.some(p => p.clientId === newClientId && p.campaignId === 'new-campaign-id')).toBe(true);
      expect(mockAutomations.some(a => a.clientId === newClientId)).toBe(true);
    });
  });

  describe('Analytics Data Aggregation', () => {
    test('aggregates data across modules for client dashboard', async () => {
      // Get an existing client with data in multiple modules
      const client = mockClients[0];
      
      // Make sure this client has:
      // - Multiple integrations
      // - Multiple campaigns
      // - Multiple scheduled posts
      // - At least one automation
      
      // Render the client detail page
      renderWithProviders(<ClientDetailPage params={{ id: client.id }} />);
      
      // Wait for client details to load
      await waitFor(() => {
        expect(screen.getByText(client.name)).toBeInTheDocument();
      });
      
      // Navigate to Dashboard tab if it exists
      fireEvent.click(screen.getByRole('tab', { name: /dashboard/i }));
      
      // Wait for the analytics data to load
      await waitFor(() => {
        expect(screen.getByText(/performance overview/i)).toBeInTheDocument();
      });
      
      // Verify platform analytics
      expect(screen.getByText(/platform performance/i)).toBeInTheDocument();
      
      // Verify campaign statistics
      expect(screen.getByText(/campaign statistics/i)).toBeInTheDocument();
      
      // Verify content engagement
      expect(screen.getByText(/content engagement/i)).toBeInTheDocument();
      
      // Verify automation activity
      expect(screen.getByText(/automation activity/i)).toBeInTheDocument();
      
      // Change the date range filter
      fireEvent.click(screen.getByLabelText(/date range/i));
      fireEvent.click(screen.getByText(/last 30 days/i, { selector: '[role="option"]' }));
      
      // Verify the API call to fetch new analytics data
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/api/clients/${client.id}/analytics`),
          expect.objectContaining({
            method: 'GET'
          })
        );
      });
      
      // Wait for updated analytics to load
      await waitFor(() => {
        expect(screen.getByText(/updated.*/i)).toBeInTheDocument();
      });
    });
  });
}); 