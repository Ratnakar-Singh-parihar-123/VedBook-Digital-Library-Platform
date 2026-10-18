import express from "express";
import http from "node:http";
import cors from "cors";
import dotenv from "dotenv";
import db from "./config/db.js";
import { initializeSocket } from "./config/socket.js";
import { getStorageBaseDir, fileExistsOnDisk } from "./utils/storage.js";

import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import myLibraryRoutes from "./routes/myLibraryRoutes.js";
import discoveryRoutes from "./routes/discoveryRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import adminReviewRoutes from "./routes/adminReviewRoutes.js";
import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes.js";
import userNotificationRoutes from "./routes/userNotificationRoutes.js";

// Load environment variables
dotenv.config();

const app = express();
const httpServer = http.createServer(app);

// Allowed frontend origins
const allowedOrigins = [
  "https://thevedbook.vercel.app",
  "https://vedbook.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
];

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without Origin, such as Postman/server-to-server or mobile apps
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow Vercel preview deployments (*.vercel.app)
      if (
        /^https:\/\/[\w-]+-ratnakarsinghparihars-projects\.vercel\.app$/.test(
          origin,
        ) ||
        /^https:\/\/thevedbook.*\.vercel\.app$/.test(origin)
      ) {
        return callback(null, true);
      }

      console.warn("CORS blocked origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// Parse JSON request bodies
app.use(express.json());

// Initialize Socket.IO
initializeSocket(httpServer);

// Serve uploaded assets from persistent storage location
app.use("/uploads", express.static(getStorageBaseDir()));

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "VedBook API is running!",
    timestamp: new Date().toISOString(),
  });
});

// Database connection test
app.get("/api/db-test", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT DATABASE() AS databaseName");

    res.json({
      success: true,
      message: "MySQL connected successfully!",
      database: rows[0].databaseName,
    });
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// Storage health test
app.get("/api/storage-test", (req, res) => {
  res.json({
    success: true,
    storageDir: getStorageBaseDir(),
    status: "healthy",
  });
});

// API routes
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/admin/notifications", notificationRoutes);
app.use("/api/my-library", myLibraryRoutes);
app.use("/api/discovery", discoveryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin/reviews", adminReviewRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/notifications", userNotificationRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// Start server
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`VedBook server running on port ${PORT}`);
  console.log(`Persistent storage directory: ${getStorageBaseDir()}`);
});
