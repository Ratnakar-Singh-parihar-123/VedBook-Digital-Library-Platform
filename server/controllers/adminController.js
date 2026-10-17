import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import {
  findAdminByEmail,
  findAdminById,
  findAdminPasswordById,
  createAdmin,
  updateAdminPassword,
  updateAdminProfilePic,
  updateAdminProfile,
} from "../models/admin.js";

import {
  getUsersForAdmin,
  countUsersForAdmin,
  getUserDetailsForAdmin,
  updateUserStatus,
  deleteUserById,
  updateUserProfile,
} from "../models/user.js";

const isValidEmail = (email) => {
  return email.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPassword = (password) => {
  return password.length >= 8 && Buffer.byteLength(password, "utf8") <= 72;
};

//  REGISTER ADMIN
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body ?? {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length > 100 || !isValidEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid name and email",
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be 8–72 bytes long",
      });
    }

    const existingAdmin = await findAdminByEmail(cleanEmail);

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "Admin with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const profilePic = req.file
      ? `/uploads/admin-profiles/${req.file.filename}`
      : null;

    const admin = await createAdmin(
      cleanName,
      cleanEmail,
      passwordHash,
      profilePic,
    );

    return res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      admin,
    });
  } catch (error) {
    console.error("Admin registration error:", error.code || error.message);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Admin with this email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//  LOGIN ADMIN
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    const admin = await findAdminByEmail(cleanEmail);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);

    if (!isMatch) {
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
      { id: admin.id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        profile_pic: admin.profile_pic,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error.code || error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//  LOGOUT ADMIN
export const logoutAdmin = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Admin logged out successfully",
    });
  } catch (error) {
    console.error("Admin logout error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

//  CHANGE ADMIN PASSWORD
export const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body ?? {};

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "New password must be 8–72 bytes long",
      });
    }

    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const admin = await findAdminPasswordById(adminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const samePassword = await bcrypt.compare(newPassword, admin.password_hash);

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    const updated = await updateAdminPassword(adminId, passwordHash);

    if (!updated) {
      return res.status(500).json({
        success: false,
        message: "Password could not be updated",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    console.error("Change password error:", error.code || error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//  UPDATE PROFILE PICTURE
export const updateAdminProfilePicture = async (req, res) => {
  try {
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a profile picture",
      });
    }

    const admin = await findAdminById(adminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const profilePic = `/uploads/admin-profiles/${req.file.filename}`;

    await updateAdminProfilePic(adminId, profilePic);

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      profile_pic: profilePic,
    });
  } catch (error) {
    console.error("Profile picture error:", error.code || error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//  GET ADMIN PROFILE
export const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const admin = await findAdminById(adminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      admin,
    });
  } catch (error) {
    console.error("Get admin profile error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch admin profile",
    });
  }
};

//  UPDATE ADMIN PROFILE
export const updateAdminProfileDetails = async (req, res) => {
  try {
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { name, email } = req.body ?? {};
    const profilePic = req.file?.filename;

    // Check whether at least one field was provided
    if (name === undefined && email === undefined && !profilePic) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one field to update",
      });
    }

    // Validate name only if provided
    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        !name.trim() ||
        name.trim().length > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid name",
        });
      }
    }

    // Validate email only if provided
    let cleanEmail;

    if (email !== undefined) {
      if (typeof email !== "string" || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email",
        });
      }

      cleanEmail = email.trim().toLowerCase();

      if (
        cleanEmail.length > 255 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email",
        });
      }

      const existingAdmin = await findAdminByEmail(cleanEmail);

      if (existingAdmin && Number(existingAdmin.id) !== Number(adminId)) {
        return res.status(409).json({
          success: false,
          message: "Email is already being used by another admin",
        });
      }
    }

    // Update only the fields that were provided
    if (name !== undefined || email !== undefined) {
      const currentAdmin = await findAdminById(adminId);

      await updateAdminProfile(
        adminId,
        name !== undefined ? name.trim() : currentAdmin.name,
        email !== undefined ? cleanEmail : currentAdmin.email,
      );
    }

    // Update picture only if a file was uploaded
    if (profilePic) {
      await updateAdminProfilePic(adminId, profilePic);
    }

    const updatedAdmin = await findAdminById(adminId);
    console.log("Received body:", req.body);
    console.log("Received file:", req.file);
    console.log("Admin ID:", adminId);
    return res.status(200).json({
      success: true,
      message: "Admin profile updated successfully",
      admin: updatedAdmin,
    });
  } catch (error) {
    console.error("Update admin profile error:", error.code || error.message);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update admin profile",
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10),
    );

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim().slice(0, 100)
        : "";

    const offset = (page - 1) * limit;

    const [users, total] = await Promise.all([
      getUsersForAdmin({ search, limit, offset }),
      countUsersForAdmin(search),
    ]);

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all users error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch users",
    });
  }
};

export const getSingleUserDetails = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await getUserDetailsForAdmin(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Get single user details error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch user details",
    });
  }
};

export const updateUserByAdmin = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const existing = await getUserDetailsForAdmin(userId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { status, name, phone } = req.body || {};

    if (status !== undefined) {
      const allowed = ["active", "inactive", "suspended"];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${allowed.join(", ")}`,
        });
      }
      await updateUserStatus(userId, status);
    }

    if (name !== undefined || phone !== undefined) {
      await updateUserProfile(
        userId,
        name !== undefined ? name : existing.name,
        phone !== undefined ? phone : existing.phone,
      );
    }

    const updated = await getUserDetailsForAdmin(userId);

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updated,
    });
  } catch (error) {
    console.error("Update user error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update user",
    });
  }
};

export const deleteUserByAdmin = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const existing = await getUserDetailsForAdmin(userId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await deleteUserById(userId);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete user",
    });
  }
};
