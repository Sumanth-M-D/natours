import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Tour from "../models/tourModel.js";
import catchAsync from "../utils/catchAsync.js";
import handlerFactory from "./handlerFactory.js";
import AppError from "../utils/appError.js";
import multer from "multer";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));

//.
//TODO => Put this function at the end
//? Uploading tour images
/// 1. Creating storage object (Storing it to memory(RAM))
const multerStorage = multer.memoryStorage("photo");

///2. Creating filter object
const multerFilter = function (req, file, cb) {
   if (file.mimetype.startsWith("image")) {
      cb(null, true);
   } else {
      cb(
         new AppError(
            "Uploaded file is not an image. Please upload a valid image file",
            404
         ),
         false
      );
   }
};

///3. Creating upload function
const upload = multer({
   storage: multerStorage,
   fileFilter: multerFilter,
});

const uploadTourImages = upload.fields([
   { name: "imageCover", maxCount: 1 },
   { name: "images", maxCOunt: 3 },
]);
//.
///4. Resizing tour images & saving it to our fileSystem
const resizeTourImages = catchAsync(async function (req, res, next) {
   if (!req.files.imageCover || !req.files.images) return next();

   // 1. Cover_image
   const imageCoverFilename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
   await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${imageCoverFilename}`);
   req.body.imageCover = imageCoverFilename;

   // 2. Other images
   await Promise.all(
      req.files.images.map(async (file, i) => {
         req.body.images = [];
         const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

         await sharp(file.buffer)
            .resize(2000, 1700)
            .toFormat("jpeg")
            .jpeg({ quality: 90 })
            .toFile(`public/img/tours/${filename}`);

         req.body.images.push(filename);
      })
   );

   next();
});
//.
/*%%%%%%%%%%%%%%%%%%%%  ROUTE HANDLER FUNCTIONS FOR TOURS %%%%%%%%%%%%%%%%%%%%%%%*/

//? MIDDLEWARE FOR ALIASING "req.query" for TOP 5 TOURS
const aliasTopTours = catchAsync(async function (req, res, next) {
   req.query.limit = "5";
   req.query.sort = "-ratingsAverage,price";
   req.query.fields = "name,price,ratingsAverage,summary,difficulty";
   next();
});

//? Options for Populating reviews in the tour query
const populateOptionsForTour = {
   path: "reviews",
   select: "review rating createdAt user -tour",
   options: { dontPopulateTour: true },
};

//.
const getAllTours = handlerFactory.getAll(Tour);
const getTour = handlerFactory.getOne(Tour, populateOptionsForTour);
const createTour = handlerFactory.createOne(Tour);
const updateTour = handlerFactory.updateOne(Tour);
const deleteTour = handlerFactory.deleteOne(Tour); /// Returns a function to delete a document from a given model

//.
//? To get tours within certain distance from a given center
///"tours-within/:distance/center/:latlng/unit/:unit"
///"tours-within/245/center/34.111745,-110.113491/unit/mi"
const getToursWithin = catchAsync(async function (req, res, next) {
   const { distance, latlng, unit } = req.params;
   const [lat, lng] = latlng.split(",");

   const earthRadius = unit === "mi" ? 3963.2 : 6378.1;
   const radians = distance / earthRadius; /// θ = l/r [theta = length/radius]

   if (!lat || !lng) {
      new AppError(
         next(
            "Please provide latitude and longitude in the format lat,lng.",
            400
         )
      );
   }

   // Geospatial query
   ///need to index "startLocation" => field where we do geospatial query
   const tours = await Tour.find({
      startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radians] } }, ///unlike traditional lat, lng in geospatial queries lng comes before lat
   });

   res.status(200).json({
      status: "success",
      results: tours.length,
      data: tours,
   });
});

//.
//? Get the distances of all the tours from a selected point
// "/distances/34.111745,-110.113491/unit/mi"
const getDistances = catchAsync(async function (req, res, next) {
   const { latlng, unit } = req.params;
   const [lat, lng] = latlng.split(",");

   const multiplier = unit === "mi" ? 0.000621371 : 0.001;

   if (!lat || !lng) {
      new AppError(
         next(
            "Please provide latitude and longitude in the format lat,lng.",
            400
         )
      );
   }

   // Geospatial query
   const distances = await Tour.aggregate([
      {
         $geoNear: {
            near: {
               type: "Point",
               coordinates: [+lng, +lat],
            },
            distanceField: "distance",
            distanceMultiplier: multiplier, ///converting metres to km
         },
      },

      {
         $project: {
            distance: 1,
            name: 1,
         },
      },
   ]);

   res.status(200).json({
      status: "success",
      results: distances.length,
      data: distances,
   });
});

//.
//? 6. TO GET THE STATS OF TOURS, GROUPED BY DIFFICULTY, USING AGRIGATE PIPELINE
const getTourStats = catchAsync(async function (req, res, next) {
   const stats = await Tour.aggregate([
      {
         $match: { ratingsAverage: { $gte: 4.5 } },
      },

      {
         $group: {
            _id: { $toUpper: "$difficulty" },
            numTours: { $sum: 1 },
            numRatings: { $sum: "$ratingsQuantity" },
            averageRating: { $avg: "$ratingsAverage" },
            avgPrice: { $avg: "$price" },
            minPrice: { $min: "$price" },
            maxPrice: { $max: "$price" },
         },
      },

      {
         $sort: {
            avgPrice: 1, //*sort by avgPrice in ascending
         },
      },
   ]);

   res.status(200).json({
      status: "success",
      data: {
         stats,
      },
   });
});

//.
//? 7. TO GET THE MONTHLY PLANS FOR NATOURS
const getMonthlyPlan = catchAsync(async function (req, res, next) {
   const year = +req.params.year;

   const plan = await Tour.aggregate([
      { $unwind: "$startDates" },

      {
         $match: {
            startDates: {
               $gte: new Date(`${year}-01-01`),
               $lte: new Date(`${year}-12-31`),
            },
         },
      },

      {
         $group: {
            _id: { $month: "$startDates" },
            numToursStarts: { $sum: 1 },
            tours: { $push: "$name" },
         },
      },

      { $addFields: { month: "$_id" } },

      { $project: { _id: 0 } },

      { $sort: { numToursStarts: -1 } },
   ]);

   res.status(200).json({
      status: "success",
      results: plan.length,
      data: {
         plan,
      },
   });
});

//.

//.

/*%%%%%%%%%%%%%%%%%%%%  Exporting the Functions  %%%%%%%%%%%%%%%%%%%%%%%*/
const tourController = {
   aliasTopTours,
   getAllTours,
   getTour,
   createTour,
   updateTour,
   deleteTour,

   getToursWithin,
   getDistances,

   getTourStats,
   getMonthlyPlan,

   uploadTourImages,
   resizeTourImages,
};
export default tourController;
