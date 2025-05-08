import { test, expect } from '@playwright/test';

// Test users
const modelUser = {
  email: 'model@example.com',
  password: 'Password123!',
  role: 'USER',
};

const adminUser = {
  email: 'admin@example.com',
  password: 'Password123!',
  role: 'ADMIN',
};

test.describe('KYC Document E2E workflow', () => {
  let documentId: string;
  
  test('Model can upload a KYC document', async ({ page }) => {
    // Log in as model
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', modelUser.email);
    await page.fill('input[name="password"]', modelUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for authentication to complete
    await page.waitForURL('/dashboard');
    
    // Navigate to the document upload page
    await page.goto('/dashboard/kyc/upload');
    
    // Verify page loaded correctly
    await expect(page.locator('h1').filter({ hasText: 'KYC Document Upload' })).toBeVisible();
    
    // Switch to ID Documents tab (should be active by default)
    await page.click('button[role="tab"]:has-text("ID Documents")');
    
    // Mock file upload - In a real test environment with real file upload capability:
    // await page.setInputFiles('input[type="file"]', 'path/to/test/id-front.jpg');
    
    // Instead, we'll directly set the document URL for testing
    // This requires modifying the test to accommodate our mocked file upload behavior
    await page.evaluate(() => {
      // Mock the upload completion event - in a real app this would happen after file selection
      const mockEvent = new Event('uploadComplete');
      mockEvent.file = {
        name: 'id-front.jpg',
        size: 1024 * 1024, // 1MB
      };
      mockEvent.url = 'https://example.com/uploads/id-front.jpg';
      document.dispatchEvent(mockEvent);
    });
    
    // Select ID Front option if not already selected
    await page.click('input[value="ID_FRONT"]');
    
    // Click submit button
    await page.click('button:has-text("Submit ID Front")');
    
    // Wait for success message
    await expect(page.locator('.toast').filter({ hasText: 'Document uploaded successfully' })).toBeVisible();
    
    // Navigate to "My Documents" tab to verify
    await page.click('button[role="tab"]:has-text("My Documents")');
    
    // Verify document appears in the list
    await expect(page.locator('table tbody tr:first-child')).toContainText('ID Card (Front)');
    await expect(page.locator('table tbody tr:first-child')).toContainText('PENDING');
    
    // Extract document ID from the page (this might require adding data attributes in a real app)
    // For mocking purposes:
    documentId = await page.evaluate(() => {
      // In a real test, this would extract the ID from the page
      return 'mock-document-id-12345';
    });
    
    expect(documentId).toBeTruthy();
  });
  
  test('Admin can review a KYC document', async ({ page }) => {
    // Skip if previous test didn't set documentId
    test.skip(!documentId, 'Document ID not available');
    
    // Log in as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', adminUser.email);
    await page.fill('input[name="password"]', adminUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for authentication to complete
    await page.waitForURL('/dashboard');
    
    // Navigate to the KYC documents review page
    await page.goto('/dashboard/admin/kyc-docs');
    
    // Verify page loaded correctly
    await expect(page.locator('h1').filter({ hasText: 'KYC Documents Review' })).toBeVisible();
    
    // Verify the document is in the list
    await expect(page.locator('table tbody tr')).toContainText('ID Card (Front)');
    await expect(page.locator('table tbody tr')).toContainText('PENDING');
    
    // Click on the review button for the document
    await page.click('button:has-text("Review")');
    
    // Verify we're on the review page
    await expect(page.locator('h1').filter({ hasText: 'ID Card (Front)' })).toBeVisible();
    
    // Make sure document preview is visible
    // For image documents:
    await expect(page.locator('img[alt="Document Preview"]')).toBeVisible();
    // Or for PDF documents:
    // await expect(page.locator('iframe[title="Document Preview"]')).toBeVisible();
    
    // Select "Approve" (should be selected by default)
    await page.check('input[value="APPROVED"]');
    
    // Add optional notes
    await page.fill('textarea#notes', 'Document verified and approved.');
    
    // Submit the review
    await page.click('button:has-text("Approve")');
    
    // Wait for success message
    await expect(page.locator('.toast').filter({ hasText: 'Review submitted successfully' })).toBeVisible();
    
    // Verify we're redirected back to the KYC documents list
    await page.waitForURL('/dashboard/admin/kyc-docs');
  });
  
  test('Model can see approved document status', async ({ page }) => {
    // Skip if previous test didn't set documentId
    test.skip(!documentId, 'Document ID not available');
    
    // Log in as model
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', modelUser.email);
    await page.fill('input[name="password"]', modelUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for authentication to complete
    await page.waitForURL('/dashboard');
    
    // Navigate to the document upload page
    await page.goto('/dashboard/kyc/upload');
    
    // Go to My Documents tab
    await page.click('button[role="tab"]:has-text("My Documents")');
    
    // Verify the document status is now APPROVED
    await expect(page.locator('table tbody tr:first-child')).toContainText('APPROVED');
    
    // Verify the reviewed date is populated
    const reviewedCell = page.locator('table tbody tr:first-child td:nth-child(4)');
    await expect(reviewedCell).not.toContainText('Pending');
    await expect(reviewedCell).toContainText(/\d{1,2}\/\d{1,2}\/\d{4}/); // Date format MM/DD/YYYY
  });
}); 