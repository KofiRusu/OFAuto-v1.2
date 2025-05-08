import { test, expect } from '@playwright/test';

test.describe('QuickBooks Integration', () => {
  // Set up test data
  let clientId: string;
  let accessToken: string;
  
  test.beforeEach(async ({ page }) => {
    // Log in as a manager user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'manager@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForURL('/dashboard');
    
    // Create test client if needed or get an existing one
    await page.goto('/dashboard/clients');
    
    // Check if we already have a test client
    const testClientExists = await page.getByText('QuickBooks E2E Test Client').isVisible();
    
    if (!testClientExists) {
      // Create a new client
      await page.click('button:has-text("Add Client")');
      await page.fill('input[name="name"]', 'QuickBooks E2E Test Client');
      await page.fill('input[name="email"]', 'qb-e2e-test@example.com');
      await page.click('button[type="submit"]');
      
      // Wait for client to be created
      await page.waitForSelector('text=Client added successfully');
    }
    
    // Get the client ID (in a real test, we would find a more reliable way to get this)
    // For this example, we'll assume we have access to client data or can extract it from the page
    clientId = 'e2e-test-client-id';
    
    // Set up mock access token for testing
    accessToken = 'e2e-test-access-token';
  });
  
  test('should display QuickBooks integration page', async ({ page }) => {
    // Navigate to the QuickBooks integration page
    await page.goto('/dashboard/integrations/quickbooks');
    
    // Check if the page title is visible
    await expect(page.getByRole('heading', { name: 'QuickBooks Integration' })).toBeVisible();
    
    // Check if the client selection is visible
    await expect(page.getByText('Select Client')).toBeVisible();
  });
  
  test('should select a client and show connection status', async ({ page }) => {
    // Navigate to the QuickBooks integration page
    await page.goto('/dashboard/integrations/quickbooks');
    
    // Select a client from the dropdown
    await page.click('button:has-text("Select a client")');
    await page.click('div[role="option"]:has-text("QuickBooks E2E Test Client")');
    
    // Check if the connection card is displayed
    await expect(page.getByText('QuickBooks Connection')).toBeVisible();
    
    // Check if the connect button is visible
    await expect(page.getByRole('button', { name: /Connect to QuickBooks/ })).toBeVisible();
  });
  
  test('should handle OAuth callback and connect QuickBooks', async ({ page }) => {
    // Set up mock to intercept QuickBooks API requests
    await page.route('**/oauth2/v1/tokens/bearer', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-oauth-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer'
        })
      });
    });
    
    // Simulate OAuth callback by navigating to the page with code and state parameters
    await page.goto(`/dashboard/integrations/quickbooks?code=mock-auth-code&state=mock-realm-id`);
    
    // Select a client from the dropdown (needed even with the code in URL)
    await page.click('button:has-text("Select a client")');
    await page.click('div[role="option"]:has-text("QuickBooks E2E Test Client")');
    
    // Wait for the connection process to complete
    await page.waitForSelector('text=QuickBooks connected successfully');
    
    // Verify the connection status shows as connected
    await expect(page.getByText('Connection Status:')).toBeVisible();
    await expect(page.getByText('CONNECTED')).toBeVisible();
  });
  
  test('should refresh QuickBooks token', async ({ page }) => {
    // Set up mock to intercept QuickBooks API requests
    await page.route('**/oauth2/v1/tokens/bearer', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-new-token',
          refresh_token: 'mock-new-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer'
        })
      });
    });
    
    // Navigate to the integration page with a client that has an existing connection
    await page.goto('/dashboard/integrations/quickbooks');
    
    // Select a client from the dropdown
    await page.click('button:has-text("Select a client")');
    await page.click('div[role="option"]:has-text("QuickBooks E2E Test Client")');
    
    // Wait for the status to load and show connected
    await page.waitForSelector('text=CONNECTED');
    
    // Click on the refresh button
    await page.click('button:has-text("Refresh Connection")');
    
    // Wait for the refresh process to complete
    await page.waitForSelector('text=QuickBooks token refreshed');
    
    // Verify the connection status is still connected
    await expect(page.getByText('CONNECTED')).toBeVisible();
  });
}); 