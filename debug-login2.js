const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://rahulshettyacademy.com/loginpagePractise/');
  await page.locator('input[name="username"]').fill('mandatijijee8@gmail.com');
  await page.locator('input[name="password"]').fill('Playwright@12');
  await page.locator('input[type="checkbox"]').check();
  await page.locator('input[value="Sign In"]').click();

  await page.waitForTimeout(5000);
  console.log('URL after click:', page.url());
  console.log('Page title:', await page.title());
  console.log('Body text:', (await page.locator('body').textContent()).slice(0, 2000));

  await browser.close();
})();
