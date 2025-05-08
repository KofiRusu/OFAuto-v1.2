import { test, expect } from '@playwright/test';

test.describe('Model Activity Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    // Log in as a manager
    await page.goto('/login');
    await page.fill('[name="email"]', 'manager@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForURL('/dashboard');
  });

  test('should display model activity page', async ({ page }) => {
    // Navigate to a model's activity page
    // Replace 'model-id' with an actual model ID for testing
    await page.goto('/dashboard/admin/activity/model/model-id');
    
    // Check if the page title is displayed
    await expect(page.locator('h1')).toContainText('Model Activity');
    
    // Check if the table headers are present
    await expect(page.locator('thead tr')).toContainText('Date');
    await expect(page.locator('thead tr')).toContainText('Action Type');
    await expect(page.locator('thead tr')).toContainText('Metadata');
  });

  test('should filter activity logs by date range', async ({ page }) => {
    // Navigate to a model's activity page
    await page.goto('/dashboard/admin/activity/model/model-id');
    
    // Open start date picker and select a date
    await page.click('text=Start Date >> button');
    await page.click('button:has-text("10")'); // Click on the 10th day
    
    // Open end date picker and select a date
    await page.click('text=End Date >> button');
    await page.click('button:has-text("20")'); // Click on the 20th day
    
    // Wait for data to refresh
    await page.waitForResponse(response => 
      response.url().includes('activityMonitor.getModelActivity') && 
      response.status() === 200
    );
    
    // Verify filtered data is displayed
    // This is a stub - would need specific test data to verify filtering works
    await expect(page.locator('tbody')).toBeVisible();
  });

  test('should filter activity logs by action type', async ({ page }) => {
    // Navigate to a model's activity page
    await page.goto('/dashboard/admin/activity/model/model-id');
    
    // Wait for action type buttons to be loaded
    await page.waitForSelector('text=Action Types');
    
    // Click on an action type button to filter (assuming there's at least one)
    const actionTypeButton = page.locator('div:has-text("Action Types") + div > button').first();
    await actionTypeButton.click();
    
    // Wait for data to refresh
    await page.waitForResponse(response => 
      response.url().includes('activityMonitor.getModelActivity') && 
      response.status() === 200
    );
    
    // Verify filtered data is displayed
    await expect(page.locator('tbody')).toBeVisible();
  });

  test('should export activity logs as CSV', async ({ page }) => {
    // Navigate to a model's activity page
    await page.goto('/dashboard/admin/activity/model/model-id');
    
    // Wait for page to load
    await page.waitForSelector('button:has-text("Export CSV")');
    
    // Set up download listener before clicking
    const downloadPromise = page.waitForEvent('download');
    
    // Click export button
    await page.click('button:has-text("Export CSV")');
    
    // Wait for download to start
    const download = await downloadPromise;
    
    // Verify download started
    expect(download.suggestedFilename()).toContain('model-activity');
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should handle no data scenario gracefully', async ({ page }) => {
    // Navigate to a model with no activity
    // Replace with a known empty model ID
    await page.goto('/dashboard/admin/activity/model/empty-model-id');
    
    // Check if empty state message is displayed
    await expect(page.locator('text=No activity logs found')).toBeVisible();
  });

  test('should enforce access control', async ({ page }) => {
    // First logout
    await page.goto('/logout');
    
    // Log in as a regular user without manager permissions
    await page.goto('/login');
    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Attempt to access manager-only page
    await page.goto('/dashboard/admin/activity/model/model-id');
    
    // Should see forbidden message
    await expect(page.locator('text=Access Denied')).toBeVisible();
  });
}); 