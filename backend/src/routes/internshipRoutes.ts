import express from "express";

import authMiddleware from "../middleware/authMiddleware";

import {
  createInternship,
  getInternships,
} from "../controllers/internshipController";

import SavedInternship from "../models/SavedInternship";

const router = express.Router();

router.post("/", createInternship);

router.get("/", getInternships);

router.post("/:internshipId/save", authMiddleware, async (req, res) => {
  try {
    const saved = await SavedInternship.create({
      userId: req.userId,
      internshipId: req.params.internshipId,
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
});

router.get("/saved/list", authMiddleware, async (req, res) => {
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
});

export default router;