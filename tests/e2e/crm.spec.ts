import { test, expect } from '@playwright/test';

test.describe('CRM Integration', () => {
  // Set up test data
  let clientId: string;
  
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
    const testClientExists = await page.getByText('CRM E2E Test Client').isVisible();
    
    if (!testClientExists) {
      // Create a new client
      await page.click('button:has-text("Add Client")');
      await page.fill('input[name="name"]', 'CRM E2E Test Client');
      await page.fill('input[name="email"]', 'crm-e2e-test@example.com');
      await page.click('button[type="submit"]');
      
      // Wait for client to be created
      await page.waitForSelector('text=Client added successfully');
    }
    
    // For a real test, we would extract the client ID, but we'll mock it for this example
    clientId = 'e2e-test-client-id';
  });
  
  test('should display CRM integration page', async ({ page }) => {
    // Navigate to the CRM integration page
    await page.goto('/dashboard/integrations/crm');
    
    // Check if the page title is visible
    await expect(page.getByRole('heading', { name: 'CRM Integration' })).toBeVisible();
    
    // Check if the client selection is visible
    await expect(page.getByText('Client Selection')).toBeVisible();
    
    // Check if the connection form is visible
    await expect(page.getByText('Connect CRM')).toBeVisible();
  });
  
  test('should select a client and fill the connection form', async ({ page }) => {
    // Set up mock to intercept API requests
    await page.route('**/api/trpc/client.getAll**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: [
              {
                id: 'client-1',
                name: 'CRM E2E Test Client',
                email: 'crm-e2e-test@example.com',
              }
            ]
          }
        })
      });
    });
    
    // Navigate to the CRM integration page
    await page.goto('/dashboard/integrations/crm');
    
    // Select a client from the dropdown
    await page.click('button:has-text("Select a client")');
    await page.click('div[role="option"]:has-text("CRM E2E Test Client")');
    
    // Fill in the CRM connection form
    await page.fill('input[name="domain"]', 'test-company.crm.com');
    await page.fill('input[name="apiKey"]', 'test-api-key-123');
    
    // Ensure the connect button is enabled
    await expect(page.getByRole('button', { name: 'Connect CRM' })).toBeEnabled();
  });
  
  test('should connect to CRM and show connection status', async ({ page }) => {
    // Set up mocks for the client and connection API
    await page.route('**/api/trpc/client.getAll**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: [
              {
                id: 'client-1',
                name: 'CRM E2E Test Client',
                email: 'crm-e2e-test@example.com',
              }
            ]
          }
        })
      });
    });
    
    await page.route('**/api/trpc/crm.connectCrm**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: {
              success: true,
              connection: {
                id: 'conn-1',
                clientId: 'client-1',
                domain: 'test-company.crm.com',
                status: 'CONNECTED',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              message: 'CRM connected successfully'
            }
          }
        })
      });
    });
    
    await page.route('**/api/trpc/client.getClientCrmConnections**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: [
              {
                id: 'conn-1',
                clientId: 'client-1',
                domain: 'test-company.crm.com',
                status: 'CONNECTED',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            ]
          }
        })
      });
    });
    
    // Navigate to the CRM integration page
    await page.goto('/dashboard/integrations/crm');
    
    // Select a client
    await page.click('button:has-text("Select a client")');
    await page.click('div[role="option"]:has-text("CRM E2E Test Client")');
    
    // Fill and submit the connection form
    await page.fill('input[name="domain"]', 'test-company.crm.com');
    await page.fill('input[name="apiKey"]', 'test-api-key-123');
    await page.click('button:has-text("Connect CRM")');
    
    // Wait for successful connection message
    await page.waitForSelector('text=CRM Connected');
    
    // Check that the connections card is displayed
    await expect(page.getByText('Active CRM Connections')).toBeVisible();
  });
  
  test('should display CRM accounts', async ({ page }) => {
    // Set up all necessary mocks
    await page.route('**/api/trpc/client.getAll**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: [{ id: 'client-1', name: 'CRM E2E Test Client' }]
          }
        })
      });
    });
    
    await page.route('**/api/trpc/client.getClientCrmConnections**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: [{ id: 'conn-1', domain: 'test-company.crm.com' }]
          }
        })
      });
    });
    
    await page.route('**/api/trpc/crm.getCrmStatus**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: {
              connected: true,
              connectionId: 'conn-1',
              domain: 'test-company.crm.com',
              lastSyncedAt: new Date().toISOString()
            }
          }
        })
      });
    });
    
    await page.route('**/api/trpc/crm.listCrmAccounts**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: {
              accounts: [
                {
                  id: 'account-1',
                  name: 'Test Account 1',
                  email: 'account1@example.com',
                  phone: '123-456-7890',
                  type: 'Customer',
                },
                {
                  id: 'account-2',
                  name: 'Test Account 2',
                  email: 'account2@example.com',
                  phone: null,
                  type: null,
                }
              ],
              count: 2
            }
          }
        })
      });
    });
    
    // Navigate to the CRM integration page
    await page.goto('/dashboard/integrations/crm');
    
    // Select a client
    await page.click('button:has-text("Select a client")');
    await page.click('div[role="option"]:has-text("CRM E2E Test Client")');
    
    // Wait for connections to load and select one
    await page.waitForSelector('text=Active CRM Connections');
    await page.click('button:has-text("Select a connection")');
    await page.click('div[role="option"]:has-text("test-company.crm.com")');
    
    // Verify status is displayed
    await expect(page.getByText('Status:')).toBeVisible();
    await expect(page.getByText('Connected')).toBeVisible();
    
    // Switch to accounts tab
    await page.click('button[role="tab"]:has-text("Accounts")');
    
    // Verify accounts are displayed
    await expect(page.getByText('Test Account 1')).toBeVisible();
    await expect(page.getByText('Test Account 2')).toBeVisible();
    await expect(page.getByText('account1@example.com')).toBeVisible();
    await expect(page.getByText('123-456-7890')).toBeVisible();
    await expect(page.getByText('Customer')).toBeVisible();
  });
}); 