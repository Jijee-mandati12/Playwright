const { test, expect } = require('@playwright/test')
//Core Playwright manage browser by explicitly launch or close browser where as playwright test runner end to end testing 
//like fixtures,isolated,test,assertions 
const url = "https://eventhub.rahulshettyacademy.com"
test("validate  the EventHub login page", async ({ page }) => {
    await page.goto(url)


    await expect(page.locator(".text-xl.font-bold.text-gray-900")).toBeVisible()
    await expect(page.getByPlaceholder("you@email.com")).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()




})

test("validate login url", async ({ page }) => {
    await page.goto(url)
    await expect(page.getByLabel("Password")).toBeVisible()

    await expect(page).toHaveURL(/.*\/login/)

    await expect(page.locator(".text-xl.font-bold.text-gray-900")).toBeVisible()


})

//smoke suit
test.describe('EventHub Login Page Smoke Suite', () => {

    // Runs before every test in this suite
    test.beforeEach(async ({ page }) => {
        await page.goto(url)
    })

    test("validate  the EventHub login page under suit", async ({ page }) => {



        await expect(page.locator(".text-xl.font-bold.text-gray-900")).toBeVisible()
        await expect(page.getByPlaceholder("you@email.com")).toBeVisible()
        await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()




    })


    test("validate login url contains under suit", async ({ page }) => {

        await expect(page.getByLabel("Password")).toBeVisible()

        await expect(page).toHaveURL(/.*\/login/)

        await expect(page.locator(".text-xl.font-bold.text-gray-900")).toBeVisible()


    })

})

