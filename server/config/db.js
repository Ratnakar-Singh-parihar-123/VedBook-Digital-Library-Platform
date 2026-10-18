import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

dotenv.config();

// Determine SSL options safely
const getSslConfig = () => {
  // If explicitly disabled or connecting to localhost
  if (
    process.env.DB_SSL === "false" ||
    process.env.DB_HOST === "localhost" ||
    process.env.DB_HOST === "127.0.0.1"
  ) {
    return false;
  }

  const rawCa = process.env.DB_SSL_CA;

  // 1. If DB_SSL_CA contains the raw certificate PEM content directly
  if (rawCa && rawCa.trim().startsWith("-----BEGIN CERTIFICATE-----")) {
    return {
      ca: rawCa.trim(),
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
    };
  }

  // 2. If DB_SSL_CA is a file path that exists
  if (rawCa && fs.existsSync(rawCa)) {
    try {
      return {
        ca: fs.readFileSync(rawCa, "utf8"),
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
      };
    } catch (err) {
      console.warn("Could not read DB_SSL_CA file:", err.message);
    }
  }

  // 3. Check default user home download path if on local machine
  const defaultLocalCa = path.join(
    process.env.HOME || "",
    "Downloads",
    "ca.pem",
  );
  if (fs.existsSync(defaultLocalCa)) {
    try {
      return {
        ca: fs.readFileSync(defaultLocalCa, "utf8"),
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
      };
    } catch {
      // Fall through to cloud fallback
    }
  }

  // 4. Cloud database fallback (Aiven, Render, AWS RDS)
  // When running in production on Render without local ca.pem file
  return {
    rejectUnauthorized: false,
  };
};

const sslConfig = getSslConfig();

const poolConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "vedbook_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
};

if (sslConfig) {
  poolConfig.ssl = sslConfig;
}

const db = mysql.createPool(poolConfig);

// Test connection on boot non-destructively
(async () => {
  try {
    const connection = await db.getConnection();
    console.log(
      "MySQL connected successfully to database:",
      poolConfig.database,
    );
    connection.release();
  } catch (error) {
    console.error("MySQL connection failed!");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
  }
})();

export default db;
