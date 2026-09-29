const { test, expect } = require('@playwright/test');
require('dotenv').config();

test("Mocking EventHub Events", async ({ page }) => {

    // =====================================================
    // MOCK EVENT DATA
    // =====================================================

    const mockEvents = [
        {
            id: 'mock-101',
            title: 'Hyderabad Tech Conference',
            category: 'Conference',
            city: 'Hyderabad',
            price: 1500,
            availableSeats: 120
        },
        {
            id: 'mock-102',
            title: 'Delhi Music Festival',
            category: 'Festival',
            city: 'Delhi',
            price: 2000,
            availableSeats: 250
        },
        {
            id: 'mock-103',
            title: 'Mumbai Live Concert',
            category: 'Concert',
            city: 'Mumbai',
            price: 2500,
            availableSeats: 180
        },
        {
            id: 'mock-104',
            title: 'Bangalore Testing Workshop',
            category: 'Workshop',
            city: 'Bangalore',
            price: 1000,
            availableSeats: 80
        }
    ];


    // =====================================================
    // FORMAT PRICE
    // =====================================================

    function formatPrice(price) {
        return `$${price.toLocaleString('en-US')}`;
    }


    // =====================================================
    // OPEN EVENTHUB
    // =====================================================

    await page.goto(
        'https://eventhub.rahulshettyacademy.com'
    );


    // =====================================================
    // LOGIN
    // =====================================================

    const emailField =
        page.getByPlaceholder('you@email.com');

    const password =
        page.getByRole('textbox', {
            name: 'Password'
        });

    const signInButton =
        page.getByRole('button', {
            name: 'Sign In'
        });


    await emailField.fill(
        process.env.EVENTHUB_EMAIL
    );

    await password.fill(
        process.env.EVENTHUB_PASSWORD
    );

    await signInButton.click();


    // Wait until login is completed
    await page.waitForURL(
        'https://eventhub.rahulshettyacademy.com/'
    );


    // =====================================================
    // MOCK EVENT API
    // =====================================================

    await page.route(
        'https://api.eventhub.rahulshettyacademy.com/api/events*',
        async route => {

            const requestUrl =
                new URL(route.request().url());

            console.log(
                'API REQUEST:',
                requestUrl.href
            );


            // =================================================
            // DETAIL API
            // Example:
            // /api/events/mock-101
            // =================================================

            const detailMatch =
                requestUrl.pathname.match(
                    /^\/api\/events\/([^/]+)$/
                );


            if (detailMatch) {

                const eventId =
                    detailMatch[1];

                console.log(
                    'DETAIL EVENT ID:',
                    eventId
                );


                const event =
                    mockEvents.find(
                        mockEvent =>
                            mockEvent.id === eventId
                    );


                // Event not found
                if (!event) {

                    await route.fulfill({
                        status: 404,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            success: false,
                            message: 'Event not found'
                        })
                    });

                    return;
                }


                console.log(
                    'MOCK DETAIL:',
                    event
                );


                // Return mocked event detail
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        data: event
                    })
                });

                return;
            }


            // =================================================
            // CATALOG API
            // /api/events
            // =================================================

            if (
                requestUrl.pathname ===
                '/api/events'
            ) {

                const search =
                    requestUrl.searchParams.get(
                        'search'
                    ) || '';


                const category =
                    requestUrl.searchParams.get(
                        'category'
                    ) || '';


                const city =
                    requestUrl.searchParams.get(
                        'city'
                    ) || '';


                console.log(
                    'SEARCH:',
                    search
                );

                console.log(
                    'CATEGORY:',
                    category
                );

                console.log(
                    'CITY:',
                    city
                );


                // Start with all mock events
                let filteredEvents =
                    [...mockEvents];


                // =================================================
                // SEARCH FILTER
                // =================================================

                if (search) {

                    filteredEvents =
                        filteredEvents.filter(
                            event =>
                                event.title
                                    .toLowerCase()
                                    .includes(
                                        search.toLowerCase()
                                    ) ||

                                event.city
                                    .toLowerCase()
                                    .includes(
                                        search.toLowerCase()
                                    )
                        );
                }


                // =================================================
                // CATEGORY FILTER
                // =================================================

                if (category) {

                    filteredEvents =
                        filteredEvents.filter(
                            event =>
                                event.category
                                    .toLowerCase() ===
                                category.toLowerCase()
                        );
                }


                // =================================================
                // CITY FILTER
                // =================================================

                if (city) {

                    filteredEvents =
                        filteredEvents.filter(
                            event =>
                                event.city
                                    .toLowerCase() ===
                                city.toLowerCase()
                        );
                }


                console.log(
                    'MOCK CATALOG:',
                    filteredEvents.map(
                        event => event.title
                    )
                );


                // Return mocked catalog
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',

                    body: JSON.stringify({

                        success: true,

                        data: filteredEvents,

                        pagination: {
                            total: filteredEvents.length,
                            page: 1,
                            limit: 12,
                            totalPages: 1
                        }

                    })
                });

                return;
            }


            // Anything else
            await route.continue();
        }
    );


    // =====================================================
    // OPEN EVENTS
    // =====================================================

    const eventsLink =
        page.getByRole('link', {
            name: 'Events',
            exact: true
        });


    await eventsLink.click();


    // =====================================================
    // VERIFY EVENTS PAGE
    // =====================================================

    const mainHeading =
        page.getByRole('heading', {
            name: /Upcoming Events/i
        });


    await expect(mainHeading)
        .toBeVisible();


    // =====================================================
    // EVENT CARDS
    // =====================================================

    const eventCards =
        page.locator(
            ".event-card:visible, [data-testid='event-card']:visible"
        );


    // =====================================================
    // VERIFY 4 MOCK EVENTS
    // =====================================================

    await expect(eventCards)
        .toHaveCount(4);


    // =====================================================
    // VERIFY MOCK EVENT TITLES
    // =====================================================

    for (const mockEvent of mockEvents) {

        await expect(
            page.getByText(
                mockEvent.title,
                {
                    exact: true
                }
            )
        ).toBeVisible();

    }


    // =====================================================
    // VERIFY LIVE EVENT IS NOT PRESENT
    // =====================================================

    await expect(
        page.getByText(
            'World Tech Summit',
            {
                exact: true
            }
        )
    ).not.toBeVisible();


    // =====================================================
    // VERIFY PRICE, SEATS AND BOOK NOW
    // =====================================================

    for (const mockEvent of mockEvents) {

        const card =
            eventCards.filter({
                hasText: mockEvent.title
            });


        // Verify price
        await expect(card)
            .toContainText(
                formatPrice(
                    mockEvent.price
                )
            );


        // Verify seats
        await expect(card)
            .toContainText(
                String(
                    mockEvent.availableSeats
                )
            );


        // Verify Book Now link
        const bookNow =
            card.getByRole(
                'link',
                {
                    name: /Book Now/i
                }
            );


        await expect(bookNow)
            .toHaveAttribute(
                'href',
                `/events/${mockEvent.id}`
            );
    }


    // =====================================================
    // FILTER EVENTS
    // =====================================================

    const search =
        page.getByPlaceholder(
            "Search events, venues…"
        );


    const categorySelect =
        page.locator('select').first();


    const citySelect =
        page.locator('select').nth(1);


    // Search Hyderabad
    await search.fill(
        'Hyderabad'
    );


    // Select Conference
    await categorySelect.selectOption(
        'Conference'
    );


    // Select Hyderabad
    await citySelect.selectOption(
        'Hyderabad'
    );


    // =====================================================
    // VERIFY ONLY ONE EVENT
    // =====================================================

    await expect(eventCards)
        .toHaveCount(1);


    // =====================================================
    // GET SELECTED EVENT
    // =====================================================

    const selectedEvent =
        mockEvents.find(
            mockEvent =>
                mockEvent.category ===
                    'Conference' &&

                mockEvent.city ===
                    'Hyderabad'
        );


    expect(selectedEvent)
        .toBeDefined();


    // Verify selected event title
    await expect(
        page.getByText(
            selectedEvent.title,
            {
                exact: true
            }
        )
    ).toBeVisible();


    // =====================================================
    // CLICK BOOK NOW
    // =====================================================

    const selectedCard =
        eventCards.filter({
            hasText:
                selectedEvent.title
        });


    await expect(selectedCard)
        .toHaveCount(1);


    const selectedBookNow =
        selectedCard.getByRole(
            'link',
            {
                name: /Book Now/i
            }
        );


    await expect(selectedBookNow)
        .toBeVisible();


    // Click Book Now
    await selectedBookNow.click();


   // =====================================================
// VERIFY BOOK NOW NAVIGATION
// =====================================================

await selectedBookNow.click();


// =====================================================
// VERIFY DETAIL PAGE URL
// =====================================================

await page.waitForURL(
    `**/events/${selectedEvent.id}`
);


// Verify URL
await expect(page).toHaveURL(
    `https://eventhub.rahulshettyacademy.com/events/${selectedEvent.id}`
);


console.log(
    'Navigated to:',
    page.url()
);

console.log(
    'Selected event:',
    selectedEvent.title
);

console.log(
    'Price:',
    formatPrice(selectedEvent.price)
);

console.log(
    'City:',
    selectedEvent.city
);

console.log(
    'Category:',
    selectedEvent.category
);

console.log(
    'Available seats:',
    selectedEvent.availableSeats
);


console.log(
    'Mock EventHub test completed successfully'
)
})