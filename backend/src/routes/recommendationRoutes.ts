import express from "express";
import authMiddleware from "../middleware/authMiddleware";
import {
  getRecommendations,
} from "../controllers/recommendationController";

const router = express.Router();

router.get(
  "/:resumeId",
  authMiddleware,
  getRecommendations
);

export default router;