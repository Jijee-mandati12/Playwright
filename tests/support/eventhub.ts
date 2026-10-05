import type { Page } from '@playwright/test';
import 'dotenv/config';

export const appUrl = 'https://eventhub.rahulshettyacademy.com';
export const apiBaseUrl = 'https://api.eventhub.rahulshettyacademy.com/api';

const email = process.env.EVENTHUB_EMAIL;
const password = process.env.EVENTHUB_PASSWORD;

if (!email || !password) {
  throw new Error('Set EVENTHUB_EMAIL and EVENTHUB_PASSWORD in .env before running EventHub tests.');
}

export const eventHubCredentials = { email, password };

export async function loginToEventHub(page: Page): Promise<void> {
  await page.goto(`${appUrl}/login`);
  await page.getByPlaceholder('you@email.com').fill(eventHubCredentials.email);
  await page.getByPlaceholder('••••••').fill(eventHubCredentials.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(`${appUrl}/`);
}