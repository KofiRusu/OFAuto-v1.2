import { describe, expect, test, beforeAll, afterAll, jest } from '@jest/globals';
import { prisma } from '../../src/lib/db/prisma';
import { createCaller } from '../../src/lib/trpc/server';

// Mock auth context for an admin user
const mockAdminContext = {
  userId: 'test-admin-id',
  user: {
    id: 'test-admin-id',
    role: 'ADMIN',
    email: 'admin@example.com',
    name: 'Test Admin'
  },
  prisma,
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }
};

// Mock auth context for a manager user
const mockManagerContext = {
  userId: 'test-manager-id',
  user: {
    id: 'test-manager-id',
    role: 'MANAGER',
    email: 'manager@example.com',
    name: 'Test Manager'
  },
  prisma,
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }
};

// Mock auth context for a regular user
const mockUserContext = {
  userId: 'test-user-id',
  user: {
    id: 'test-user-id',
    role: 'USER',
    email: 'user@example.com',
    name: 'Test User'
  },
  prisma,
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }
};

describe('Compliance API', () => {
  let testReportId: string;
  let testTakedownId: string;
  
  beforeAll(async () => {
    // Create test users
    await prisma.user.upsert({
      where: { id: 'test-admin-id' },
      update: {},
      create: {
        id: 'test-admin-id',
        email: 'admin@example.com',
        name: 'Test Admin',
        clerkId: 'test-admin-clerk-id',
        role: 'ADMIN',
      },
    });
    
    await prisma.user.upsert({
      where: { id: 'test-manager-id' },
      update: {},
      create: {
        id: 'test-manager-id',
        email: 'manager@example.com',
        name: 'Test Manager',
        clerkId: 'test-manager-clerk-id',
        role: 'MANAGER',
      },
    });
    
    await prisma.user.upsert({
      where: { id: 'test-user-id' },
      update: {},
      create: {
        id: 'test-user-id',
        email: 'user@example.com',
        name: 'Test User',
        clerkId: 'test-user-clerk-id',
        role: 'USER',
      },
    });
  });
  
  afterAll(async () => {
    // Clean up test data
    await prisma.takedownRequest.deleteMany({});
    await prisma.complianceReport.deleteMany({});
    
    await prisma.user.delete({ where: { id: 'test-admin-id' } });
    await prisma.user.delete({ where: { id: 'test-manager-id' } });
    await prisma.user.delete({ where: { id: 'test-user-id' } });
  });
  
  test('user should be able to submit a report', async () => {
    const userCaller = createCaller(mockUserContext);
    
    const result = await userCaller.compliance.submitReport({
      reporterId: 'test-user-id',
      type: 'POST_CONTENT',
      contentId: 'test-post-123',
      details: 'This post contains inappropriate content that violates guidelines.'
    });
    
    expect(result.success).toBe(true);
    expect(result.report).toBeDefined();
    expect(result.report.reporterId).toBe('test-user-id');
    expect(result.report.type).toBe('POST_CONTENT');
    
    // Save the report ID for later tests
    testReportId = result.report.id;
  });
  
  test('manager should be able to get reports', async () => {
    const managerCaller = createCaller(mockManagerContext);
    
    const result = await managerCaller.compliance.getReports({
      limit: 10
    });
    
    expect(result.reports).toBeDefined();
    expect(result.reports.length).toBeGreaterThan(0);
    
    // Verify our test report is in the results
    const testReport = result.reports.find(report => report.id === testReportId);
    expect(testReport).toBeDefined();
    expect(testReport?.type).toBe('POST_CONTENT');
  });
  
  test('manager should be able to get report by ID', async () => {
    const managerCaller = createCaller(mockManagerContext);
    
    const result = await managerCaller.compliance.getReportById({
      id: testReportId
    });
    
    expect(result.report).toBeDefined();
    expect(result.report.id).toBe(testReportId);
    expect(result.report.type).toBe('POST_CONTENT');
    expect(result.report.reporter).toBeDefined();
    expect(result.report.reporter.id).toBe('test-user-id');
  });
  
  test('regular user should not be able to get reports', async () => {
    const userCaller = createCaller(mockUserContext);
    
    // This should throw an error because regular users can't access this endpoint
    await expect(userCaller.compliance.getReports({
      limit: 10
    })).rejects.toThrow();
  });
  
  test('admin should be able to review a report', async () => {
    const adminCaller = createCaller(mockAdminContext);
    
    const result = await adminCaller.compliance.reviewReport({
      id: testReportId,
      status: 'REVIEWED',
      adminNotes: 'Reviewed the report and found the content to be in violation.'
    });
    
    expect(result.success).toBe(true);
    expect(result.report).toBeDefined();
    expect(result.report.id).toBe(testReportId);
    expect(result.report.status).toBe('REVIEWED');
  });
  
  test('manager should not be able to review a report', async () => {
    const managerCaller = createCaller(mockManagerContext);
    
    // This should throw an error because managers can't update reports
    await expect(managerCaller.compliance.reviewReport({
      id: testReportId,
      status: 'REVIEWED',
      adminNotes: 'Attempting to review as manager.'
    })).rejects.toThrow();
  });
  
  test('admin should be able to create a takedown request', async () => {
    const adminCaller = createCaller(mockAdminContext);
    
    const result = await adminCaller.compliance.createTakedownRequest({
      reportId: testReportId,
      requestedBy: 'test-admin-id',
      reason: 'This content violates our terms of service and must be removed.'
    });
    
    expect(result.success).toBe(true);
    expect(result.takedownRequest).toBeDefined();
    expect(result.takedownRequest.reportId).toBe(testReportId);
    expect(result.takedownRequest.requestedBy).toBe('test-admin-id');
    
    // Save the takedown ID for later tests
    testTakedownId = result.takedownRequest.id;
    
    // Check that the report status was updated
    const reportResult = await adminCaller.compliance.getReportById({
      id: testReportId
    });
    
    expect(reportResult.report.status).toBe('REVIEWED');
  });
  
  test('admin should be able to get takedown requests', async () => {
    const adminCaller = createCaller(mockAdminContext);
    
    const result = await adminCaller.compliance.getTakedownRequests({
      limit: 10
    });
    
    expect(result.takedownRequests).toBeDefined();
    expect(result.takedownRequests.length).toBeGreaterThan(0);
    
    // Verify our test takedown is in the results
    const testTakedown = result.takedownRequests.find(takedown => takedown.id === testTakedownId);
    expect(testTakedown).toBeDefined();
    expect(testTakedown?.reportId).toBe(testReportId);
  });
  
  test('manager should not be able to get takedown requests', async () => {
    const managerCaller = createCaller(mockManagerContext);
    
    // This should throw an error because managers can't access takedown requests
    await expect(managerCaller.compliance.getTakedownRequests({
      limit: 10
    })).rejects.toThrow();
  });
  
  test('admin should be able to update a takedown request', async () => {
    const adminCaller = createCaller(mockAdminContext);
    
    const result = await adminCaller.compliance.updateTakedownRequest({
      id: testTakedownId,
      status: 'COMPLETED',
      notes: 'Takedown completed, content has been removed.'
    });
    
    expect(result.success).toBe(true);
    expect(result.takedownRequest).toBeDefined();
    expect(result.takedownRequest.id).toBe(testTakedownId);
    expect(result.takedownRequest.status).toBe('COMPLETED');
    
    // Check that the report status was updated to RESOLVED when takedown is COMPLETED
    const reportResult = await adminCaller.compliance.getReportById({
      id: testReportId
    });
    
    expect(reportResult.report.status).toBe('RESOLVED');
  });
}); 