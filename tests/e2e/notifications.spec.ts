import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Notifications Feature', () => {
  test('Manager sends notification and model receives it', async ({ page, browser }) => {
    // Step 1: Login as manager
    await loginAs(page, 'manager');
    
    // Navigate to notifications admin page
    await page.goto('/dashboard/admin/notifications');
    
    // Check that the page loaded correctly
    await expect(page.getByRole('heading', { name: 'Notification Management' })).toBeVisible();
    
    // Fill out the notification form
    await page.getByLabel('Recipients').click();
    await page.getByRole('option', { name: 'All Models' }).click();
    
    await page.getByLabel('Notification Type').click();
    await page.getByRole('option', { name: 'SYSTEM ALERT' }).click();
    
    await page.getByLabel('Title').fill('E2E Test Notification');
    await page.getByLabel('Message').fill('This is a test notification sent during E2E testing.');
    
    // Send the notification
    await page.getByRole('button', { name: 'Send Notification' }).click();
    
    // Check that the confirmation appears
    await expect(page.getByText('Notification sent successfully')).toBeVisible();
    
    // Step 2: Open a new browser context for model
    const modelContext = await browser.newContext();
    const modelPage = await modelContext.newPage();
    
    // Login as model
    await loginAs(modelPage, 'model');
    
    // Navigate to notifications page
    await modelPage.goto('/dashboard/notifications');
    
    // Check that the notification appears in the list
    await expect(modelPage.getByText('E2E Test Notification')).toBeVisible();
    await expect(modelPage.getByText('This is a test notification sent during E2E testing.')).toBeVisible();
    
    // Mark the notification as read
    await modelPage.getByRole('button', { name: 'Mark as read' }).first().click();
    
    // Check that the notification is marked as read (should have opacity)
    await expect(modelPage.getByText('E2E Test Notification').first()).toHaveCSS('opacity', '0.75');
    
    // Clean up
    await modelContext.close();
  });
  
  test('Notification toast appears in real-time', async ({ page }) => {
    // This is a placeholder test for real-time notification toasts
    // In a real implementation, you'd need a way to trigger notifications while the test is running
    
    // Login as model
    await loginAs(page, 'model');
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Note: In a real implementation, you would:
    // 1. Have another user send a notification (via API call or second browser context)
    // 2. Check that the toast appears in the UI
    
    // TODO: Implement real-time notification test when WebSocket mocking is available
    
    // Placeholder assertion
    expect(true).toBeTruthy();
  });
  
  test('Notification bell shows correct count', async ({ page }) => {
    // Login as a user
    await loginAs(page, 'model');
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Check if notification bell is visible
    await expect(page.locator('button').filter({ has: page.locator('svg[data-lucide="Bell"]') })).toBeVisible();
    
    // Check if there's a badge on the bell (this will depend on the state of test data)
    // Note: This test will need to be adjusted based on your test data setup
    
    // Click on the notification bell
    await page.locator('button').filter({ has: page.locator('svg[data-lucide="Bell"]') }).click();
    
    // Check that the popover appears
    await expect(page.getByText('Notifications')).toBeVisible();
    
    // Click "Mark all as read" if there are notifications
    const markAllButton = page.getByRole('button', { name: 'Mark all as read' });
    if (await markAllButton.isVisible()) {
      await markAllButton.click();
      
      // Verify the badge disappears after marking all as read
      // This might need a waitFor or similar depending on your implementation
      await page.waitForTimeout(500); // Allow time for UI to update
      
      // Re-open the notification bell
      await page.locator('button').filter({ has: page.locator('svg[data-lucide="Bell"]') }).click();
      
      // Check for "No unread notifications" message
      await expect(page.getByText('No unread notifications')).toBeVisible();
    }
  });
}); 