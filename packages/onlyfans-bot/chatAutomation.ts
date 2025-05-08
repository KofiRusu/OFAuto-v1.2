/**
 * OnlyFans Chat Automation
 * 
 * Handles automated DM responses including:
 * - Detecting new messages
 * - Reading message content
 * - Replying with templated or AI-generated responses
 * - Optional persona-based customization
 */

import { Browser, Page } from 'puppeteer';
import { 
  initSessionBrowser, 
  validateSession,
  captureDebugScreenshot,
  humanType
} from './utils/session';

/**
 * OnlyFans chat selectors
 * These are subject to change if OnlyFans updates their UI
 */
const SELECTORS = {
  // Navigation
  MESSAGES_TAB: '.b-tabs__nav-item[href*="/my/chats"]',
  CHATS_LIST: '.b-chats__list',
  CHAT_ITEMS: '.b-chats__item',
  UNREAD_CHAT: '.b-chats__item--unread',
  CHAT_NAME: '.b-chats__item .g-user-name',
  
  // Chat interface
  CHAT_MESSAGES: '.b-chat__messages',
  MESSAGE_TEXT: '.b-chat__message__text',
  LAST_MESSAGE: '.b-chat__message:last-child',
  UNREAD_MARKER: '.b-chat__unread-marker',
  
  // Sending messages
  MESSAGE_INPUT: '.b-chat__message-form textarea',
  SEND_BUTTON: 'button.b-chat__message-form__submit',
  
  // Media and attachments
  ATTACH_BUTTON: '.b-chat__message-form__attach',
  ATTACH_MEDIA: '.b-chat__message-form__attach-item:nth-child(1)',
  ATTACH_PRICE: '.b-chat__price-input input',
  ATTACH_PRICE_SAVE: '.b-chat__price-input button',
  
  // Indicators
  TYPING_INDICATOR: '.b-chat__input-state--typing',
  ONLINE_STATUS: '.b-chat__header .g-user-status--online',
};

/**
 * Special keywords to watch for in user messages
 */
const SPECIAL_KEYWORDS = [
  'buy', 'purchase', 'content', 'price', 'subscription', 'video', 'custom',
  'discount', 'sale', 'offer', 'special', 'private', 'exclusive',
  'meet', 'meetup', 'service', 'help', 'support'
];

/**
 * Chat message interface
 */
export interface ChatMessage {
  text: string;
  sender: 'user' | 'creator';
  timestamp: Date;
  unread: boolean;
  mediaAttached?: boolean;
  specialKeywords?: string[];
}

/**
 * Chat user interface
 */
export interface ChatUser {
  name: string;
  userId?: string;
  isSubscriber: boolean;
  unreadCount?: number;
  hasSpecialKeywords?: boolean;
  isOnline?: boolean;
  lastMessage?: string;
}

/**
 * Chat automation configuration
 */
export interface ChatConfig {
  accountId?: string;
  responseTemplates?: Record<string, string>;
  defaultResponse?: string;
  responseDelay?: { min: number; max: number }; // Delay in ms
  maxReplies?: number; // Max number of DMs to reply to
  persona?: { 
    name?: string;
    style?: string;
    contextInfo?: string; 
  };
  keywordResponses?: Record<string, string>; // Custom responses for keywords
  flaggedKeywords?: string[]; // Additional keywords to flag
}

/**
 * Chat automation result interface
 */
export interface ChatResult {
  success: boolean;
  error?: string;
  messagesRead: number;
  messagesReplied: number;
  usersProcessed: number;
  specialKeywordsDetected?: string[];
  screenshotPath?: string;
}

/**
 * Handle OnlyFans DMs - check for new messages and auto-reply
 */
export async function handleDMs(config: ChatConfig = {}): Promise<ChatResult> {
  // Default configuration
  const defaultConfig: ChatConfig = {
    responseDelay: { min: 2000, max: 8000 },
    maxReplies: 10,
    defaultResponse: "Thanks for your message! I'll get back to you as soon as I can.",
    responseTemplates: {
      question: "Thanks for asking! I'll respond to your question soon.",
      greeting: "Hey there! Thanks for reaching out! How are you today?",
      subscription: "Thanks for subscribing! I hope you enjoy my content.",
      content: "I'm glad you like my content! Let me know if there's anything specific you'd like to see.",
    }
  };
  
  // Merge provided config with defaults
  const mergedConfig: ChatConfig = { ...defaultConfig, ...config };
  
  // Validate session before proceeding
  const isSessionValid = await validateSession(config.accountId);
  if (!isSessionValid) {
    return {
      success: false,
      error: 'Invalid or expired session. Please run loginAndSaveSession first.',
      messagesRead: 0,
      messagesReplied: 0,
      usersProcessed: 0
    };
  }
  
  // Initialize browser with saved session
  const session = await initSessionBrowser(config.accountId);
  if (!session) {
    return {
      success: false,
      error: 'Failed to initialize browser with saved session.',
      messagesRead: 0,
      messagesReplied: 0,
      usersProcessed: 0
    };
  }
  
  const { browser, page } = session;
  const result: ChatResult = {
    success: true,
    messagesRead: 0,
    messagesReplied: 0,
    usersProcessed: 0,
    specialKeywordsDetected: []
  };
  
  try {
    console.log('🚀 Starting OnlyFans DM automation...');
    
    // Navigate to OnlyFans messages page
    await page.goto('https://onlyfans.com/my/chats', { 
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    // Wait for the chats list to load
    await page.waitForSelector(SELECTORS.CHATS_LIST, { timeout: 30000 });
    
    // Take a screenshot of the chats list
    result.screenshotPath = await captureDebugScreenshot(page, 'chats-list.png');
    
    // Find chats with unread messages
    console.log('🔍 Looking for unread messages...');
    const unreadChats = await page.$$(SELECTORS.UNREAD_CHAT);
    console.log(`📩 Found ${unreadChats.length} chats with unread messages`);
    
    if (unreadChats.length === 0) {
      console.log('✅ No unread messages found.');
      await browser.close();
      return result;
    }
    
    // Process each unread chat (up to maxReplies)
    const chatsToProcess = Math.min(unreadChats.length, mergedConfig.maxReplies || 10);
    
    for (let i = 0; i < chatsToProcess; i++) {
      // Get chat element again (to avoid stale references)
      const currentUnreadChats = await page.$$(SELECTORS.UNREAD_CHAT);
      if (currentUnreadChats.length === 0) break;
      
      // Click on the unread chat
      await currentUnreadChats[0].click();
      
      // Wait for the chat to load
      await page.waitForSelector(SELECTORS.CHAT_MESSAGES, { timeout: 30000 });
      
      // Get chat user info
      const chatUser = await extractChatUserInfo(page);
      
      // Take a screenshot of the chat
      await captureDebugScreenshot(page, `chat-${i+1}.png`);
      
      // Get the unread messages
      const messages = await extractUnreadMessages(page);
      result.messagesRead += messages.length;
      
      // Check for special keywords
      const detectedKeywords = findSpecialKeywords(
        messages, 
        [...SPECIAL_KEYWORDS, ...(mergedConfig.flaggedKeywords || [])]
      );
      
      if (detectedKeywords.length > 0) {
        console.log(`⚠️ Special keywords detected: ${detectedKeywords.join(', ')}`);
        result.specialKeywordsDetected = [
          ...(result.specialKeywordsDetected || []),
          ...detectedKeywords
        ];
      }
      
      // Generate a response based on messages content
      const responseText = generateResponse(messages, mergedConfig, chatUser);
      
      // Introduce a random typing delay
      const typingDelay = getRandomDelay(mergedConfig.responseDelay?.min || 2000, mergedConfig.responseDelay?.max || 8000);
      console.log(`⏳ Waiting ${Math.round(typingDelay/1000)} seconds before replying...`);
      await new Promise(resolve => setTimeout(resolve, typingDelay));
      
      // Type and send the response
      await page.waitForSelector(SELECTORS.MESSAGE_INPUT, { timeout: 30000 });
      await humanType(page, SELECTORS.MESSAGE_INPUT, responseText);
      
      // Wait a brief moment and click send
      await new Promise(resolve => setTimeout(resolve, 500));
      await page.click(SELECTORS.SEND_BUTTON);
      
      // Wait for the message to be sent
      await page.waitForFunction(
        () => !document.querySelector('.b-chat__message--sending'),
        { timeout: 30000 }
      );
      
      console.log(`✅ Response sent to ${chatUser.name}`);
      result.messagesReplied++;
      result.usersProcessed++;
      
      // Go back to chats list
      await page.goto('https://onlyfans.com/my/chats', { 
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // Wait for chats list to load again
      await page.waitForSelector(SELECTORS.CHATS_LIST, { timeout: 30000 });
    }
    
    console.log(`✅ DM automation complete. Processed ${result.usersProcessed} users, read ${result.messagesRead} messages, sent ${result.messagesReplied} replies.`);
    return result;
    
  } catch (error) {
    console.error('❌ Error during DM automation:', error);
    // Capture screenshot on error
    const errorScreenshot = await captureDebugScreenshot(page, 'dm-automation-error.png');
    return {
      success: false,
      error: `Failed to process DMs: ${error.message}`,
      screenshotPath: errorScreenshot,
      messagesRead: result.messagesRead,
      messagesReplied: result.messagesReplied,
      usersProcessed: result.usersProcessed
    };
  } finally {
    await browser.close();
  }
}

/**
 * Extract information about the current chat user
 */
async function extractChatUserInfo(page: Page): Promise<ChatUser> {
  try {
    // Get user name from chat header
    const name = await page.$eval(SELECTORS.CHAT_NAME, (el) => el.textContent?.trim() || 'User');
    
    // Get online status
    const isOnline = await page.$(SELECTORS.ONLINE_STATUS) !== null;
    
    // Check if user is a subscriber
    // Note: This would need a specific selector for subscriber status
    // For now, we'll assume all chatting users are subscribers
    const isSubscriber = true;
    
    // Get last message for context
    const lastMessageEl = await page.$(SELECTORS.LAST_MESSAGE);
    const lastMessage = lastMessageEl 
      ? await lastMessageEl.$eval(SELECTORS.MESSAGE_TEXT, el => el.textContent?.trim() || '') 
      : '';
    
    return {
      name,
      isSubscriber,
      isOnline,
      lastMessage
    };
  } catch (error) {
    console.error('Error extracting chat user info:', error);
    return {
      name: 'User',
      isSubscriber: true
    };
  }
}

/**
 * Extract unread messages from the current chat
 */
async function extractUnreadMessages(page: Page): Promise<ChatMessage[]> {
  try {
    // Find the unread marker (if any)
    const unreadMarker = await page.$(SELECTORS.UNREAD_MARKER);
    
    // If there's no unread marker, get only the last message
    if (!unreadMarker) {
      const lastMessageEl = await page.$(SELECTORS.LAST_MESSAGE);
      if (!lastMessageEl) return [];
      
      const text = await lastMessageEl.$eval(SELECTORS.MESSAGE_TEXT, el => el.textContent?.trim() || '');
      const isUserMessage = await lastMessageEl.evaluate(el => !el.classList.contains('m-from-me'));
      
      if (!isUserMessage) return []; // Don't process our own messages
      
      return [{
        text,
        sender: 'user',
        timestamp: new Date(),
        unread: true,
        mediaAttached: await lastMessageEl.$('.b-chat__message__media') !== null
      }];
    }
    
    // If there is an unread marker, get all messages after it
    const allMessages = await page.$$(SELECTORS.CHAT_MESSAGES + ' .b-chat__message');
    let unreadIndex = -1;
    
    // Find the index of the unread marker
    for (let i = 0; i < allMessages.length; i++) {
      const compareResult = await page.evaluate((message, marker) => {
        return message.compareDocumentPosition(marker);
      }, allMessages[i], unreadMarker);
      
      // Node.DOCUMENT_POSITION_FOLLOWING (4) means the marker is after this message
      if (compareResult & 4) {
        unreadIndex = i;
        break;
      }
    }
    
    if (unreadIndex === -1) return [];
    
    // Extract all messages after the unread marker
    const unreadMessages: ChatMessage[] = [];
    for (let i = unreadIndex + 1; i < allMessages.length; i++) {
      const messageEl = allMessages[i];
      const isUserMessage = await messageEl.evaluate(el => !el.classList.contains('m-from-me'));
      
      // Only process messages from the user, not our own
      if (isUserMessage) {
        const text = await messageEl.$eval(SELECTORS.MESSAGE_TEXT, el => el.textContent?.trim() || '');
        const mediaAttached = await messageEl.$('.b-chat__message__media') !== null;
        
        unreadMessages.push({
          text,
          sender: 'user',
          timestamp: new Date(),
          unread: true,
          mediaAttached
        });
      }
    }
    
    return unreadMessages;
  } catch (error) {
    console.error('Error extracting unread messages:', error);
    return [];
  }
}

/**
 * Find special keywords in messages
 */
function findSpecialKeywords(messages: ChatMessage[], keywords: string[]): string[] {
  const detectedKeywords: string[] = [];
  
  for (const message of messages) {
    const lowerText = message.text.toLowerCase();
    
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase()) && !detectedKeywords.includes(keyword)) {
        detectedKeywords.push(keyword);
      }
    }
  }
  
  return detectedKeywords;
}

/**
 * Generate a response based on message content and config
 */
function generateResponse(
  messages: ChatMessage[], 
  config: ChatConfig,
  user: ChatUser
): string {
  if (messages.length === 0) {
    return config.defaultResponse || "Thanks for your message!";
  }
  
  const lastMessage = messages[messages.length - 1];
  const lowerText = lastMessage.text.toLowerCase();
  
  // First check for keyword-specific responses
  if (config.keywordResponses) {
    for (const [keyword, response] of Object.entries(config.keywordResponses)) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return personalize(response, config.persona, user);
      }
    }
  }
  
  // Then check message type patterns
  if (config.responseTemplates) {
    if (lowerText.includes('?') || lowerText.includes('how') || lowerText.includes('what') || lowerText.includes('when')) {
      return personalize(config.responseTemplates.question, config.persona, user);
    }
    
    if (lastMessage.mediaAttached) {
      return personalize(config.responseTemplates.content || "Thanks for sharing!", config.persona, user);
    }
    
    if (
      lowerText.includes('hi') || 
      lowerText.includes('hey') || 
      lowerText.includes('hello') || 
      lowerText.includes('sup') ||
      lowerText.length < 10 // Short message is likely a greeting
    ) {
      return personalize(config.responseTemplates.greeting, config.persona, user);
    }
    
    if (
      lowerText.includes('subscrib') || 
      lowerText.includes('joined') || 
      lowerText.includes('signed up') || 
      lowerText.includes('new here')
    ) {
      return personalize(config.responseTemplates.subscription, config.persona, user);
    }
  }
  
  // Fall back to default response
  return personalize(config.defaultResponse, config.persona, user);
}

/**
 * Personalize a response using persona configuration
 */
function personalize(
  response: string = "Thanks for your message!",
  persona?: ChatConfig['persona'],
  user?: ChatUser
): string {
  if (!persona) return response;
  
  let personalizedResponse = response;
  
  // Replace name placeholder
  if (persona.name) {
    personalizedResponse = personalizedResponse.replace(/\{name\}/g, persona.name);
  }
  
  // Add personalized greeting with user's name
  if (user && user.name && !personalizedResponse.includes(user.name)) {
    if (personalizedResponse.startsWith("Hey") || personalizedResponse.startsWith("Hi") || personalizedResponse.startsWith("Hello")) {
      personalizedResponse = personalizedResponse.replace(/^(Hey|Hi|Hello)/, `$1 ${user.name},`);
    } else {
      personalizedResponse = `Hey ${user.name}, ${personalizedResponse}`;
    }
  }
  
  // Adapt style based on persona style
  if (persona.style) {
    switch (persona.style.toLowerCase()) {
      case 'friendly':
        if (!personalizedResponse.includes('!')) personalizedResponse += '!';
        if (!personalizedResponse.includes('💕')) personalizedResponse += ' 💕';
        break;
      case 'professional':
        personalizedResponse = personalizedResponse.replace(/!+/g, '.');
        personalizedResponse = personalizedResponse.replace(/\s*💕\s*/, '');
        break;
      case 'flirty':
        if (!personalizedResponse.includes('😘')) personalizedResponse += ' 😘';
        break;
      // Add more styles as needed
    }
  }
  
  return personalizedResponse;
}

/**
 * Generate a random delay between min and max
 */
function getRandomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// CLI interface for direct use
if (require.main === module) {
  const accountId = process.argv[2]; // Optional account ID as first argument
  
  const config: ChatConfig = {
    accountId,
    maxReplies: 5, // Limit to 5 replies for CLI testing
    responseDelay: { min: 1000, max: 3000 }, // Shorter delays for testing
  };
  
  handleDMs(config)
    .then(result => {
      console.log('DM automation completed:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
} 