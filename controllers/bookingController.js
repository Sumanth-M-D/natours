import Stripe from "stripe";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Tour from "../models/tourModel.js";
import Booking from "../models/bookingModel.js";
import catchAsync from "../utils/catchAsync.js";
import handlerFactory from "./handlerFactory.js";
import AppError from "../utils/appError.js";
import User from "../models/userModel.js";

//.
//? Getting the checkout session from stripe
const getCheckoutSession = catchAsync(async function (req, res, next) {
   //1. Get the currently booked tour
   const tour = await Tour.findById(req.params.tourId);

   //2. Create checkout-session
   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
   const session = await stripe.checkout.sessions.create({
      // payment_method: ["card"],
      mode: "payment",

      // success_url: `${req.protocol}://${req.get("host")}/my-tours/?tour=${
      //    req.params.tourId
      // }&user=${req.user.id}&price=${tour.price}`,

      success_url: `${req.protocol}://${req.get("host")}/my-tours`,
      cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`,
      customer_email: req.user.email,
      client_reference_id: req.params.tourId,
      line_items: [
         {
            price_data: {
               currency: "usd",
               product_data: {
                  name: `${tour.name} Tour`,
                  description: tour.summary,
                  images: [
                     `${req.protocol}://${req.get("host")}/img/tours/${
                        tour.imageCover
                     }`,
                  ],
               },
               unit_amount: tour.price * 100, //Considers in cents
            },
            quantity: 1,
         },
      ],
   });

   // /3. Server side render ->
   // res.status(303).redirect(session.url);

   //3. Send checkout-session to client
   res.status(200).json({ status: "success", session });
});

//.
// //? Creating the booking on successful checkout [Temporary => before deploying]
// const createBookingCheckout = catchAsync(async function (req, res, next) {
//
//    const { tour, user, price } = req.query;
//    if (!tour && !user && !price) return next();
//    await Booking.create({ tour, user, price });
//    res.redirect(req.originalUrl.split("?")[0]); /// `${req.protocol}://${req.get("host")}`
// });

//.
//? Creating the booking on successful checkout => through webhooks [after deploying website]
/// Hanlder function for the event => "checkout.session.completed"
const createBookingCheckout = catchAsync(async function (sessionData) {
   console.log(sessionData);
   const tour = sessionData.client_reference_id;
   const user = (await User.find({ email: sessionData.customer_email })).id;
   const price = sessionData.line_items[0].price_data.unit_amount;

   await Booking.create({ tour, user, price });
});

const webHookCheckout = async function (req, res, next) {
   const signature = req.headers["stripe-signature"];
   const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

   let event;

   try {
      event = Stripe.webhooks.constructEvent(
         req.body,
         signature,
         endpointSecret
      );
   } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
   }

   // Handle the event
   if (event.type === "checkout.session.completed")
      await createBookingCheckout(event.data.object); /// Function to handle the event

   // Return a 200 response to acknowledge receipt of the event
   res.status(200).json({ received: true });
};

//.
//? Get all bookings (admin)
const getAllBookings = handlerFactory.getAll(Booking);
const getBooking = handlerFactory.getOne(Booking);
const createBooking = handlerFactory.createOne(Booking);
const deleteBooking = handlerFactory.deleteOne(Booking);
const updateBooking = handlerFactory.updateOne(Booking);

//.

//.
//? Exporting the functions
const bookingController = {
   getCheckoutSession,
   createBookingCheckout,
   webHookCheckout,

   getAllBookings,
   getBooking,
   createBooking,
   updateBooking,
   deleteBooking,
};

export default bookingController;
