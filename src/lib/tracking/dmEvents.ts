import { trpc } from "@/lib/trpc/client";
import { clientLogger } from "@/lib/logger";

/**
 * Track direct message events like opens, responses, and conversions
 * 
 * @param messageId The ID of the message to track
 * @param event The type of event to track (open, response, conversion)
 * @returns Promise that resolves to success status
 */
export const trackDMEvent = async (
  messageId: string,
  event: 'open' | 'response' | 'conversion'
): Promise<boolean> => {
  try {
    const result = await trpc.dmCampaigns.recordEvent.mutate({ 
      messageId, 
      event 
    });
    
    clientLogger.info(`Tracked ${event} event for DM ${messageId}`, { messageId, event });
    return result.success;
  } catch (err) {
    clientLogger.error("Failed to track DM event:", { 
      messageId, 
      event, 
      error: err instanceof Error ? err.message : String(err) 
    });
    return false;
  }
};

/**
 * Helper to simulate opens, responses, and conversions for demo purposes
 * Use this in development to test the tracking system
 * 
 * @param messageId The ID of the message to track
 * @param delayMs Delay before triggering open event (ms)
 * @param responseRate Probability of getting a response (0-1)
 * @param conversionRate Probability of conversion after response (0-1)
 */
export const simulateDMEvents = async (
  messageId: string,
  delayMs: number = 5000,
  responseRate: number = 0.7,
  conversionRate: number = 0.3
): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    clientLogger.warn("simulateDMEvents should not be used in production");
    return;
  }
  
  // Simulate open after delay
  setTimeout(async () => {
    try {
      // Track open
      await trackDMEvent(messageId, 'open');
      clientLogger.info(`Simulated open for message ${messageId}`);
      
      // Simulate response with probability
      if (Math.random() < responseRate) {
        setTimeout(async () => {
          await trackDMEvent(messageId, 'response');
          clientLogger.info(`Simulated response for message ${messageId}`);
          
          // Simulate conversion with probability
          if (Math.random() < conversionRate) {
            setTimeout(async () => {
              await trackDMEvent(messageId, 'conversion');
              clientLogger.info(`Simulated conversion for message ${messageId}`);
            }, Math.random() * 10000 + 5000); // Random delay 5-15s for conversion
          }
        }, Math.random() * 8000 + 2000); // Random delay 2-10s for response
      }
    } catch (err) {
      clientLogger.error("Error in event simulation:", err);
    }
  }, delayMs);
}; 