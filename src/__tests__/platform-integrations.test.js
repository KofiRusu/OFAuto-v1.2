import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { server } from '../mocks/server';
import { renderWithProviders } from '../lib/test-utils/render-utils';
import { resetDb } from '../lib/test-utils/db-utils';
import { mockIntegrations } from '../mocks/data/integrations';

// Import components
// Note: Update these imports based on your actual component paths
import IntegrationsPage from '../app/dashboard/integrations/page';
import IntegrationDetailPage from '../app/dashboard/integrations/[id]/page';
import ConnectIntegrationForm from '../components/integrations/connect-integration-form';

// Mock window.open for OAuth redirection
const mockWindowOpen = jest.fn();
window.open = mockWindowOpen;

describe('Platform Integrations Integration Tests', () => {
  beforeEach(() => {
    resetDb();
    mockWindowOpen.mockClear();
  });

  describe('OAuth Flow', () => {
    test('initiates OAuth flow when connecting a new platform', async () => {
      // Setup mock for oauth endpoint
      server.use(
        rest.post('/api/integrations/oauth/init', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              url: 'https://example.com/oauth/authorize?client_id=test&redirect_uri=callback',
              state: 'random-state-token'
            })
          );
        })
      );
      
      // Render the integrations page
      renderWithProviders(<IntegrationsPage />);
      
      // Click the "Connect New Platform" button
      fireEvent.click(screen.getByText(/connect new platform/i));
      
      // In the modal, select a platform
      fireEvent.click(screen.getByLabelText(/platform/i));
      fireEvent.click(screen.getByText(/twitter/i, { selector: '[role="option"]' }));
      
      // Select a client
      fireEvent.click(screen.getByLabelText(/client/i));
      fireEvent.click(screen.getByText(/sarah smith/i, { selector: '[role="option"]' }));
      
      // Click the connect button
      fireEvent.click(screen.getByRole('button', { name: /connect/i }));
      
      // Verify the OAuth window was opened
      await waitFor(() => {
        expect(mockWindowOpen).toHaveBeenCalledWith(
          'https://example.com/oauth/authorize?client_id=test&redirect_uri=callback',
          '_blank',
          expect.any(String)
        );
      });
    });

    test('handles OAuth callback and completes platform connection', async () => {
      // Setup mock for OAuth callback endpoint
      server.use(
        rest.get('/api/integrations/oauth/callback', (req, res, ctx) => {
          const code = req.url.searchParams.get('code');
          const state = req.url.searchParams.get('state');
          
          if (code && state) {
            return res(
              ctx.status(200),
              ctx.json({
                success: true,
                integration: {
                  id: 'new-integration-id',
                  clientId: 'client-1',
                  platform: 'twitter',
                  status: 'connected',
                  username: 'sarahsmith_twitter',
                  credentials: {
                    accessToken: 'new-access-token',
                    refreshToken: 'new-refresh-token',
                    expiresAt: new Date(Date.now() + 3600000).toISOString()
                  },
                  platformData: {
                    followersCount: 5200,
                    postsCount: 1240,
                    averageEngagement: 0.03
                  },
                  lastSyncedAt: new Date().toISOString(),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }
              })
            );
          }
          
          return res(
            ctx.status(400),
            ctx.json({ error: 'Invalid OAuth callback parameters' })
          );
        })
      );
      
      // In a real test, we'd need to simulate the OAuth callback redirect
      // For this mock test, we'll test the callback handler directly
      
      // Get the initial count of integrations
      const initialIntegrationsCount = mockIntegrations.length;
      
      // Simulate fetching the OAuth callback with valid parameters
      await fetch('/api/integrations/oauth/callback?code=test-code&state=test-state');
      
      // Check if a new integration was added to the mock DB
      expect(mockIntegrations.length).toBe(initialIntegrationsCount + 1);
      
      // Find the newly added integration
      const newIntegration = mockIntegrations.find(i => i.id === 'new-integration-id');
      expect(newIntegration).toBeTruthy();
      expect(newIntegration.platform).toBe('twitter');
      expect(newIntegration.clientId).toBe('client-1');
      expect(newIntegration.status).toBe('connected');
    });
  });

  describe('Integration Status Detection', () => {
    test('detects when an integration is disconnected or has errors', async () => {
      // Render the integrations page
      renderWithProviders(<IntegrationsPage />);
      
      // Wait for the integrations to load
      await waitFor(() => {
        // Twitter integration for client-2 should show as having an error
        const errorIntegration = screen.getByText(/API rate limit exceeded/i);
        expect(errorIntegration).toBeInTheDocument();
        
        // Twitter integration for client-3 should show as disconnected
        const disconnectedIntegration = screen.getByText(/disconnected/i);
        expect(disconnectedIntegration).toBeInTheDocument();
      });
    });

    test('displays real-time status updates for integrations', async () => {
      // Render the integrations page
      renderWithProviders(<IntegrationsPage />);
      
      // Wait for the integrations to load
      await waitFor(() => {
        expect(screen.getByText(/API rate limit exceeded/i)).toBeInTheDocument();
      });
      
      // Simulate a WebSocket event updating an integration status
      const updatedIntegration = {
        ...mockIntegrations.find(i => i.id === 'integration-4'),
        status: 'connected',
        error: null,
        lastSyncedAt: new Date().toISOString()
      };
      
      // Update the mock database
      const index = mockIntegrations.findIndex(i => i.id === 'integration-4');
      mockIntegrations[index] = updatedIntegration;
      
      // Emit the WebSocket event
      global.mockSocket.emit('integration_updated', { integration: updatedIntegration });
      
      // Check that the UI reflects the change
      await waitFor(() => {
        expect(screen.queryByText(/API rate limit exceeded/i)).not.toBeInTheDocument();
        const statusElements = screen.getAllByText(/connected/i);
        expect(statusElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Reconnection and Disconnection', () => {
    test('allows reconnecting a disconnected platform', async () => {
      // Mock the integration detail route
      const integrationId = 'integration-7'; // Disconnected Twitter integration
      
      // Override the useParams mock for this test
      jest.mock('next/navigation', () => ({
        ...jest.requireActual('next/navigation'),
        useParams: () => ({ id: integrationId })
      }));
      
      // Render the integration detail page
      renderWithProviders(<IntegrationDetailPage />);
      
      // Wait for the integration data to load
      await waitFor(() => {
        expect(screen.getByText(/emilychenbeauty/i)).toBeInTheDocument();
        expect(screen.getByText(/disconnected/i)).toBeInTheDocument();
      });
      
      // Click the reconnect button
      fireEvent.click(screen.getByRole('button', { name: /reconnect/i }));
      
      // Verify that OAuth flow is initiated
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/integrations/oauth/init',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            }),
            body: expect.stringContaining(integrationId)
          })
        );
      });
    });

    test('allows disconnecting a connected platform', async () => {
      // Setup
      const integrationId = 'integration-1'; // Connected OnlyFans integration
      
      // Mock the integration detail route
      jest.mock('next/navigation', () => ({
        ...jest.requireActual('next/navigation'),
        useParams: () => ({ id: integrationId })
      }));
      
      // Render the integration detail page
      renderWithProviders(<IntegrationDetailPage />);
      
      // Wait for the integration data to load
      await waitFor(() => {
        expect(screen.getByText(/sarahsmith/i)).toBeInTheDocument();
        expect(screen.getByText(/connected/i)).toBeInTheDocument();
      });
      
      // Click the disconnect button
      fireEvent.click(screen.getByRole('button', { name: /disconnect/i }));
      
      // Confirm disconnection in the modal
      fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
      
      // Wait for the API call to complete
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          `/api/integrations/${integrationId}/disconnect`,
          expect.objectContaining({
            method: 'POST'
          })
        );
      });
      
      // Verify the integration status was updated in the mock database
      const updatedIntegration = mockIntegrations.find(i => i.id === integrationId);
      expect(updatedIntegration.status).toBe('disconnected');
    });
  });

  describe('Error Handling', () => {
    test('handles API errors during platform connection', async () => {
      // Setup mock for OAuth init endpoint to return an error
      server.use(
        rest.post('/api/integrations/oauth/init', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ error: 'Failed to initialize OAuth flow' })
          );
        })
      );
      
      // Render the connect integration form
      renderWithProviders(<ConnectIntegrationForm clientId="client-1" />);
      
      // Select a platform
      fireEvent.click(screen.getByLabelText(/platform/i));
      fireEvent.click(screen.getByText(/twitter/i, { selector: '[role="option"]' }));
      
      // Click the connect button
      fireEvent.click(screen.getByRole('button', { name: /connect/i }));
      
      // Wait for the error message
      await waitFor(() => {
        expect(screen.getByText(/failed to initialize oauth flow/i)).toBeInTheDocument();
      });
      
      // Verify the OAuth window was not opened
      expect(mockWindowOpen).not.toHaveBeenCalled();
    });
  });
}); 