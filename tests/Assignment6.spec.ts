import { test, expect } from '@playwright/test';
import { appUrl, apiBaseUrl, eventHubCredentials } from './support/eventhub';

type BookingRecord = {
	id: string | number;
	bookingRef: string;
	quantity: number;
	totalPrice: number;
	event: { title: string; [key: string]: unknown };
	[key: string]: unknown;
};

const bookingsApiUrl = `${apiBaseUrl}/bookings`;

test('patches one live booking in the list and matching detail response', async ({ page }) => {
	// Question 1: Sign in and confirm My Bookings navigation is available.
	await page.goto(appUrl);
	await page.getByPlaceholder('you@email.com').fill(eventHubCredentials.email);
	await page.getByPlaceholder('••••••').fill(eventHubCredentials.password);
	await page.getByRole('button', { name: 'Sign In' }).click();

	const myBookingsLink = page.getByRole('link', { name: 'My Bookings' }).first();
	await expect(myBookingsLink).toBeVisible();

	let originalBookings: BookingRecord[] = [];
	let patchedBookings: BookingRecord[] = [];
	let patchedBooking: BookingRecord | undefined;
	let originalDetailEmail;
	let detailRequestBookingId;

	// Question 2: Intercept the bookings list and fetch its live response.
	await page.route(`${bookingsApiUrl}**`, async route => {
		const requestUrl = new URL(route.request().url());
		const detailMatch = requestUrl.pathname.match(/^\/api\/bookings\/([^/]+)$/);

		if (route.request().method() === 'GET' && requestUrl.pathname === '/api/bookings') {
			const response = await route.fetch();
			const payload = await response.json();
			originalBookings = Array.isArray(payload.data) ? payload.data as BookingRecord[] : [];

			if (originalBookings.length < 2) {
				await route.fulfill({ response, body: JSON.stringify(payload) });
				return;
			}

			// Question 3: Save the patched object and replace only its requested fields.
			const originalTarget = originalBookings[0];
			const newPatchedBooking: BookingRecord = {
				...originalTarget,
				bookingRef: 'PW-RUNTIME-BOOKING-001',
				quantity: 7,
				totalPrice: 24680,
				event: {
					...originalTarget.event,
					title: 'Runtime Patched Event: Automation Showcase'
				}
			};
			patchedBooking = newPatchedBooking;
			patchedBookings = originalBookings.map(booking =>
				String(booking.id) === String(originalTarget.id) ? newPatchedBooking : booking
			);

			await route.fulfill({
				response,
				body: JSON.stringify({ ...payload, data: patchedBookings })
			});
			return;
		}

		// Question 9: Align the matching detail response while retaining its live customer email.
		if (route.request().method() === 'GET' && detailMatch) {
			const bookingId = detailMatch[1];
			if (!patchedBooking || bookingId !== String(patchedBooking.id)) {
				await route.continue();
				return;
			}

			detailRequestBookingId = bookingId;
			const response = await route.fetch();
			const payload = await response.json();
			const originalDetail = payload.data;
			originalDetailEmail = originalDetail.customerEmail;

			await route.fulfill({
				response,
				body: JSON.stringify({
					...payload,
					data: {
						...originalDetail,
						bookingRef: patchedBooking.bookingRef,
						quantity: patchedBooking.quantity,
						totalPrice: patchedBooking.totalPrice,
						event: {
							...originalDetail.event,
							title: patchedBooking.event.title
						}
					}
				})
			});
			return;
		}

		await route.continue();
	});

	// Question 5: Open My Bookings after installing the route and wait for its list response.
	// The heading can render before the list request has completed.
	const listResponse = page.waitForResponse(response => {
		const responseUrl = new URL(response.url());
		return response.request().method() === 'GET' && responseUrl.pathname === '/api/bookings';
	});
	await myBookingsLink.click();
	await listResponse;
	await expect(page.getByRole('heading', { name: 'My Bookings', exact: true })).toBeVisible();
	expect(
		originalBookings.length,
		'This account needs at least two live bookings to verify patched and unchanged cards'
	).toBeGreaterThanOrEqual(2);
	const verifiedPatchedBooking = patchedBooking;
	expect(verifiedPatchedBooking).toBeDefined();
	if (!verifiedPatchedBooking) {
		throw new Error('The bookings response did not produce a patched record.');
	}

	// Question 4: Verify exactly one record changed and all other records stayed identical.
	expect(patchedBookings).toHaveLength(originalBookings.length);
	const changedRecords = patchedBookings.filter((booking, index) =>
		JSON.stringify(booking) !== JSON.stringify(originalBookings[index])
	);
	expect(changedRecords).toHaveLength(1);
	expect(verifiedPatchedBooking.id).toBe(originalBookings[0].id);
	expect(verifiedPatchedBooking.bookingRef).toBe('PW-RUNTIME-BOOKING-001');
	expect(patchedBookings.filter(booking => String(booking.id) !== String(verifiedPatchedBooking.id)))
		.toEqual(originalBookings.filter(booking => String(booking.id) !== String(verifiedPatchedBooking.id)));

	// Question 6: Locate the patched card by reference and verify its patched values.
	const patchedCard = page.getByTestId('booking-card').filter({ hasText: verifiedPatchedBooking.bookingRef });
	await expect(patchedCard).toHaveCount(1);
	await expect(patchedCard.getByText(verifiedPatchedBooking.event.title, { exact: true })).toBeVisible();
	await expect(patchedCard.getByText(/7 tickets?/)).toBeVisible();
	await expect(patchedCard.getByText('$24,680', { exact: true })).toBeVisible();

	const otherBooking = originalBookings.find(
		booking => String(booking.id) !== String(verifiedPatchedBooking.id)
	);
	expect(otherBooking).toBeDefined();
	if (!otherBooking) {
		throw new Error('An unchanged booking was not found.');
	}
	// Question 7: Prove another card still shows its unchanged live booking data.
	expect(otherBooking.bookingRef).not.toBe(verifiedPatchedBooking.bookingRef);
	const otherCard = page.getByTestId('booking-card').filter({ hasText: otherBooking.bookingRef });
	await expect(otherCard).toBeVisible();
	await expect(otherCard.getByText(otherBooking.bookingRef, { exact: true })).toBeVisible();
	if (otherBooking.event?.title) {
		await expect(otherCard.getByText(otherBooking.event.title, { exact: true })).toBeVisible();
	}

	// Question 8: Open details and confirm the preserved booking ID is in the route.
	await patchedCard.getByRole('link', { name: 'View Details' }).click();
	await expect(page).toHaveURL(new RegExp(`/bookings/${verifiedPatchedBooking.id}$`));
	const bookingBreadcrumb = page.locator('main')
		.getByRole('link', { name: 'My Bookings', exact: true })
		.first()
		.locator('..');
	// Question 10: Verify patched detail fields and the unchanged original customer email.
	await expect(bookingBreadcrumb).toContainText(verifiedPatchedBooking.bookingRef);
	await expect(page.getByRole('heading', { name: verifiedPatchedBooking.event.title, exact: true })).toBeVisible();
	expect(detailRequestBookingId).toBe(String(verifiedPatchedBooking.id));
	expect(originalDetailEmail).toBeTruthy();
	if (!originalDetailEmail) {
		throw new Error('The live booking detail response did not include a customer email.');
	}
	await expect(page.getByText(originalDetailEmail, { exact: true })).toBeVisible();

	const ticketsRow = page.getByText('Tickets', { exact: true }).locator('..');
	await expect(ticketsRow).toContainText('7');
	const totalPaidRow = page.getByText('Total Paid', { exact: true }).locator('..');
	await expect(totalPaidRow).toContainText('$24,680');

	await page.getByRole('link', { name: 'My Bookings' }).last().click();
	await expect(page.getByRole('heading', { name: 'My Bookings', exact: true })).toBeVisible();
	// Question 11: Return to the list and re-find the patched card by reference.
	const returnedPatchedCard = page.getByTestId('booking-card').filter({ hasText: verifiedPatchedBooking.bookingRef });
	await expect(returnedPatchedCard).toHaveCount(1);
	await expect(returnedPatchedCard.getByText('$24,680', { exact: true })).toBeVisible();
});
