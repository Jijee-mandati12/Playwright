# GreenKart SeleniumPractise Test Plan

## Application Overview

Functional test plan for the GreenKart grocery storefront at https://rahulshettyacademy.com/seleniumPractise/#/. Live exploration confirmed a 30-item catalog with per-item quantity spinbuttons and ADD TO CART actions, immediate catalog search and no-results feedback, a cart route with product and pricing summary, promo field, Place Order action, country selection and Terms & Conditions gate, and a Top Deals table with search, sortable columns, page-size options, pagination, and a delivery-date widget. Each scenario assumes an isolated fresh browser context and starts at the storefront unless its steps navigate directly to another route. Observed issue: an empty cart displays null totals and still permits navigation to the country step via Place Order. The live session accumulated console errors; capture and investigate exact console messages during execution.

## Test Scenarios

### 1. Catalog and Cart

**Seed:** `tests/seed.spec.ts`

#### 1.1. Catalog loads and product search filters correctly

**File:** `tests/greenkart-catalog.spec.ts`

**Steps:**
  1. Open https://rahulshettyacademy.com/seleniumPractise/#/ in a fresh browser context.
    - expect: The page title is GreenKart - veg and fruits kart.
    - expect: The header, search field labeled Search for Vegetables and Fruits, Cart entry point, and catalog render.
  2. Inspect products at the beginning, middle, and end of the catalog, including Raspberry - 1/4 Kg.
    - expect: Each inspected product has a name, rupee price, quantity spinbutton initialized to 1, and ADD TO CART button.
    - expect: The catalog contains the visible produce and nuts entries and the footer is reachable.
  3. Search for Apple, then search for zz-not-a-product.
    - expect: Apple filters the catalog to Apple - 1 Kg with its price and product controls.
    - expect: An unmatched query displays Sorry, no products matched your search! and guidance to try another keyword.
  4. Clear the search field.
    - expect: The full catalog returns.

#### 1.2. Add multiple products and verify quantities and totals

**File:** `tests/greenkart-cart.spec.ts`

**Steps:**
  1. From a fresh storefront, increase Brocolli - 1 Kg quantity from 1 to 2 using its plus control, then select ADD TO CART.
    - expect: The item count and cart value reflect two broccoli units at the displayed unit price.
  2. Add one Cucumber - 1 Kg unit and open the Cart route from the header.
    - expect: The cart contains one line per selected product, with the correct quantities, unit prices, and line totals.
    - expect: The combined total equals the sum of displayed unit price multiplied by quantity.

#### 1.3. Empty cart cannot advance to an order

**File:** `tests/greenkart-empty-cart.spec.ts`

**Steps:**
  1. Navigate directly to https://rahulshettyacademy.com/seleniumPractise/#/cart in a fresh browser context.
    - expect: The empty cart state is displayed.
    - expect: Item count and total are represented as zero or a clear empty value, not null.
    - expect: Place Order is disabled or otherwise blocked.
  2. If Place Order is enabled, activate it and inspect the resulting route.
    - expect: The application blocks checkout for an empty cart and explains why.
    - expect: Failure: the explored app displayed You cart is empty! but showed null totals and allowed navigation to #/country.

#### 1.4. Invalid promo code does not change cart total

**File:** `tests/greenkart-promo.spec.ts`

**Steps:**
  1. Add Brocolli - 1 Kg and open the cart route.
    - expect: The cart shows the item and total; an Enter promo code textbox and Apply button are available.
  2. Enter INVALIDCODE and select Apply; then inspect discount, total, and feedback.
    - expect: The invalid code is rejected with understandable feedback.
    - expect: Discount remains 0% and total after discount remains equal to the pre-promo total.
    - expect: Cart contents remain unchanged.

### 2. Checkout

**Seed:** `tests/seed.spec.ts`

#### 2.1. Terms consent is required and country can be selected

**File:** `tests/greenkart-checkout.spec.ts`

**Steps:**
  1. Add one product, open the cart, select Place Order, and reach the country step.
    - expect: The route changes to #/country and shows a Choose Country dropdown, Terms & Conditions checkbox/link, and Proceed button.
  2. Without checking the consent checkbox, select Proceed.
    - expect: The page remains on the country step and displays Please accept Terms & Conditions - Required.
  3. Select India, check the consent checkbox, and select Proceed.
    - expect: The flow proceeds from the country step and returns to the storefront route.
    - expect: The selected country and consent do not corrupt the order flow.

#### 2.2. Successful order reaches a clear terminal confirmation

**File:** `tests/greenkart-order.spec.ts`

**Steps:**
  1. In a fresh browser context, add two different products and verify the cart quantities and total.
    - expect: The cart summary matches the selected products and arithmetic.
  2. Select Place Order, choose India, accept Terms & Conditions, and select Proceed once.
    - expect: A clear order-success confirmation or equivalent terminal success state is presented.
    - expect: The confirmation corresponds to the submitted order and the cart is not submitted twice.
    - expect: Record the final route and cart state; the explored flow returned to #/ but did not expose a confirmation in the captured accessibility snapshot.

### 3. Top Deals

**Seed:** `tests/seed.spec.ts`

#### 3.1. Offers search supports matching and no-result queries

**File:** `tests/greenkart-offers.spec.ts`

**Steps:**
  1. Open the storefront and select Top Deals, navigating to #/offers.
    - expect: The offers table, Page size dropdown, Search field, pagination controls, and Delivery Date widget render.
  2. Search for Carrot, then for a string with no matching offer, and clear the search.
    - expect: Carrot filters the table to its matching row (exploration showed Carrot, price 34, discount price 12).
    - expect: No-match behavior is clear and clearing restores rows.

#### 3.2. Offers columns sort in both directions

**File:** `tests/greenkart-offers.spec.ts`

**Steps:**
  1. On #/offers, note the initial sort indicator and rows.
    - expect: The table exposes sortable Veg/fruit name, Price, and Discount price columns; the initial accessible status reported name descending.
  2. Select the Price column header twice.
    - expect: The table announces price ascending after the first selection and price descending after the second.
    - expect: Rows are ordered numerically by the selected column in the announced direction.

#### 3.3. Offers page size and pagination

**File:** `tests/greenkart-offers.spec.ts`

**Steps:**
  1. Inspect Page size options, select 10, then navigate to Next and Last where enabled.
    - expect: Page size options include 5, 10, and 20.
    - expect: The visible row count follows the selected page size, except on a final partial page.
    - expect: Current-page state and First, Previous, Next, and Last enabled/disabled states are consistent.

#### 3.4. Delivery date widget accepts valid dates

**File:** `tests/greenkart-offers.spec.ts`

**Steps:**
  1. Inspect the date widget's day, month, and year spinbuttons and its adjacent buttons.
    - expect: The current date is represented consistently across the date inputs.
    - expect: Controls can be identified and operated with keyboard and assistive technology; unlabeled controls are recorded as an accessibility issue.
  2. Enter a valid date and then an invalid boundary date, such as an impossible day for the selected month.
    - expect: Valid input is retained or normalized consistently.
    - expect: Invalid dates are rejected or corrected without leaving the widget in a contradictory state.
