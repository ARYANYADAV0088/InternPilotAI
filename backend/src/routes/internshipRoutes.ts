import express from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import authMiddleware from "../middleware/authMiddleware";

import {
  createInternship,
  getInternships,
} from "../controllers/internshipController";

import SavedInternship from "../models/SavedInternship";

const router = express.Router();

router.post("/", createInternship);
router.get("/", getInternships);

router.post(
  "/:internshipId/save",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const saved = await SavedInternship.create({
        userId: req.userId,
        internshipId: String(req.params.internshipId),
      });

      res.status(201).json({
        message: "Internship saved",
        saved,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(400).json({
          message: "Internship already saved",
        });
      }

      res.status(500).json({
        message: "Failed to save internship",
      });
    }
  }
);

router.delete(
  "/:internshipId/save",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      await SavedInternship.findOneAndDelete({
        userId: req.userId,
        internshipId: String(req.params.internshipId),
      });

      res.json({
        message: "Internship unsaved",
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to unsave internship",
      });
    }
  }
);

router.delete(
  "/:internshipId/unsave",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      await SavedInternship.findOneAndDelete({
        userId: req.userId,
        internshipId: String(req.params.internshipId),
      });

      res.json({
        message: "Internship unsaved",
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to unsave internship",
      });
    }
  }
);

router.get(
  "/saved/list",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const saved = await SavedInternship.find({
        userId: req.userId,
      }).populate("internshipId");

      res.json({
        saved,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch saved internships",
      });
    }
  }
);

// Direct routes for when mounted at /api/saved
router.post(
  "/:internshipId",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const existing = await SavedInternship.findOne({
        userId: req.userId,
        internshipId: String(req.params.internshipId),
      });

      if (existing) {
        // Toggle behavior if called as toggle
        await SavedInternship.findByIdAndDelete(existing._id);
        return res.json({ message: "Internship unsaved", saved: false });
      }

      const savedDoc = await SavedInternship.create({
        userId: req.userId,
        internshipId: String(req.params.internshipId),
      });

      res.status(201).json({
        message: "Internship saved",
        saved: true,
        doc: savedDoc,
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update saved status" });
    }
  }
);

router.delete(
  "/:internshipId",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      await SavedInternship.findOneAndDelete({
        userId: req.userId,
        internshipId: String(req.params.internshipId),
      });
      res.json({ message: "Internship unsaved", saved: false });
    } catch (error) {
      res.status(500).json({ message: "Failed to unsave internship" });
    }
  }
);

router.get(
  "/list",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const saved = await SavedInternship.find({
        userId: req.userId,
      }).populate("internshipId");

      res.json({
        saved,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch saved internships",
      });
    }
  }
);

export default router;