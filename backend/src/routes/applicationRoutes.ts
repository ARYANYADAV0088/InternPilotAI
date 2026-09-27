import express from "express";
import authMiddleware from "../middleware/authMiddleware";
import {
  createApplication,
  getMyApplications,
  updateApplication,
  withdrawApplication,
} from "../controllers/applicationController";

const router = express.Router();

router.post("/", authMiddleware, createApplication);
router.get("/", authMiddleware, getMyApplications);
router.put("/:id", authMiddleware, updateApplication);
router.delete("/:id", authMiddleware, withdrawApplication);

export default router;