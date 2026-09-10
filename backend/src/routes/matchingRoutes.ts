import express from "express";
import authMiddleware from "../middleware/authMiddleware";
import { matchResumeToInternship } from "../controllers/matchingController";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  matchResumeToInternship
);

export default router;