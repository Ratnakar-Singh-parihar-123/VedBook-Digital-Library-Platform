import { Server } from "socket.io";
import { authenticateSocket } from "../middleware/socketAuth.js";

let io;

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST", "PATCH"],
    },
  });

  // Verify JWT before allowing a socket connection.
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const { id, role } = socket.user;

    // Each user can join only their own room.
    socket.join(`${role}:${id}`);

    // Admins can also receive notifications intended for all admins.
    if (role === "admin") {
      socket.join("admins");
    }

    console.log(`${role} connected:`, id);

    socket.on("disconnect", () => {
      console.log(`${role} disconnected:`, id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
};
