import util from "util"; /// Nodes built in module that provides function to promisify a common error-first callback style, asynchronous function
import User from "../models/userModel.js";
import catchAsync from "../utils/catchAsync.js";
import jwt from "jsonwebtoken";
import AppError from "../utils/appError.js";
import Email from "../utils/email.js";
import crypto from "crypto";

//.
//?HELPER Function => Generating signed JWT token (with id as the payload and secret string)
function signToken(id) {
   return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
   });
}

//.
//? HELPER function => sending login
function createSendToken(user, statusCode, res) {
   const token = signToken(user._id);
   const cookieOptions = {
      expires: new Date(
         Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ), //miliseconds
      httpOnly: true, /// to make the cookie inchangable in the browser
   };

   if (process.env.NODE_ENV === "production") {
      cookieOptions.secure = true; // For production => https
   }

   res.cookie("jwt", token, cookieOptions);

   /// To remove the passwords from output
   user.password = undefined;

   res.status(statusCode).json({
      status: "success",
      token,
      data: {
         user,
      },
   });
}

//.
//? Signing up new user
const signup = catchAsync(async function (req, res, next) {
   // Creating a new user form input data
   const userData = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
   };
   /// Conditionally add passwordChangedAt
   if (req.body.passwordChangedAt) {
      userData.passwordChangedAt = req.body.passwordChangedAt;
   }

   /// Conditionally add role
   if (req.body.role) {
      userData.role = req.body.role;
   }

   const newUser = await User.create(userData);

   // Sending a welcome email to new user
   const url = `${req.protocol}://${req.get("host")}/me`;
   await new Email(newUser, url).sendWelcome();

   // If newuser is created then log him in -> (create and send JWT token)
   createSendToken(newUser, 201, res);
});

//.
//? Logging in a existing user user
const login = catchAsync(async function (req, res, next) {
   const { email, password: inputPassword } = req.body;

   /// Check if both, username and password are given by the client
   if (!email || !inputPassword) {
      return next(new AppError("please provide email and password", 400));
   }

   /// Getting the user password from database
   const user = await User.findOne({ email: email }).select("+password"); /// "+" sign '.' in schema, select is values false

   /// Check if the email or password is correct
   if (!user || !(await user.checkPassword(inputPassword, user.password))) {
      return next(new AppError("Incorrect email or password", 401));
   }

   /// If everything is okay then login (i.e send the JWT token as response to client)
   createSendToken(user, 200, res);
});

/* NOTE:-> 
      Once the user logs in, he receives the JWT token which can be used to 
   access the protected routes from the server.
      Only the valid JWT token can give access to the protected routes.
*/

//.
//? Logging out the user (by sending the dummy token)
const logout = catchAsync(async function (req, res, next) {
   ///sending a cookie with dummy JWT token
   res.cookie("jwt", "loggedOut", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
   });

   res.status(200).json({ status: "success" });
});

//.
//? AUTHENTICATION ==> Function for protecting certain routes for only logged in users
const protect = catchAsync(async function (req, res, next) {
   // 1. Getting token and checking if it exists
   let token;
   if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
   } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
   }

   if (!token) {
      return next(
         new AppError("Your are not logged in. Please login to get access", 401)
      );
   }

   // 2. Verification of token ()
   /* 
      /// jwt.verify() =>  verifies, whether the token is signed with given secret key
         /// If correct, then returns the decoded jwt token
         /// If incorrect then return an error "JsonWebTokenError" => handled in errorController
         /// If expired token then return an error "TokenExpiredError"
      /// Promisifying the "jwt.verify()" function to maintain consistancy (and calling it)
    */
   const decoded = await util.promisify(jwt.verify)(
      token,
      process.env.JWT_SECRET
   );

   //.
   // 3. Check if user still exists (if not, then the JWT token should not work)
   const currentUser = await User.findById(decoded.id);
   if (!currentUser) {
      return next(
         new AppError("The user belonging to the token no longer exists")
      );
   }

   // 4. Check if user changed password after JWT token was issued (then old JWT should not work)
   const isPasswodChanged = currentUser.changedPasswordAfter(decoded.iat);

   if (isPasswodChanged) {
      return next(
         new AppError("Recently Password was changed. Please login again", 401)
      );
   }

   /// this will be helpful for middlewares that comes after authentication (for API)
   req.user = currentUser;

   res.locals.user = currentUser; /// For templates (website rendering)

   next();
});

//.
//? Middleware for conditional rendering of contents of header.pug
const isloggedIn = async function (req, res, next) {
   if (req.cookies.jwt) {
      try {
         // 1. Verify token
         const decoded = await util.promisify(jwt.verify)(
            req.cookies.jwt,
            process.env.JWT_SECRET
         );

         // 2. Check if user still exists
         const currentUser = await User.findById(decoded.id);
         if (!currentUser) return next();

         // 4. Check if user changed password after JWT token was issued (then old JWT should not work)
         const isPasswodChanged = currentUser.changedPasswordAfter(decoded.iat);
         if (isPasswodChanged) return next();

         /// There is a logged in user
         /// Making the user data available for pug template
         res.locals.user = currentUser;
      } catch (err) {
         return next();
      }
   }
   next();
};

//.
//? AUTHORIZATION ==> Function for restricting certain routes for ceratin user roles
function restrictTo(...roles) {
   return function (req, res, next) {
      if (!roles.includes(req.user.role)) {
         return next(
            new AppError(
               "You do not have pemission to perform this action",
               403
            )
         );
      }
      next();
   };
}

//.
//? Routing to forgot password [sending password reset token to suer email]
const forgotPassword = catchAsync(async function (req, res, next) {
   /// 1. Get user from POSTed email
   const user = await User.findOne({ email: req.body.email });
   if (!user) {
      next(new AppError("There is no user with that email address.", 404));
   }

   /// 2. GENERATE the random reset token
   const resetToken = user.createPasswordResetToken();
   await user.save({ validateBeforeSave: false });

   ///3. send the token to users email
   try {
      const resetURL = `${req.protocol}://${req.get(
         "host"
      )}/api/v1/users/resetPassword/${resetToken}`;

      await new Email(user, resetURL).sendPasswordReset();

      res.status(300).json({
         status: "success",
         message: "Token sent to email",
      });
   } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpiresAt = undefined;
      await user.save({ validateBeforeSave: false });
      console.log(err);
      return next(
         new AppError(
            "There was an error sending an email. Try again later",
            500
         )
      );
   }
});

//.
//? Resetting the password of the user
const resetPassword = catchAsync(async function (req, res, next) {
   // 1. Get user based on token
   const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

   const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiresAt: { $gt: Date.now() },
   });

   // 2. If there is a user & token hasn't expired, Set new password
   if (!user) {
      return next(new AppError("Token is invalid or expired", 400));
   }

   user.password = req.body.password;
   user.passwordConfirm = req.body.passwordConfirm;
   user.passwordResetToken = undefined;
   user.passwordResetExpiresAt = undefined;
   await user.save();

   // 3. Update changedPasswordAt property for the user
   /// delegated to document middlware in the usermodel

   // 4. Log the user in send JWT
   const token = signToken(user._id);

   createSendToken(user, 200, res);
});

//.
//? Updating password for logged in user
const updatePassword = catchAsync(async function (req, res, next) {
   // 1. Get user from database (protect middleware is already run)
   const user = await User.findOne(req.user._id).select("+password");

   // 2. Check posted password is correct
   const isPasswordCorrect = await user.checkPassword(
      req.body.passwordCurrent,
      user.password
   );
   if (!isPasswordCorrect) {
      return next(
         new AppError(
            "Password you entered is incorrect. Please try again",
            403
         )
      );
   }

   // 3. If the password is correct then update the password
   user.password = req.body.password;
   user.passwordConfirm = req.body.passwordConfirm;
   await user.save();

   // 4. Log user in, send JWT token
   createSendToken(user, 200, res);
});

//.
//? Export the controller functions
const authController = {
   signup,
   login,
   logout,
   protect,
   restrictTo,
   isloggedIn,
   forgotPassword,
   resetPassword,
   updatePassword,
};

export default authController;
