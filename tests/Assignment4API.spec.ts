

import{test,expect,request} from '@playwright/test'
const loginPayload={email: "mandatijijee8@gmail.com", password: "Playwright@12"}
const bookingPayload={customerEmail:"mandatijijee8@gmail.com",customerName: "Rams",customerPhone:"+7573168434",eventId:283,quantity:1}
let booking1: {
    
    bookingReference: string;
    eventTitle: string;
    ticketCount: number;
    totalText: string;
    customerEmail: string;
  };
//declare token as global
let token:string

// //customer details
// const customerDetails = {
//   name: "Rams",
//   email: "mandatijijee8@gmail.com",
//   phone: "0573168434"
// };
// // Declared as direct object types using type aliases instead of interfaces
// type BookingPayload = {
//   id?: string;
//   bookingReference: string;
//   eventTitle: string;
//   ticketCount: number;
//   totalText: string;
//   customerEmail: string;
// };

// let booking1: BookingPayload;
// let booking2: BookingPayload;

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


//new api context for creting order
const booking1Response=await apiContext.post("https://api.eventhub.rahulshettyacademy.com/api/bookings",
    {
      data:bookingPayload,
      headers:{
        'Authorization' : `Bearer ${token}`,
        'Content-Type' :'application/json'
      },

    })
    //parse response json

const booking1ResponseJson=await booking1Response.json()
const b1data=booking1ResponseJson.data
//console.log(b1data)
//Q2:Capture Booking1 required data event title, booking reference, ticket count, total text, and customer email
booking1={
     eventTitle:b1data.event.title,
bookingReference:b1data.bookingRef,
ticketCount:b1data.quantity,
totalText: b1data.totalPrice,
customerEmail:b1data.customerEmail


 }
//console.log("booking1 data:", booking1)
//Q3 : Confirm the first event title is World Tech Summit, the booking reference is non-empty, and the ticket count is 1
expect(booking1.eventTitle).toContain('World Tech Summit')
expect(booking1.bookingReference).not.toBe("")
expect(booking1.ticketCount).toBe(1)
})



test("Validate EventHub Multiple Events booking", async ({ page }) => {

    page.addInitScript(value=>{
        window.localStorage.setItem('token',value)
    },token)
    //1. Launch EventHub URl
    await page.goto("https://eventhub.rahulshettyacademy.com")


})