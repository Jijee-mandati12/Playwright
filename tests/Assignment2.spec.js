const { test, expect } = require('@playwright/test')


test.describe("Evenhub smoke suite", () => {

    test("validate loginpage using configured base url", async ({ page }) => {

        //navigate to url mentioned in configure snd sppend login by /login
        await page.goto("/login")

        //Assert page title matches Event hub by expressing in Regular expression /.../
        await expect(page).toHaveTitle(/EventHub/)

        // Assert email field and Sign In button are visible
        await expect(page.getByPlaceholder("you@email.com")).toBeVisible()
        await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()



    })

    //use built in page fixture and isolated browser context
    test.only("Validate by using page fixture and isolated browser context",async({page,browser})=>{

       // 1. Use built-in page fixture to open login page and fill email field
    await page.goto('/login');
    const emailField = page.locator('input[type="email"], input[name="email"]');
    
    await emailField.fill('beginner@sample.com');
    // Confirm the same field shows that filled value
    await expect(emailField).toHaveValue('beginner@sample.com');

    // 2. Create a fresh isolated browser context and page
    const isolatedContext = await browser.newContext();
    const isolatedPage = await isolatedContext.newPage();

    // Open the login page with the full application URL explicitly
    await isolatedPage.goto('https://eventhub.rahulshettyacademy.com/');

    // Confirm the "Sign in to EventHub" heading is visible in the new context
    const heading = isolatedPage.getByRole('heading', { name: /Sign in to EventHub/i });
    await expect(heading).toBeVisible();

    // Confirm the email field starts empty in this isolated container
    const isolatedEmailField = isolatedPage.locator('input[type="email"], input[name="email"]');
    await expect(isolatedEmailField).toHaveValue('');

    // Close the isolated context when finished
    await isolatedContext.close();
    })
})
//page fixture is built in Playwrights ready-to-use browser page within an isolated default context
//Browser context is an independent isolated browser window means cookies, localStorage, sessionStorage, and cached data are completely isolated from other contexts and pages.