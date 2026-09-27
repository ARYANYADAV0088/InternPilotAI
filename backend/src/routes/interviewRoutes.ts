import express from "express";
import authMiddleware from "../middleware/authMiddleware";
import {
  startInterview,
  submitAnswer,
  finishInterview,
  getMyInterviews,
  getInterviewById,
} from "../controllers/interviewController";

const router = express.Router();

router.use(authMiddleware);

router.post("/start", startInterview);
router.post("/:id/submit", submitAnswer);
router.post("/:id/finish", finishInterview);
router.post("/:id/finalize", finishInterview);
router.get("/", getMyInterviews);
router.get("/:id", getInterviewById);

export default router;
