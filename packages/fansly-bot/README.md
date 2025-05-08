# Fansly Bot for OFAuto

A Puppeteer-based automation module for Fansly, designed to work with OFAuto.

## Features

- ✅ Secure login and session storage
- ✅ Scheduled posting (image/video + caption)
- ✅ Tier-specific content publishing
- ✅ OFAuto-compatible task structure

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Capture a Fansly login session (requires manual login):
   ```bash
   npx ts-node loginAndSaveSession.ts
   ```
   This will open a browser window. Log in to Fansly manually and the session will be saved.

## Usage

### Within OFAuto

Import and use the module in your OFAuto integration:

```typescript
import { createFanslyPost, hasValidSession } from 'fansly-bot';

// Check if a valid session exists
const hasSession = await hasValidSession('platform-id');

// Create a post
const result = await createFanslyPost({
  platformId: 'platform-id',
  caption: 'Check out my new content!',
  mediaUrls: ['path/to/local/image.jpg'],
  scheduledFor: new Date('2023-12-31T12:00:00Z'),
  tiers: ['tier-id-1', 'tier-id-2']
});

if (result.success) {
  console.log(`Post created successfully with ID: ${result.postId}`);
} else {
  console.error(`Failed to create post: ${result.error}`);
}
```

### Standalone Testing

You can also use the automation script directly:

```bash
npx ts-node fanslyAutomation.ts "Your post caption" "/path/to/image.jpg" "2023-12-31T12:00:00Z"
```

## Integration with OFAuto

To integrate with OFAuto, add this package to your OFAuto project:

1. Add as a dependency in your OFAuto's package.json:
   ```json
   "dependencies": {
     "fansly-bot": "file:packages/fansly-bot"
   }
   ```

2. Create a Fansly platform integration that uses this module.

## Technical Details

- Uses Puppeteer with Stealth plugin to avoid detection
- Stores and reuses session cookies and local storage
- Handles scheduled posts and tier-specific content
- Compatible with OFAuto's task execution system

## Troubleshooting

- If authentication fails, the session may have expired. Run `loginAndSaveSession.ts` again.
- For posting issues, check the Fansly UI elements - selectors may need updating if Fansly changes their interface.
- The module generates a screenshot on errors (`fansly-error.png`) to help with debugging.

## License

Same as OFAuto main project. 