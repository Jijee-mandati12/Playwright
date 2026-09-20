

import{test,expect,request} from '@playwright/test'
const loginPayload={email: "mandatijijee8@gmail.com", password: "Playwright@12"}
//declare token as global
let token:string

//customer details
const customerDetails = {
  name: "Rams",
  email: "mandatijijee8@gmail.com",
  phone: "0573168434"
};
// Declared as direct object types using type aliases instead of interfaces
type BookingPayload = {
  id?: string;
  bookingReference: string;
  eventTitle: string;
  ticketCount: number;
  totalText: string;
  customerEmail: string;
};

let booking1: BookingPayload;
let booking2: BookingPayload;

test.beforeAll(async()=>{
    //LOGIN API
    // Create API context
    const apiContext=await request.newContext()
    // Make the POST call
   const loginResponse= await apiContext.post("https://api.eventhub.rahulshettyacademy.com/api/auth/login",

{
    data:loginPayload
})
expect(( loginResponse).ok()).toBeTruthy()
// AWAIT the json parsing
const loginResponseJson=await loginResponse.json()
// Extract token 
token=loginResponseJson.token;
console.log(`token: ${token}`)

// Header helper for authenticated requests
  const authHeaders = {
   'Authorization': `Bearer ${token}`,
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json'
  };
  // 2. CREATE FIRST BOOKING VIA API (Hyderabad - Conference - "World", Qty 1)
  const eventsResp1 = await apiContext.get("https://api.eventhub.rahulshettyacademy.com/api/events?category=Conference&location=Hyderabad&search=World", {
    headers: authHeaders
  });
    //World Tech Summit event filtered
  const eventsData1 = await eventsResp1.json();
  const event1 = eventsData1.data ? eventsData1.data[0] : eventsData1[0];
  const event1title=event1.title
 // console.log(`Events displayed : ${event1title}`)

 //Booking World Tech Summit event
 const createBookingResp1 = await apiContext.post("https://api.eventhub.rahulshettyacademy.com/api/bookings", {
   headers: authHeaders,
  data: {
    eventId: event1.id,
    quantity: 1,
    customerName: "test",
    customerEmail: "mandatijijee8@mail.com",
    customerPhone: "7573168434"
  }
})


if (!createBookingResp1.ok()) {
  console.log("Booking 1 Error Body:", await createBookingResp1.text());
}

expect(createBookingResp1.ok()).toBeTruthy();
})

test("Validate EventHub Multiple Events booking", async ({ page }) => {

    page.addInitScript(value=>{
        window.localStorage.setItem('token',value)
    },token)
    //1. Launch EventHub URl
    await page.goto("https://eventhub.rahulshettyacademy.com")


})