import express from "express";
import authMiddleware, {
  recruiterMiddleware,
} from "../middleware/authMiddleware";
import {
  getRecruiterInternships,
  createRecruiterInternship,
  updateRecruiterInternship,
  deleteRecruiterInternship,
  getRecruiterApplications,
  getRecruiterApplicationById,
  updateApplicationStatus,
} from "../controllers/recruiterController";

const router = express.Router();

// All recruiter routes require both authentication and recruiter/admin role
router.use(authMiddleware, recruiterMiddleware);

// Internship management
router.get("/internships", getRecruiterInternships);
router.post("/internships", createRecruiterInternship);
router.put("/internships/:id", updateRecruiterInternship);
router.delete("/internships/:id", deleteRecruiterInternship);

// Applications review
router.get("/applications", getRecruiterApplications);
router.get("/applications/:id", getRecruiterApplicationById);
router.put("/applications/:id/status", updateApplicationStatus);

export default router;
