import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/authRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import timeLogRoutes from "./src/routes/timeLogRoutes.js";
import chatbotRoutes from "./src/routes/chatbotRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/employee", timeLogRoutes);
app.use("/chatbot", chatbotRoutes);

export default app;
