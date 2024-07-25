import Express from "express";
import userController from "../controllers/userController.js";
import authController from "../controllers/authController.js";

const router = Express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

/// Protecting all beow routes only for authenticated(loggedIn) user
router.use(authController.protect);

router.patch("/updateMyPassword", authController.updatePassword);

router.patch(
   "/updateMe",
   userController.uploadUserPhoto,
   userController.resizePhoto,
   userController.updateMe
);
router.delete("/deleteMe", userController.deleteMe);
router.get("/me", userController.getMe, userController.getUser);

///Restricting all of below routes to only admin
router.use(authController.restrictTo("admin"));

router
   .route("/")
   .get(userController.getAllUsers)
   .post(userController.createUser);

router
   .route("/:id")
   .get(userController.getUser)
   .patch(userController.updateUser)
   .delete(userController.deleteUser);

//.
export default router;
