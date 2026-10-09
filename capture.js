const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  
  const baseUrl = 'http://localhost:5173';
  const outDir = path.join(__dirname, 'docs', 'screenshots');
  if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
  }

  try {
    // 1. Landing Page
    await page.goto(baseUrl);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outDir, 'landing-page.png') });
    console.log('Captured landing-page.png');

    // 2. Login Page
    await page.goto(`${baseUrl}/login`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outDir, 'login-page.png') });
    console.log('Captured login-page.png');

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
})();
