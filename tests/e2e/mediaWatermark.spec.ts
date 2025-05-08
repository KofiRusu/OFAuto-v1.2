import { test, expect } from '@playwright/test';

test.describe('Media Watermarking', () => {
  test.beforeEach(async ({ page }) => {
    // Go to application and login
    await page.goto('/dashboard');
    
    // Mock authentication - assumes an auth bypass is provided in the test environment
    await page.evaluate(() => {
      localStorage.setItem('mock-auth', JSON.stringify({
        userId: 'test-user',
        role: 'ADMIN',
      }));
    });
    
    await page.reload();
    
    // Navigate to Media Management
    await page.getByRole('link', { name: 'Media' }).click();
  });
  
  test('should upload and watermark media', async ({ page }) => {
    // Click the "Upload Media" button
    await page.getByRole('button', { name: 'Upload Media' }).click();
    
    // Upload file in the modal
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-content'),
    });
    
    // Wait for upload to complete
    await expect(page.getByText('Upload complete')).toBeVisible();
    
    // Click on "Apply Watermark" button for the uploaded image
    await page.getByRole('button', { name: 'Apply Watermark' }).click();
    
    // Select watermark profile in the dialog
    await page.getByLabel('Watermark Profile').click();
    await page.getByText('Company Logo').click();
    
    // Adjust watermark settings
    await page.getByLabel('Opacity:').click();
    await page.locator('div[role="slider"]').click();
    
    // Click Apply button
    await page.getByRole('button', { name: 'Apply Watermark' }).click();
    
    // Wait for success message
    await expect(page.getByText('Watermark applied successfully')).toBeVisible();
    
    // Verify watermarked image is displayed
    await expect(page.locator('.watermarked-image')).toBeVisible();
  });
  
  test('should create a new watermark profile', async ({ page }) => {
    // Click on "Watermark Profiles" tab
    await page.getByRole('tab', { name: 'Watermark Profiles' }).click();
    
    // Click "Create Profile" button
    await page.getByRole('button', { name: 'Create Profile' }).click();
    
    // Fill profile details
    await page.getByLabel('Name').fill('Test Watermark');
    
    // Upload logo
    const logoInput = page.locator('input[type="file"][name="logo"]');
    await logoInput.setInputFiles({
      name: 'logo.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-logo-content'),
    });
    
    // Select position
    await page.getByLabel('Position').click();
    await page.getByText('Bottom Right').click();
    
    // Adjust opacity
    await page.locator('div[role="slider"]').click();
    
    // Save profile
    await page.getByRole('button', { name: 'Save Profile' }).click();
    
    // Wait for success message
    await expect(page.getByText('Profile created successfully')).toBeVisible();
    
    // Verify new profile appears in the list
    await expect(page.getByText('Test Watermark')).toBeVisible();
  });
  
  test('should watermark media while scheduling post', async ({ page }) => {
    // Navigate to Content Scheduler
    await page.getByRole('link', { name: 'Content Scheduler' }).click();
    
    // Click "Create New Post" button
    await page.getByRole('button', { name: 'Create New Post' }).click();
    
    // Fill post details
    await page.getByLabel('Title').fill('Test Post with Watermark');
    
    // Select platform
    await page.getByText('OnlyFans').click();
    
    // Add content
    await page.getByLabel('Content').fill('This is a test post with watermarked content.');
    
    // Go to Media tab
    await page.getByRole('tab', { name: 'Media' }).click();
    
    // Upload media
    const mediaInput = page.locator('input[type="file"]');
    await mediaInput.setInputFiles({
      name: 'test-content.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-post-image-content'),
    });
    
    // Wait for upload
    await expect(page.getByText('Upload complete')).toBeVisible();
    
    // Go to Watermark tab
    await page.getByRole('tab', { name: 'Watermark' }).click();
    
    // Select watermark profile
    await page.getByLabel('Watermark Profile').click();
    await page.getByText('Company Logo').click();
    
    // Schedule the post
    await page.getByRole('tab', { name: 'Schedule' }).click();
    await page.getByLabel('Schedule Now').check();
    
    // Submit the post
    await page.getByRole('button', { name: 'Post Now' }).click();
    
    // Wait for success message
    await expect(page.getByText('Post has been created')).toBeVisible();
  });
}); 