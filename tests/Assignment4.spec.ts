import { test, expect } from '@playwright/test';

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
    await page.goto('https://eventhub.rahulshettyacademy.com/login');

    // Fill credentials and log in
    await page.getByPlaceholder('you@email.com').fill('mandatijijee8@gmail.com');
    await page.locator('input[type="password"]').fill('YourPassword123!'); // Replace with valid password
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Navigate to Events catalog
    await page.getByRole('link', { name: 'Events' }).click();

    // Filter: Conference events in Hyderabad with search text "World"
    await page.getByRole('combobox', { name: /category/i }).selectOption('Conference');
    await page.getByRole('combobox', { name: /city|location/i }).selectOption('Hyderabad');
    await page.getByPlaceholder(/search/i).fill('World');

    // Select the matched event card (World Tech Summit)
    const firstEventCard = page.locator('.event-card', { hasText: 'World Tech Summit' });
    await expect(firstEventCard).toBeVisible();
    await firstEventCard.getByRole('button', { name: /book|view/i }).click();

    // Select Quantity = 1 and checkout
    await page.getByRole('combobox', { name: /quantity/i }).selectOption('1');
    await page.getByPlaceholder(/name/i).fill('test');
    await page.getByPlaceholder(/email/i).fill('yopmail@mail.com');
    await page.getByPlaceholder(/phone/i).fill('7573168434');
    await page.getByRole('button', { name: /confirm|book/i }).click();

    // Capture returned details from First Booking confirmation screen
    await expect(page.getByText(/booking confirmed/i)).toBeVisible();

    const b1Ref = await page.locator('.booking-ref-value, [data-testid="booking-ref"]').innerText();
    const b1Title = await page.getByRole('heading', { level: 1 }).innerText();
    const b1Email = 'yopmail@mail.com';

    booking1 = {
      bookingReference: b1Ref.trim(),
      eventTitle: b1Title.trim(),
      ticketCount: '1',
      totalText: '1500', // Adjust if UI displays formatted currency like $1,500
      customerEmail: b1Email
    };

    // Confirm first booking assertions
    expect(booking1.eventTitle).toContain('World Tech Summit');
    expect(booking1.bookingReference).not.toBe('');
    expect(booking1.bookingReference).toBeDefined();

    // ==========================================
    // 2. RETURN TO CATALOG & CREATE SECOND BOOKING VIA UI
    // ==========================================
    await page.getByRole('link', { name: 'Events' }).click();

    // Filter: Festival events in Delhi with search text "Dilli"
    await page.getByRole('combobox', { name: /category/i }).selectOption('Festival');
    await page.getByRole('combobox', { name: /city|location/i }).selectOption('Delhi');
    await page.getByPlaceholder(/search/i).fill('Dilli');

    const secondEventCard = page.locator('.event-card').first();
    await expect(secondEventCard).toBeVisible();
    await secondEventCard.getByRole('button', { name: /book|view/i }).click();

    // Select Quantity = 2 and checkout
    await page.getByRole('combobox', { name: /quantity/i }).selectOption('2');
    await page.getByPlaceholder(/name/i).fill('test');
    await page.getByPlaceholder(/email/i).fill('yopmail@mail.com');
    await page.getByPlaceholder(/phone/i).fill('7573168434');
    await page.getByRole('button', { name: /confirm|book/i }).click();

    // Capture returned details from Second Booking confirmation screen
    await expect(page.getByText(/booking confirmed/i)).toBeVisible();

    const b2Ref = await page.locator('.booking-ref-value, [data-testid="booking-ref"]').innerText();
    const b2Title = await page.getByRole('heading', { level: 1 }).innerText();

    booking2 = {
      bookingReference: b2Ref.trim(),
      eventTitle: b2Title.trim(),
      ticketCount: '2',
      totalText: '3000',
      customerEmail: 'yopmail@mail.com'
    };

    // Confirm second booking differs from first booking
    expect(booking2.bookingReference).not.toBe(booking1.bookingReference);
    expect(booking2.eventTitle).not.toBe(booking1.eventTitle);

    // ==========================================
    // 3. OPEN MY BOOKINGS & VERIFY BOTH CARDS BY REF ONLY
    // ==========================================
    await page.getByRole('link', { name: 'My Bookings' }).click();

    // Locate cards strictly by booking reference text
    const card1 = page.locator('.booking-card', { hasText: booking1.bookingReference });
    const card2 = page.locator('.booking-card', { hasText: booking2.bookingReference });

    // Confirm Card 1
    await expect(card1).toBeVisible();
    await expect(card1.getByText(/confirmed/i)).toBeVisible();
    await expect(card1.getByText(booking1.eventTitle)).toBeVisible();
    await expect(card1.getByText(new RegExp(`.*${booking1.ticketCount}.*`))).toBeVisible();
    await expect(card1.getByText(new RegExp(`.*${booking1.totalText}.*`))).toBeVisible();

    // Confirm Card 2
    await expect(card2).toBeVisible();
    await expect(card2.getByText(/confirmed/i)).toBeVisible();
    await expect(card2.getByText(booking2.eventTitle)).toBeVisible();
    await expect(card2.getByText(new RegExp(`.*${booking2.ticketCount}.*`))).toBeVisible();
    await expect(card2.getByText(new RegExp(`.*${booking2.totalText}.*`))).toBeVisible();

    // ==========================================
    // 4. OPEN & VERIFY FIRST BOOKING DETAIL PAGE
    // ==========================================
    await card1.getByRole('link', { name: /view details|details/i }).click();

    await expect(page.getByText(new RegExp(`.*${booking1.bookingReference}.*`))).toBeVisible();
    await expect(page.getByRole('heading', { name: booking1.eventTitle })).toBeVisible();
    await expect(page.getByText(booking1.customerEmail)).toBeVisible();
    await expect(page.getByText(new RegExp(`.*${booking1.ticketCount}.*`))).toBeVisible();
    await expect(page.getByText(new RegExp(`.*${booking1.totalText}.*`))).toBeVisible();

    // Confirm numeric ID presence on detail page
    await expect(page.getByText(/\b\d+\b/)).toBeVisible();

    // ==========================================
    // 5. RETURN TO MY BOOKINGS & VERIFY SECOND BOOKING DETAIL PAGE
    // ==========================================
    await page.getByRole('link', { name: 'My Bookings' }).click();

    const card2Refound = page.locator('.booking-card', { hasText: booking2.bookingReference });
    await expect(card2Refound).toBeVisible();
    await card2Refound.getByRole('link', { name: /view details|details/i }).click();

    await expect(page.getByRole('heading', { name: booking2.eventTitle })).toBeVisible();
    await expect(page.getByText(new RegExp(`.*${booking2.ticketCount}.*`))).toBeVisible();
    await expect(page.getByText(new RegExp(`.*${booking2.totalText}.*`))).toBeVisible();

    // Ensure First Booking's reference does not appear on Second Booking's detail page
    await expect(page.getByText(booking1.bookingReference)).not.toBeVisible();
  });

});