import Express from "express";
import tourController from "../controllers/tourController.js";
import authController from "../controllers/authController.js";
import reviewRouter from "./reviewRoutes.js";

const router = Express.Router();

//.

/*%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
                        HTTP routing
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%*/

router
   .route("/top-5-cheap")
   .get(tourController.aliasTopTours, tourController.getAllTours);

router.route("/tour-stats").get(tourController.getTourStats);

router
   .route("/monthly-plan/:year")
   .get(
      authController.protect,
      authController.restrictTo("admin", "lead-guide", "guide"),
      tourController.getMonthlyPlan
   );

//.
//? Get the tours within certain distance from the selected center
// "/tours-within/245/center/34.111745,-110.113491/unit/mi"
router
   .route("/tours-within/:distance/center/:latlng/unit/:unit")
   .get(tourController.getToursWithin);

//.
//? Get the distances of all the tours from a selected point
// "/distances/34.111745,-110.113491/unit/mi"
router.route("/distances/:latlng/unit/:unit").get(tourController.getDistances);

//.
router
   .route("/")
   .get(tourController.getAllTours)
   .post(
      authController.protect,
      authController.restrictTo("admin", "lead-guide"),
      tourController.createTour
   );

router
   .route("/:id")
   .get(tourController.getTour)
   .patch(
      authController.protect,
      authController.restrictTo("admin", "lead-guide"),
      tourController.uploadTourImages,
      tourController.resizeTourImages,
      tourController.updateTour
   )
   .delete(
      authController.protect,
      authController.restrictTo("admin", "lead-guide"),
      tourController.deleteTour
   );

//.
//? Handling nested routes => reviews for a particular tour
/*
   /// create a new review    =>  POST /tour/:tourId/reviews/
   /// Get all reviews        =>  GET /tour/:tourId/reviews/
   /// Get Particular review  =>  GET /tour/:tourId/reviews/:reviewId
*/
router.use("/:tourId/reviews", reviewRouter);

//.

//.
export default router;
