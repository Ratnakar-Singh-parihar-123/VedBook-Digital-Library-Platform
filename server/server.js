import express from "express";
import http from "node:http";
import path from "node:path";
import cors from "cors";
import dotenv from "dotenv";
import db from "./config/db.js";
import { initializeSocket } from "./config/socket.js";

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
dotenv.config();

const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.IO
initializeSocket(httpServer);

app.use(cors());
app.use(express.json());

// Serve book cover images publicly.
// Keep PDF files behind an authenticated endpoint.
app.use("/uploads", express.static(path.resolve("uploads")));

app.get("/", (req, res) => {
  res.json({ message: "VedBook API is running!" });
});

app.get("/api/db-test", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT DATABASE() AS databaseName");

    res.json({
      success: true,
      message: "MySQL connected successfully!",
      database: rows[0].databaseName,
    });
  } catch (error) {
    console.error("Database error:", error.message);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

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

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`VedBook server running on port ${PORT}`);
});
