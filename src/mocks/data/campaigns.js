export const mockCampaigns = [
  {
    id: 'campaign-1',
    clientId: 'client-1',
    name: 'Summer Fitness Program',
    description: 'Promotional campaign for new fitness content and routines',
    status: 'active',
    startDate: '2023-06-01T00:00:00Z',
    endDate: '2023-08-31T23:59:59Z',
    platforms: ['onlyfans', 'instagram'],
    budget: 500,
    goals: {
      subscriberGrowth: 200,
      revenueTarget: 2500,
      engagementRate: 0.25
    },
    metrics: {
      impressions: 12500,
      clicks: 2300,
      conversions: 85,
      revenue: 1275,
      roi: 2.55
    },
    tags: ['fitness', 'summer', 'wellness'],
    experiments: [
      {
        id: 'exp-1',
        name: 'Pricing Test',
        status: 'running',
        variants: [
          {
            id: 'var-1',
            name: 'Standard Price',
            impressions: 6200,
            conversions: 42
          },
          {
            id: 'var-2',
            name: 'Discounted Price',
            impressions: 6300,
            conversions: 43
          }
        ]
      }
    ],
    createdAt: '2023-05-15T10:30:00Z',
    updatedAt: '2023-05-25T14:20:00Z'
  },
  {
    id: 'campaign-2',
    clientId: 'client-1',
    name: 'Travel Vlog Series',
    description: 'Campaign for upcoming travel content across Europe',
    status: 'scheduled',
    startDate: '2023-07-15T00:00:00Z',
    endDate: '2023-09-30T23:59:59Z',
    platforms: ['onlyfans', 'instagram'],
    budget: 750,
    goals: {
      subscriberGrowth: 300,
      revenueTarget: 3000,
      engagementRate: 0.3
    },
    metrics: {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      roi: 0
    },
    tags: ['travel', 'europe', 'vlog'],
    createdAt: '2023-05-20T11:45:00Z',
    updatedAt: '2023-05-20T11:45:00Z'
  },
  {
    id: 'campaign-3',
    clientId: 'client-2',
    name: 'New Game Launch',
    description: 'Campaign for streaming new game releases',
    status: 'active',
    startDate: '2023-05-10T00:00:00Z',
    endDate: '2023-06-30T23:59:59Z',
    platforms: ['onlyfans', 'twitter', 'fansly'],
    budget: 300,
    goals: {
      subscriberGrowth: 150,
      revenueTarget: 1800,
      engagementRate: 0.2
    },
    metrics: {
      impressions: 8700,
      clicks: 1500,
      conversions: 62,
      revenue: 930,
      roi: 3.1
    },
    tags: ['gaming', 'stream', 'newrelease'],
    experiments: [],
    createdAt: '2023-05-05T09:15:00Z',
    updatedAt: '2023-05-24T16:30:00Z'
  },
  {
    id: 'campaign-4',
    clientId: 'client-2',
    name: 'Gaming Tournament Sponsorship',
    description: 'Special campaign for upcoming gaming tournament participation',
    status: 'draft',
    platforms: ['twitter', 'fansly'],
    budget: 250,
    goals: {
      subscriberGrowth: 100,
      revenueTarget: 1500,
      engagementRate: 0.15
    },
    tags: ['tournament', 'gaming', 'competition'],
    createdAt: '2023-05-22T14:30:00Z',
    updatedAt: '2023-05-22T14:30:00Z'
  },
  {
    id: 'campaign-5',
    clientId: 'client-3',
    name: 'Spring Makeup Collection',
    description: 'Showcase of new spring makeup products and tutorials',
    status: 'completed',
    startDate: '2023-03-01T00:00:00Z',
    endDate: '2023-05-15T23:59:59Z',
    platforms: ['instagram'],
    budget: 600,
    goals: {
      subscriberGrowth: 250,
      revenueTarget: 2200,
      engagementRate: 0.28
    },
    metrics: {
      impressions: 18500,
      clicks: 3700,
      conversions: 143,
      revenue: 2860,
      roi: 4.77
    },
    tags: ['beauty', 'makeup', 'spring', 'tutorial'],
    experiments: [
      {
        id: 'exp-2',
        name: 'Content Format Test',
        status: 'completed',
        variants: [
          {
            id: 'var-3',
            name: 'Tutorial Videos',
            impressions: 9200,
            conversions: 82
          },
          {
            id: 'var-4',
            name: 'Product Showcases',
            impressions: 9300,
            conversions: 61
          }
        ],
        winner: 'var-3'
      }
    ],
    createdAt: '2023-02-15T10:30:00Z',
    updatedAt: '2023-05-16T09:45:00Z'
  }
]; 