import express from "express";
import authMiddleware from "../middleware/authMiddleware";
import { analyzeMyResume } from "../controllers/aiController";

const router = express.Router();

router.post(
  "/resume/:resumeId",
  authMiddleware,
  analyzeMyResume
);

export default router;