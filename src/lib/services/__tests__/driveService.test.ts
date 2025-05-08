import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DriveService } from '../driveService';
import { google } from 'googleapis';

// Mock the googleapis module
vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: vi.fn().mockImplementation(() => ({
        generateAuthUrl: vi.fn().mockReturnValue('https://accounts.google.com/o/oauth2/auth'),
        getToken: vi.fn().mockResolvedValue({
          tokens: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expiry_date: Date.now() + 3600 * 1000,
          },
        }),
        setCredentials: vi.fn(),
        refreshAccessToken: vi.fn().mockResolvedValue({
          credentials: {
            access_token: 'mock-refreshed-token',
            expiry_date: Date.now() + 3600 * 1000,
          },
        }),
      })),
    },
    drive: vi.fn().mockImplementation(() => ({
      files: {
        list: vi.fn().mockResolvedValue({
          data: {
            files: [
              {
                id: 'file1',
                name: 'Test File 1',
                mimeType: 'application/pdf',
                modifiedTime: new Date().toISOString(),
              },
              {
                id: 'folder1',
                name: 'Test Folder',
                mimeType: 'application/vnd.google-apps.folder',
                modifiedTime: new Date().toISOString(),
              },
            ],
          },
        }),
        create: vi.fn().mockResolvedValue({
          data: {
            id: 'new-file-id',
            name: 'Uploaded File',
            mimeType: 'application/pdf',
            modifiedTime: new Date().toISOString(),
          },
        }),
      },
    })),
  },
}));

// Mock logger
vi.mock('@/lib/telemetry/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Mock env
vi.mock('@/env.mjs', () => ({
  env: {
    GOOGLE_CLIENT_ID: 'mock-client-id',
    GOOGLE_CLIENT_SECRET: 'mock-client-secret',
    GOOGLE_REDIRECT_URI: 'http://localhost:3000/dashboard/media/drive/connect',
  },
}));

describe('DriveService', () => {
  let driveService: DriveService;
  
  beforeEach(() => {
    driveService = new DriveService();
    vi.clearAllMocks();
  });
  
  describe('getAuthUrl', () => {
    it('should generate an authorization URL', () => {
      const url = driveService.getAuthUrl();
      expect(url).toBe('https://accounts.google.com/o/oauth2/auth');
    });
  });
  
  describe('exchangeCodeForTokens', () => {
    it('should exchange code for tokens successfully', async () => {
      const result = await driveService.exchangeCodeForTokens('mock-code');
      
      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: expect.any(Date),
      });
    });
    
    it('should throw an error if tokens are missing', async () => {
      // Override the mock for this test
      const oauth2ClientMock = google.auth.OAuth2();
      oauth2ClientMock.getToken = vi.fn().mockResolvedValue({
        tokens: {
          // Missing refresh_token
          access_token: 'mock-access-token',
          expiry_date: Date.now() + 3600 * 1000,
        },
      });
      
      await expect(driveService.exchangeCodeForTokens('invalid-code')).rejects.toThrow(
        'Failed to exchange authorization code for tokens'
      );
    });
  });
  
  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const mockCredential = {
        id: 'cred-id',
        userId: 'user-id',
        accessToken: 'old-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() - 1000), // Expired
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const result = await driveService.refreshTokens(mockCredential);
      
      expect(result).toEqual({
        accessToken: 'mock-refreshed-token',
        expiresAt: expect.any(Date),
      });
    });
  });
  
  describe('listFiles', () => {
    it('should list files from Drive', async () => {
      const mockCredential = {
        id: 'cred-id',
        userId: 'user-id',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const files = await driveService.listFiles(mockCredential);
      
      expect(files).toHaveLength(2);
      expect(files[0].id).toBe('file1');
      expect(files[1].id).toBe('folder1');
    });
    
    it('should list files from a specific folder', async () => {
      const mockCredential = {
        id: 'cred-id',
        userId: 'user-id',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await driveService.listFiles(mockCredential, 'folder1');
      
      // Check that the drive.files.list was called with the right parameters
      const driveMock = google.drive();
      expect(driveMock.files.list).toHaveBeenCalledWith(
        expect.objectContaining({
          q: "'folder1' in parents",
        })
      );
    });
  });
  
  describe('uploadFile', () => {
    it('should upload a file to Drive', async () => {
      const mockCredential = {
        id: 'cred-id',
        userId: 'user-id',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const fileBuffer = Buffer.from('test file content');
      const result = await driveService.uploadFile(mockCredential, fileBuffer, 'test.txt');
      
      expect(result).toEqual({
        id: 'new-file-id',
        name: 'Uploaded File',
        mimeType: 'application/pdf',
        modifiedTime: expect.any(String),
      });
    });
    
    it('should upload a file to a specific folder', async () => {
      const mockCredential = {
        id: 'cred-id',
        userId: 'user-id',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const fileBuffer = Buffer.from('test file content');
      await driveService.uploadFile(mockCredential, fileBuffer, 'test.txt', 'text/plain', 'folder1');
      
      // Check that the drive.files.create was called with the right parameters
      const driveMock = google.drive();
      expect(driveMock.files.create).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            name: 'test.txt',
            parents: ['folder1'],
          }),
          media: expect.objectContaining({
            mimeType: 'text/plain',
          }),
        })
      );
    });
  });
}); 