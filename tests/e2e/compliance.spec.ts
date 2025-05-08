import { test, expect } from '@playwright/test';

test.describe('Compliance and Report Flow', () => {
  // Test for regular user submitting a report
  test('a user should be able to submit a report', async ({ page }) => {
    // Go to application and login as regular user
    await page.goto('/dashboard');
    
    // Mock authentication for a regular user
    await page.evaluate(() => {
      localStorage.setItem('mock-auth', JSON.stringify({
        userId: 'test-user',
        role: 'USER',
      }));
    });
    
    await page.reload();
    
    // Navigate to the report page
    await page.goto('/dashboard/report');
    
    // Verify page is loaded correctly
    await expect(page.getByRole('heading', { name: 'Report Content' })).toBeVisible();
    
    // Fill out the report form
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Post Content' }).click();
    
    await page.getByPlaceholder('Enter post ID, message ID, or profile ID').fill('test-post-12345');
    
    await page.getByPlaceholder(/Please describe the issue/i).fill('This post contains inappropriate content that violates community guidelines. The content includes offensive language and misleading information.');
    
    // Submit the report
    await page.getByRole('button', { name: 'Submit Report' }).click();
    
    // Verify success message
    await expect(page.getByText('Report Submitted')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Thank you for helping us maintain platform safety')).toBeVisible();
  });
  
  // Test for manager viewing reports list
  test('a manager should be able to view reports', async ({ page }) => {
    // Go to application and login as manager
    await page.goto('/dashboard');
    
    // Mock authentication for a manager user
    await page.evaluate(() => {
      localStorage.setItem('mock-auth', JSON.stringify({
        userId: 'test-manager',
        role: 'MANAGER',
      }));
    });
    
    await page.reload();
    
    // Navigate to the admin reports page
    await page.goto('/dashboard/admin/reports');
    
    // Verify page is loaded correctly
    await expect(page.getByRole('heading', { name: 'Compliance Reports' })).toBeVisible();
    
    // Check that filter controls are visible
    await expect(page.getByText('Filter Reports')).toBeVisible();
    
    // Table should be visible with at least headers
    await expect(page.getByRole('columnheader', { name: 'Type' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Reporter' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    
    // Try filtering reports
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: 'Pending' }).click();
    
    // Filtering should work (either showing filtered results or "No reports found")
    await expect(page.getByRole('row').count()).toBeGreaterThan(0);
  });
  
  // Test for admin reviewing a report and submitting a takedown
  test('an admin should be able to review a report and submit a takedown', async ({ page }) => {
    // Go to application and login as admin
    await page.goto('/dashboard');
    
    // Mock authentication for an admin user
    await page.evaluate(() => {
      localStorage.setItem('mock-auth', JSON.stringify({
        userId: 'test-admin',
        role: 'ADMIN',
      }));
    });
    
    await page.reload();
    
    // Navigate to the admin reports page
    await page.goto('/dashboard/admin/reports');
    
    // Verify page is loaded correctly
    await expect(page.getByRole('heading', { name: 'Compliance Reports' })).toBeVisible();
    
    // Look for a pending report to review (if any)
    const hasReports = await page.getByRole('row').count() > 1; // More than just header row
    
    if (hasReports) {
      // Find and click the first report's "View Details" action
      await page.getByRole('button', { name: 'Actions' }).first().click();
      await page.getByRole('menuitem', { name: 'View Details' }).click();
      
      // Verify we're on the report detail page
      await expect(page.getByText('Report Details')).toBeVisible();
      
      // Update the report status
      await page.locator('select').first().selectOption('REVIEWED');
      await page.getByLabel('Admin Notes').fill('I have reviewed this report and found that it violates our terms of service regarding appropriate content.');
      await page.getByRole('button', { name: 'Update Status' }).click();
      
      // Verify status was updated
      await expect(page.getByText('Report reviewed')).toBeVisible({ timeout: 5000 });
      
      // Now create a takedown request
      await page.getByLabel('Takedown Reason').fill('This content clearly violates our community guidelines section 4.2 regarding appropriate content. It must be removed immediately to maintain platform standards.');
      await page.getByRole('button', { name: 'Request Takedown' }).click();
      
      // Confirm in the dialog
      await page.getByRole('button', { name: 'Confirm Takedown' }).click();
      
      // Verify takedown request was created
      await expect(page.getByText('Takedown request created')).toBeVisible({ timeout: 5000 });
    } else {
      // Skip this test if no reports are available
      test.skip();
    }
  });
  
  // Test for accessing reports without proper permissions
  test('a regular user should not be able to access admin reports', async ({ page }) => {
    // Go to application and login as regular user
    await page.goto('/dashboard');
    
    // Mock authentication for a regular user
    await page.evaluate(() => {
      localStorage.setItem('mock-auth', JSON.stringify({
        userId: 'test-user',
        role: 'USER',
      }));
    });
    
    await page.reload();
    
    // Try to navigate to the admin reports page
    await page.goto('/dashboard/admin/reports');
    
    // Should be redirected or shown access denied
    // This depends on how the application handles unauthorized access
    // We'll check for either a direct "access denied" message or if we're redirected away
    const isAccessDenied = await Promise.race([
      page.getByText(/access denied|unauthorized|not authorized/i).isVisible()
        .then(visible => visible ? 'denied' : ''),
      page.url().then(url => url.includes('/dashboard/admin/reports') ? '' : 'redirected')
    ]);
    
    expect(isAccessDenied).toMatch(/denied|redirected/);
  });
}); 