import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { server } from '../mocks/server';
import { renderWithProviders } from '../lib/test-utils/render-utils';
import { resetDb } from '../lib/test-utils/db-utils';
import { mockCampaigns } from '../mocks/data/campaigns';

// Import components
// Note: Update these imports based on your actual component paths
import CampaignsPage from '../app/dashboard/campaigns/page';
import CampaignDetailPage from '../app/dashboard/campaigns/[id]/page';
import CreateCampaignModal from '../components/campaigns/create-campaign-modal';
import CampaignAnalytics from '../components/campaigns/campaign-analytics';
import ABTestingDashboard from '../components/campaigns/ab-testing-dashboard';

describe('Campaign Management Integration Tests', () => {
  beforeEach(() => {
    resetDb();
  });

  describe('Campaign Creation', () => {
    test('creates a new campaign with goals and metrics', async () => {
      // Setup spy on fetch
      const fetchSpy = jest.spyOn(global, 'fetch');
      
      // Render the campaigns page
      renderWithProviders(<CampaignsPage />);
      
      // Click the "Create Campaign" button
      fireEvent.click(screen.getByRole('button', { name: /create campaign/i }));
      
      // Fill out the form in the modal
      
      // Enter campaign name
      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'New Test Campaign' }
      });
      
      // Enter campaign description
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Testing campaign creation with goals' }
      });
      
      // Select client
      fireEvent.click(screen.getByLabelText(/client/i));
      fireEvent.click(screen.getByText(/sarah smith/i, { selector: '[role="option"]' }));
      
      // Select platforms
      fireEvent.click(screen.getByLabelText(/platforms/i));
      fireEvent.click(screen.getByText(/onlyfans/i, { selector: '[role="option"]' }));
      fireEvent.click(document.body);
      
      // Set campaign status
      fireEvent.click(screen.getByLabelText(/status/i));
      fireEvent.click(screen.getByText(/active/i, { selector: '[role="option"]' }));
      
      // Set start date
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      fireEvent.change(screen.getByLabelText(/start date/i), {
        target: { value: startDate.toISOString().split('T')[0] }
      });
      
      // Set end date
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      fireEvent.change(screen.getByLabelText(/end date/i), {
        target: { value: endDate.toISOString().split('T')[0] }
      });
      
      // Set budget
      fireEvent.change(screen.getByLabelText(/budget/i), {
        target: { value: '500' }
      });
      
      // Set goals
      fireEvent.change(screen.getByLabelText(/subscriber growth/i), {
        target: { value: '100' }
      });
      
      fireEvent.change(screen.getByLabelText(/revenue target/i), {
        target: { value: '2000' }
      });
      
      fireEvent.change(screen.getByLabelText(/engagement rate/i), {
        target: { value: '0.25' }
      });
      
      // Add tags
      fireEvent.change(screen.getByLabelText(/tags/i), {
        target: { value: 'test, campaign, integration' }
      });
      
      // Click the save button
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      
      // Wait for the API call to complete
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/campaigns',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            }),
            body: expect.any(String)
          })
        );
      });
      
      // Verify the request payload
      const requestBody = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(requestBody).toEqual(
        expect.objectContaining({
          name: 'New Test Campaign',
          description: 'Testing campaign creation with goals',
          clientId: 'client-1',
          platforms: ['onlyfans'],
          status: 'active',
          budget: 500,
          goals: {
            subscriberGrowth: 100,
            revenueTarget: 2000,
            engagementRate: 0.25
          },
          tags: ['test', 'campaign', 'integration']
        })
      );
      
      // Verify the campaign was created in the mock database
      expect(mockCampaigns.some(campaign => campaign.name === 'New Test Campaign')).toBe(true);
    });
  });

  describe('Campaign Analytics', () => {
    test('displays campaign analytics data correctly', async () => {
      // Setup
      const campaignId = 'campaign-1'; // An active campaign with metrics
      
      // Mock the campaign detail route
      jest.mock('next/navigation', () => ({
        ...jest.requireActual('next/navigation'),
        useParams: () => ({ id: campaignId })
      }));
      
      // Render the campaign analytics component
      renderWithProviders(<CampaignAnalytics campaignId={campaignId} />);
      
      // Wait for the analytics data to load
      await waitFor(() => {
        // Check for key metric displays
        expect(screen.getByText(/12,500/)).toBeInTheDocument(); // Impressions
        expect(screen.getByText(/2,300/)).toBeInTheDocument(); // Clicks
        expect(screen.getByText(/85/)).toBeInTheDocument(); // Conversions
        expect(screen.getByText(/\$1,275/)).toBeInTheDocument(); // Revenue
        expect(screen.getByText(/2.55x/)).toBeInTheDocument(); // ROI
      });
      
      // Test the date range filter
      const dateRangeSelector = screen.getByLabelText(/date range/i);
      fireEvent.click(dateRangeSelector);
      fireEvent.click(screen.getByText(/last 7 days/i));
      
      // Verify the API call with the new date range
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/api/campaigns/${campaignId}/analytics?period=7days`),
          expect.any(Object)
        );
      });
    });
  });

  describe('A/B Testing', () => {
    test('displays A/B testing data and allows setting a winner', async () => {
      // Setup
      const campaignId = 'campaign-1'; // Campaign with an active experiment
      const experimentId = 'exp-1'; // The experiment ID
      
      // Mock the campaign detail route
      jest.mock('next/navigation', () => ({
        ...jest.requireActual('next/navigation'),
        useParams: () => ({ id: campaignId })
      }));
      
      // Render the A/B testing dashboard
      renderWithProviders(<ABTestingDashboard campaignId={campaignId} />);
      
      // Wait for the A/B testing data to load
      await waitFor(() => {
        expect(screen.getByText(/pricing test/i)).toBeInTheDocument();
        expect(screen.getByText(/standard price/i)).toBeInTheDocument();
        expect(screen.getByText(/discounted price/i)).toBeInTheDocument();
      });
      
      // Check conversion rates are displayed
      await waitFor(() => {
        const variant1 = screen.getByText(/standard price/i).closest('[data-testid="variant-card"]');
        expect(variant1).toHaveTextContent('42'); // Conversions
        expect(variant1).toHaveTextContent('6,200'); // Impressions
        
        const variant2 = screen.getByText(/discounted price/i).closest('[data-testid="variant-card"]');
        expect(variant2).toHaveTextContent('43'); // Conversions
        expect(variant2).toHaveTextContent('6,300'); // Impressions
      });
      
      // Click to select the winning variant
      const variant2 = screen.getByText(/discounted price/i).closest('[data-testid="variant-card"]');
      const selectWinnerButton = variant2.querySelector('button[data-testid="select-winner"]');
      fireEvent.click(selectWinnerButton);
      
      // Confirm selection in the modal
      fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
      
      // Verify the API call to set the winner
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          `/api/campaigns/${campaignId}/experiments/${experimentId}/winner`,
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            }),
            body: expect.stringContaining('var-2')
          })
        );
      });
      
      // Verify the experiment was updated in the mock database
      const campaign = mockCampaigns.find(c => c.id === campaignId);
      const experiment = campaign.experiments.find(e => e.id === experimentId);
      expect(experiment.winner).toBe('var-2');
      
      // Verify the UI reflects the winner
      await waitFor(() => {
        const winnerBadge = screen.getByText(/winner/i);
        expect(winnerBadge.closest('[data-testid="variant-card"]')).toHaveTextContent(/discounted price/i);
      });
    });
  });

  describe('Campaign Filtering and Reporting', () => {
    test('filters campaigns by various criteria', async () => {
      // Render the campaigns page
      renderWithProviders(<CampaignsPage />);
      
      // Wait for campaigns to load
      await waitFor(() => {
        expect(screen.getByText('Summer Fitness Program')).toBeInTheDocument();
        expect(screen.getByText('Travel Vlog Series')).toBeInTheDocument();
        expect(screen.getByText('New Game Launch')).toBeInTheDocument();
      });
      
      // Filter by status
      fireEvent.click(screen.getByLabelText(/status/i));
      fireEvent.click(screen.getByText(/active/i, { selector: '[role="option"]' }));
      
      // Verify only active campaigns are shown
      await waitFor(() => {
        expect(screen.getByText('Summer Fitness Program')).toBeInTheDocument();
        expect(screen.getByText('New Game Launch')).toBeInTheDocument();
        expect(screen.queryByText('Travel Vlog Series')).not.toBeInTheDocument();
      });
      
      // Clear status filter
      fireEvent.click(screen.getByLabelText(/status/i));
      fireEvent.click(screen.getByText(/all/i, { selector: '[role="option"]' }));
      
      // Filter by tag
      const tagFilter = screen.getByLabelText(/tags/i);
      fireEvent.change(tagFilter, { target: { value: 'travel' } });
      fireEvent.click(screen.getByRole('button', { name: /apply/i }));
      
      // Verify only campaigns with the travel tag are shown
      await waitFor(() => {
        expect(screen.queryByText('Summer Fitness Program')).not.toBeInTheDocument();
        expect(screen.getByText('Travel Vlog Series')).toBeInTheDocument();
        expect(screen.queryByText('New Game Launch')).not.toBeInTheDocument();
      });
      
      // Clear all filters
      fireEvent.click(screen.getByRole('button', { name: /clear filters/i }));
      
      // Verify all campaigns are shown again
      await waitFor(() => {
        expect(screen.getByText('Summer Fitness Program')).toBeInTheDocument();
        expect(screen.getByText('Travel Vlog Series')).toBeInTheDocument();
        expect(screen.getByText('New Game Launch')).toBeInTheDocument();
      });
    });

    test('generates campaign reports', async () => {
      // Setup
      const campaignId = 'campaign-1';
      
      // Mock the campaign detail route
      jest.mock('next/navigation', () => ({
        ...jest.requireActual('next/navigation'),
        useParams: () => ({ id: campaignId })
      }));
      
      // Mock file download
      const mockLink = { click: jest.fn() };
      jest.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'a') {
          return mockLink;
        }
        return document.createElement(tag);
      });
      
      // Mock URL.createObjectURL
      const mockURL = 'blob:mockurl';
      global.URL.createObjectURL = jest.fn().mockReturnValue(mockURL);
      
      // Render the campaign detail page
      renderWithProviders(<CampaignDetailPage />);
      
      // Wait for the campaign data to load
      await waitFor(() => {
        expect(screen.getByText('Summer Fitness Program')).toBeInTheDocument();
      });
      
      // Click the export/report button
      fireEvent.click(screen.getByRole('button', { name: /export report/i }));
      
      // Select report type
      fireEvent.click(screen.getByText(/performance report/i));
      
      // Select format
      fireEvent.click(screen.getByLabelText(/format/i));
      fireEvent.click(screen.getByText(/pdf/i, { selector: '[role="option"]' }));
      
      // Click generate button
      fireEvent.click(screen.getByRole('button', { name: /generate/i }));
      
      // Verify the API call to generate the report
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          `/api/campaigns/${campaignId}/report`,
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            }),
            body: expect.stringContaining('performance')
          })
        );
      });
      
      // Verify the download was triggered
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('displays error message when campaign creation fails', async () => {
      // Mock a server error for this test
      server.use(
        rest.post('/api/campaigns', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ error: 'Failed to create campaign' })
          );
        })
      );
      
      // Render the create campaign modal
      renderWithProviders(<CreateCampaignModal isOpen={true} onClose={() => {}} />);
      
      // Fill out minimal required fields
      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Error Test Campaign' }
      });
      
      fireEvent.click(screen.getByLabelText(/client/i));
      fireEvent.click(screen.getByText(/sarah smith/i, { selector: '[role="option"]' }));
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      
      // Wait for the error message
      await waitFor(() => {
        expect(screen.getByText(/failed to create campaign/i)).toBeInTheDocument();
      });
      
      // Verify the campaign was not added to the mock database
      expect(mockCampaigns.some(campaign => campaign.name === 'Error Test Campaign')).toBe(false);
    });
  });
}); 