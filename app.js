//? UPDATING ENVIRONMENT VARIABLES FORM CONFIG.ENV
import dotenv from "dotenv"; /// npm i dotenv
dotenv.config({ path: "./config.env" });

/// console.log(process.env); //Environment variables

import Express, { urlencoded } from "express";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

/// App security related modules
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import ExpressMongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";

/// App modules
import tourRouter from "./routes/tourRoutes.js";
import userRouter from "./routes/userRoutes.js";
import reviewRouter from "./routes/reviewRoutes.js";
import viewRouter from "./routes/viewRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import AppError from "./utils/appError.js";
import globalErrorHandler from "./controllers/errorController.js";

//.

//.
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = Express();

//.
//.
//? Setup pug as the view-Engine and mddlewares for rendering webpages
app.set("view engine", "pug");
app.set("views", `${__dirname}/views`);

// To be able to use the static files from public directory
app.use(Express.static(`${__dirname}/public`));

// To parse the cookie (for view)
app.use(cookieParser());
//.
//.
//? Global midldewares
// 1. Body parsers (req.body)
app.use(Express.json({ limit: "20kb" })); /// to parse JSON bodies (from API requests)
app.use(Express.urlencoded({ extended: true, limit: "20kb" })); /// Body parser urlencoded bodies (from forms of RENDERed website)

// 2. Data loggers
if (process.env.NODE_ENV === "development") {
   app.use(morgan("dev"));

   /// Test middleware
   app.use((req, res, next) => {
      // console.log("Headers: -", req.headers);

      next();
   });
}

//3.
/// app.use(cors());
//.
//? Using GLOBAL middlewares npm packages, for app security
//1 .setting secure HTTP response headers.
/// app.use(helmet());

//2. Limiting the api requests
const limiter = rateLimit({
   windowMs: 60 * 60 * 1000,
   limit: 100,
   message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

//3. Data sanitization against noSQL query injection
app.use(ExpressMongoSanitize());

//4. Preventing parameter pollution [eg: /tours?sort=ratingsAverage&sort=price]
app.use(
   hpp({
      whitelist: [
         "duration",
         "ratingsAverage",
         "ratingsQuantity",
         "maxGroupSize",
         "difficulty",
         "price",
      ],
   })
);

//.
//? Mounting view (web-app) route
app.use("/", viewRouter);

//.
//? MOUNTING API ROUTES
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter); 
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

//.
// Handling unhandled routes
app.all("*", (req, res, next) => {
   next(new AppError(`Cant find ${req.originalUrl} on this server!`, 404)); //* This will immedietly go to global error handling middleware
});

//.
//.
//? Global Error handling middleware
/// all the "next(new AppError())" will immedietly lead to this middleware handler
app.use(globalErrorHandler);

export default app;
