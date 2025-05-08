import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationType, NotificationSchema, SendNotificationSchema, MarkReadSchema } from '@/lib/schemas/notifications';
import { notificationsRouter } from '@/lib/trpc/routers/notifications';
import { UserRole } from '@prisma/client';

describe('Notification Schemas', () => {
  describe('NotificationType', () => {
    it('should allow valid notification types', () => {
      expect(NotificationType.parse('ACTIVITY_UPDATE')).toBe('ACTIVITY_UPDATE');
      expect(NotificationType.parse('PLATFORM_ACCESS_CHANGED')).toBe('PLATFORM_ACCESS_CHANGED');
      expect(NotificationType.parse('NEW_POST_SCHEDULED')).toBe('NEW_POST_SCHEDULED');
      expect(NotificationType.parse('POST_PUBLISHED')).toBe('POST_PUBLISHED');
      expect(NotificationType.parse('PERFORMANCE_REPORT')).toBe('PERFORMANCE_REPORT');
      expect(NotificationType.parse('MANAGER_MESSAGE')).toBe('MANAGER_MESSAGE');
      expect(NotificationType.parse('SYSTEM_ALERT')).toBe('SYSTEM_ALERT');
      expect(NotificationType.parse('OTHER')).toBe('OTHER');
    });

    it('should reject invalid notification types', () => {
      expect(() => NotificationType.parse('INVALID_TYPE')).toThrow();
    });
  });

  describe('NotificationSchema', () => {
    it('should validate a valid notification', () => {
      const notification = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'user123',
        type: 'SYSTEM_ALERT' as const,
        title: 'System Maintenance',
        message: 'The system will be down for maintenance tonight.',
        createdAt: new Date(),
        readAt: null,
      };

      expect(NotificationSchema.parse(notification)).toEqual(notification);
    });

    it('should reject an invalid notification', () => {
      const invalidNotification = {
        id: 'not-a-uuid',
        userId: '',
        type: 'INVALID_TYPE',
        message: 'This should fail validation',
      };

      expect(() => NotificationSchema.parse(invalidNotification)).toThrow();
    });
  });

  describe('SendNotificationSchema', () => {
    it('should validate a valid notification request', () => {
      const request = {
        userIds: ['user1', 'user2'],
        type: 'SYSTEM_ALERT' as const,
        title: 'Important Announcement',
        message: 'Please update your profile information.',
      };

      expect(SendNotificationSchema.parse(request)).toEqual(request);
    });

    it('should reject a request with no users', () => {
      const invalidRequest = {
        userIds: [],
        type: 'SYSTEM_ALERT' as const,
        title: 'Important Announcement',
        message: 'Please update your profile information.',
      };

      expect(() => SendNotificationSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe('MarkReadSchema', () => {
    it('should validate a valid mark read request', () => {
      const request = {
        ids: ['123e4567-e89b-12d3-a456-426614174000'],
      };

      expect(MarkReadSchema.parse(request)).toEqual(request);
    });

    it('should reject a request with no IDs', () => {
      const invalidRequest = {
        ids: [],
      };

      expect(() => MarkReadSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject a request with invalid UUIDs', () => {
      const invalidRequest = {
        ids: ['not-a-uuid'],
      };

      expect(() => MarkReadSchema.parse(invalidRequest)).toThrow();
    });
  });
});

describe('Notifications Router', () => {
  // Mock context
  const createMockContext = (role = UserRole.MODEL) => ({
    auth: {
      userId: 'user123',
      userRole: role,
    },
    prisma: {
      notification: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: vi.fn(),
      },
      user: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
      },
      $transaction: vi.fn(async (transactions) => Promise.all(transactions.map(t => t))),
      $queryRaw: vi.fn().mockResolvedValue([]),
    },
    logger: {
      info: vi.fn(),
      error: vi.fn(),
    },
  });

  let mockCtx;

  beforeEach(() => {
    mockCtx = createMockContext();
    vi.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should retrieve user notifications', async () => {
      const mockNotifications = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: 'user123',
          type: 'SYSTEM_ALERT',
          title: 'Test Notification',
          message: 'This is a test notification',
          createdAt: new Date(),
          readAt: null,
        },
      ];
      
      mockCtx.prisma.notification.findMany.mockResolvedValueOnce(mockNotifications);
      mockCtx.prisma.notification.count.mockResolvedValueOnce(1);
      
      const caller = notificationsRouter.createCaller(mockCtx);
      const result = await caller.getNotifications({ limit: 10 });
      
      expect(result.notifications).toEqual(mockNotifications);
      expect(result.totalCount).toBe(1);
      expect(mockCtx.prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        take: 11, // limit + 1 for pagination
        cursor: undefined,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('sendNotification', () => {
    it('should require manager/admin role', async () => {
      const modelCtx = createMockContext(UserRole.MODEL);
      const caller = notificationsRouter.createCaller(modelCtx);
      
      await expect(caller.sendNotification({
        userIds: ['user1'],
        type: 'SYSTEM_ALERT',
        title: 'Test',
        message: 'Test message',
      })).rejects.toThrow('FORBIDDEN');
    });
    
    it('should send notifications to users as a manager', async () => {
      const managerCtx = createMockContext(UserRole.MANAGER);
      const mockUsers = [
        { id: 'user1', name: 'User 1', email: 'user1@example.com', role: UserRole.MODEL },
      ];
      
      const mockNotification = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'user1',
        type: 'SYSTEM_ALERT',
        title: 'Test Notification',
        message: 'This is a test notification',
        createdAt: new Date(),
        readAt: null,
      };
      
      managerCtx.prisma.user.findMany.mockResolvedValueOnce(mockUsers);
      managerCtx.prisma.notification.create.mockResolvedValueOnce(mockNotification);
      
      const caller = notificationsRouter.createCaller(managerCtx);
      const result = await caller.sendNotification({
        userIds: ['user1'],
        type: 'SYSTEM_ALERT',
        title: 'Test Notification',
        message: 'This is a test notification',
      });
      
      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(managerCtx.prisma.user.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['user1'] } },
        select: { id: true, name: true, email: true, role: true },
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notifications as read', async () => {
      mockCtx.prisma.notification.count.mockResolvedValueOnce(2);
      mockCtx.prisma.notification.updateMany.mockResolvedValueOnce({ count: 2 });
      
      const caller = notificationsRouter.createCaller(mockCtx);
      const result = await caller.markAsRead({
        ids: [
          '123e4567-e89b-12d3-a456-426614174000',
          '123e4567-e89b-12d3-a456-426614174001',
        ],
      });
      
      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(mockCtx.prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: [
            '123e4567-e89b-12d3-a456-426614174000',
            '123e4567-e89b-12d3-a456-426614174001',
          ] },
          userId: 'user123',
        },
        data: { readAt: expect.any(Date) },
      });
    });
    
    it('should reject if notifications do not belong to user', async () => {
      mockCtx.prisma.notification.count.mockResolvedValueOnce(1); // Only one of two belongs to user
      
      const caller = notificationsRouter.createCaller(mockCtx);
      await expect(caller.markAsRead({
        ids: [
          '123e4567-e89b-12d3-a456-426614174000',
          '123e4567-e89b-12d3-a456-426614174001',
        ],
      })).rejects.toThrow('FORBIDDEN');
    });
  });
}); 