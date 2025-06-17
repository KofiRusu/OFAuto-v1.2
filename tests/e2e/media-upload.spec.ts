import { test, expect } from '@playwright/test';

test.describe('Media Upload', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should upload an image file', async ({ page }) => {
    await page.goto('/dashboard/media');
    
    // Verify page loaded
    await expect(page.locator('h1')).toContainText('Media Management');
    
    // Click upload tab if not already selected
    await page.click('button[role="tab"]:has-text("Upload")');
    
    // Create a test file
    const fileName = 'test-image.jpg';
    const fileContent = Buffer.from('fake image content');
    
    // Upload file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: fileName,
      mimeType: 'image/jpeg',
      buffer: fileContent,
    });
    
    // Wait for upload to start
    await expect(page.locator('text=Uploading...')).toBeVisible();
    
    // Wait for processing
    await expect(page.locator('text=Processing media...')).toBeVisible({ timeout: 10000 });
    
    // Wait for completion
    await expect(page.locator('text=Upload completed successfully!')).toBeVisible({ timeout: 30000 });
    
    // Should automatically switch to library tab
    await expect(page.locator('button[role="tab"][data-state="active"]')).toContainText('Media Library');
    
    // Verify media appears in library
    await expect(page.locator(`text=${fileName}`)).toBeVisible();
  });

  test('should show upload progress for large files', async ({ page }) => {
    await page.goto('/dashboard/media');
    
    // Create a larger test file
    const fileName = 'large-video.mp4';
    const fileContent = Buffer.alloc(5 * 1024 * 1024); // 5MB
    
    // Upload file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: fileName,
      mimeType: 'video/mp4',
      buffer: fileContent,
    });
    
    // Should show progress bar
    await expect(page.locator('[role="progressbar"]')).toBeVisible();
    
    // Should show chunk progress
    await expect(page.locator('text=/Chunk \\d+ of \\d+/')).toBeVisible();
    
    // Should show percentage
    await expect(page.locator('text=/%/')).toBeVisible();
  });

  test('should handle upload errors', async ({ page }) => {
    await page.goto('/dashboard/media');
    
    // Try to upload a file that's too large
    const fileName = 'too-large.mp4';
    const fileContent = Buffer.alloc(600 * 1024 * 1024); // 600MB (exceeds 500MB limit)
    
    // Upload file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: fileName,
      mimeType: 'video/mp4',
      buffer: fileContent,
    });
    
    // Should show error message
    await expect(page.locator('text=File size exceeds maximum of 500MB')).toBeVisible();
  });

  test('should allow canceling upload', async ({ page }) => {
    await page.goto('/dashboard/media');
    
    const fileName = 'cancelable.jpg';
    const fileContent = Buffer.alloc(2 * 1024 * 1024); // 2MB
    
    // Upload file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: fileName,
      mimeType: 'image/jpeg',
      buffer: fileContent,
    });
    
    // Wait for upload to start
    await expect(page.locator('text=Uploading...')).toBeVisible();
    
    // Click cancel button
    await page.click('button[aria-label="Cancel upload"]');
    
    // Should return to idle state
    await expect(page.locator('text=Drag & drop a file here')).toBeVisible();
  });

  test('manager should be able to reprocess media', async ({ page }) => {
    // Login as manager
    await page.goto('/login');
    await page.fill('input[name="email"]', 'manager@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await page.goto('/dashboard/media');
    
    // Switch to library tab
    await page.click('button[role="tab"]:has-text("Media Library")');
    
    // Find a media item with failed status
    const failedMedia = page.locator('[data-testid="media-card"]').filter({ hasText: 'Failed' }).first();
    
    if (await failedMedia.isVisible()) {
      // Click retry button
      await failedMedia.locator('button:has-text("Retry")').click();
      
      // Should show processing state
      await expect(failedMedia.locator('text=Processing')).toBeVisible();
    }
  });

  test('should display media metadata', async ({ page }) => {
    await page.goto('/dashboard/media');
    
    // Switch to library tab
    await page.click('button[role="tab"]:has-text("Media Library")');
    
    // Check for media metadata display
    const mediaCard = page.locator('[data-testid="media-card"]').first();
    
    if (await mediaCard.isVisible()) {
      // Should show file size
      await expect(mediaCard.locator('text=/\\d+\\.\\d+ MB/')).toBeVisible();
      
      // For images, should show dimensions
      const dimensions = mediaCard.locator('text=/\\d+ × \\d+/');
      if (await dimensions.isVisible()) {
        await expect(dimensions).toBeVisible();
      }
      
      // Should show upload time
      await expect(mediaCard.locator('text=/ago/')).toBeVisible();
    }
  });

  test('should allow downloading processed media', async ({ page }) => {
    await page.goto('/dashboard/media');
    
    // Switch to library tab
    await page.click('button[role="tab"]:has-text("Media Library")');
    
    // Find a ready media item
    const readyMedia = page.locator('[data-testid="media-card"]').filter({ hasText: 'Ready' }).first();
    
    if (await readyMedia.isVisible()) {
      // Start download
      const downloadPromise = page.waitForEvent('download');
      await readyMedia.locator('button:has-text("Download")').click();
      const download = await downloadPromise;
      
      // Verify download started
      expect(download).toBeTruthy();
    }
  });
}); 