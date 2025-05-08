import { test, expect } from '@playwright/test';
import { loginAs } from '../utils/auth';
import { UserRole } from '@prisma/client';

/**
 * Google Drive integration E2E tests
 * 
 * Note: These tests mock the OAuth flow and API responses as we can't
 * actually authenticate with Google in automated tests.
 */
test.describe('Google Drive Integration', () => {
  // Mock OAuth flow and API responses before tests
  test.beforeEach(async ({ page }) => {
    // Intercept the Google OAuth URL redirect
    await page.route('**/accounts.google.com/o/oauth2/**', async (route) => {
      // Instead of going to Google, redirect to our callback URL with a mock code
      await route.fulfill({
        status: 302,
        headers: {
          Location: '/dashboard/media/drive/connect?code=mock-auth-code',
        },
      });
    });
    
    // Intercept tRPC calls to the drive router
    await page.route('**/api/trpc/drive.getAuthUrl*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          result: {
            data: {
              url: 'https://accounts.google.com/o/oauth2/auth',
            },
          },
        }),
      });
    });
    
    await page.route('**/api/trpc/drive.connectDrive*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          result: {
            data: {
              id: 'mock-credential-id',
              userId: 'current-user-id',
              accessToken: 'mock-access-token',
              refreshToken: 'mock-refresh-token',
              expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
        }),
      });
    });
    
    await page.route('**/api/trpc/drive.getDriveStatus*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          result: {
            data: {
              connected: true,
              expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
            },
          },
        }),
      });
    });
    
    await page.route('**/api/trpc/drive.listDriveFiles*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          result: {
            data: [
              {
                id: 'file1',
                name: 'Document.pdf',
                mimeType: 'application/pdf',
                modifiedTime: new Date().toISOString(),
                size: '1048576', // 1MB
                iconLink: 'https://drive-thirdparty.googleusercontent.com/16/type/application/pdf',
                webViewLink: 'https://drive.google.com/file/d/file1/view',
              },
              {
                id: 'folder1',
                name: 'My Folder',
                mimeType: 'application/vnd.google-apps.folder',
                modifiedTime: new Date().toISOString(),
                iconLink: 'https://drive-thirdparty.googleusercontent.com/16/type/application/vnd.google-apps.folder',
                webViewLink: 'https://drive.google.com/drive/folders/folder1',
              },
              {
                id: 'image1',
                name: 'Profile Photo.jpg',
                mimeType: 'image/jpeg',
                modifiedTime: new Date().toISOString(),
                size: '524288', // 512KB
                iconLink: 'https://drive-thirdparty.googleusercontent.com/16/type/image/jpeg',
                webViewLink: 'https://drive.google.com/file/d/image1/view',
                thumbnailLink: 'https://lh3.googleusercontent.com/drive-storage/thumbnail',
              },
            ],
          },
        }),
      });
    });
    
    await page.route('**/api/trpc/drive.uploadToDrive*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          result: {
            data: {
              id: 'uploaded-file-id',
              name: 'Uploaded File.txt',
              mimeType: 'text/plain',
              modifiedTime: new Date().toISOString(),
              size: '123',
              iconLink: 'https://drive-thirdparty.googleusercontent.com/16/type/text/plain',
              webViewLink: 'https://drive.google.com/file/d/uploaded-file-id/view',
            },
          },
        }),
      });
    });
  });
  
  test('Model user can connect Google Drive', async ({ page }) => {
    // Login as a model user
    await loginAs(page, UserRole.MODEL);
    
    // Navigate to Drive connect page
    await page.goto('/dashboard/media/drive/connect');
    
    // Check page content
    await expect(page.getByText('Connect Google Drive')).toBeVisible();
    
    // Click connect button (this will trigger the mocked OAuth flow)
    await page.getByRole('button', { name: 'Connect Google Drive' }).click();
    
    // Since we mocked the OAuth flow and API calls, we should be redirected to the file list page
    await expect(page).toHaveURL('/dashboard/media/drive/list');
    
    // Check that we see the file listing
    await expect(page.getByText('Google Drive Files')).toBeVisible();
  });
  
  test('Model user can view and upload files', async ({ page }) => {
    // Login as a model user
    await loginAs(page, UserRole.MODEL);
    
    // Navigate directly to the file list page (we're already mocking the connected status)
    await page.goto('/dashboard/media/drive/list');
    
    // Check that files are displayed
    await expect(page.getByText('Document.pdf')).toBeVisible();
    await expect(page.getByText('My Folder')).toBeVisible();
    await expect(page.getByText('Profile Photo.jpg')).toBeVisible();
    
    // Prepare a file for upload
    const testFileBuffer = Buffer.from('Test file content for E2E test');
    const testFileName = 'test-upload.txt';
    
    // Set file input value (this is hidden, so we need to use JavaScript)
    await page.setInputFiles('input[type="file"]', {
      name: testFileName,
      mimeType: 'text/plain',
      buffer: testFileBuffer,
    });
    
    // The upload should be triggered automatically after file selection
    // Wait for the success message
    await expect(page.getByText('File uploaded successfully')).toBeVisible({ timeout: 5000 });
    
    // Verify that the file list is refreshed (our mocked response would show the same files)
    await expect(page.getByText('Document.pdf')).toBeVisible();
  });
  
  test('Manager user can create shared folders', async ({ page }) => {
    // Login as a manager user
    await loginAs(page, UserRole.MANAGER);
    
    // Mock the createSharedFolder API endpoint
    await page.route('**/api/trpc/drive.createSharedFolder*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          result: {
            data: {
              id: 'shared-folder-id',
              name: 'Team Folder',
              shared: 2,
            },
          },
        }),
      });
    });
    
    // Navigate to the file list page
    await page.goto('/dashboard/media/drive/list');
    
    // Check manager-specific controls are available
    await expect(page.getByRole('button', { name: 'Create Shared Folder' })).toBeVisible();
    
    // Click create shared folder button
    await page.getByRole('button', { name: 'Create Shared Folder' }).click();
    
    // Fill in the form (assuming a modal or dialog opens)
    await page.getByLabel('Folder Name').fill('Team Folder');
    
    // Select users to share with (assuming a multi-select component)
    await page.getByText('Select users to share with').click();
    await page.getByText('Model 1').click();
    await page.getByText('Model 2').click();
    
    // Submit the form
    await page.getByRole('button', { name: 'Create' }).click();
    
    // Check for success message
    await expect(page.getByText('Folder created and shared successfully')).toBeVisible({ timeout: 5000 });
  });
}); 