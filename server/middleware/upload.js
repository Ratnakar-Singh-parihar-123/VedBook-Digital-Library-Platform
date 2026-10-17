import multer from "multer";
import { randomUUID } from "node:crypto";
import { getAdminProfilesDir, initStorageDirs } from "../utils/storage.js";

initStorageDirs();

const extensionMap = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getAdminProfilesDir());
  },

  filename: (req, file, cb) => {
    const extension = extensionMap[file.mimetype] || ".png";
    cb(null, `${randomUUID()}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!extensionMap[file.mimetype]) {
    return cb(new Error("Only JPG, PNG and WebP images are allowed"));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

export default upload;
