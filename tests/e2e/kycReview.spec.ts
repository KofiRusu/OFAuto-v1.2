import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

// Setup: Database client for test data
const prisma = new PrismaClient();

// Test credentials - these would normally be in environment variables or test fixtures
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin-password'; // Use environment variables in real implementation

test.describe('KYC Review Flow', () => {
  let testProfileId: string;
  let testUserId: string;

  // Setup: Create test data
  test.beforeAll(async () => {
    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        email: 'e2e-test-user@example.com',
        name: 'E2E Test User',
        clerkId: 'e2e-test-clerk-id',
        role: 'USER',
      },
    });

    testUserId = testUser.id;

    // Create a test onboarding profile
    const testProfile = await prisma.onboardingProfile.create({
      data: {
        userId: testUser.id,
        fullName: 'E2E Test User',
        phoneNumber: '+1987654321',
        address: '456 E2E Test St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '54321',
        country: 'Test Country',
        dateOfBirth: new Date('1990-01-01'),
        kycStatus: 'PENDING',
      },
    });

    testProfileId = testProfile.id;

    // Create a test KYC review
    await prisma.kycReview.create({
      data: {
        profileId: testProfile.id,
        reviewerId: 'system',
        status: 'PENDING',
        documentUrls: ['https://example.com/test-document.pdf'],
      },
    });
  });

  // Cleanup: Delete test data
  test.afterAll(async () => {
    await prisma.kycReview.deleteMany({
      where: { profileId: testProfileId },
    });

    await prisma.onboardingProfile.delete({
      where: { id: testProfileId },
    });

    await prisma.user.delete({
      where: { id: testUserId },
    });
  });

  test('Admin can review and approve a KYC submission with reason', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard');

    // Navigate to KYC review list
    await page.goto('/dashboard/admin/kyc-review');
    await page.waitForLoadState('networkidle');

    // Find and click on the test profile
    await page.getByText('E2E Test User').first().click();
    
    // Wait for the KYC review detail page to load
    await page.waitForURL(`**/dashboard/admin/kyc-review/${testProfileId}`);
    
    // Fill out the approval reason
    await page.fill('textarea#reason', 'All documents verified in E2E test');
    
    // Click the approve button
    await page.click('button:has-text("Approve Profile")');
    
    // Wait for the toast notification
    await expect(page.getByText('Profile approved')).toBeVisible();
    
    // Verify the reviewedAt timestamp is displayed
    await expect(page.getByText(/Last Reviewed/)).toBeVisible();
    
    // Verify the reviewer name is displayed
    await expect(page.getByText(/by Admin/)).toBeVisible();
    
    // Check the status badge shows approved
    await expect(page.getByText('VERIFIED')).toBeVisible();
    
    // Check the reason appears in the review history
    const reasonInHistory = await page.getByText('All documents verified in E2E test');
    await expect(reasonInHistory).toBeVisible();
  });
});

test.describe('KYC Review Flow with Rejection', () => {
  let testProfileId: string;
  let testUserId: string;

  // Setup: Create test data for rejection flow
  test.beforeAll(async () => {
    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        email: 'e2e-test-user-reject@example.com',
        name: 'E2E Test User Reject',
        clerkId: 'e2e-test-clerk-id-reject',
        role: 'USER',
      },
    });

    testUserId = testUser.id;

    // Create a test onboarding profile
    const testProfile = await prisma.onboardingProfile.create({
      data: {
        userId: testUser.id,
        fullName: 'E2E Test User Reject',
        phoneNumber: '+1123456789',
        address: '789 E2E Test St',
        city: 'Reject City',
        state: 'Reject State',
        zipCode: '98765',
        country: 'Reject Country',
        dateOfBirth: new Date('1991-02-02'),
        kycStatus: 'PENDING',
      },
    });

    testProfileId = testProfile.id;

    // Create a test KYC review
    await prisma.kycReview.create({
      data: {
        profileId: testProfile.id,
        reviewerId: 'system',
        status: 'PENDING',
        documentUrls: ['https://example.com/test-document-reject.pdf'],
      },
    });
  });

  // Cleanup: Delete test data
  test.afterAll(async () => {
    await prisma.kycReview.deleteMany({
      where: { profileId: testProfileId },
    });

    await prisma.onboardingProfile.delete({
      where: { id: testProfileId },
    });

    await prisma.user.delete({
      where: { id: testUserId },
    });
  });

  test('Admin can review and reject a KYC submission with rejection reason', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard');

    // Navigate to KYC review list
    await page.goto('/dashboard/admin/kyc-review');
    await page.waitForLoadState('networkidle');

    // Find and click on the test profile for rejection
    await page.getByText('E2E Test User Reject').first().click();
    
    // Wait for the KYC review detail page to load
    await page.waitForURL(`**/dashboard/admin/kyc-review/${testProfileId}`);
    
    // Switch to reject tab
    await page.click('button:has-text("Reject")');
    
    // Fill out the rejection reason
    await page.fill('textarea#rejectionReason', 'Documents provided are invalid');
    await page.fill('textarea#reason', 'Please provide valid and current documents');
    
    // Click the reject button
    await page.click('button:has-text("Reject Profile")');
    
    // Wait for the toast notification
    await expect(page.getByText('Profile rejected')).toBeVisible();
    
    // Verify the reviewedAt timestamp is displayed
    await expect(page.getByText(/Last Reviewed/)).toBeVisible();
    
    // Check the status badge shows rejected
    await expect(page.getByText('REJECTED')).toBeVisible();
    
    // Check the rejection reason appears in red in the review history
    const rejectionInHistory = await page.getByText('Documents provided are invalid');
    await expect(rejectionInHistory).toBeVisible();
    await expect(rejectionInHistory).toHaveCSS('color', /rgb\(239,\s*68,\s*68\)/); // Check for red text
  });
}); 