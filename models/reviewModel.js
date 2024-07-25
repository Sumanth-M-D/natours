import mongoose from "mongoose";
import Tour from "./tourModel.js";

const reveiwSchema = new mongoose.Schema(
   {
      review: {
         type: String,
         min: 20,
         max: 100,
         required: [true, "Review cannot be empty"],
      },

      rating: {
         type: Number,
         min: 1,
         max: 5,
         enum: [1, 2, 3, 4, 5],
         required: [true, "Choose a rating from 1-5"],
      },

      createdAt: {
         type: Date,
         default: Date.now(),
      },

      tour: {
         type: mongoose.Schema.ObjectId,
         ref: "Tour",
         required: [true, "Review must belong to a tour"],
      },

      user: {
         type: mongoose.Schema.ObjectId,
         ref: "User",
         required: [true, "Review must belong to a user"],
      },
   },

   {
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
   }
);

//? Compund Indexing tourId and UserId for limiting one review per user
reveiwSchema.index({ tour: 1, user: 1 }, { unique: true });

//.//.
//? Populating user and tour in the review
reveiwSchema.pre(/^find/, async function (next) {
   this.populate({
      path: "user",
      select: "name photo",
   });

   /// Check if no need to populate tours (useful while populating reviews in tours)
   if (this.options.dontPopulateTour) {
      return next();
   }

   this.populate({
      path: "tour",
      select: "name ",
      options: { dontPopulateGuides: true }, ///custom option used for Preventing populationg guides in the user
   });

   next();
});

//.
//? FUnction to calculate avg_Rating and num of ratings of a tour
/// this => Review (model)
reveiwSchema.statics.calcAverageRatings = async function (tourId) {
   const stats = await this.aggregate([
      {
         $match: { tour: tourId },
      },
      {
         $group: {
            _id: "$tour",
            ratingsAverage: { $avg: "$rating" },
            ratingsQuantity: { $sum: 1 },
         },
      },
   ]);

   if (stats.length > 0) {
      await Tour.findByIdAndUpdate(tourId, {
         ratingsAverage: stats[0].ratingsAverage,
         ratingsQuantity: stats[0].ratingsQuantity,
      });
   } else {
      await Tour.findByIdAndUpdate(tourId, {
         ratingsAverage: 4.5,
         ratingsQuantity: 0,
      });
   }
};

//.
//? Calculating ratingsAverage and ratingsQuantity when a new review is created  (Document middleware)
reveiwSchema.post("save", function () {
   this.constructor.calcAverageRatings(this.tour); ///this.constructor = Review
});

//.
//? Calculating ratingsAverage and ratingsQuantity when a review is updated or deleted
/// findOneAndUpdate & findOneAndDelete and findByIdAndUpdate() & findByIdAndDelete()
/// This is because all these methods internally use the "findOneAnd" MongoDB operation.

/// Saving a review to this.review, before updating/ deleting it  (for getting tour._id in next step)
/// this.getQuery() => return query filter Object
reveiwSchema.pre(/^findOneAnd/, async function () {
   this.review = await this.model.findOne(this.getQuery()); //this => query object, this.model = Review
});

reveiwSchema.post(/^findOneAnd/, async function () {
   const tourId = this.review.tour._id;
   this.model.calcAverageRatings(tourId);
});

//.
const Review = new mongoose.model("Review", reveiwSchema);

export default Review;
