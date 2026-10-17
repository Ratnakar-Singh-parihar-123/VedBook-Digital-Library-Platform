import { Router } from "express";

import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfileDetails,
  updateUserProfilePicture,
  changeUserPassword,
} from "../controllers/userController.js";

import { verifyUserToken } from "../middleware/userMiddleware.js";
import userUpload from "../middleware/userUpload.js";

const router = Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes: valid user token required
router.post("/logout", verifyUserToken, logoutUser);
router.get("/profile", verifyUserToken, getUserProfile);

router.patch("/profile", verifyUserToken, updateUserProfileDetails);

router.patch(
  "/profile-picture",
  verifyUserToken,
  userUpload.single("profilePic"),
  updateUserProfilePicture,
);

router.patch("/change-password", verifyUserToken, changeUserPassword);

export default router;
