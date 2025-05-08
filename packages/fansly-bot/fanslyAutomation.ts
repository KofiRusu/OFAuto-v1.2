import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs/promises';
import path from 'path';

puppeteer.use(StealthPlugin());

interface FanslySession {
  cookies: any[];
  localStorage: Record<string, string>;
  userAgent: string;
}

interface PostConfig {
  caption: string;
  mediaPath: string;  // Local path to image/video
  scheduledTime?: Date;  // Optional scheduled time
  tiers?: string[];  // Optional tier-specific access
}

/**
 * Initialize a browser with saved Fansly session
 */
async function initFanslySession() {
  try {
    // Load saved session data
    const sessionFile = path.join(__dirname, 'session.json');
    const sessionData: FanslySession = JSON.parse(await fs.readFile(sessionFile, 'utf-8'));
    
    const browser = await puppeteer.launch({ 
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        `--user-agent=${sessionData.userAgent}`
      ]
    });
    
    // Create new page and restore session
    const page = await browser.newPage();
    await page.setUserAgent(sessionData.userAgent);
    await page.setCookie(...sessionData.cookies);
    
    // Set local storage from session data
    await page.evaluateOnNewDocument((storageData) => {
      for (const [key, value] of Object.entries(storageData)) {
        localStorage.setItem(key, value);
      }
    }, sessionData.localStorage);
    
    return { browser, page };
  } catch (error) {
    throw new Error(`Failed to initialize Fansly session: ${error.message}`);
  }
}

/**
 * Create a new post on Fansly
 */
async function createPost(config: PostConfig) {
  const { browser, page } = await initFanslySession();
  
  try {
    console.log('✅ Session loaded, navigating to Fansly...');
    
    // Navigate to Fansly homepage
    await page.goto('https://fansly.com/feed', { 
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    // Wait for the create post button and click it
    console.log('📝 Opening new post dialog...');
    const createPostButton = await page.waitForSelector('[data-testid="create-post-button"]', {
      timeout: 30000
    });
    await createPostButton.click();
    
    // Wait for the post editor to appear
    await page.waitForSelector('[data-testid="post-editor"]', { timeout: 30000 });
    
    // Enter caption
    console.log('📝 Entering caption...');
    await page.type('[data-testid="post-text-input"]', config.caption);
    
    // Upload media if provided
    if (config.mediaPath) {
      console.log('🖼️ Uploading media...');
      const fileInput = await page.waitForSelector('input[type="file"]');
      await fileInput.uploadFile(config.mediaPath);
      
      // Wait for upload to complete (looking for thumbnail or progress indicator)
      await page.waitForSelector('[data-testid="media-upload-preview"]', { timeout: 60000 });
    }
    
    // Handle scheduled post if time is provided
    if (config.scheduledTime) {
      console.log('🕐 Setting scheduled time...');
      const scheduleButton = await page.waitForSelector('[data-testid="schedule-post-button"]');
      await scheduleButton.click();
      
      // Set the date and time (implementation may vary based on Fansly's UI)
      // This might need adjustment based on actual Fansly UI
      const dateStr = config.scheduledTime.toISOString().split('T')[0];
      const timeStr = config.scheduledTime.toTimeString().split(' ')[0].substring(0, 5);
      
      await page.type('[data-testid="schedule-date-input"]', dateStr);
      await page.type('[data-testid="schedule-time-input"]', timeStr);
      
      // Confirm scheduling
      await page.click('[data-testid="confirm-schedule-button"]');
    }
    
    // Handle tier access if provided
    if (config.tiers && config.tiers.length > 0) {
      console.log('🔒 Setting tier access...');
      const accessButton = await page.waitForSelector('[data-testid="post-access-button"]');
      await accessButton.click();
      
      // Select specific tiers
      for (const tierId of config.tiers) {
        await page.click(`[data-testid="tier-checkbox-${tierId}"]`);
      }
      
      // Confirm tier selection
      await page.click('[data-testid="confirm-access-button"]');
    }
    
    // Submit the post
    console.log('📤 Submitting post...');
    const submitButton = await page.waitForSelector('[data-testid="submit-post-button"]');
    await submitButton.click();
    
    // Wait for success confirmation
    await page.waitForSelector('[data-testid="post-success-indicator"]', { timeout: 30000 });
    
    console.log('✅ Post created successfully!');
    return { success: true };
    
  } catch (error) {
    console.error('Error creating Fansly post:', error);
    // Capture screenshot for debugging
    await page.screenshot({ path: 'fansly-error.png' });
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

// Export functions for use in the OFAuto system
export { initFanslySession, createPost };

// CLI usage example (can be used for testing)
if (require.main === module) {
  const [caption, mediaPath, scheduledTimeISO] = process.argv.slice(2);
  
  if (!caption || !mediaPath) {
    console.error('Usage: node fanslyAutomation.js "Your caption here" /path/to/media.jpg [ISO-date-time]');
    process.exit(1);
  }
  
  const config: PostConfig = {
    caption,
    mediaPath,
    scheduledTime: scheduledTimeISO ? new Date(scheduledTimeISO) : undefined
  };
  
  createPost(config)
    .then(result => {
      if (!result.success) {
        console.error('Failed to create post:', result.error);
        process.exit(1);
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
} 