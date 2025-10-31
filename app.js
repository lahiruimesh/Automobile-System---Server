import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/authRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import chatbotRoutes from "./src/routes/chatbotRoutes.js";
import appointmentRoutes from "./src/routes/appointmentRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/chatbot", chatbotRoutes);
app.use("/api/appointments", appointmentRoutes);

export default app;
