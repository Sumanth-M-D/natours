import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import APIFeatures from "../utils/apiFeatures.js";

//.
//? Get all documents from a Model
function getAll(Model) {
   return catchAsync(async function (req, res, next) {
      // To allow for nested getAllReviews on a specific tour
      let filter = {};
      if (req.params.tourId) {
         filter = { tour: { _id: req.params.tourId } };
      }

      // Build a query
      const features = new APIFeatures(Model.find(filter), req.query)
         .filter()
         .sort()
         .limitFields()
         .paginate();

      // Execute a query
      const doc = await features.query;
      /// const doc = await features.query.explain(); => return the statistics of query

      res.status(200).json({
         status: "success",
         results: doc.length,
         data: {
            data: doc,
         },
      });
   });
}

//.
//? getting a single document based on ID
function getOne(Model, populateOptions) {
   return catchAsync(async function (req, res, next) {
      let query = Model.findById(req.params.id);

      if (populateOptions) {
         query = query.populate(populateOptions);
      }

      let doc = await query;

      if (!doc) {
         return next(new AppError("No document found with that id", 404));
      }

      res.status(200).json({
         status: "success",
         data: {
            data: doc,
         },
      });
   });
}

//.
//? Creating a new document in the model
function createOne(Model) {
   return catchAsync(async function (req, res, next) {
      /// const doc = new Model(req.body);
      /// doc.save();

      const doc = await Model.create(req.body);

      res.status(201).json({
         status: "success",
         data: {
            data: doc,
         },
      });
   });
}

//.
//? Updating a document of a model
function updateOne(Model) {
   return catchAsync(async function (req, res, next) {
      const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
         new: true,
         runValidators: true,
      });

      if (!doc) {
         return next(new AppError("No document found with that id", 404));
      }

      res.status(200).json({
         status: "success",
         data: {
            data: doc,
         },
      });
   });
}

//.
//? Function to delete a document from the Model (eg: "tour" doc from "Tour" Model)
function deleteOne(Model) {
   return catchAsync(async function (req, res, next) {
      const doc = await Model.findByIdAndDelete(req.params.id);

      if (!doc) {
         return next(new AppError("No document found with that id", 404));
      }

      res.status(204).json({
         status: "success",
         data: null,
      });
   });
}

//.
const handlerFactory = {
   deleteOne,
   updateOne,
   createOne,
   getOne,
   getAll,
};

export default handlerFactory;
