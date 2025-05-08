import { AutoDMEngine, DMTriggerType, DMCampaignStatus, DMTarget } from '@/services/autoDMEngine';

describe('DM Performance Metrics', () => {
  let dmEngine: AutoDMEngine;
  let campaignId: string;
  let messageId: string;
  let target: DMTarget;

  // Set up test environment before each test
  beforeEach(() => {
    // Initialize the AutoDMEngine
    dmEngine = new AutoDMEngine();
    
    // Create a test template
    const template = dmEngine.createTemplate({
      name: 'Test Template',
      content: 'Hello {{username}}! This is a test message.',
      platformId: 'test-platform',
      variables: ['username'],
      personalizationVariables: ['username']
    });
    
    // Create a test campaign
    const campaign = dmEngine.createCampaign({
      name: 'Test Campaign',
      platformIds: ['test-platform'],
      templateId: template.id,
      triggerType: DMTriggerType.NEW_FOLLOWER,
      status: DMCampaignStatus.ACTIVE,
      throttleRate: 10,
      personalization: {}
    });
    
    campaignId = campaign.id;
    
    // Create a test target
    target = {
      id: 'test-target-1',
      platformId: 'test-platform',
      userId: 'user-1',
      username: 'testuser'
    };
  });

  test('Should increment impressions when a message is sent', async () => {
    // Schedule and send a message
    const message = await dmEngine.scheduleDM(campaignId, target);
    expect(message).not.toBeNull();
    
    if (message) {
      messageId = message.id;
      
      // Check that the message was sent
      expect(message.status).toBe('sent');
      
      // Get metrics for the campaign
      const metrics = dmEngine.getCampaignMetrics(campaignId);
      
      // Check that impressions were incremented
      expect(metrics).not.toBeNull();
      expect(metrics?.impressions).toBe(1);
    }
  });

  test('Should track open, response, and conversion events', async () => {
    // Schedule a message
    const message = await dmEngine.scheduleDM(campaignId, target);
    expect(message).not.toBeNull();
    
    if (message) {
      messageId = message.id;
      
      // Record an open event
      const openResult = await dmEngine.recordEvent(messageId, 'open');
      expect(openResult).toBe(true);
      
      // Check metrics after open
      let metrics = dmEngine.getCampaignMetrics(campaignId);
      expect(metrics?.opens).toBe(1);
      expect(metrics?.responses).toBe(0);
      expect(metrics?.conversions).toBe(0);
      
      // Record a response event
      const responseResult = await dmEngine.recordEvent(messageId, 'response');
      expect(responseResult).toBe(true);
      
      // Check metrics after response
      metrics = dmEngine.getCampaignMetrics(campaignId);
      expect(metrics?.opens).toBe(1);
      expect(metrics?.responses).toBe(1);
      expect(metrics?.conversions).toBe(0);
      
      // Record a conversion event
      const conversionResult = await dmEngine.recordEvent(messageId, 'conversion');
      expect(conversionResult).toBe(true);
      
      // Check metrics after conversion
      metrics = dmEngine.getCampaignMetrics(campaignId);
      expect(metrics?.opens).toBe(1);
      expect(metrics?.responses).toBe(1);
      expect(metrics?.conversions).toBe(1);
    }
  });

  test('Should calculate rates correctly', async () => {
    // Create multiple messages and events to test rate calculations
    
    // First message: impression + open + response + conversion
    const message1 = await dmEngine.scheduleDM(campaignId, target);
    await dmEngine.recordEvent(message1!.id, 'open');
    await dmEngine.recordEvent(message1!.id, 'response');
    await dmEngine.recordEvent(message1!.id, 'conversion');
    
    // Second message: impression + open + response (no conversion)
    const message2 = await dmEngine.scheduleDM(campaignId, {
      ...target,
      id: 'test-target-2',
      username: 'testuser2'
    });
    await dmEngine.recordEvent(message2!.id, 'open');
    await dmEngine.recordEvent(message2!.id, 'response');
    
    // Third message: impression + open (no response, no conversion)
    const message3 = await dmEngine.scheduleDM(campaignId, {
      ...target,
      id: 'test-target-3',
      username: 'testuser3'
    });
    await dmEngine.recordEvent(message3!.id, 'open');
    
    // Fourth message: impression only (no open, no response, no conversion)
    await dmEngine.scheduleDM(campaignId, {
      ...target,
      id: 'test-target-4',
      username: 'testuser4'
    });
    
    // Get metrics and calculate rates
    const metrics = dmEngine.getCampaignMetrics(campaignId);
    
    // Expected results:
    // 4 impressions, 3 opens, 2 responses, 1 conversion
    expect(metrics?.impressions).toBe(4);
    expect(metrics?.opens).toBe(3);
    expect(metrics?.responses).toBe(2);
    expect(metrics?.conversions).toBe(1);
    
    // Calculate expected rates
    const expectedOpenRate = (3 / 4) * 100; // 75%
    const expectedResponseRate = (2 / 3) * 100; // 66.67%
    const expectedConversionRate = (1 / 2) * 100; // 50%
    
    // Calculate actual rates
    const openRate = metrics ? (metrics.opens / metrics.impressions) * 100 : 0;
    const responseRate = metrics && metrics.opens ? (metrics.responses / metrics.opens) * 100 : 0;
    const conversionRate = metrics && metrics.responses ? (metrics.conversions / metrics.responses) * 100 : 0;
    
    // Check rates with reasonable precision (allow for some floating point differences)
    expect(openRate).toBeCloseTo(expectedOpenRate, 1);
    expect(responseRate).toBeCloseTo(expectedResponseRate, 1);
    expect(conversionRate).toBeCloseTo(expectedConversionRate, 1);
  });

  test('Should update message timestamps and status on events', async () => {
    // Schedule a message
    const message = await dmEngine.scheduleDM(campaignId, target);
    expect(message).not.toBeNull();
    
    if (message) {
      messageId = message.id;
      
      // Before events: No event timestamps, status is 'sent'
      expect(message.status).toBe('sent');
      expect(message.openedAt).toBeUndefined();
      expect(message.respondedAt).toBeUndefined();
      expect(message.convertedAt).toBeUndefined();
      
      // Record an open event
      await dmEngine.recordEvent(messageId, 'open');
      
      // Get updated message
      const messages = dmEngine.getMessages({ campaignId });
      const updatedMessage = messages.find(m => m.id === messageId);
      
      // After open: Has openedAt timestamp, status still 'sent'
      expect(updatedMessage).not.toBeUndefined();
      expect(updatedMessage?.openedAt).not.toBeUndefined();
      expect(updatedMessage?.status).toBe('sent');
      
      // Record a response event
      await dmEngine.recordEvent(messageId, 'response');
      
      // Get updated message again
      const messagesAfterResponse = dmEngine.getMessages({ campaignId });
      const messageAfterResponse = messagesAfterResponse.find(m => m.id === messageId);
      
      // After response: Has respondedAt timestamp, status changed to 'responded'
      expect(messageAfterResponse?.respondedAt).not.toBeUndefined();
      expect(messageAfterResponse?.status).toBe('responded');
      
      // Record a conversion event
      await dmEngine.recordEvent(messageId, 'conversion');
      
      // Get updated message again
      const messagesAfterConversion = dmEngine.getMessages({ campaignId });
      const messageAfterConversion = messagesAfterConversion.find(m => m.id === messageId);
      
      // After conversion: Has convertedAt timestamp, status changed to 'converted'
      expect(messageAfterConversion?.convertedAt).not.toBeUndefined();
      expect(messageAfterConversion?.status).toBe('converted');
    }
  });
}); 