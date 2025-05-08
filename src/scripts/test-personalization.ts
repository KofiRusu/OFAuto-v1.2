import { applyTemplate, findMissingVariables, createTemplateSamplePreview } from '../lib/utils/template'
import { logger } from '../lib/logger'

/**
 * Test script for demonstrating personalization with fallback chains
 */
function testPersonalization() {
  // Example template with regular variables and fallback chains
  const template = `
Hi {{firstName|username|"friend"}},

Thanks for following me on {{platform}}! I noticed you've been engaging with my content for {{engagementDays|"a while"}} now.

{{#if subscriptionActive}}
Your subscription is active for {{subscriptionDays|"some more time"}}. I appreciate your continued support!
{{else}}
Would you be interested in checking out my {{specialOffer|"exclusive content"}}?
{{/if}}

Feel free to message me about {{topic|interests|"anything that interests you"}}.

Best,
{{creatorName}}
`

  logger.info('Example Template:')
  logger.info(template)
  logger.info('---\n')

  // Test case 1: Complete personalization data
  const completeData = {
    firstName: 'John',
    username: 'john_doe',
    platform: 'OnlyFans',
    engagementDays: '15 days',
    subscriptionActive: 'true',
    subscriptionDays: '20 days',
    specialOffer: 'premium package',
    topic: 'fitness tips',
    interests: 'workouts',
    creatorName: 'FitnessCreator'
  }

  logger.info('Test Case 1: Complete Data')
  logger.info('Personalization Data:', completeData)
  logger.info('Result:')
  logger.info(applyTemplate(template, completeData))
  logger.info('---\n')

  // Test case 2: Some fallbacks needed
  const partialData = {
    // firstName is missing, should fall back to username
    username: 'jane_doe',
    platform: 'Instagram',
    // engagementDays is missing, should use fallback text
    subscriptionActive: '',  // empty string treated as false
    specialOffer: 'holiday discount',
    // topic is missing, should fall back to interests
    interests: 'fashion',
    creatorName: 'StyleCreator'
  }

  logger.info('Test Case 2: Partial Data (Some Fallbacks)')
  logger.info('Personalization Data:', partialData)
  logger.info('Result:')
  logger.info(applyTemplate(template, partialData))
  logger.info('---\n')

  // Test case 3: Extensive fallbacks needed
  const minimalData = {
    // All primary variables missing, fallbacks should be used
    platform: 'Twitter',
    creatorName: 'ContentCreator'
  }

  logger.info('Test Case 3: Minimal Data (Many Fallbacks)')
  logger.info('Personalization Data:', minimalData)
  logger.info('Result:')
  logger.info(applyTemplate(template, minimalData))
  logger.info('---\n')

  // Test case 4: Find missing variables
  const missingVariables = findMissingVariables(template, partialData)
  logger.info('Missing Variables in Test Case 2:')
  logger.info(missingVariables)
  logger.info('---\n')

  // Test case 5: Sample preview
  logger.info('Sample Preview with Empty Data:')
  logger.info(createTemplateSamplePreview(template))
  logger.info('---\n')
}

// Run the test if executed directly
if (require.main === module) {
  testPersonalization()
}

export { testPersonalization } 