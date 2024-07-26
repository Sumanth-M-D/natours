import Tour from "../models/tourModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import User from "../models/userModel.js";
import Booking from "../models/bookingModel.js";

//.
//? alert function
const alerts = function (req, res, next) {
   const { alert } = req.query;

   if (alert === "booking")
      res.locals.alerts =
         "Your booking was successful! Please check your email for a confirmation. If your booking doesn't show up immedietly, please comeback later";
   next();
};

//.
//? Get overview of all tours
const getOverview = catchAsync(async function (req, res, next) {
   //Importing tours data from Tour-model
   const tours = await Tour.find();

   res.status(200).render("overview", {
      title: "All tours",
      tours,
   });
});

//.
//? get details of a tour
const getTour = catchAsync(async function (req, res, next) {
   const tour = await Tour.find({ slug: req.params.slug }).populate({
      path: "reviews",
      fields: "review, rating, user",
   });

   if (tour.length === 0) {
      return next(new AppError("There is no tour with that name.", 404));
   }

   res.status(200).render("tour", {
      title: `${tour[0].name} Tour`,
      tour: tour[0],
   });
});

//.
//? Get the login form
const getLoginForm = function (req, res) {
   res.status(200).render("login", {
      title: "Log into your account",
   });
};

//.
//? Get the signup form
const getsignUpForm = function (req, res) {
   res.status(200).render("signUp", {
      title: "Create new account",
   });
};

//.
//? Get user account page
const getAccount = function (req, res) {
   res.status(200).render("account", {
      title: "Your account",
   });
};

//.
//? Getting and rendering the mytours
const getMyTours = catchAsync(async function (req, res, next) {
   //1. FInd all bookings of logged in user
   const bookings = await Booking.find({ user: req.user.id });

   //2. Find tours of found bookings
   const tourIds = bookings.map((ele) => ele.tour);
   const tours = await Tour.find({ _id: { $in: tourIds } });

   res.status(200).render("overview", {
      title: "My tours",
      tours,
   });
});

//.
//? Update user data
const updateUserData = catchAsync(async function (req, res) {
   const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
         name: req.body.name,
         email: req.body.email,
      },
      {
         new: true,
         runValidators: true,
      }
   );

   res.status(200).render("account", {
      title: "Your account",
      user: updatedUser,
   });
});

//.//.
//? Exporting controller functions as an object
const viewsController = {
   alerts,
   getOverview,
   getTour,
   getsignUpForm,
   getLoginForm,
   getAccount,
   getMyTours,
   updateUserData,
};

export default viewsController;
