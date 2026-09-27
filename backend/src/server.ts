import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import resumeRoutes from "./routes/resumeRoutes";
import aiRoutes from "./routes/aiRoutes";
import internshipRoutes from "./routes/internshipRoutes";
import matchingRoutes from "./routes/matchingRoutes";
import applicationRoutes from "./routes/applicationRoutes";
import recommendationRoutes from "./routes/recommendationRoutes";
import recruiterRoutes from "./routes/recruiterRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import interviewRoutes from "./routes/interviewRoutes";
import skillGapRoutes from "./routes/skillGapRoutes";

dotenv.config();

const app = express();

const corsOriginEnv = process.env.CORS_ORIGIN;
const localAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:3000",
];
const configuredOrigins = corsOriginEnv
  ? corsOriginEnv
      .split(",")
      .map((s) => s.trim().replace(/\/+$/, ""))
      .filter(Boolean)
  : [];
const allowedOrigins = [
  ...new Set([
    ...configuredOrigins,
    ...localAllowedOrigins,
    "https://intern-pilot-ai-rho.vercel.app",
  ]),
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/+$/, "");
      const isLocalhost =
        normalizedOrigin.startsWith("http://localhost:") ||
        normalizedOrigin.startsWith("http://127.0.0.1:");

      if (
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(normalizedOrigin) ||
        isLocalhost
      ) {
        return callback(null, true);
      }
      return callback(
        new Error(`CORS policy does not allow access from origin: ${origin}`),
        false
      );
    },
    credentials: true,
  })
);

app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.json({
    message: "InternPilot AI Backend is running 🚀",
  });
});

app.get("/api/health", (_req, res) =>
  res.json({ ok: true, service: "internpilot-api" })
);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/internships", internshipRoutes);
app.use("/api/saved", internshipRoutes);
app.use("/api/matching", matchingRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/recruiter", recruiterRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/skill-gaps", skillGapRoutes);

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});