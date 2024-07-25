import crypto from "crypto"; /// TO generate cryptographic string for password reset token
import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import { stringify } from "querystring";

const userSchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, "Please tell us your name"],
      max: 50,
   },

   email: {
      type: String,
      unique: true,
      lowercase: true,
      required: [true, "A user must have an email"],
      validate: [validator.isEmail, "Please provide a valid email"],
   },

   photo: {
      type: String,
      default: "default.jpg",
   },

   role: {
      type: String,
      enum: ["user", "guide", "lead-guide", "admin"],
      default: "user",
   },

   password: {
      type: String,
      min: 8,
      max: 15,
      required: [true, "Please provide a password"],
      select: false, /// Will not return this filed for "db.User.find()" queries
   },

   passwordConfirm: {
      type: String,
      required: [true, "Please confirm your password"],
      validate: {
         /// Validator property is given a callback funciton which returns true/false
         /// This only works on CREATE and SAVE!!! [query method to save a new doc]
         /// This does not work for findOneAndUpdate, etc
         validator: function (el) {
            return el === this.password;
         },
         message: "Passwords are not the same",
      },
   },

   passwordChangedAt: {
      type: Date,
   },

   passwordResetToken: {
      type: String,
   },

   passwordResetExpiresAt: {
      type: Date,
   },

   active: {
      type: Boolean,
      default: true,
      select: false,
   },
});

// //.
// Comment below code while importing new data into database
//? Encrypting the new or modified password   [Document middleware]
userSchema.pre("save", async function (next) {
   /// If password isnt modified then skip this middleware
   if (!this.isModified("password")) return next();

   /// Encrypting the password
   this.password = await bcrypt.hash(this.password, +process.env.SALT_ROUNDS);

   /// Deletes the confirmPasseord
   this.passwordConfirm = undefined;

   next();
});

//.
//? Update changedPasswordAt property for the user when password is changed [Document middleware]
userSchema.pre("save", function (next) {
   if (!this.isModified("password") || this.isNew) return next();

   this.passwordChangedAt = Date.now() - 1; // 1 second less
   next();
});

//.
//? To filter out the inactive users
userSchema.pre(/^find/, function (next) {
   /// "this" points to current query
   this.find({ active: { $ne: false } });
   next();
});

//.
//? Schema instance method to check the password
userSchema.methods.checkPassword = async function (
   inputPassword,
   actualPassword
) {
   return await bcrypt.compare(inputPassword, actualPassword);
};

//.
//? Schema instance method to check if the password has been chnaged after JWT token time stamp
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
   if (this.passwordChangedAt) {
      const changedTimestamp = Math.floor(
         this.passwordChangedAt.getTime() / 1000
      );

      ///If token was created after password change return true
      return JWTTimestamp < changedTimestamp;
   }

   return false;
};

//.
//? Schema instance method to generate random password reset token
userSchema.methods.createPasswordResetToken = function () {
   /// Generating random 32 Bytes charecter and converting it to hxadecimal string
   const resetToken = crypto.randomBytes(32).toString("hex");

   /// Encrypting and storing, the randomly generated hexadecimal string with 'sha256' algorithm
   this.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

   /// Setting expiry time to reset token
   this.passwordResetExpiresAt = Date.now() + 10 * 60 * 1000; //10 minutes in milisecond

   /// Sending the unencrypted token via email
   return resetToken;
};

//.
const User = mongoose.model("User", userSchema);

export default User;
