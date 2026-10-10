---
name: manual-ecommerce-order-test
description: Run a manual end-to-end ecommerce order test and save test cases, steps, expected results, and execution results to Excel.
---

Perform a manual end-to-end test of the ecommerce application using the browser tools.

Inputs supplied by the user:
- Application URL
- Test account username and password

Workflow:
1. Open the application URL and sign in with the supplied test account.
2. Browse the product catalogue and add at least two products to the cart.
3. Verify the selected products, quantities, availability, and totals in the cart.
4. Complete the billing and shipping form using test-only values. Do not use or save real payment details.
5. Place the order only when explicitly authorized by the user.
6. Verify the order confirmation and locate the created order ID or IDs in the Orders history page.
7. Record the observed results, including product names, total, order date, order ID or IDs, and any failures.

Create an Excel workbook in the workspace containing one row per test case. Include these columns: Test Case ID, Area, Title, Preconditions, Test Steps, Expected Result, Actual Result, Status, and Order ID. Include detailed numbered test steps and distinguish unexecuted cases from passed or failed cases. Never include passwords, CVVs, or other secrets in the workbook.