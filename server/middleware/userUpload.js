import multer from "multer";
import { randomUUID } from "node:crypto";
import { getUserProfilesDir, initStorageDirs } from "../utils/storage.js";

initStorageDirs();

const allowedTypes = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getUserProfilesDir());
  },

  filename: (req, file, cb) => {
    const extension = allowedTypes[file.mimetype] || ".jpg";
    cb(null, `${randomUUID()}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!allowedTypes[file.mimetype]) {
    return cb(new Error("Only JPG, PNG and WebP images are allowed"));
  }

  cb(null, true);
};

const userUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

export default userUpload;
