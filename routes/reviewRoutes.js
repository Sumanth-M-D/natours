import Express from "express";
import reviewController from "../controllers/reviewController.js";
import authController from "../controllers/authController.js";

const router = Express.Router({ mergeParams: true }); ///to get access to "tourId" parameter from tourRouter

//.
router.use(authController.protect);

//.
//? Getting all the reviews and creating a new Review
router
   .route("/")
   .get(reviewController.getAllReviews)
   .post(
      authController.restrictTo("user"),
      reviewController.setTourIdAndUserId,
      reviewController.createReview
   );

//.
//? Get, update and delete a single review
router
   .route("/:id")
   .get(reviewController.getReview)
   .patch(
      authController.restrictTo("user", "admin"),
      reviewController.updateReview
   )
   .delete(
      authController.restrictTo("user", "admin"),
      reviewController.deleteReview
   );

//.
export default router;
