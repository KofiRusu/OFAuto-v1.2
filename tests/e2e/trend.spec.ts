import { test, expect } from '@playwright/test';

test.describe('Trend Analysis', () => {
  test.beforeEach(async ({ page }) => {
    // Go to application and login
    await page.goto('/dashboard');
    
    // Mock authentication - assumes an auth bypass is provided in the test environment
    await page.evaluate(() => {
      localStorage.setItem('mock-auth', JSON.stringify({
        userId: 'test-admin',
        role: 'ADMIN',
      }));
    });
    
    await page.reload();
    
    // Navigate to Trends page
    await page.getByRole('link', { name: 'Trends' }).click();
  });
  
  test('should display trend analysis dashboard', async ({ page }) => {
    // Verify page heading
    await expect(page.getByRole('heading', { name: 'Trend Analysis' })).toBeVisible();
    
    // Check that source filter tabs are present
    await expect(page.getByRole('tab', { name: 'All Sources' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Twitter' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'TikTok' })).toBeVisible();
    
    // Check that Refresh Trends button is present
    await expect(page.getByRole('button', { name: 'Refresh Trends' })).toBeVisible();
  });
  
  test('should filter trends by source', async ({ page }) => {
    // Wait for trends to load
    await page.waitForSelector('.card');
    
    // Switch to Twitter tab
    await page.getByRole('tab', { name: 'Twitter' }).click();
    
    // Check Twitter-specific message is shown
    await expect(page.getByText('Twitter trends are updated hourly')).toBeVisible();
    
    // Switch to TikTok tab
    await page.getByRole('tab', { name: 'TikTok' }).click();
    
    // Check TikTok-specific message is shown
    await expect(page.getByText('TikTok trends include popular hashtags')).toBeVisible();
  });
  
  test('should refresh trends when button is clicked', async ({ page }) => {
    // Wait for trends to load
    await page.waitForSelector('.card');
    
    // Click refresh button
    await page.getByRole('button', { name: 'Refresh Trends' }).click();
    
    // Verify loading state appears
    await expect(page.getByText('Refreshing...')).toBeVisible();
    
    // Verify success toast appears eventually
    await expect(page.getByText('Trends refreshed')).toBeVisible({ timeout: 5000 });
  });
  
  test('should show trend details when a trend card is clicked', async ({ page }) => {
    // Wait for trends to load
    await page.waitForSelector('.card');
    
    // Get all trend cards
    const trendCards = await page.locator('.card').all();
    
    // Verify there are trend cards
    expect(trendCards.length).toBeGreaterThan(0);
    
    // Click the first trend card
    await trendCards[0].click();
    
    // Verify trend details view is shown
    await expect(page.getByRole('button', { name: '← Back to Trends' })).toBeVisible();
    
    // Verify chart and boost score sections are shown
    await expect(page.getByText('Trend metrics over time')).toBeVisible();
    await expect(page.getByText('Boost Score')).toBeVisible();
    
    // Verify suggestions section is shown
    await expect(page.getByText('Content Suggestions')).toBeVisible();
  });
  
  test('should change timeframe in trend details', async ({ page }) => {
    // Wait for trends to load
    await page.waitForSelector('.card');
    
    // Click the first trend card
    await page.locator('.card').first().click();
    
    // Wait for trend details to load
    await expect(page.getByText('Trend metrics over time')).toBeVisible();
    
    // Open the timeframe dropdown
    await page.getByRole('combobox').click();
    
    // Select "Last Week"
    await page.getByRole('option', { name: 'Last Week' }).click();
    
    // Verify the timeframe changes (the select value updates)
    await expect(page.getByRole('combobox')).toHaveValue('week');
  });
  
  test('admin should be able to access trend settings', async ({ page }) => {
    // Navigate to admin settings
    await page.goto('/dashboard/admin/trends/settings');
    
    // Verify settings page is loaded
    await expect(page.getByRole('heading', { name: 'Trend Analysis Settings' })).toBeVisible();
    
    // Check that general settings section is present
    await expect(page.getByText('General Settings')).toBeVisible();
    
    // Check that trend sources section is present
    await expect(page.getByText('Trend Sources')).toBeVisible();
    
    // Check that Twitter tab is present in sources
    await expect(page.getByRole('tab', { name: 'Twitter' })).toBeVisible();
  });
  
  test('admin should be able to update trend settings', async ({ page }) => {
    // Navigate to admin settings
    await page.goto('/dashboard/admin/trends/settings');
    
    // Wait for settings form to load
    await page.waitForSelector('form');
    
    // Change refresh interval using slider
    const sliderTrack = page.locator('form').locator('div').filter({ hasText: 'Refresh Interval' }).locator('[role="slider"]');
    await sliderTrack.click();
    
    // Toggle auto-suggest posts switch
    await page.getByText('Auto-suggest posts').click();
    
    // Go to Twitter tab in sources
    await page.getByRole('tab', { name: 'Twitter' }).click();
    
    // Enter API key
    await page.getByLabel('API Key').fill('test-api-key');
    
    // Save settings
    await page.getByRole('button', { name: 'Save Settings' }).click();
    
    // Verify success toast appears
    await expect(page.getByText('Settings updated')).toBeVisible({ timeout: 5000 });
  });
  
  test('should toggle show/hide API secrets', async ({ page }) => {
    // Navigate to admin settings
    await page.goto('/dashboard/admin/trends/settings');
    
    // Wait for settings form to load
    await page.waitForSelector('form');
    
    // Go to Twitter tab in sources
    await page.getByRole('tab', { name: 'Twitter' }).click();
    
    // Verify API Secret field is password type initially
    expect(await page.getByLabel('API Secret').getAttribute('type')).toBe('password');
    
    // Click show keys button
    await page.getByRole('button', { name: 'Show Keys' }).click();
    
    // Verify API Secret field is now text type
    expect(await page.getByLabel('API Secret').getAttribute('type')).toBe('text');
    
    // Click hide keys button
    await page.getByRole('button', { name: 'Hide Keys' }).click();
    
    // Verify API Secret field is password type again
    expect(await page.getByLabel('API Secret').getAttribute('type')).toBe('password');
  });
}); 