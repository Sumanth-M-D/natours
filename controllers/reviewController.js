import Review from "../models/reviewModel.js";
import handlerFactory from "./handlerFactory.js";
// import catchAsync from "../utils/catchAsync.js";

//.
//? Helper Middleware for setting userId and tourId for creating a new review
function setTourIdAndUserId(req, res, next) {
   /// getting tourId from url => params object
   if (!req.body.tour) req.body.tour = req.params.tourId;

   /// Getting userId from authController.protect middleware run before this
   if (!req.body.user) req.body.user = req.user.id;
   next();
}

//.
const getAllReviews = handlerFactory.getAll(Review);
const getReview = handlerFactory.getOne(Review);
const createReview = handlerFactory.createOne(Review);
const deleteReview = handlerFactory.deleteOne(Review);
const updateReview = handlerFactory.updateOne(Review);

//.
//? Exporting the handler functions as an Object
const reviewController = {
   getAllReviews,
   getReview,
   createReview,
   deleteReview,
   updateReview,
   setTourIdAndUserId,
};

export default reviewController;
