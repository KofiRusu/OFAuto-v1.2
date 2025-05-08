import { test, expect } from '@playwright/test';

test.describe('Linktree Profile Generator', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before each test
    await page.goto('/login');
  });

  test('manager can access linktree management page', async ({ page }) => {
    // Login as manager
    await page.fill('[name="email"]', 'manager@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to admin linktree page
    await page.goto('/dashboard/admin/linktree');
    
    // Check if the page title is displayed
    await expect(page.locator('h1')).toContainText('Linktree Management');
    
    // Check for user selection dropdown
    await expect(page.getByText('Select User')).toBeVisible();
    
    // Click on user selection dropdown
    await page.getByText('Select a user').click();
    
    // Select first user from dropdown
    await page.getByRole('option').first().click();
    
    // Verify tabs are present
    await expect(page.getByRole('tab', { name: 'Edit Linktree' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Preview' })).toBeVisible();
  });
  
  test('manager can create and edit linktree for a model', async ({ page }) => {
    // Login as manager
    await page.fill('[name="email"]', 'manager@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to admin linktree page
    await page.goto('/dashboard/admin/linktree');
    
    // Select a model user
    await page.getByText('Select a user').click();
    await page.getByRole('option').first().click();
    
    // Wait for the editor to load
    await page.waitForSelector('button:has-text("Add Link")');
    
    // Add a new link
    await page.getByRole('button', { name: 'Add Link' }).click();
    
    // Fill in link details
    const linkTitle = `Instagram ${Date.now()}`;
    await page.locator('input[placeholder="My Instagram"]').last().fill(linkTitle);
    await page.locator('input[placeholder="https://instagram.com/myusername"]').last().fill('https://instagram.com/testuser');
    
    // Select a theme
    await page.getByText('Select a theme').click();
    await page.getByRole('option', { name: 'Dark Mode' }).click();
    
    // Save changes
    await page.getByRole('button', { name: 'Save Changes' }).click();
    
    // Verify success toast
    await expect(page.getByText('Linktree updated')).toBeVisible();
    
    // Switch to preview tab
    await page.getByRole('tab', { name: 'Preview' }).click();
    
    // Verify the link appears in preview
    await expect(page.getByRole('button', { name: linkTitle })).toBeVisible();
  });
  
  test('manager can generate link suggestions', async ({ page }) => {
    // Login as manager
    await page.fill('[name="email"]', 'manager@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to admin linktree page
    await page.goto('/dashboard/admin/linktree');
    
    // Select a model user
    await page.getByText('Select a user').click();
    await page.getByRole('option').first().click();
    
    // Wait for the editor to load
    await page.waitForSelector('button:has-text("Generate Suggestions")');
    
    // Click generate suggestions
    await page.getByRole('button', { name: 'Generate Suggestions' }).click();
    
    // Wait for suggestions to be generated (toast message)
    await expect(page.getByText('Generated link suggestions')).toBeVisible();
    
    // Verify at least one link was generated
    await expect(page.locator('input[placeholder="My Instagram"]')).toBeVisible();
    await expect(page.locator('input[placeholder="https://instagram.com/myusername"]')).toBeVisible();
  });
  
  test('model can access their own linktree page', async ({ page }) => {
    // Login as model
    await page.fill('[name="email"]', 'model@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to model linktree page
    await page.goto('/dashboard/linktree');
    
    // Check if the page title is displayed
    await expect(page.locator('h1')).toContainText('My Linktree');
    
    // Check for shareable link section
    await expect(page.getByText('Share Your Linktree')).toBeVisible();
    
    // Verify tabs are present
    await expect(page.getByRole('tab', { name: 'Edit Linktree' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Preview' })).toBeVisible();
  });
  
  test('model can edit their own linktree', async ({ page }) => {
    // Login as model
    await page.fill('[name="email"]', 'model@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to model linktree page
    await page.goto('/dashboard/linktree');
    
    // Add a new link
    await page.getByRole('button', { name: 'Add Link' }).click();
    
    // Fill in link details
    const linkTitle = `OnlyFans ${Date.now()}`;
    await page.locator('input[placeholder="My Instagram"]').last().fill(linkTitle);
    await page.locator('input[placeholder="https://instagram.com/myusername"]').last().fill('https://onlyfans.com/testuser');
    
    // Select a theme
    await page.getByText('Select a theme').click();
    await page.getByRole('option', { name: 'Neon' }).click();
    
    // Save changes
    await page.getByRole('button', { name: 'Save Changes' }).click();
    
    // Verify success toast
    await expect(page.getByText('Linktree updated successfully')).toBeVisible();
    
    // Switch to preview tab
    await page.getByRole('tab', { name: 'Preview' }).click();
    
    // Verify the link appears in preview
    await expect(page.getByRole('button', { name: linkTitle })).toBeVisible();
  });
  
  test('model can generate their own link suggestions', async ({ page }) => {
    // Login as model
    await page.fill('[name="email"]', 'model@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to model linktree page
    await page.goto('/dashboard/linktree');
    
    // Wait for the editor to load
    await page.waitForSelector('button:has-text("Generate Suggestions")');
    
    // Click generate suggestions
    await page.getByRole('button', { name: 'Generate Suggestions' }).click();
    
    // Wait for suggestions to be generated (toast message)
    await expect(page.getByText('Generated link suggestions')).toBeVisible();
    
    // Verify at least one link was generated
    await expect(page.locator('input[placeholder="My Instagram"]')).toBeVisible();
    await expect(page.locator('input[placeholder="https://instagram.com/myusername"]')).toBeVisible();
  });
  
  test('model cannot access admin linktree page', async ({ page }) => {
    // Login as model
    await page.fill('[name="email"]', 'model@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Try to navigate to admin linktree page
    await page.goto('/dashboard/admin/linktree');
    
    // Should be redirected or see access denied
    await expect(page.getByText(/access denied|unauthorized|forbidden/i)).toBeVisible();
  });
  
  test('model can copy shareable link', async ({ page }) => {
    // Login as model
    await page.fill('[name="email"]', 'model@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to model linktree page
    await page.goto('/dashboard/linktree');
    
    // Click copy button
    await page.getByRole('button', { name: 'Copy' }).click();
    
    // Verify success toast
    await expect(page.getByText('Link copied to clipboard')).toBeVisible();
  });
}); 