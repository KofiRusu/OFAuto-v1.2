// packages/fansly-bot/loginAndSaveSession.ts
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs/promises';
import path from 'path';

puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://fansly.com/login', { waitUntil: 'networkidle2' });

  console.log('🧠 Please log in manually. Script will save session after login.');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 0 });

  // Wait for logged-in indicator
  await page.waitForSelector('[data-testid="user-nav-avatar"]', { timeout: 120000 });

  const cookies = await page.cookies();
  const localStorage = await page.evaluate(() => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      data[key] = localStorage.getItem(key);
    }
    return data;
  });

  const sessionData = {
    cookies,
    localStorage,
    userAgent: await browser.userAgent(),
  };

  const sessionFile = path.join(__dirname, 'session.json');
  await fs.writeFile(sessionFile, JSON.stringify(sessionData, null, 2));

  console.log('✅ Session saved to session.json');
  await browser.close();
})().catch(error => {
  console.error('Error during Fansly login session capture:', error);
  process.exit(1);
}); 