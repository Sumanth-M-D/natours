import mongoose from "mongoose";
import slugify from "slugify";
import validator from "validator";
// import User from "./userModel.js";
//.
//? Constructing the MONGODB SCHEMA
const tourSchema = new mongoose.Schema(
   //? Schema definition Object
   {
      name: {
         type: String,
         required: [true, "A tour must have name"],
         unique: true,
         trim: true,
         maxlength: [
            40,
            "A tour name must have less than or equal to 40 characters",
         ],
         minlength: [10, "A tour must have minimum of 10 characters"],
         /// validate: [validator.isAlpha, "Tour name must only contain charecters"],
      },

      slug: {
         type: String,
      },

      duration: {
         type: Number,
         required: [true, "A tour must have a duration"],
      },

      maxGroupSize: {
         type: Number,
         required: [true, "A tour must have a group size"],
      },

      difficulty: {
         type: String,
         required: [true, "A tour must have a difficulty"],
         enum: {
            values: ["easy", "medium", "difficult"],
            message: "Difficulty is either: easy, medium, difficult",
         },
      },

      ratingsAverage: {
         type: Number,
         default: 4.5,
         min: [1, "Rating must be above 1.0"],
         max: [5, "Rating must be below 5.0"],
         set: (val) => Math.round(val * 10) / 10, ///Setter function => runs everyTime the value changes
      },

      ratingsQuantity: {
         type: Number,
         default: 0,
      },

      price: {
         type: Number,
         required: [true, "A tour must have price"],
      },

      priceDiscount: {
         type: Number,
         validate: {
            validator: function (val) {
               //* "this" => only points to current doc under creation
               return val < this.price;
            },
            message: (props) => {
               /// console.log(props);
               return `Discount ${props.value} price should be less than price`;
            },
         },
      },

      summary: {
         type: String,
         trim: true,
         required: [true, "A tour must have a description"],
      },

      description: {
         type: String,
         trim: true,
      },

      imageCover: {
         type: String,
         required: [true, "A tour must have a cover image"],
      },

      images: [String],

      createdAt: {
         type: Date,
         default: Date.now(),
         select: false, //* will exclude this field while sending data for api request
      },

      startDates: [Date],

      secretTour: {
         type: Boolean,
         default: false,
      },

      // Modelling Geo_Locations => Embedded data model
      startLocation: {
         ///GeoJSON DATA format
         type: {
            type: String,
            default: "Point",
            enum: ["Point"],
         },
         coordinates: [Number], /// Array of numbers
         address: String,
         description: String,
      },

      locations: [
         {
            ///type field => type of location
            type: {
               type: String, /// Datatype of type field
               default: "Point",
               enum: ["Point"],
            },
            coordinates: [Number],
            description: String,
            day: Number,
         },
      ],

      guides: [
         {
            type: mongoose.Schema.ObjectId,
            ref: "User",
         },
      ],
   },

   //? Schema Options Object
   {
      toJSON: { virtuals: true }, ///Include virtuals while converting to JSON
      toObject: { virtuals: true }, ///Include virtuals while converting to Object
   }
);

//.
//? Indexing the properties of schema [=> for various functinalities s/a - sort for quick access for a query]
/// 1=> ascending, -1 => descending
tourSchema.index({ price: 1, ratingsAverage: -1 }); ///Compound index
tourSchema.index({ slug: 1 }); /// simple index
tourSchema.index({ startLocation: "2dsphere" }); /// 2dsphere => indexing for geospatial query

//.
//? Virtual Properties (not stored in DB, instead created during a query)
tourSchema.virtual("durationWeeks").get(function () {
   return this.duration / 7;
});

//.
//? Virtual populating reviews in the tour [Similar to using joins in SQL]
tourSchema.virtual("reviews", {
   ref: "Review",
   foreignField: "tour", ///W.R.T Review
   localField: "_id", ///W.R.T Tour
});

//.
//? Document Middleware => to save the slug
///  "this" keyword => document to be saved
/// It runs only before .save() and .current() and not before "findAndUpdate()" functions

tourSchema.pre("save", function (next) {
   this.slug = slugify(this.name, { lower: true });
   console.log(this);
   next();
});

//.
// ? Document Middleware => Embedding the user(guides) into tours through id
// tourSchema.pre("save", async function (next) {
//    const guidesPromises = this.guides.map(async (id) => await User.findById(id));

//    this.guides = await Promise.all(guidesPromises);
//    next();
// });

//.
//? Query Middleware: -> trial
///  "this" keyword => query Object
tourSchema.pre(/^find/, function (next) {
   this.find({ secretTour: { $ne: true } });
   this.start = Date.now();
   next();
});

//.
//? Populating tour guides for tour query
tourSchema.pre(/^find/, function (next) {
   // do not populate guides for reviews query
   if (this.options.dontPopulateGuides) {
      return next();
   }

   this.populate({
      path: "guides",
      select: "-passwordChangedAt",
   });
   next();
});

//.
//? query middleware ->trial
tourSchema.post(/^find/, function (docs, next) {
   console.log(`Query Took ${Date.now() - this.start} miliseconds`);
   /// console.log(docs);
   next();
});

//.
//? Aggregation Middleware: --> trial
///  "this" keyword => aggregation object
// tourSchema.pre("aggregate", function (next) {
//    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//    console.log(this.pipeline());
//    next();
// });

//.

//.

//.
//? Constructing the MODEL from SCHEMA
const Tour = mongoose.model("Tour", tourSchema);

//.
export default Tour;
