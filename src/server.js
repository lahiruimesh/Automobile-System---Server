import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.io with CORS
const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://localhost:3001"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });

  // Custom events
  socket.on("joinAppointmentRoom", (appointmentId) => {
    socket.join(`appointment_${appointmentId}`);
    console.log(`📍 User joined appointment room: ${appointmentId}`);
  });
});

// Make io accessible in routes
app.use((req, res, next) => {
  req.io = io;
  return next();
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io enabled`);
  console.log("Available endpoints:");
  console.log("  POST /api/auth/signup");
  console.log("  POST /api/auth/login");
  console.log("  GET  /api/auth/profile");
  console.log("  PUT  /api/auth/profile");
  console.log("  PUT  /api/auth/change-password");
  console.log("  GET  /api/customer/dashboard");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err.message);
  console.error("💡 Server will continue running...");
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err.message);
  console.error("💡 Attempting graceful shutdown...");
  httpServer.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received: closing HTTP server");
  httpServer.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(0);
  });
});

export { io };
