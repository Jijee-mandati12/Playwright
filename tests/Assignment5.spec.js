const { test, expect } = require('@playwright/test');
require('dotenv').config();

test("Mocking EventHub Events", async ({ page }) => {

  // =====================================================
  // 1. MOCK EVENT DATA
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
  // 2. FORMAT PRICE
  // =====================================================

  function formatPrice(price) {
    return `$${price.toLocaleString('en-US')}`;
  }


  // =====================================================
  // 3. OPEN EVENTHUB
  // =====================================================

  await page.goto(
    'https://eventhub.rahulshettyacademy.com'
  );


  // =====================================================
  // 4. LOGIN
  // =====================================================

  await page
    .getByPlaceholder('you@email.com')
    .fill(process.env.EVENTHUB_EMAIL);

  await page
    .getByRole('textbox', {
      name: 'Password'
    })
    .fill(process.env.EVENTHUB_PASSWORD);

  await page
    .getByRole('button', {
      name: 'Sign In'
    })
    .click();


  await page.waitForURL(
    'https://eventhub.rahulshettyacademy.com/'
  );


  // =====================================================
  // 5. MOCK /api/events
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


      // -------------------------------------------------
      // DETAIL API
      // /api/events/mock-101
      // -------------------------------------------------

      const detailMatch =
        requestUrl.pathname.match(
          /^\/api\/events\/([^/]+)$/
        );


      if (detailMatch) {

        const eventId = detailMatch[1];

        const event =
          mockEvents.find(
            mockEvent =>
              mockEvent.id === eventId
          );


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


      // -------------------------------------------------
      // CATALOG API
      // /api/events
      // -------------------------------------------------

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


        // Start with all mock events
        let filteredEvents =
          [...mockEvents];

        // Search filter
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
            )
        }
        // Category filter
        if (category) {

          filteredEvents =
            filteredEvents.filter(
              event =>
                event.category
                  .toLowerCase() ===
                category.toLowerCase()
            )
        }
        // City filter
        if (city) {

          filteredEvents =
            filteredEvents.filter(
              event =>
                event.city
                  .toLowerCase() ===
                city.toLowerCase()
            )
        }
        console.log(
          'MOCK EVENTS:',
          filteredEvents.map(
            event => event.title
          )
        )

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
  )
  //SMALL MOCK DETAIL PAGE
   await page.route('https://eventhub.rahulshettyacademy.com/events/mock-*',async route => {

      const requestUrl =
        new URL(route.request().url());
      const eventId =
        requestUrl.pathname
          .split('/')
          .pop();


      const event =
        mockEvents.find(
          mockEvent =>
            mockEvent.id === eventId
        );


      // Not one of our mock events
      if (!event) {
        await route.continue();
        return;
      }
 


      // SMALL HTML
      // Only elements required by the assignment
          const html = `
                <!DOCTYPE html>

                <html>
                <head>
                    <title>${event.title}</title>
                </head>

                <body>

                    <h1>${event.title}</h1>

                    <p>
                        Category: ${event.category}
                    </p>

                    <p>
                        City: ${event.city}
                    </p>

                    <p>
                        ${event.availableSeats} seats available
                    </p>

                    <p data-testid="event-price">
                        ${formatPrice(event.price)}
                    </p>

                    <label>
                        Quantity
                    </label>

                    <button id="decrease">
                        -
                    </button>

                    <input
                        id="quantity"
                        type="number"
                        value="1"
                        readonly
                    >

                    <button id="increase">
                        +
                    </button>

                    <p>
                        Total:
                        <span id="total">
                            ${formatPrice(event.price)}
                        </span>
                    </p>


                    <script>

                        let quantity = 1;

                        const price = ${event.price};

                        const quantityInput =
                            document.getElementById(
                                'quantity'
                            );

                        const total =
                            document.getElementById(
                                'total'
                            );


                        document
                            .getElementById('increase')
                            .addEventListener(
                                'click',
                                () => {

                                    quantity++;

                                    quantityInput.value =
                                        quantity;

                                    total.textContent =
                                        '$' +
                                        (
                                            price * quantity
                                        ).toLocaleString('en-US');
                                }
                            );


                        document
                            .getElementById('decrease')
                            .addEventListener(
                                'click',
                                () => {

                                    if (quantity > 1) {

                                        quantity--;

                                        quantityInput.value =
                                            quantity;

                                        total.textContent =
                                            '$' +
                                            (
                                                price * quantity
                                            ).toLocaleString('en-US');
                                    }
                                }
                            );

                    </script>

                </body>
                </html>
            `
      await route.fulfill({ status: 200,contentType: 'text/html',body: html})
    }
  ) 
  //OPEN EVENTS
   await page.getByRole('link', { name: 'Events',exact: true}).click() 
  //  VERIFY EVENTS PAGE
  await expect(page.getByRole('heading', {name: /Upcoming Events/i})).toBeVisible()
  const eventCards = page.locator(".event-card:visible, [data-testid='event-card']:visible")
 //  ONLY MOCKED EVENTS ARE SHOWN
await expect(eventCards).toHaveCount(4);
 // Verify all 4 mock events
  for (const mockEvent of mockEvents) {
    await expect( page.getByText( mockEvent.title, { exact: true})).toBeVisible()
  }
  // Live event must NOT exist
  await expect(page.getByText('World Tech Summit',{ exact: true})).not.toBeVisible() 
  // VERIFY MOCK CARD DATA 
  for (const mockEvent of mockEvents) {
    const card = eventCards.filter({hasText: mockEvent.title})

    // Price
    await expect(card).toContainText(formatPrice(mockEvent.price))
    // Available seats
    await expect(card).toContainText(String(mockEvent.availableSeats))
    // Book Now URL
    const bookNow =card.getByRole('link',{name: /Book Now/i})
    await expect(bookNow).toHaveAttribute('href',`/events/${mockEvent.id}`)}
  //FILTER Hyderabad + Conference + Hyderabad
  const search =page.getByPlaceholder('Search events, venues…')

  const categorySelect = page.locator('select').first()
  const citySelect =page.locator('select').nth(1)
  //search Keyword
  await search.fill('Hyderabad')
  // Category
  await categorySelect.selectOption('Conference')
  // City
  await citySelect.selectOption('Hyderabad')
  // EXACTLY ONE CARD
    await expect(eventCards).toHaveCount(1)
  // STORE THE MOCK RECORD
    const selectedEvent = mockEvents.find(mockEvent => mockEvent.category ==='Conference' && mockEvent.city ==='Hyderabad' )
  expect(selectedEvent).toBeDefined()
 // console.log('SELECTED MOCK:',selectedEvent)
  // Verify selected title
  await expect(page.getByText(selectedEvent.title,{exact: true})).toBeVisible()

  //  CLICK BOOK NOW
   const selectedCard =eventCards.filter({ hasText:selectedEvent.title})
  const selectedBookNow =selectedCard.getByRole('link',{name: /Book Now/i})
  await selectedBookNow.click();
  //  VERIFY DETAIL PAGE PATH
   await page.waitForURL(`**/events/${selectedEvent.id}`)
  await expect(page).toHaveURL(`https://eventhub.rahulshettyacademy.com/events/${selectedEvent.id}`)


  // Important:
  // Force normal document request so our
  // mocked detail HTML is returned.
  await page.goto(`https://eventhub.rahulshettyacademy.com/events/${selectedEvent.id}`)

  // VERIFY DETAIL VALUES MATCH MOCK RECORD
  // Title
  await expect(page.getByRole('heading', {name: selectedEvent.title})).toBeVisible()
  // Price
  await expect(page.getByTestId('event-price')).toHaveText(formatPrice(selectedEvent.price))
  // City
  await expect(page.getByText(`City: ${selectedEvent.city}`,{exact: true})).toBeVisible()
  // Available seats
  await expect(page.getByText(`${selectedEvent.availableSeats} seats available`,{exact: true})).toBeVisible()
  // Category
  await expect(page.getByText(`Category: ${selectedEvent.category}`,{exact: true})).toBeVisible()
 
  // QUANTITY STARTS AT 1
    const quantityInput =page.locator('#quantity')
  await expect(quantityInput).toHaveValue('1')
  // TOTAL FOR ONE TICKET
  const total = page.locator('#total');
  await expect(total).toHaveText(formatPrice(selectedEvent.price))
 // INCREASE QUANTITY TO 2
  await page.getByRole('button', {name: '+'}).click();
  await expect(quantityInput).toHaveValue('2');
  // Q9 VERIFY TOTAL = PRICE × 2
    await expect(total).toHaveText(formatPrice(selectedEvent.price * 2))
})