import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "vedbook_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

try {
  const connection = await db.getConnection();

  console.log("MySQL connected successfully!");
  connection.release();
} catch (error) {
  console.error("MySQL connection failed!");
  console.error("Error code:", error.code);
  console.error("Error message:", error.message);
}

export default db;
