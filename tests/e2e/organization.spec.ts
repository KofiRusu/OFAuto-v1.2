import { test, expect } from '@playwright/test';
import { UserRole } from '@prisma/client';

test.describe('Organization Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Login as a manager
    await page.goto('/login');
    await page.fill('input[name="email"]', 'manager@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display organization settings page', async ({ page }) => {
    await page.goto('/dashboard/admin/organization');
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Organization Settings');
    
    // Check main sections are visible
    await expect(page.locator('text=General Settings')).toBeVisible();
    await expect(page.locator('text=Referral Code')).toBeVisible();
  });

  test('should update organization settings', async ({ page }) => {
    await page.goto('/dashboard/admin/organization?clientId=test-client-123');
    
    // Fill in organization settings
    await page.fill('input[name="displayName"]', 'My Updated Organization');
    await page.fill('input[name="contactEmail"]', 'contact@myorg.com');
    await page.fill('input[name="primaryColor"]', '#4f46e5');
    
    // Submit form
    await page.click('button:has-text("Save Settings")');
    
    // Check for success message
    await expect(page.locator('text=Organization settings updated successfully')).toBeVisible();
  });

  test('should generate a new referral code', async ({ page }) => {
    await page.goto('/dashboard/admin/organization?clientId=test-client-123');
    
    // Click generate referral code button
    await page.click('button:has-text("Generate New Code")');
    
    // Check for success message
    await expect(page.locator('text=Referral code generated successfully')).toBeVisible();
    
    // Check that a referral code is displayed
    const referralCodeInput = page.locator('input[name="referralCode"]');
    const referralCode = await referralCodeInput.inputValue();
    expect(referralCode).toMatch(/^[A-Z]{3}-[A-Z0-9]{5}$/);
  });

  test('should update referral code manually', async ({ page }) => {
    await page.goto('/dashboard/admin/organization?clientId=test-client-123');
    
    // Update referral code
    await page.fill('input[name="referralCode"]', 'CUSTOM-CODE');
    await page.click('button:has-text("Update Code")');
    
    // Check for success message
    await expect(page.locator('text=Referral code updated successfully')).toBeVisible();
  });

  test('should show validation errors for invalid settings', async ({ page }) => {
    await page.goto('/dashboard/admin/organization?clientId=test-client-123');
    
    // Try to submit invalid email
    await page.fill('input[name="contactEmail"]', 'invalid-email');
    await page.click('button:has-text("Save Settings")');
    
    // Check for validation error
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
    
    // Try to submit invalid color
    await page.fill('input[name="primaryColor"]', 'not-a-color');
    await page.click('button:has-text("Save Settings")');
    
    // Check for validation error
    await expect(page.locator('text=Please enter a valid hex color')).toBeVisible();
  });

  test('should handle client selection', async ({ page }) => {
    await page.goto('/dashboard/admin/organization');
    
    // Select a client from dropdown
    await page.click('button[role="combobox"]');
    await page.click('text=Test Client 1');
    
    // Check URL is updated with clientId
    await expect(page).toHaveURL(/clientId=.+/);
    
    // Check that settings are loaded
    await expect(page.locator('input[name="displayName"]')).not.toBeEmpty();
  });

  test('should restrict access for non-manager users', async ({ page, context }) => {
    // Logout current user
    await page.goto('/logout');
    
    // Login as a regular user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Try to access organization settings
    await page.goto('/dashboard/admin/organization');
    
    // Should be redirected or show access denied
    await expect(page.locator('text=Access Denied')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page, context }) => {
    // Intercept API calls to simulate error
    await context.route('**/api/trpc/organization.updateOrgSettings', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'Internal Server Error' } }),
      });
    });
    
    await page.goto('/dashboard/admin/organization?clientId=test-client-123');
    
    // Try to update settings
    await page.fill('input[name="displayName"]', 'Test Org');
    await page.click('button:has-text("Save Settings")');
    
    // Check for error message
    await expect(page.locator('text=Failed to update organization settings')).toBeVisible();
  });

  test('should display loading states', async ({ page, context }) => {
    // Add delay to API response to test loading state
    await context.route('**/api/trpc/organization.getOrgSettings', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });
    
    await page.goto('/dashboard/admin/organization?clientId=test-client-123');
    
    // Check for loading indicator
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // Wait for content to load
    await expect(page.locator('text=General Settings')).toBeVisible({ timeout: 5000 });
  });

  test('should handle empty referral code', async ({ page }) => {
    await page.goto('/dashboard/admin/organization?clientId=test-client-123');
    
    // Clear referral code
    await page.fill('input[name="referralCode"]', '');
    await page.click('button:has-text("Update Code")');
    
    // Check for success message
    await expect(page.locator('text=Referral code removed successfully')).toBeVisible();
  });
}); 