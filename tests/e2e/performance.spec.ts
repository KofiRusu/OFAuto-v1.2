import { test, expect } from '@playwright/test';

test.describe('Performance Reporting', () => {
  test.beforeEach(async ({ page }) => {
    // Log in as a manager
    await page.goto('/login');
    await page.fill('[name="email"]', 'manager@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForURL('/dashboard');
  });

  test('should display collective performance page with summary cards', async ({ page }) => {
    // Navigate to collective performance page
    await page.goto('/dashboard/admin/performance/collective');
    
    // Check if the page title is displayed
    await expect(page.locator('h1')).toContainText('Collective Performance Reports');
    
    // Check for summary metric cards
    await expect(page.locator('text=Total Earnings')).toBeVisible();
    await expect(page.locator('text=Total Posts')).toBeVisible();
    await expect(page.locator('text=Avg. Engagement')).toBeVisible();
  });

  test('should filter collective performance reports by date range', async ({ page }) => {
    // Navigate to collective performance page
    await page.goto('/dashboard/admin/performance/collective');
    
    // Open start date picker and select a date
    await page.click('text=Start Date >> button');
    await page.click('button:has-text("10")'); // Click on the 10th day
    
    // Open end date picker and select a date
    await page.click('text=End Date >> button');
    await page.click('button:has-text("20")'); // Click on the 20th day
    
    // Wait for data to refresh
    await page.waitForResponse(response => 
      response.url().includes('performance.listReports') && 
      response.status() === 200
    );
    
    // Verify filtered data is displayed
    // This is a stub - would need specific test data to verify filtering works
    await page.waitForSelector('.card');
  });

  test('should navigate to individual model report', async ({ page }) => {
    // Navigate to collective performance page
    await page.goto('/dashboard/admin/performance/collective');
    
    // Wait for reports to load
    await page.waitForSelector('button:has-text("View Details")');
    
    // Click on View Details for the first report
    await page.click('button:has-text("View Details")');
    
    // Verify we navigated to individual report page
    await expect(page.url()).toContain('/dashboard/admin/performance/individual/');
    await expect(page.locator('h1')).toContainText('Performance Metrics');
  });

  test('should display individual performance page with charts', async ({ page }) => {
    // Navigate to individual performance page - replace with actual model ID
    await page.goto('/dashboard/admin/performance/individual/model-id');
    
    // Check for performance tab content
    await expect(page.locator('text=Performance Metrics')).toBeVisible();
    
    // Check for chart tabs 
    await expect(page.locator('text=Overview')).toBeVisible();
    await expect(page.locator('text=Earnings')).toBeVisible();
    await expect(page.locator('text=Engagement')).toBeVisible();
    
    // Verify charts are rendered
    await expect(page.locator('.recharts-surface')).toBeVisible();
  });

  test('should switch between chart types on individual performance page', async ({ page }) => {
    // Navigate to individual performance page
    await page.goto('/dashboard/admin/performance/individual/model-id');
    
    // Click on Earnings tab
    await page.click('button:has-text("Earnings")');
    
    // Verify earnings chart content is visible
    await expect(page.locator('text=Earnings Analysis')).toBeVisible();
    
    // Click on Engagement tab
    await page.click('button:has-text("Engagement")');
    
    // Verify engagement chart content is visible
    await expect(page.locator('text=Engagement Metrics')).toBeVisible();
  });

  test('should filter individual performance reports by date range', async ({ page }) => {
    // Navigate to individual performance page
    await page.goto('/dashboard/admin/performance/individual/model-id');
    
    // Open start date picker and select a date
    await page.click('text=Start Date >> button');
    await page.click('button:has-text("10")'); // Click on the 10th day
    
    // Open end date picker and select a date
    await page.click('text=End Date >> button');
    await page.click('button:has-text("20")'); // Click on the 20th day
    
    // Wait for data to refresh
    await page.waitForResponse(response => 
      response.url().includes('performance.listReports') && 
      response.status() === 200
    );
    
    // Verify charts update
    await expect(page.locator('.recharts-surface')).toBeVisible();
  });

  test('should handle no data scenario gracefully on performance pages', async ({ page }) => {
    // Navigate to a model with no performance data - replace with known empty model ID
    await page.goto('/dashboard/admin/performance/individual/empty-model-id');
    
    // Check if empty state message is displayed
    await expect(page.locator('text=No performance reports found')).toBeVisible();
  });

  test('should enforce access control on performance pages', async ({ page }) => {
    // First logout
    await page.goto('/logout');
    
    // Log in as a regular user without manager permissions
    await page.goto('/login');
    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Attempt to access manager-only page
    await page.goto('/dashboard/admin/performance/collective');
    
    // Should see forbidden message
    await expect(page.locator('text=Access Denied')).toBeVisible();
  });
}); 