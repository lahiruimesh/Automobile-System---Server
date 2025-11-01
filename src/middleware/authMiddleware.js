// src/middleware/authMiddleware.js
import jwt from "jsonwebtoken";

// Middleware to protect routes and verify JWT
export const protect = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Separate authenticateToken middleware (if some routes specifically want it)
export const authenticateToken = protect;

// Role-based access control middleware
export const roleCheck = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${allowedRoles.join(", ")}` 
      });
    }

    next();
  };
};

// Admin/Employee only middleware
export const adminOnly = (req, res, next) => {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "employee")) {
    return res.status(403).json({ message: "Access denied. Admin/Employee only." });
  }
  next();
};
