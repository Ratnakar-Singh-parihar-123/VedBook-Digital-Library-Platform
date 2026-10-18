import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getBooksDir, getCoversDir, initStorageDirs } from "../utils/storage.js";

// Ensure dirs are initialized
initStorageDirs();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "cover" || file.fieldname === "coverImage") {
      cb(null, getCoversDir());
    } else {
      cb(null, getBooksDir());
    }
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.fieldname === "cover" || file.fieldname === "coverImage") {
      const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext)
        ? ext
        : ".png";
      cb(null, `${randomUUID()}${safeExt}`);
    } else {
      cb(null, `${randomUUID()}.pdf`);
    }
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "cover" || file.fieldname === "coverImage") {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Cover image must be a JPEG, PNG, or WebP image"));
    }
    return cb(null, true);
  }

  if (
    file.mimetype !== "application/pdf" &&
    !file.originalname.toLowerCase().endsWith(".pdf")
  ) {
    return cb(new Error("Only PDF files are allowed"));
  }

  cb(null, true);
};

const bookUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,*/ 50MB limit
    files: 2,
  },
});

export default bookUpload;
