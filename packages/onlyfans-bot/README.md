# OnlyFans Bot for OFAuto

A Puppeteer-based automation module for OnlyFans, designed to work with OFAuto's automation framework.

## Features

- ✅ Secure session management and login
- ✅ Post creation with media uploads
- ✅ Post scheduling and pricing
- ✅ Tier-specific content publishing
- ✅ Automated DM responses
- ✅ Smart chat interaction with persona support
- ✅ Multi-account support
- ✅ OFAuto-compatible task structure

## Installation

From the OFAuto project root:

```bash
cd packages/onlyfans-bot
npm install
npm run build
```

## Usage

### Manual Login and Session Capture

Before automation can run, a valid session is required. This needs to be done once manually:

```bash
npm run login [accountId]
```

This will:
1. Open a browser window
2. Navigate to OnlyFans login page
3. Wait for you to log in manually
4. Capture and save the session for future use

### Post Creation

```typescript
import { createPost } from 'onlyfans-bot';

const result = await createPost({
  caption: "Check out my new content!",
  mediaPath: "/path/to/image.jpg",
  price: 5.99, // Optional, for PPV content
  scheduledTime: new Date("2023-12-31T12:00:00Z"), // Optional scheduled post
  isPublic: false, // True for public, false for subscribers-only
  tier: "VIP", // Optional tier name/ID for tier-specific posts
  accountId: "account1" // Optional for multi-account support
});

console.log("Post result:", result);
```

### DM Automation

```typescript
import { handleDMs } from 'onlyfans-bot';

const result = await handleDMs({
  accountId: "account1", // Optional for multi-account support
  responseDelay: { min: 2000, max: 8000 }, // Simulate real typing delays
  maxReplies: 10, // Maximum number of DMs to process
  
  // Custom response templates
  responseTemplates: {
    greeting: "Hey there! Thanks for reaching out!",
    question: "Thanks for your question! I'll get back to you soon.",
    subscription: "Thank you for subscribing! Hope you enjoy my content!",
    content: "I'm glad you like my content! Let me know what else you'd like to see!"
  },
  
  // Optional persona configuration for more personalized responses
  persona: {
    name: "Jessica",
    style: "friendly", // friendly, professional, flirty
    contextInfo: "Fitness model who loves travel and photography"
  },
  
  // Custom keyword responses
  keywordResponses: {
    "custom": "I do offer custom content! DM me with exactly what you'd like.",
    "price": "My subscription is just $9.99/month with regular exclusive content!"
  }
});

console.log("DM automation results:", result);
```

### OFAuto Integration

For integration with OFAuto's task execution system:

```typescript
import onlyfansBot from 'onlyfans-bot';

// Check for valid session
const hasSession = await onlyfansBot.hasValidSession("account1");

// Execute a task
const result = await onlyfansBot.executeTask({
  accountId: "account1",
  taskType: "post", // or "chat"
  postConfig: {
    caption: "New content!",
    mediaPath: "/path/to/media.jpg"
  }
});
```

## Configuration

### Session Management

Sessions are stored in the project directory as `session.json` or `session_[accountId].json` when using multiple accounts.

Sessions include:
- Cookies
- LocalStorage data
- User agent
- Timestamp (for expiration detection)

### DM Automation

The chat automation module supports:
- Automatic detection of unread messages
- Smart response templates based on message context
- Personalized replies using user info and persona configuration
- Special keyword detection for flagging important messages
- Realistic typing simulation with random delays

### Post Configuration

Posts support:
- Text/caption content
- Image or video uploads
- Scheduled publishing
- Price settings for PPV content
- Access control (public, subscribers, or specific tiers)

## Development

### Project Structure

- `loginAndSaveSession.ts` - Manual session capture
- `onlyfansAutomation.ts` - Post creation and publishing
- `chatAutomation.ts` - Message handling and responses
- `utils/session.ts` - Session management utilities
- `index.ts` - Main entry point and OFAuto integration

### Selectors

UI selectors for OnlyFans elements are defined in each file. If OnlyFans updates their UI, you may need to update these selectors.

### Debugging

Error screenshots are automatically saved to help debug issues:
- `login-error.png` - For login issues
- `post-creation-error.png` - For posting issues
- `dm-automation-error.png` - For DM handling issues

## License

Same as OFAuto main project. 