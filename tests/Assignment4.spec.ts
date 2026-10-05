import { test, expect, type Locator, type Page } from '@playwright/test';
import { appUrl, loginToEventHub } from './support/eventhub';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
}

async function findBookableEvent(page: Page, excludedTitle?: string): Promise<{
  card: Locator;
  title: string;
  price: number;
  path: string;
}> {
  const eventCards = page.getByRole('article');
  await expect(eventCards.first()).toBeVisible();

  for (let index = 0; index < await eventCards.count(); index += 1) {
    const card = eventCards.nth(index);
    const title = (await card.getByRole('heading', { level: 3 }).innerText()).trim();
    const bookNowLink = card.getByRole('link', { name: 'Book Now', exact: true });

    if (title === excludedTitle || await bookNowLink.count() === 0) {
      continue;
    }

    const path = await bookNowLink.getAttribute('href');
    if (!path) {
      continue;
    }

    const priceText = await card.getByText(/^\$\d[\d,]*$/).innerText();
    return {
      card,
      title,
      price: Number(priceText.replace(/[^\d]/g, '')),
      path
    };
  }

  throw new Error('No available event with an enabled Book Now link was found.');
}

test.describe('Assignment 4 - Multi-Booking Web UI Flow', () => {

  // Store details captured from UI for both bookings
  let booking1: {
    bookingReference: string;
    eventTitle: string;
    ticketCount: string;
    totalText: string;
    customerEmail: string;
  };

  let booking2: {
    bookingReference: string;
    eventTitle: string;
    ticketCount: string;
    totalText: string;
    customerEmail: string;
  };

  test('Complete Web UI Flow for Creating and Validating Two Bookings', async ({ page }) => {

    // ==========================================
    // 1. SIGN IN & CREATE FIRST BOOKING VIA UI
    // ==========================================
    await loginToEventHub(page);

    // Navigate to Events catalog
    await page.getByTestId('nav-events').click();

    const firstEvent = await findBookableEvent(page);
    await expect(firstEvent.card).toBeVisible();
    await firstEvent.card.getByRole('link', { name: 'Book Now', exact: true }).click();
    await page.goto(new URL(firstEvent.path, appUrl).toString());
    await expect(page).toHaveURL(/\/events\/\d+$/);

    // Quantity starts at one; complete the booking form.
    await page.getByPlaceholder(/name/i).fill('test');
    await page.getByPlaceholder(/email/i).fill('yopmail@mail.com');
    await page.getByRole('textbox', { name: /Phone Number/ }).fill('7573168434');
    await page.getByRole('button', { name: /confirm|book/i }).click();

    // Capture returned details from First Booking confirmation screen
    await expect(page.getByText(/booking confirmed/i)).toBeVisible();

    const b1RefRow = await page.getByText('Booking Ref', { exact: true }).locator('..').innerText();
    const b1Ref = b1RefRow.replace('Booking Ref', '').trim();
    const b1Title = await page.getByRole('heading', { level: 1 }).innerText();
    const b1Email = 'yopmail@mail.com';

    booking1 = {
      bookingReference: b1Ref.trim(),
      eventTitle: b1Title.trim(),
      ticketCount: '1',
      totalText: formatCurrency(firstEvent.price),
      customerEmail: b1Email
    };

    // Confirm first booking assertions
    expect(booking1.eventTitle).toBe(firstEvent.title);
    expect(booking1.bookingReference).not.toBe('');
    expect(booking1.bookingReference).toBeDefined();

    // ==========================================
    // 2. RETURN TO CATALOG & CREATE SECOND BOOKING VIA UI
    // ==========================================
    await page.getByTestId('nav-events').click();

    const secondEvent = await findBookableEvent(page, booking1.eventTitle);
    await expect(secondEvent.card).toBeVisible();
    await secondEvent.card.getByRole('link', { name: 'Book Now', exact: true }).click();
    await page.goto(new URL(secondEvent.path, appUrl).toString());
    await expect(page).toHaveURL(/\/events\/\d+$/);

    // Increase the default quantity from one ticket to two.
    await page.getByRole('button', { name: '+' }).click();
    const secondBookingTotal = secondEvent.price * 2;
    const secondBookingTotalRow = page.getByText('Total', { exact: true }).locator('..');
    await expect(secondBookingTotalRow).toContainText(`$${secondBookingTotal.toLocaleString('en-US')}`);
    await page.getByPlaceholder(/name/i).fill('test');
    await page.getByPlaceholder(/email/i).fill('yopmail@mail.com');
    await page.getByRole('textbox', { name: /Phone Number/ }).fill('7573168434');
    await page.getByRole('button', { name: /confirm|book/i }).click();

    // Capture returned details from Second Booking confirmation screen
    await expect(page.getByText(/booking confirmed/i)).toBeVisible();

    const b2RefRow = await page.getByText('Booking Ref', { exact: true }).locator('..').innerText();
    const b2Ref = b2RefRow.replace('Booking Ref', '').trim();
    const b2Title = await page.getByRole('heading', { level: 1 }).innerText();

    booking2 = {
      bookingReference: b2Ref.trim(),
      eventTitle: b2Title.trim(),
      ticketCount: '2',
      totalText: formatCurrency(secondBookingTotal),
      customerEmail: 'yopmail@mail.com'
    };

    // Confirm second booking differs from first booking
    expect(booking2.bookingReference).not.toBe(booking1.bookingReference);
    expect(booking2.eventTitle).not.toBe(booking1.eventTitle);

    // ==========================================
    // 3. OPEN MY BOOKINGS & VERIFY BOTH CARDS BY REF ONLY
    // ==========================================
    await page.getByTestId('nav-bookings').click();

    // Locate cards strictly by booking reference text
    const card1 = page.getByTestId('booking-card').filter({ hasText: booking1.bookingReference });
    const card2 = page.getByTestId('booking-card').filter({ hasText: booking2.bookingReference });

    // Confirm Card 1
    await expect(card1).toBeVisible();
    await expect(card1.getByText(/confirmed/i)).toBeVisible();
    await expect(card1.getByText(booking1.eventTitle)).toBeVisible();
    await expect(card1.getByText(new RegExp(`${booking1.ticketCount} tickets?$`))).toBeVisible();
    await expect(card1.getByText(booking1.totalText, { exact: true })).toBeVisible();

    // Confirm Card 2
    await expect(card2).toBeVisible();
    await expect(card2.getByText(/confirmed/i)).toBeVisible();
    await expect(card2.getByText(booking2.eventTitle)).toBeVisible();
    await expect(card2.getByText(new RegExp(`${booking2.ticketCount} tickets?$`))).toBeVisible();
    await expect(card2.getByText(booking2.totalText, { exact: true })).toBeVisible();

    // ==========================================
    // 4. OPEN & VERIFY FIRST BOOKING DETAIL PAGE
    // ==========================================
    await card1.getByRole('link', { name: /view details|details/i }).click();

    const booking1Breadcrumb = page.locator('main')
      .getByRole('link', { name: 'My Bookings', exact: true })
      .first()
      .locator('..');
    await expect(booking1Breadcrumb).toContainText(booking1.bookingReference);
    await expect(page.getByRole('heading', { name: booking1.eventTitle, level: 1, exact: true })).toBeVisible();
    await expect(page.getByText(booking1.customerEmail)).toBeVisible();
    await expect(page.getByText('Tickets', { exact: true }).locator('..'))
      .toContainText(booking1.ticketCount);
    await expect(page.getByText('Total Paid', { exact: true }).locator('..'))
      .toContainText(booking1.totalText);

    // Confirm numeric ID presence on detail page
    await expect(page.getByText('Booking ID', { exact: true }).locator('..'))
      .toContainText(/#\d+/);

    // ==========================================
    // 5. RETURN TO MY BOOKINGS & VERIFY SECOND BOOKING DETAIL PAGE
    // ==========================================
    await page.getByTestId('nav-bookings').click();

    const card2Refound = page.getByTestId('booking-card').filter({ hasText: booking2.bookingReference });
    await expect(card2Refound).toBeVisible();
    await card2Refound.getByRole('link', { name: /view details|details/i }).click();

    await expect(page.getByRole('heading', { name: booking2.eventTitle, level: 1, exact: true })).toBeVisible();
    await expect(page.getByText('Tickets', { exact: true }).locator('..'))
      .toContainText(booking2.ticketCount);
    await expect(page.getByText('Total Paid', { exact: true }).locator('..'))
      .toContainText(booking2.totalText);

    // Ensure First Booking's reference does not appear on Second Booking's detail page
    await expect(page.getByText(booking1.bookingReference)).not.toBeVisible();
  });

});