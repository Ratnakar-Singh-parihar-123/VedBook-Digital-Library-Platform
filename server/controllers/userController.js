import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { notifyAdmins } from "../services/notificationService.js";
import {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserProfile,
  updateUserProfilePic,
  findUserPasswordById,
  updateUserPassword,
} from "../models/user.js";

const isValidEmail = (email) =>
  typeof email === "string" &&
  email.length <= 255 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidPassword = (password) =>
  typeof password === "string" &&
  password.length >= 8 &&
  Buffer.byteLength(password, "utf8") <= 72;

// 1. Register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      !isValidEmail(email) ||
      !isValidPassword(password)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid name and email are required. Password must be 8+ characters.",
      });
    }

    if (
      phone !== undefined &&
      phone !== null &&
      (typeof phone !== "string" || phone.length > 20)
    ) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be a string of at most 20 characters",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone?.trim() || null;

    if (cleanName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name must be 100 characters or fewer",
      });
    }

    const existingUser = await findUserByEmail(cleanEmail);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await createUser(
      cleanName,
      cleanEmail,
      cleanPhone,
      passwordHash,
    );

    try {
      await notifyAdmins({
        title: "New User Registered",
        message: `Name: ${cleanName} | Email: ${cleanEmail} | Phone: ${cleanPhone || "Not provided"}`,
        entityId: user.id,
      });
    } catch (notificationError) {
      console.error("New user notification error:", notificationError.message);
    }

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    console.error("Register user error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to register user",
    });
  }
};

// 2. Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!isValidEmail(email) || typeof password !== "string" || !password) {
      return res.status(400).json({
        success: false,
        message: "Valid email and password are required",
      });
    }

    const user = await findUserByEmail(email.trim().toLowerCase());

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Authentication is not configured",
      });
    }

    const token = jwt.sign(
      { id: user.id, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    const { password_hash, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error("Login user error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to login",
    });
  }
};

// 3. Logout
export const logoutUser = (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logout successful. Remove the token on the client.",
  });
};

// 4. Get logged-in user's profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch profile",
    });
  }
};

// 5. Update name and phone (email cannot be changed here)
export const updateUserProfileDetails = async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name must be 100 characters or fewer",
      });
    }

    if (
      phone !== undefined &&
      phone !== null &&
      (typeof phone !== "string" || phone.length > 20)
    ) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be at most 20 characters",
      });
    }

    const cleanPhone = phone?.trim() || null;

    const updated = await updateUserProfile(
      req.user.id,
      name.trim(),
      cleanPhone,
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "User not found or no changes made",
      });
    }

    const user = await findUserById(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update profile",
    });
  }
};

// 6. Update profile picture
export const updateUserProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a profile picture",
      });
    }

    const user = await findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const profilePic = `/uploads/user-profiles/${req.file.filename}`;

    await updateUserProfilePic(req.user.id, profilePic);

    const updatedUser = await findUserById(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile picture error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update profile picture",
    });
  }
};

// 7. Change password
export const changeUserPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (
      typeof currentPassword !== "string" ||
      !currentPassword ||
      !isValidPassword(newPassword)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter your current password and a valid new password (8+ characters)",
      });
    }

    const user = await findUserPasswordById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const matches = await bcrypt.compare(currentPassword, user.password_hash);

    if (!matches) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const samePassword = await bcrypt.compare(newPassword, user.password_hash);

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from the current password",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await updateUserPassword(req.user.id, passwordHash);

    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Please login again.",
    });
  } catch (error) {
    console.error("Change password error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to change password",
    });
  }
};
