import express from "express";
import authMiddleware from "../middleware/authMiddleware";
import {
  generateSkillGapRecord,
  getUserSkillGaps,
  getSkillGapById,
  updateProgress,
  deleteSkillGap,
} from "../controllers/skillGapController";

const router = express.Router();

router.use(authMiddleware);

router.post("/generate", generateSkillGapRecord);
router.get("/", getUserSkillGaps);
router.get("/:id", getSkillGapById);
router.put("/:id/progress", updateProgress);
router.put("/:id/toggle-action", updateProgress);
router.delete("/:id", deleteSkillGap);

export default router;
