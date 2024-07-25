import AppError from "../utils/appError.js";

//? To handle the "invalid id error" (CastError) -> making it an operational error
function handleCastErrorDB(err) {
   const message = `Invalid ${err.path}: ${err.value}`;
   return new AppError(message, 400);
}

//.
//? To handle "duplicate name error" field, while creating new tour -> making it an operational error
function handleDuplicateFieldsDb(err) {
   const message = `Duplicate field value ${err.keyValue.name}. Please use another value`;
   return new AppError(message, 400);
}

//.
//?  If a validation error occures while creating the tour -> making it an operational error
function handleValidationError(err) {
   const errors = Object.values(err.errors).map((el) => el.message);
   const message = `Invalid inpt data. ${errors.join(". ")}`;
   return new AppError(message, 400);
}

//.
//? If an error occures while verfying JWT token
function handleJWTError() {
   return next(new AppError("Invalid Token. Please login again"));
}

//.
//? If JWT token has been expiures
function handleJWTExpiredError() {
   return next(new AppError(".Your token has expired. Please login again"));
}

//.
//? To send error for development environment
function sendErrorForDev(err, req, res) {
   // 1. API
   if (req.originalUrl.startsWith("/api")) {
      return res.status(err.statusCode).json({
         status: err.status,
         message: err.message,
         stack: err.stack,
         error: err,
      });
   }

   // 2. RENDERED WEBSITE
   console.log("ERROR 💥💥💥", err);
   return res.status(err.statusCode).render("error", {
      title: "Something went wrong",
      msg: err.message,
   });
}

//.
//? To send error for production environment
function sendErrorProd(err, req, res) {
   // 1. For API
   if (req.originalUrl.startsWith("/api")) {
      /// If its an Operational error
      if (err.isOperational) {
         return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
         });
      }

      /// If its a Programming error, which should not be leaked to client. So, Send a generic message
      console.log("ERROR 💥💥💥", err);
      return res.status(500).json({
         status: "error",
         message: "Something went wrong",
      });
   }

   // 2. For RENDERED WEBSITE
   /// If its an Operational error
   if (err.isOperational) {
      return res.status(err.statusCode).render("error", {
         title: "Something went wrong",
         msg: err.message,
      });
   }

   /// If its a Programming error, which sholud not be leaked to client
   console.log("ERROR 💥💥💥", err);
   return res.status(err.statusCode).render("error", {
      title: "Something went wrong",
      msg: "please try again later",
   });
}

//.
//? Function to handle various global operational errors
export default function globalErrorHandler(err, req, res, next) {
   /// console.log(err.stack);

   err.statusCode = err.statusCode || 500;
   err.status = err.status || "error";

   if (process.env.NODE_ENV === "development") {
      sendErrorForDev(err, req, res);
   } else if (process.env.NODE_ENV === "production") {
      let error = { ...err };
      error.message = err.message;

      // If an error occured due to invalid "id" field of Tour
      if (error.name === "CastError") {
         error = handleCastErrorDB(error);
      }

      // If an error occeured due to duplicate "name" field, while creating new tour
      if (error.code === 11000) {
         error = handleDuplicateFieldsDb(error);
      }

      // If a validation error occures while creating the tour
      if (error.name === "ValidationError") {
         error = handleValidationError(error);
      }

      // If an error occures while verfying JWT token
      if (error.name === "JsonWebTokenError") {
         error = handleJWTError();
      }

      //.
      // If JWT token expires
      if (error.name === "TokenExpiredError") {
         error = handleJWTExpiredError();
      }

      sendErrorProd(error, req, res);
   }
}
