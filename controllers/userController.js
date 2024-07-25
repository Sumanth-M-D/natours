import User from "../models/userModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import handlerFactory from "./handlerFactory.js";
import multer from "multer";
import sharp from "sharp";

//TODO => Put this function at the end
//? Uploading user photo
/// 1. Creating storage object (Storing it to files)
// const multerStorage = multer.diskStorage({
//    destination: (req, file, cb) => {
//       cb(null, "public/img/users");
//    },
//    filename: (req, file, cb) => {
//       /// user-${userId}-${currentTimestamp}.jpeg
//       const ext = file.mimetype.split("/")[1];
//       cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//    },
// });

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
const uploadUserPhoto = upload.single("photo");

//.
///4. Adjusting photo size and writing it to our filesystem
const resizePhoto = catchAsync(async function (req, res, next) {
   if (!req.file) return next();

   req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

   await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`public/img/users/${req.file.filename}`);

   next();
});

//.
//? HELPER FUNCTION =>  to filter the allowed fields from req.body
function filterObj(obj, ...allowedFields) {
   const result = {};

   for (let field of allowedFields) {
      if (!obj[field]) continue;

      result[field] = obj[field];
   }

   return result;
}

/*%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
                    ROUTE HANDLER FUNCTIONS FOR ADMIN
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%*/

function createUser(req, res) {
   res.status(500).json({
      status: "error",
      message: "This route is not yet defined! Please use signUp instead",
   });
}

const getAllUsers = handlerFactory.getAll(User);
const getUser = handlerFactory.getOne(User);
const updateUser = handlerFactory.updateOne(User);
const deleteUser = handlerFactory.deleteOne(User);

//.
/*%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
                    ROUTE HANDLER FUNCTIONS FOR CURRENT USER
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%*/

//.
//? Setting the userId for Getting the logged in user details
const getMe = function (req, res, next) {
   req.params.id = req.user.id;
   next();
};

//.
//? Updating Current user details
const updateMe = catchAsync(async function (req, res, next) {
   // 1. Create error if user POSTs password data for update
   if (req.body.password || req.body.passwordConfirm) {
      return next(
         new AppError(
            "This route is not for password updates. Please use /updateMyPassword",
            400
         )
      );
   }

   // 2. Update user document
   /// Only inlcude "name" and "email" fields for update
   const filteredBody = filterObj(req.body, "name", "email");
   /// including filename of photo
   if (req.file) {
      filteredBody.photo = req.file.filename;
   }

   /// find the user and update the field
   const UpdatedUser = await User.findByIdAndUpdate(
      req.user._id,
      filteredBody,
      {
         new: true, /// => to return new data of the user
         runValidators: true,
      }
   );

   res.status(200).json({
      status: "success",
      data: {
         user: UpdatedUser,
      },
   });
});

//.
//? Deleting Current user account
const deleteMe = catchAsync(async function (req, res, next) {
   /// find the user and delete the field
   await User.findByIdAndUpdate(req.user._id, { active: false });

   res.status(204).json({
      status: "success",
      data: null,
   });
});

//.

//.
const userController = {
   getAllUsers,
   createUser,
   getUser,
   updateUser,
   deleteUser,

   getMe,
   updateMe,
   deleteMe,
   uploadUserPhoto,
   resizePhoto,
};
export default userController;
