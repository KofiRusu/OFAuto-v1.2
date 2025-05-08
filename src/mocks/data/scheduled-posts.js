export const mockScheduledPosts = [
  {
    id: 'post-1',
    clientId: 'client-1',
    platform: 'onlyfans',
    content: 'Check out my new workout routine! #fitness #wellness',
    mediaUrls: ['https://example.com/media1.jpg', 'https://example.com/media2.jpg'],
    scheduledFor: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    timezone: 'America/New_York',
    status: 'scheduled',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    createdBy: 'user-1',
    metadata: {
      isPremium: true,
      price: 5.99,
      categories: ['fitness', 'wellness']
    }
  },
  {
    id: 'post-2',
    clientId: 'client-1',
    platform: 'instagram',
    content: 'Beach day vibes! 🏖️ #summer #vacation',
    mediaUrls: ['https://example.com/beach1.jpg'],
    scheduledFor: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
    timezone: 'America/New_York',
    status: 'scheduled',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    createdBy: 'user-1',
    metadata: {
      hashtags: ['summer', 'vacation', 'beach', 'travel']
    }
  },
  {
    id: 'post-3',
    clientId: 'client-2',
    platform: 'onlyfans',
    content: 'Gaming session tonight at 8PM EST! Join me for some fun!',
    mediaUrls: [],
    scheduledFor: new Date(Date.now() + 43200000).toISOString(), // 12 hours from now
    timezone: 'America/Chicago',
    status: 'scheduled',
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    updatedAt: new Date(Date.now() - 10800000).toISOString(),
    createdBy: 'user-2',
    metadata: {
      isPremium: false,
      categories: ['gaming', 'stream']
    }
  },
  {
    id: 'post-4',
    clientId: 'client-2',
    platform: 'twitter',
    content: 'Just hit a new high score in #Elden Ring! Who wants to see the video?',
    mediaUrls: [],
    scheduledFor: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
    timezone: 'America/Chicago',
    status: 'published',
    publishedAt: new Date(Date.now() - 43200000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString(),
    createdBy: 'user-2',
    metadata: {
      hashtags: ['gaming', 'EldenRing', 'victory']
    }
  },
  {
    id: 'post-5',
    clientId: 'client-2',
    platform: 'fansly',
    content: 'Exclusive behind-the-scenes footage from my latest stream setup!',
    mediaUrls: ['https://example.com/setup1.jpg', 'https://example.com/setup2.jpg'],
    scheduledFor: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    timezone: 'America/Chicago',
    status: 'failed',
    error: 'API authentication failed',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    createdBy: 'user-2',
    metadata: {
      isPremium: true,
      price: 9.99,
      categories: ['gaming', 'behindthescenes']
    }
  },
  {
    id: 'post-6',
    clientId: 'client-3',
    platform: 'instagram',
    content: 'My favorite new makeup products for summer! 💄 #beauty #makeup',
    mediaUrls: ['https://example.com/makeup1.jpg', 'https://example.com/makeup2.jpg', 'https://example.com/makeup3.jpg'],
    scheduledFor: new Date(Date.now() + 129600000).toISOString(), // 1.5 days from now
    timezone: 'America/Los_Angeles',
    status: 'scheduled',
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    updatedAt: new Date(Date.now() - 14400000).toISOString(),
    createdBy: 'user-3',
    metadata: {
      hashtags: ['beauty', 'makeup', 'summer', 'skincare', 'glam'],
      productLinks: [
        { name: 'Summer Glow Palette', url: 'https://example.com/product1' },
        { name: 'Hydrating Foundation', url: 'https://example.com/product2' }
      ]
    }
  },
  {
    id: 'post-7',
    clientId: 'client-1',
    platform: 'onlyfans',
    content: 'Join me for a live Q&A session this Friday at 7PM EST!',
    mediaUrls: [],
    scheduledFor: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
    timezone: 'America/New_York',
    status: 'draft',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    createdBy: 'user-1',
    metadata: {
      isPremium: false,
      categories: ['qa', 'live']
    }
  }
]; 