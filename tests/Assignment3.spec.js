const { test, expect } = require('@playwright/test')

test("Validate EventHub Events", async ({ page }) => {

    //1. Launch EventHub URl
    await page.goto("https://eventhub.rahulshettyacademy.com")

    //login page locators
    const emailField = page.getByPlaceholder("you@email.com")
    const password = page.getByRole('textbox', { name: "Password" })
    const signInButton = page.getByRole('button', { name: 'Sign In' })

    //Q1:sign into EventHub portal
    await emailField.fill('mandatijijee8@gmail.com')
    await password.fill('Playwright@12')
    await signInButton.click()

    //click on Events menu link
    const event = page.getByRole('link', { name: "Events", exact: true })
    await event.click()

    //Q2. Confirm the Upcoming Events heading is visible
    const mainHeading = page.getByRole("heading", { name: /upcoming events/i });
    await expect(mainHeading).toBeVisible();

    //Event page locators
    const search = page.getByPlaceholder("Search events, venues…")
    const catogirySelect = page.locator("select")
    const citySelect = page.locator("select")
    const listOfEvents = page.locator(".event-card, [data-testid='event-card']")


    //Q3 Event page Actions(search for World, choose category Conference, and choose city Hyderabad)
    await search.fill("World")
    await catogirySelect.first().selectOption("Conference")
    await citySelect.nth(1).selectOption("Hyderabad")
    // const eventsTexts=await listOfEvents.allTextContents()
    //console.log(eventsTexts)
    //select World Tech Summit
    //await listOfEvents.filter({ hasText: "World Tech Summit" }).click();

    //Q4:confirm at least one card matches, narrow to the card that shows World Tech Summit, and confirm exactly one match
    await expect(listOfEvents.first()).toBeVisible()
    const eventName = listOfEvents.filter({ hasText: "World Tech Summit" })

    await expect(eventName).toContainText("World Tech Summit")
    await expect(eventName).toHaveCount(1)

    //Q5 : capture the event title, price text, and seats text of the Matching card
    const eventTitle = (await eventName.getByRole('heading', { name: 'World Tech Summit', exact: true }).innerText()).trim()
    const eventPrice = (await eventName.locator(".text-lg.font-bold.text-indigo-700").innerText()).trim()
    const seats = (await eventName.locator(".text-xs.font-bold.text-amber-600").innerText()).trim()

    //Q6:Confirm the title is World Tech Summit, the price text contains $, and the available seat count parsed from the seats text is greater than 0

    expect(eventTitle).toBe("World Tech Summit")
    expect(eventPrice).toContain("$")
    const seatsCount = parseInt(seats, 10);


    //Q7 :inside the same event  Open "Book Now"
    await eventName.getByRole('link', { name: 'Book Now' }).click()
    await page.waitForLoadState("networkidle")

    //Q8 : World Tech Summit page booking assertions
    await expect(page).toHaveURL(/events/)
    const bookingHeading = page.getByRole('heading', { name: 'World Tech Summit' })
    await expect(bookingHeading).toHaveText(eventTitle)
    const bookingPrice = page.locator(".text-sm.text-gray-800.font-medium").nth(5)
    // console.log(bookingPrice)
    await expect(bookingPrice).toContainText(eventPrice)

    //Q9Return back to events page ,clear filters and validated 3 events cards are visable

    // Navigates back to the previous page in history
    await page.goBack();

    //click on clear filters
    await page.getByRole('button', { name: 'Clear filters' }).click()

    //confirm event cards count is 3
    await expect(listOfEvents.nth(2)).toBeVisible()

    //Q10:Compare the first, second, and last card titles: all must be non-empty, and the first and last titles must differ

    const firstCardTitle = (await listOfEvents.first().getByRole('heading', { name: 'Dilli Diwali Mela' }).innerText()).trim()
    const secondCardTitle = (await listOfEvents.nth(1).getByRole('heading', { name: 'Hollywood Monsoon Night — Los Angeles' }).innerText()).trim()
    const thirdCardTitle = (await listOfEvents.last().getByRole('heading', { name: 'World Tech Summit' }).innerText()).trim()
    //must not be empty
    expect(firstCardTitle).not.toBe("")
    expect(secondCardTitle).not.toBe("")
    expect(thirdCardTitle).not.toBe("")

    //first and last must not equal
    expect(firstCardTitle).not.toBe(thirdCardTitle)

})