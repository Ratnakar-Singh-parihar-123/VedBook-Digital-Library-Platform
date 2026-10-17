import { Router } from "express";

import {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  changeAdminPassword,
  updateAdminProfilePicture,
  getAdminProfile,
  updateAdminProfileDetails,
  getSingleUserDetails,
  getAllUsers,
  updateUserByAdmin,
  deleteUserByAdmin,
} from "../controllers/adminController.js";

import { verifyAdminToken } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = Router();

// Registration: optional profile picture
router.post("/register", upload.single("profilePic"), registerAdmin);

// Login
router.post("/login", loginAdmin);

// Authenticated admin routes
router.post("/logout", verifyAdminToken, logoutAdmin);
// Authenticated admin profile
router.get("/profile", verifyAdminToken, getAdminProfile);

router.patch(
  "/profile",
  verifyAdminToken,
  upload.single("avatar"),
  updateAdminProfileDetails,
);

router.patch("/change-password", verifyAdminToken, changeAdminPassword);

router.patch(
  "/profile-picture",
  verifyAdminToken,
  upload.single("profilePic"),
  updateAdminProfilePicture,
);

router.get("/users", verifyAdminToken, getAllUsers);
router.get("/users/:id", verifyAdminToken, getSingleUserDetails);
router.patch("/users/:id", verifyAdminToken, updateUserByAdmin);
router.patch("/users/:id/status", verifyAdminToken, updateUserByAdmin);
router.delete("/users/:id", verifyAdminToken, deleteUserByAdmin);

export default router;
