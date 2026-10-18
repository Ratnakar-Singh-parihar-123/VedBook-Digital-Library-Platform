import db from "../config/db.js";
import {
  createCategory,
  findCategoryById,
  getAllCategories,
  updateCategory,
  deactivateCategory,
  setCategoryStatus,
} from "../models/category.js";

const makeSlug = (value) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const validId = (id) => /^\d+$/.test(id) && Number(id) > 0;

const handleError = (res, error, message) => {
  if (error.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      success: false,
      message: "This category name or slug already exists",
    });
  }

  console.error(message, error.message);

  return res.status(500).json({
    success: false,
    message: "Something went wrong",
  });
};

// Admin: create category
export const addCategory = async (req, res) => {
  try {
    const { name, description = "" } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 100 ||
      typeof description !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid category name and description are required",
      });
    }

    const slug = makeSlug(name);

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid category name",
      });
    }

    const category = await createCategory(
      name.trim(),
      slug,
      description.trim(),
    );

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    return handleError(res, error, "Create category error:");
  }
};

// Public: list active categories
export const listCategories = async (req, res) => {
  try {
    const categories = await getAllCategories(false);

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    return handleError(res, error, "List categories error:");
  }
};

// Admin: list all categories, including inactive
export const listAdminCategories = async (req, res) => {
  try {
    const categories = await getAllCategories(true);

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    return handleError(res, error, "Admin categories error:");
  }
};

// Admin: update category
export const editCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description = "" } = req.body;

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 100 ||
      typeof description !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid category name and description are required",
      });
    }

    const existing = await findCategoryById(Number(id));

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const slug = makeSlug(name);

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Invalid category name",
      });
    }

    await updateCategory(Number(id), name.trim(), slug, description.trim());

    const category = await findCategoryById(Number(id));

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    return handleError(res, error, "Update category error:");
  }
};

// Admin: deactivate category instead of deleting it
export const removeCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const existing = await findCategoryById(Number(id));

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    //Optional: check for books//
    const [books] = await db.execute(
      "SELECT COUNT(*) AS count FROM books WHERE category_id = ?",
      [Number(id)],
    );
    const bookCount = books[0]?.count ?? 0;

    if (bookCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete — ${bookCount} book(s) are using this category. Move or reassign them first.`,
      });
    }

    //HARD DELETE//
    const [result] = await db.execute("DELETE FROM categories WHERE id = ?", [
      Number(id),
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category deleted permanently",
    });
  } catch (error) {
    return handleError(res, error, "Delete category error:");
  }
};

// Admin: activate or deactivate category
export const toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let { is_active } = req.body;

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    if (typeof is_active !== "boolean") {
      if (is_active === 1 || is_active === "1" || is_active === "true") {
        is_active = true;
      } else if (
        is_active === 0 ||
        is_active === "0" ||
        is_active === "false"
      ) {
        is_active = false;
      } else {
        return res.status(400).json({
          success: false,
          message: "is_active must be a boolean (true/false)",
        });
      }
    }

    const existing = await findCategoryById(Number(id));

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Model function to implement
    await setCategoryStatus(Number(id), is_active);

    const category = await findCategoryById(Number(id));

    return res.status(200).json({
      success: true,
      message: is_active
        ? "Category activated successfully"
        : "Category deactivated successfully",
      category,
    });
  } catch (error) {
    return handleError(res, error, "Toggle category status error:");
  }
};
