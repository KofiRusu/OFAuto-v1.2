import { triggerEngine } from '../../lib/orchestration/triggerEngine';

export const mockAutomations = [
  {
    id: 'automation-1',
    name: 'Subscriber Re-engagement',
    description: 'Automatically message subscribers who haven\'t engaged in 30 days',
    clientId: 'client-1',
    triggerType: triggerEngine.TriggerType.SUBSCRIPTION_DIP,
    conditions: {
      threshold: 0.05,
      timeFrame: 'week'
    },
    actions: [
      {
        type: 'message',
        platform: 'onlyfans',
        params: {
          message: 'Hey there! We miss you. Here\'s a special discount just for you!',
          audience: 'inactive_subscribers'
        },
        priority: 'high'
      }
    ],
    isActive: true,
    lastTriggeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'automation-2',
    name: 'ROI Optimization',
    description: 'Adjust pricing when ROI exceeds targets',
    clientId: 'client-1',
    triggerType: triggerEngine.TriggerType.ROI_THRESHOLD,
    conditions: {
      threshold: 2.0,
      timeFrame: 'month'
    },
    actions: [
      {
        type: 'pricing',
        platform: 'onlyfans',
        params: {
          action: 'increase',
          percentage: 10,
          message: 'Due to high demand, we\'re adjusting our subscription price. Current subscribers will keep their existing rate!'
        },
        priority: 'medium'
      }
    ],
    isActive: true,
    lastTriggeredAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'automation-3',
    name: 'Underperforming Campaign Adjuster',
    description: 'Boost content visibility when campaigns aren\'t meeting goals',
    clientId: 'client-2',
    triggerType: triggerEngine.TriggerType.CAMPAIGN_UNDERPERFORMANCE,
    conditions: {
      threshold: 0.3,
      timeFrame: 'week'
    },
    actions: [
      {
        type: 'message',
        platform: 'onlyfans',
        params: {
          message: 'Check out our latest content! [link]',
          audience: 'all_subscribers'
        },
        priority: 'high'
      }
    ],
    isActive: false,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'automation-4',
    name: 'Content Performance Booster',
    description: 'Promote high-performing content to maximize engagement',
    clientId: 'client-3',
    triggerType: triggerEngine.TriggerType.CONTENT_PERFORMANCE,
    conditions: {
      threshold: 0.25,
      timeFrame: 'week',
      metric: 'engagement'
    },
    actions: [
      {
        type: 'post',
        platform: 'instagram',
        params: {
          message: 'This post is getting a lot of love! Check it out if you haven\'t seen it yet: [link]',
          mediaUrl: ''
        },
        priority: 'medium'
      },
      {
        type: 'message',
        platform: 'instagram',
        params: {
          message: 'DM exclusive: Behind the scenes of our most popular content this week!',
          audience: 'top_engagers'
        },
        priority: 'low'
      }
    ],
    isActive: true,
    lastTriggeredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'automation-5',
    name: 'A/B Test Result Applier',
    description: 'Apply winning variant from completed A/B tests automatically',
    clientId: 'client-3',
    triggerType: triggerEngine.TriggerType.EXPERIMENT_CONCLUSION,
    conditions: {
      minConfidence: 0.9,
      minImpressions: 1000
    },
    actions: [
      {
        type: 'experiment',
        platform: 'instagram',
        params: {
          action: 'apply_winner',
          notifyTeam: true
        },
        priority: 'high'
      }
    ],
    isActive: true,
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const mockTasks = [
  {
    id: 'task-1',
    automationId: 'automation-1',
    title: 'Send re-engagement message',
    description: 'Automatically message subscribers who haven\'t engaged in 30 days',
    actionType: 'message',
    platform: 'onlyfans',
    status: 'completed',
    result: { messageId: 'msg123', recipientCount: 15 },
    startTime: new Date(Date.now() - 3600000).toISOString(),
    endTime: new Date(Date.now() - 3540000).toISOString(),
    createdAt: new Date(Date.now() - 3700000).toISOString(),
    updatedAt: new Date(Date.now() - 3540000).toISOString()
  },
  {
    id: 'task-2',
    automationId: 'automation-1',
    title: 'Send re-engagement message',
    description: 'Automatically message subscribers who haven\'t engaged in 30 days',
    actionType: 'message',
    platform: 'onlyfans',
    status: 'running',
    startTime: new Date(Date.now() - 600000).toISOString(),
    createdAt: new Date(Date.now() - 600000).toISOString(),
    updatedAt: new Date(Date.now() - 600000).toISOString()
  },
  {
    id: 'task-3',
    automationId: 'automation-2',
    title: 'Update subscription price',
    description: 'Adjust pricing when ROI exceeds targets',
    actionType: 'pricing',
    platform: 'onlyfans',
    status: 'queued',
    scheduledTime: new Date(Date.now() + 3600000).toISOString(),
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'task-4',
    automationId: 'automation-4',
    title: 'Promote high-performing content',
    description: 'Promote high-performing content to maximize engagement',
    actionType: 'post',
    platform: 'instagram',
    status: 'failed',
    error: 'API rate limit exceeded',
    startTime: new Date(Date.now() - 86400000).toISOString(),
    endTime: new Date(Date.now() - 86340000).toISOString(),
    createdAt: new Date(Date.now() - 86500000).toISOString(),
    updatedAt: new Date(Date.now() - 86340000).toISOString()
  },
  {
    id: 'task-5',
    automationId: 'automation-4',
    title: 'Send exclusive message to top engagers',
    description: 'Send DM exclusive content to top engaging followers',
    actionType: 'message',
    platform: 'instagram',
    status: 'completed',
    result: { messageId: 'msg456', recipientCount: 27, responseRate: 0.41 },
    startTime: new Date(Date.now() - 172800000).toISOString(),
    endTime: new Date(Date.now() - 172740000).toISOString(),
    createdAt: new Date(Date.now() - 172900000).toISOString(),
    updatedAt: new Date(Date.now() - 172740000).toISOString()
  },
  {
    id: 'task-6',
    automationId: 'automation-5',
    title: 'Apply A/B test winner',
    description: 'Apply winning variant from completed A/B tests automatically',
    actionType: 'experiment',
    platform: 'instagram',
    status: 'queued',
    scheduledTime: new Date(Date.now() + 7200000).toISOString(),
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString()
  }
]; 