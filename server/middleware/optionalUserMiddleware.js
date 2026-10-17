import jwt from "jsonwebtoken";

export const optionalUserToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Login nahi hai toh public PDF reading allow karo.
  if (!authHeader) {
    return next();
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Invalid authorization header",
    });
  }

  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.id && decoded.role === "user") {
      req.user = { id: decoded.id, role: decoded.role };
    }

    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
