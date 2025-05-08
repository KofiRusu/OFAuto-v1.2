import { test, expect } from '@playwright/test';

test.describe('KPI & Objective Setters', () => {
  test.beforeEach(async ({ page }) => {
    // Log in as a manager
    await page.goto('/login');
    await page.fill('[name="email"]', 'manager@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForURL('/dashboard');
  });

  test('should navigate to KPI management page', async ({ page }) => {
    // Navigate to KPI management page
    await page.goto('/dashboard/admin/kpi');
    
    // Check if the page title is displayed
    await expect(page.locator('h1')).toContainText('KPI & Objective Management');
    
    // Check for main components
    await expect(page.getByText('Create New KPI')).toBeVisible();
    await expect(page.getByText('KPI List')).toBeVisible();
  });

  test('should create a new KPI', async ({ page }) => {
    // Navigate to KPI management page
    await page.goto('/dashboard/admin/kpi');
    
    // Fill the KPI creation form
    await page.locator('button').filter({ hasText: 'Select a user' }).click();
    await page.getByRole('option').first().click(); // Select the first user
    
    await page.locator('input#name').fill('New Test KPI');
    await page.locator('input#targetValue').fill('1000');
    
    // Set due date to end of month
    await page.getByText('Select a date').click();
    await page.locator('.rdp-day').last().click();
    
    // Submit the form
    await page.getByRole('button', { name: 'Create KPI' }).click();
    
    // Wait for success toast
    await expect(page.getByText('KPI Created')).toBeVisible();
    
    // Verify the KPI appears in the list
    await expect(page.getByText('New Test KPI')).toBeVisible();
  });

  test('should filter KPIs by user and status', async ({ page }) => {
    // Navigate to KPI management page
    await page.goto('/dashboard/admin/kpi');
    
    // Wait for the KPI list to load
    await page.waitForSelector('table');
    
    // Filter by user
    await page.locator('button').filter({ hasText: 'Filter by user' }).click();
    await page.getByRole('option').nth(1).click(); // Select the first user option
    
    // Wait for the filtered list
    await page.waitForResponse(response => 
      response.url().includes('kpi.listKpis') && 
      response.status() === 200
    );
    
    // Filter by status
    await page.locator('button').filter({ hasText: 'Filter by status' }).click();
    await page.getByRole('option', { name: 'In Progress' }).click();
    
    // Wait for the filtered list
    await page.waitForResponse(response => 
      response.url().includes('kpi.listKpis') && 
      response.status() === 200
    );
  });

  test('should view KPI details page', async ({ page }) => {
    // Navigate to KPI management page
    await page.goto('/dashboard/admin/kpi');
    
    // Wait for KPI list to load
    await page.waitForSelector('table');
    
    // Click view button on first KPI
    await page.locator('button[title="View Details"]').first().click();
    
    // Check we're on the details page
    await expect(page.locator('h1')).toContainText('KPI Details');
    
    // Verify details content
    await expect(page.getByText('Progress')).toBeVisible();
    await expect(page.getByText('Created')).toBeVisible();
    await expect(page.getByText('Due Date')).toBeVisible();
  });

  test('should update KPI progress and verify progress bar updates', async ({ page }) => {
    // Create a KPI first
    await page.goto('/dashboard/admin/kpi');
    
    // Fill the KPI creation form with a known name
    await page.locator('button').filter({ hasText: 'Select a user' }).click();
    await page.getByRole('option').first().click();
    
    const kpiName = `Progress Test KPI ${Date.now()}`;
    await page.locator('input#name').fill(kpiName);
    await page.locator('input#targetValue').fill('100');
    
    // Submit the form
    await page.getByRole('button', { name: 'Create KPI' }).click();
    
    // Wait for the KPI to appear in the list
    await expect(page.getByText(kpiName)).toBeVisible();
    
    // Click view button on the newly created KPI
    await page.getByText(kpiName).click();
    // Wait to be redirected to detail page
    await expect(page.locator('h1')).toContainText('KPI Details');
    
    // Click Edit button
    await page.getByRole('button', { name: 'Edit KPI' }).click();
    
    // Update current value to 50% progress
    await page.locator('input#currentValue').fill('50');
    
    // Save changes
    await page.getByRole('button', { name: 'Save Changes' }).click();
    
    // Wait for success toast
    await expect(page.getByText('KPI Updated')).toBeVisible();
    
    // Verify progress bar shows 50%
    await expect(page.getByText('50 / 100 (50%)')).toBeVisible();
    
    // Update to 100% progress
    await page.getByRole('button', { name: 'Edit KPI' }).click();
    await page.locator('input#currentValue').fill('100');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    
    // Verify status automatically changed to COMPLETED
    await expect(page.getByText('COMPLETED')).toBeVisible();
    await expect(page.getByText('100 / 100 (100%)')).toBeVisible();
  });

  test('should delete a KPI', async ({ page }) => {
    // Create a KPI first
    await page.goto('/dashboard/admin/kpi');
    
    // Fill the KPI creation form with a known name
    await page.locator('button').filter({ hasText: 'Select a user' }).click();
    await page.getByRole('option').first().click();
    
    const kpiName = `Delete Test KPI ${Date.now()}`;
    await page.locator('input#name').fill(kpiName);
    await page.locator('input#targetValue').fill('100');
    
    // Submit the form
    await page.getByRole('button', { name: 'Create KPI' }).click();
    
    // Wait for the KPI to appear in the list
    await expect(page.getByText(kpiName)).toBeVisible();
    
    // Find and click the delete button for this KPI
    const row = page.getByText(kpiName).locator('..').locator('..');
    await row.locator('button[title="Delete KPI"]').click();
    
    // Confirm the delete dialog
    await page.keyboard.press('Enter'); // Accept the confirm dialog
    
    // Wait for success toast
    await expect(page.getByText('KPI Deleted')).toBeVisible();
    
    // Verify KPI no longer exists in the list
    await expect(page.getByText(kpiName)).not.toBeVisible();
  });

  test('should handle empty state when no KPIs exist', async ({ page }) => {
    // We would ideally clear all KPIs first, but for test purposes
    // we'll use a filter that should return no results
    await page.goto('/dashboard/admin/kpi');
    
    // Select a non-existent user
    await page.locator('button').filter({ hasText: 'Filter by user' }).click();
    // Assuming there's a "Non-existent User" option or similar for testing
    await page.getByRole('option').filter({ hasText: 'Test User' }).click();
    
    // Wait for filtered results
    await page.waitForResponse(response => 
      response.url().includes('kpi.listKpis') && 
      response.status() === 200
    );
    
    // Check for empty state message
    await expect(page.getByText('No KPIs found')).toBeVisible();
  });

  test('should enforce access control on KPI pages', async ({ page }) => {
    // First logout
    await page.goto('/logout');
    
    // Log in as a regular user without manager permissions
    await page.goto('/login');
    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Attempt to access manager-only page
    await page.goto('/dashboard/admin/kpi');
    
    // Should see forbidden message
    await expect(page.getByText('Access Denied')).toBeVisible();
  });
  
  test('should allow model users to update their own KPIs', async ({ page }) => {
    // First logout
    await page.goto('/logout');
    
    // Log in as a model user
    await page.goto('/login');
    await page.fill('[name="email"]', 'model@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to their KPI page
    // Models likely access this through a different route than managers
    await page.goto('/dashboard/kpi');
    
    // Verify they can see their KPIs but not create new ones
    await expect(page.getByText('My KPIs')).toBeVisible();
    await expect(page.getByText('Create New KPI')).not.toBeVisible();
    
    // Click on a KPI to view details
    await page.locator('table tr').first().click();
    
    // Edit their progress
    await page.getByRole('button', { name: 'Edit KPI' }).click();
    await page.locator('input#currentValue').fill('75');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    
    // Verify update was successful
    await expect(page.getByText('KPI Updated')).toBeVisible();
  });
}); 