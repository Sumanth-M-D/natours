import Express from "express";
import viewsController from "../controllers/viewsController.js";
import authController from "../controllers/authController.js";
import bookingController from "../controllers/bookingController.js";

const router = Express.Router();

router.get("/", authController.isloggedIn, viewsController.getOverview);

router.get(`/tour/:slug`, authController.isloggedIn, viewsController.getTour);
router.get("/login", authController.isloggedIn, viewsController.getLoginForm);
router.get("/signUp", authController.isloggedIn, viewsController.getsignUpForm);
router.get("/me", authController.protect, viewsController.getAccount);

router.get(
   "/my-tours",
   // bookingController.createBookingCheckout,
   authController.protect,
   viewsController.getMyTours
);

//? Stripe payment checkout page
// router.post(
//    "/checkout-session/:tourId",
//    authController.protect,
//    bookingController.getCheckoutSession
// );

//? Update current user data
router.post(
   "/submit-user-data",
   authController.protect,
   viewsController.updateUserData
);

export default router;
