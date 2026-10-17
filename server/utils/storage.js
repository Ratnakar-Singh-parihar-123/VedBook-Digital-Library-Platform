import path from "node:path";
import fs from "node:fs";
import { stat, unlink } from "node:fs/promises";

// Storage base directory configuration:
// Supports Render Persistent Disk (e.g. UPLOAD_DIR=/var/data/uploads or STORAGE_PATH=/data)
// Falls back to local "./uploads" directory.
export const getStorageBaseDir = () => {
  const customPath = process.env.STORAGE_PATH || process.env.UPLOAD_DIR;
  if (customPath && customPath.trim()) {
    return path.resolve(customPath.trim());
  }
  return path.resolve(process.cwd(), "uploads");
};

// Subdirectories
export const getBooksDir = () => path.join(getStorageBaseDir(), "books");
export const getCoversDir = () => path.join(getStorageBaseDir(), "covers");
export const getAdminProfilesDir = () =>
  path.join(getStorageBaseDir(), "admin-profiles");
export const getUserProfilesDir = () =>
  path.join(getStorageBaseDir(), "user-profiles");

// Ensure all upload directories exist safely
export const initStorageDirs = () => {
  const dirs = [
    getStorageBaseDir(),
    getBooksDir(),
    getCoversDir(),
    getAdminProfilesDir(),
    getUserProfilesDir(),
  ];

  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (err) {
      console.error(`Failed to initialize storage directory ${dir}:`, err.message);
    }
  }
};

// Check if a path is a remote URL (S3, Cloudinary, Supabase, CDN)
export const isRemoteUrl = (rawPath) => {
  if (typeof rawPath !== "string") return false;
  return /^https?:\/\//i.test(rawPath.trim());
};

// Resolve a stored path (e.g. "uploads/books/xyz.pdf" or "books/xyz.pdf") to absolute path on disk
export const resolveStoragePath = (storedPath) => {
  if (!storedPath || typeof storedPath !== "string") return null;
  const clean = storedPath.trim();
  if (isRemoteUrl(clean)) return null;

  // If path starts with "uploads/" or "/uploads/"
  let relative = clean.replace(/^\/?uploads\/?/, "");

  const baseDir = getStorageBaseDir();
  const absolutePath = path.resolve(baseDir, relative);

  // Path traversal check
  const checkRelative = path.relative(baseDir, absolutePath);
  if (
    !checkRelative ||
    checkRelative.startsWith("..") ||
    path.isAbsolute(checkRelative)
  ) {
    return null;
  }

  return absolutePath;
};

// Check if stored file actually exists on disk
export const fileExistsOnDisk = (storedPath) => {
  const abs = resolveStoragePath(storedPath);
  if (!abs) return false;
  try {
    return fs.existsSync(abs);
  } catch {
    return false;
  }
};

// Get file stats safely
export const getFileStat = async (storedPath) => {
  const abs = resolveStoragePath(storedPath);
  if (!abs) return null;
  try {
    return await stat(abs);
  } catch {
    return null;
  }
};

// Safely delete a file from storage
export const safeDeleteStoredFile = async (storedPath) => {
  if (!storedPath || isRemoteUrl(storedPath)) return false;

  const abs = resolveStoragePath(storedPath);
  if (!abs) {
    console.warn("Attempted to delete file outside storage boundary:", storedPath);
    return false;
  }

  try {
    await unlink(abs);
    return true;
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error(`Failed to delete stored file ${abs}:`, err.message);
    }
    return false;
  }
};

// Initialize directories on module load
initStorageDirs();
