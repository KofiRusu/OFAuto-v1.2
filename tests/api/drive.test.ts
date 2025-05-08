import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { appRouter } from '@/lib/trpc/routers/_app';
import { createInnerTRPCContext } from '@/lib/trpc/context';
import { DriveCredential, UserRole } from '@prisma/client';
import { DriveService } from '@/lib/services/driveService';
import { prisma } from '@/lib/db/prisma';

// Mock the driveService
vi.mock('@/lib/services/driveService', () => ({
  driveService: {
    getAuthUrl: vi.fn().mockReturnValue('https://google.com/auth'),
    exchangeCodeForTokens: vi.fn().mockResolvedValue({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      expiresAt: new Date(Date.now() + 3600 * 1000),
    }),
    refreshTokens: vi.fn().mockResolvedValue({
      accessToken: 'test-refreshed-token',
      expiresAt: new Date(Date.now() + 3600 * 1000),
    }),
    listFiles: vi.fn().mockResolvedValue([
      {
        id: 'file1',
        name: 'Test File',
        mimeType: 'text/plain',
        modifiedTime: new Date().toISOString(),
      },
    ]),
    uploadFile: vi.fn().mockResolvedValue({
      id: 'uploaded-file-id',
      name: 'Uploaded File',
      mimeType: 'application/pdf',
      modifiedTime: new Date().toISOString(),
    }),
  },
}));

// Mock the prisma client
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    driveCredential: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findMany: vi.fn().mockResolvedValue([
        { id: 'user1', email: 'user1@example.com' },
        { id: 'user2', email: 'user2@example.com' },
      ]),
    },
  },
}));

describe('Drive Router', () => {
  // Test data
  const testUser = {
    id: 'test-user-id',
    role: UserRole.MODEL,
    email: 'test@example.com',
    name: 'Test User',
  };

  const testManager = {
    id: 'test-manager-id',
    role: UserRole.MANAGER,
    email: 'manager@example.com',
    name: 'Test Manager',
  };

  const testDriveCredential: DriveCredential = {
    id: 'test-credential-id',
    userId: testUser.id,
    accessToken: 'test-token',
    refreshToken: 'test-refresh-token',
    expiresAt: new Date(Date.now() + 3600 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(() => {
    // Setup mocks
    vi.mocked(prisma.driveCredential.findFirst).mockImplementation((args) => {
      const userId = args?.where?.userId as string;
      
      if (userId === testUser.id || userId === testManager.id) {
        return Promise.resolve({
          ...testDriveCredential,
          userId,
        });
      }
      
      return Promise.resolve(null);
    });

    vi.mocked(prisma.driveCredential.create).mockImplementation((args) => {
      return Promise.resolve({
        id: 'new-credential-id',
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as DriveCredential);
    });

    vi.mocked(prisma.driveCredential.update).mockImplementation((args) => {
      return Promise.resolve({
        ...testDriveCredential,
        ...args.data,
        updatedAt: new Date(),
      } as DriveCredential);
    });
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  describe('Model procedures', () => {
    // Create a context with the test user
    const ctx = createInnerTRPCContext({
      userId: testUser.id,
      user: testUser,
    });

    // Create a caller
    const caller = appRouter.createCaller(ctx);

    it('should get auth URL', async () => {
      const result = await caller.drive.getAuthUrl();
      expect(result.url).toBe('https://google.com/auth');
      expect(DriveService.prototype.getAuthUrl).toHaveBeenCalled();
    });

    it('should connect drive with code', async () => {
      const result = await caller.drive.connectDrive({
        code: 'test-auth-code',
      });

      expect(result).toMatchObject({
        userId: testUser.id,
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });

      expect(DriveService.prototype.exchangeCodeForTokens).toHaveBeenCalledWith('test-auth-code');
    });

    it('should get drive status', async () => {
      // Mock the drive credential exists
      vi.mocked(prisma.driveCredential.findFirst).mockResolvedValueOnce(testDriveCredential);

      const result = await caller.drive.getDriveStatus();
      
      expect(result).toEqual({
        connected: true,
        expiresAt: testDriveCredential.expiresAt,
      });
    });

    it('should refresh drive token', async () => {
      // Mock the drive credential exists
      vi.mocked(prisma.driveCredential.findFirst).mockResolvedValueOnce({
        ...testDriveCredential,
        expiresAt: new Date(Date.now() - 1000), // Expired
      });

      const result = await caller.drive.refreshDriveToken();
      
      expect(result).toMatchObject({
        accessToken: expect.any(String),
        expiresAt: expect.any(Date),
      });

      expect(DriveService.prototype.refreshTokens).toHaveBeenCalled();
    });

    it('should list drive files', async () => {
      // Mock the drive credential exists
      vi.mocked(prisma.driveCredential.findFirst).mockResolvedValueOnce(testDriveCredential);

      const result = await caller.drive.listDriveFiles({});
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'file1',
        name: 'Test File',
      });

      expect(DriveService.prototype.listFiles).toHaveBeenCalled();
    });

    it('should upload file to drive', async () => {
      // Mock the drive credential exists
      vi.mocked(prisma.driveCredential.findFirst).mockResolvedValueOnce(testDriveCredential);

      const result = await caller.drive.uploadToDrive({
        name: 'test.pdf',
        content: 'dGVzdCBmaWxlIGNvbnRlbnQ=', // base64 "test file content"
      });
      
      expect(result).toMatchObject({
        id: 'uploaded-file-id',
        name: 'Uploaded File',
      });

      expect(DriveService.prototype.uploadFile).toHaveBeenCalled();
    });
  });

  describe('Manager procedures', () => {
    // Create a context with the test manager
    const ctx = createInnerTRPCContext({
      userId: testManager.id,
      user: testManager,
    });

    // Create a caller
    const caller = appRouter.createCaller(ctx);

    it('should create shared folder', async () => {
      // Mock the create folder implementation
      vi.mocked(DriveService.prototype.uploadFile).mockImplementationOnce(() => {
        return Promise.resolve({
          id: 'shared-folder-id',
          name: 'Shared Folder',
          mimeType: 'application/vnd.google-apps.folder',
          modifiedTime: new Date().toISOString(),
        });
      });

      // Mock the drive credential exists
      vi.mocked(prisma.driveCredential.findFirst).mockResolvedValueOnce({
        ...testDriveCredential,
        userId: testManager.id,
      });

      const result = await caller.drive.createSharedFolder({
        name: 'Shared Folder',
        userIds: ['user1', 'user2'],
      });
      
      expect(result).toMatchObject({
        id: expect.any(String),
        name: 'Shared Folder',
        shared: 2,
      });
    });
  });
}); 