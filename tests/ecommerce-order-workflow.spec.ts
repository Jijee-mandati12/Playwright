import { test, expect } from '@playwright/test';

test.describe('Ecommerce order workflow', () => {
  test('signs in, creates an order, and verifies both order IDs', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'This stateful order-creation scenario runs once in Chromium.');

    const username = 'mandatijijee8@gmail.com';
    const password = 'Playwright@12';

    // 1. Sign in with the configured test account.
    await page.goto('https://rahulshettyacademy.com/client/#/auth/login');
    await page.locator('#userEmail').fill(username);
    await page.locator('#userPassword').fill(password);
    await page.locator('#login').click();
    await expect(page).toHaveURL(/#\/dashboard\/dash$/);

    // 2. Add the two selected products to the cart.
    await expect(page.getByRole('heading', { name: 'ADIDAS ORIGINAL' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ZARA COAT 3' })).toBeVisible();
    const addToCartButtons = page.getByRole('button', { name: /Add To Cart/ });
    await addToCartButtons.nth(0).click();
    await addToCartButtons.nth(1).click();
    await expect(page.getByRole('button', { name: /Cart 2/ })).toBeVisible();

    // 3. Verify cart contents and price arithmetic.
    await page.locator('button[routerlink="/dashboard/cart"]').click();
    await expect(page.getByRole('heading', { name: 'My Cart' })).toBeVisible();
    await expect(page.getByText('ADIDAS ORIGINAL', { exact: true })).toBeVisible();
    await expect(page.getByText('ZARA COAT 3', { exact: true })).toBeVisible();
    await expect(page.getByText('In Stock')).toHaveCount(2);
    await expect(page.getByText('$23000', { exact: true })).toHaveCount(2);

    // 4. Complete the billing form with test-only values.
    await page.getByRole('button', { name: /Checkout/ }).click();
    await expect(page.getByText('ADIDAS ORIGINAL', { exact: true })).toBeVisible();
    await expect(page.getByText('ZARA COAT 3', { exact: true })).toBeVisible();
    await page.locator('div.field.small:has-text("CVV Code") input').fill('123');
    await page.locator('div.field:has-text("Name on Card") input').fill('QA Practice Tester');
    await page.locator('select:first-of-type').selectOption('12');
    await page.locator('select:nth-of-type(2)').selectOption('30');

    const countryField = page.getByPlaceholder('Select Country');
    await countryField.pressSequentially('India');
    const indiaOption = page.locator('button.ta-item').nth(1);
    await expect(indiaOption).toBeVisible();
    await indiaOption.click();
    await expect(countryField).toHaveValue('India');

    // 5. Place the order and verify the confirmation.
    await page.locator('a.action__submit').click();
    await expect(page.getByText('Order Placed Successfully', { exact: true })).toBeVisible();
    await expect(page.getByText('ADIDAS ORIGINAL', { exact: true })).toBeVisible();
    await expect(page.getByText('ZARA COAT 3', { exact: true })).toBeVisible();

    const confirmationQuery = page.url().split('?')[1] ?? '';
    const createdOrderIds = JSON.parse(
      new URLSearchParams(confirmationQuery).get('prop') ?? '[]',
    ) as string[];
    expect(createdOrderIds).toHaveLength(2);
    expect(new Set(createdOrderIds).size).toBe(2);

    // 6. Verify both generated IDs against their product rows in Orders history.
    await page.getByRole('button', { name: /ORDERS/ }).click();
    await expect(page).toHaveURL(/#\/dashboard\/myorders$/);
    await expect(page.getByRole('heading', { name: 'Your Orders' })).toBeVisible();

    const ordersTable = page.getByRole('table');
    for (const orderId of createdOrderIds) {
      const orderRow = ordersTable.getByRole('row').filter({ hasText: orderId });
      await expect(orderRow).toHaveCount(1);
      await expect(orderRow).toContainText('$ 11500');
      await expect(orderRow).toContainText(/ADIDAS ORIGINAL|ZARA COAT 3/);
    }

    await expect(page.getByText('ADIDAS ORIGINAL', { exact: true })).toBeVisible();
    await expect(page.getByText('ZARA COAT 3', { exact: true })).toBeVisible();
  });
});
