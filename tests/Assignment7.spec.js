const { test, expect, request } = require('@playwright/test');

const appUrl = 'https://eventhub.rahulshettyacademy.com';
const apiBaseUrl = 'https://api.eventhub.rahulshettyacademy.com/api';
const eventHubEmail = 'mandatijijee8@gmail.com';
const eventHubPassword = 'Playwright@12';
const customer = {
	name: 'Playwright API Lifecycle',
	email: 'playwright.api.lifecycle@example.com',
	phone: '+15555550123'
};

function formatCurrency(amount) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	}).format(amount);
}

test('creates, verifies, and cancels a runtime-selected event booking', async ({ page }) => {
	let apiContext;
	let accessToken;
	let booking;
	let bookingDeleted = false;

	try {
		// Question 1: Log in through the API and retain the token for authenticated calls and browser storage.
		apiContext = await request.newContext();
		const loginResponse = await apiContext.post(`${apiBaseUrl}/auth/login`, {
			data: { email: eventHubEmail, password: eventHubPassword }
		});
		expect(loginResponse.ok(), 'EventHub API login should succeed').toBeTruthy();
		const loginData = await loginResponse.json();
		accessToken = loginData.token;
		expect(accessToken, 'Login response should include an access token').toBeTruthy();
		const authHeaders = { Authorization: `Bearer ${accessToken}` };

		// Question 2: Fetch every live event page and choose an event with at least two available seats.
		const events = [];
		let pageNumber = 1;
		let totalPages = 1;
		do {
			const eventsResponse = await apiContext.get(`${apiBaseUrl}/events?page=${pageNumber}&limit=100`, {
				headers: authHeaders
			});
			expect(eventsResponse.ok(), `Event page ${pageNumber} should load`).toBeTruthy();
			const eventsPayload = await eventsResponse.json();
			events.push(...(Array.isArray(eventsPayload.data) ? eventsPayload.data : []));
			totalPages = Number(eventsPayload.pagination?.totalPages || pageNumber);
			pageNumber += 1;
		} while (pageNumber <= totalPages);

		const selectedEvent = events.find(event => Number(event.availableSeats) >= 2);
		expect(selectedEvent, 'A live event with at least two available seats is required').toBeTruthy();
		const selectedEventDetails = {
			id: selectedEvent.id,
			title: selectedEvent.title,
			category: selectedEvent.category,
			city: selectedEvent.city,
			price: Number(selectedEvent.price)
		};
		const expectedTotal = selectedEventDetails.price * 2;

		// Question 3: Create two tickets for the selected event with deterministic customer details.
		const createResponse = await apiContext.post(`${apiBaseUrl}/bookings`, {
			headers: authHeaders,
			data: {
				eventId: selectedEventDetails.id,
				quantity: 2,
				customerName: customer.name,
				customerEmail: customer.email,
				customerPhone: customer.phone
			}
		});
		expect(createResponse.ok(), 'Booking creation should succeed').toBeTruthy();
		const createdPayload = await createResponse.json();
		const createdData = createdPayload.data;
		booking = {
			id: createdData?.id,
			bookingRef: createdData?.bookingRef,
			quantity: createdData?.quantity,
			totalPrice: Number(createdData?.totalPrice),
			event: selectedEventDetails,
			customerName: createdData?.customerName,
			customerEmail: createdData?.customerEmail,
			customerPhone: createdData?.customerPhone
		};

		// Question 4: Store the booking and verify its ID, reference, event, quantity, and total.
		expect(booking.id, 'Create response should include a booking ID').toBeTruthy();
		expect(booking.bookingRef, 'Create response should include a booking reference').toBeTruthy();
		expect(booking.quantity).toBe(2);
		expect(booking.totalPrice).toBe(expectedTotal);
		expect(createdData.event.id).toBe(selectedEventDetails.id);
		expect(createdData.event.title).toBe(selectedEventDetails.title);
		expect(booking.customerEmail).toBe(customer.email);

		// Question 5: Look up by reference and compare the key values with the create response.
		const referenceResponse = await apiContext.get(
			`${apiBaseUrl}/bookings/ref/${encodeURIComponent(booking.bookingRef)}`,
			{ headers: authHeaders }
		);
		expect(referenceResponse.ok(), 'The new booking should be retrievable by reference').toBeTruthy();
		const referencePayload = await referenceResponse.json();
		const referenceData = referencePayload.data;
		expect(referenceData.id).toBe(booking.id);
		expect(referenceData.bookingRef).toBe(booking.bookingRef);
		expect(referenceData.quantity).toBe(booking.quantity);
		expect(Number(referenceData.totalPrice)).toBe(booking.totalPrice);

		// Question 6: Seed the token before the first app navigation, then open My Bookings.
		await page.addInitScript(token => {
			window.localStorage.setItem('eventhub_token', token);
		}, accessToken);
		await page.goto(appUrl);
		const myBookingsLink = page.getByRole('link', { name: 'My Bookings' }).first();
		await expect(myBookingsLink).toBeVisible();
		await myBookingsLink.click();
		await expect(page.getByRole('heading', { name: 'My Bookings', exact: true })).toBeVisible();
		const bookingCard = page.getByTestId('booking-card').filter({ hasText: booking.bookingRef });
		await expect(bookingCard).toHaveCount(1);

		// Question 7: Verify the reference-matched card shows the selected event, two tickets, and total.
		await expect(bookingCard.getByText(booking.event.title, { exact: true })).toBeVisible();
		await expect(bookingCard.getByText(/2 tickets?/)).toBeVisible();
		await expect(bookingCard.getByText(formatCurrency(booking.totalPrice), { exact: true })).toBeVisible();

		// Question 8: Open details and validate the booking reference, selected event, payment, and customer.
		await bookingCard.getByRole('link', { name: 'View Details' }).click();
		await expect(page).toHaveURL(new RegExp(`/bookings/${booking.id}$`));
		const breadcrumb = page.locator('main')
			.getByRole('link', { name: 'My Bookings', exact: true })
			.first()
			.locator('..');
		await expect(breadcrumb).toContainText(booking.bookingRef);
		await expect(page.getByRole('heading', { name: booking.event.title, exact: true })).toBeVisible();
		await expect(page.getByText(booking.event.category, { exact: true })).toBeVisible();
		await expect(page.getByText(booking.event.city, { exact: true })).toBeVisible();
		await expect(page.getByText(booking.customerEmail, { exact: true })).toBeVisible();
		await expect(page.getByText('Tickets', { exact: true }).locator('..')).toContainText('2');
		await expect(page.getByText('Price per ticket', { exact: true }).locator('..'))
			.toContainText(formatCurrency(booking.event.price));
		await expect(page.getByText('Total Paid', { exact: true }).locator('..'))
			.toContainText(formatCurrency(booking.totalPrice));

		// Question 9: Cancel the booking through the API using its saved ID.
		const deleteResponse = await apiContext.delete(`${apiBaseUrl}/bookings/${booking.id}`, {
			headers: authHeaders
		});
		expect(deleteResponse.ok(), 'Booking cancellation should succeed').toBeTruthy();
		bookingDeleted = true;

		// Question 10: Verify reference lookup returns the API's not-found status after cancellation.
		const removedLookup = await apiContext.get(
			`${apiBaseUrl}/bookings/ref/${encodeURIComponent(booking.bookingRef)}`,
			{ headers: authHeaders }
		);
		expect(removedLookup.status()).toBe(404);

		// Question 11: Return to My Bookings and prove no card remains for the canceled reference.
		await page.getByRole('link', { name: 'My Bookings' }).first().click();
		await expect(page.getByRole('heading', { name: 'My Bookings', exact: true })).toBeVisible();
		await page.reload();
		await expect(page.getByRole('heading', { name: 'My Bookings', exact: true })).toBeVisible();
		await expect(page.getByTestId('booking-card').filter({ hasText: booking.bookingRef })).toHaveCount(0);
	} finally {
		// Question 12: Remove the booking if an earlier assertion failed, then dispose the API session.
		if (apiContext && booking?.id && !bookingDeleted) {
			await apiContext.delete(`${apiBaseUrl}/bookings/${booking.id}`, {
				headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
			}).catch(() => {});
		}
		await apiContext?.dispose();
	}
});
