import jwt from "jsonwebtoken";

export const authenticateSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication token is required"));
    }

    if (!process.env.JWT_SECRET) {
      return next(new Error("Authentication is not configured"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id || !["admin", "user"].includes(decoded.role)) {
      return next(new Error("Invalid authentication credentials"));
    }

    socket.user = {
      id: String(decoded.id),
      role: decoded.role,
    };

    next();
  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
};
