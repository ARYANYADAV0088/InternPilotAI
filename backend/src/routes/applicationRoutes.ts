import express from "express";
import authMiddleware from "../middleware/authMiddleware";
import {
  createApplication,
  getMyApplications,
  updateApplication,
} from "../controllers/applicationController";

const router = express.Router();

router.post("/", authMiddleware, createApplication);
router.get("/", authMiddleware, getMyApplications);
router.put("/:id", authMiddleware, updateApplication);

export default router;