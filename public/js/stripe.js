import axios from "axios";
// import Stripe from "stripe";
import alertFunctions from "./alerts.js";

//? Constructing stripe from "Stripe" -> available from "stripe.js" module, included in base.pug
const stripe = Stripe(
   "pk_test_51PfdVPKba1lrKkhS2vL1HQhHHvfYMcbl41xQigxf7rDcAhWjn7dXdEhDqMSkgHsuuPxZm7k91CySkWzngrtUytk400Zfoyl6tD"
);

//.
//?
const bookTour = async function (tourId) {
   try {
      //1. Get checkout session from API
      const session = await axios.post(
         `/api/v1/bookings/checkout-session/${tourId}`
      );

      //2. Create checkout form and charge credit card
      stripe.redirectToCheckout({ sessionId: session.data.session.id });
   } catch (err) {
      // console.log(err);
      alertFunctions.showAlert("error", err);
   }
};

export default bookTour;
