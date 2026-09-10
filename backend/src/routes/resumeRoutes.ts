import express from "express";
import authMiddleware from "../middleware/authMiddleware";
import {
  createResume,
  getMyResumes,
} from "../controllers/resumeController";

const router = express.Router();

router.post("/", authMiddleware, createResume);
router.get("/", authMiddleware, getMyResumes);

export default router;