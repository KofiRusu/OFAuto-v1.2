export const mockIntegrations = [
  {
    id: 'integration-1',
    clientId: 'client-1',
    platform: 'onlyfans',
    status: 'connected',
    username: 'sarahsmith',
    credentials: {
      accessToken: 'mock-access-token-1',
      refreshToken: 'mock-refresh-token-1',
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    },
    platformData: {
      followersCount: 15240,
      subscribersCount: 512,
      postsCount: 487,
      averageEngagement: 0.24
    },
    lastSyncedAt: new Date(Date.now() - 120000).toISOString(),
    createdAt: '2023-01-20T11:30:00Z',
    updatedAt: '2023-05-22T09:15:00Z'
  },
  {
    id: 'integration-2',
    clientId: 'client-1',
    platform: 'instagram',
    status: 'connected',
    username: 'sarahsmith_official',
    credentials: {
      accessToken: 'mock-access-token-2',
      refreshToken: 'mock-refresh-token-2',
      expiresAt: new Date(Date.now() + 7200000).toISOString()
    },
    platformData: {
      followersCount: 62100,
      postsCount: 342,
      averageEngagement: 0.32
    },
    lastSyncedAt: new Date(Date.now() - 240000).toISOString(),
    createdAt: '2023-01-25T14:45:00Z',
    updatedAt: '2023-05-21T16:30:00Z'
  },
  {
    id: 'integration-3',
    clientId: 'client-2',
    platform: 'onlyfans',
    status: 'connected',
    username: 'adamjgamer',
    credentials: {
      accessToken: 'mock-access-token-3',
      refreshToken: 'mock-refresh-token-3',
      expiresAt: new Date(Date.now() + 5400000).toISOString()
    },
    platformData: {
      followersCount: 8750,
      subscribersCount: 320,
      postsCount: 215,
      averageEngagement: 0.18
    },
    lastSyncedAt: new Date(Date.now() - 360000).toISOString(),
    createdAt: '2023-02-15T10:20:00Z',
    updatedAt: '2023-05-19T11:40:00Z'
  },
  {
    id: 'integration-4',
    clientId: 'client-2',
    platform: 'twitter',
    status: 'error',
    username: 'adamjgamer',
    error: 'API rate limit exceeded',
    credentials: {
      accessToken: 'mock-access-token-4',
      refreshToken: 'mock-refresh-token-4',
      expiresAt: new Date(Date.now() - 3600000).toISOString()
    },
    platformData: {
      followersCount: 12400,
      postsCount: 3210,
      averageEngagement: 0.05
    },
    lastSyncedAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: '2023-02-20T09:30:00Z',
    updatedAt: '2023-05-18T13:25:00Z'
  },
  {
    id: 'integration-5',
    clientId: 'client-2',
    platform: 'fansly',
    status: 'pending',
    username: 'adamjgamer',
    createdAt: '2023-05-23T15:10:00Z',
    updatedAt: '2023-05-23T15:10:00Z'
  },
  {
    id: 'integration-6',
    clientId: 'client-3',
    platform: 'instagram',
    status: 'connected',
    username: 'emilychenbeauty',
    credentials: {
      accessToken: 'mock-access-token-6',
      refreshToken: 'mock-refresh-token-6',
      expiresAt: new Date(Date.now() + 1800000).toISOString()
    },
    platformData: {
      followersCount: 98500,
      postsCount: 743,
      averageEngagement: 0.29
    },
    lastSyncedAt: new Date(Date.now() - 180000).toISOString(),
    createdAt: '2023-03-10T12:15:00Z',
    updatedAt: '2023-05-20T10:50:00Z'
  },
  {
    id: 'integration-7',
    clientId: 'client-3',
    platform: 'twitter',
    status: 'disconnected',
    username: 'emilychenbeauty',
    createdAt: '2023-03-15T09:40:00Z',
    updatedAt: '2023-05-01T14:20:00Z'
  }
]; 