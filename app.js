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

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for image uploads
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

export default app;
