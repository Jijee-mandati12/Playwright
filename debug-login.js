const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://rahulshettyacademy.com/loginpagePractise/');
  console.log('Initial URL:', page.url());

  await page.locator('input[name="username"]').fill('rahulshettyacademy');
  await page.locator('input[name="password"]').fill('learning');
  await page.locator('input[type="checkbox"]').check();

  const button = page.locator('input[value="Sign In"]');
  console.log('Button count:', await button.count());

  await button.click();

  await page.waitForTimeout(5000);
  console.log('After click URL:', page.url());
  console.log('Body snippet:', (await page.locator('body').textContent()).slice(0, 1000));

  await browser.close();
})();
