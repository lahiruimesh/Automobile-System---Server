import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/authRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import timeLogRoutes from "./src/routes/timeLogRoutes.js";
import chatbotRoutes from "./src/routes/chatbotRoutes.js";
import serviceRequestRoutes from "./src/routes/serviceRequestRoutes.js";
import appointmentRoutes from "./src/routes/appointmentRoutes.js";
import profileRoutes from "./src/routes/profileRoutes.js";
import serviceRoutes from "./src/routes/serviceRoutes.js";
import partsRoutes from "./src/routes/partsRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";
import calendarRoutes from "./src/routes/calendarRoutes.js";
import customerRoutes from "./src/routes/customerRoutes.js";

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use("/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/employee", timeLogRoutes);
app.use("/chatbot", chatbotRoutes);
app.use("/api/requests", serviceRequestRoutes);
app.use("/api/admin", serviceRequestRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/employee", profileRoutes);
app.use("/services", serviceRoutes);
app.use("/parts", partsRoutes);
app.use("/notifications", notificationRoutes);
app.use("/calendar", calendarRoutes);
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/customer", customerRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running!" });
});

// Handle undefined routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Error:", error);
  res.status(500).json({ message: "Internal server error" });
});

export default app;