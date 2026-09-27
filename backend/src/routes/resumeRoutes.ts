import express from "express";
import authMiddleware from "../middleware/authMiddleware";
import {
  createResume,
  getMyResumes,
  getResumeById,
  updateResume,
  deleteResume,
} from "../controllers/resumeController";

const router = express.Router();

router.post("/", authMiddleware, createResume);
router.get("/", authMiddleware, getMyResumes);
router.get("/:id", authMiddleware, getResumeById);
router.put("/:id", authMiddleware, updateResume);
router.delete("/:id", authMiddleware, deleteResume);

export default router;