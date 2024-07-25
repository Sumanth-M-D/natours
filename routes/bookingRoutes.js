import Express from "express";
import bookingController from "../controllers/bookingController.js";
import authController from "../controllers/authController.js";

const router = Express.Router();

router.use(authController.protect);
//.
//? Checkout session
router.post("/checkout-session/:tourId", bookingController.getCheckoutSession);

router.use(authController.restrictTo("admin", "leadGuide"));

router
   .route("/")
   .get(bookingController.getAllBookings)
   .post(bookingController.createBooking);

router
   .route("/:id")
   .get(bookingController.getBooking)
   .patch(bookingController.updateBooking)
   .delete(bookingController.deleteBooking);

export default router;
