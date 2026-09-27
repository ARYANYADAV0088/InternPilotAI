import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Resume from "../models/resume";
import Internship from "../models/Internship";
import SkillGap from "../models/SkillGap";
import { generateSkillGap } from "../services/aiService";
import mongoose from "mongoose";

export const generateSkillGapRecord = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { resumeId, internshipId } = req.body;

    if (!resumeId || !internshipId) {
      return res.status(400).json({
        message: "Resume ID and Internship ID are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(String(resumeId)) ||
      !mongoose.Types.ObjectId.isValid(String(internshipId))
    ) {
      return res.status(404).json({ message: "Invalid ID provided" });
    }

    // 1. Verify resume ownership
    const resume = await Resume.findOne({ _id: resumeId, userId: req.userId });
    if (!resume) {
      return res.status(404).json({
        message: "Resume not found or does not belong to you",
      });
    }

    // 2. Verify active internship exists
    const internship = await Internship.findOne({
      _id: internshipId,
      status: { $ne: "closed" },
    });
    if (!internship) {
      return res.status(404).json({
        message: "Internship not found or is closed",
      });
    }

    // 3. Prepare data for AI
    const resumePayload = {
      title: resume.title,
      skills: resume.skills,
      projects: resume.projects,
      experience: resume.experience,
      education: resume.education,
    };

    const internshipPayload = {
      title: internship.title,
      company: internship.company,
      description: internship.description,
      requiredSkills: internship.requiredSkills,
    };

    // 4. Generate AI analysis
    const aiResult = await generateSkillGap(resumePayload, internshipPayload);

    // 5. Upsert record for this user and internship
    const record = await SkillGap.findOneAndUpdate(
      { userId: req.userId, internshipId },
      {
        $set: {
          userId: req.userId,
          resumeId: resume._id,
          internshipId: internship._id,
          matchPercentage: aiResult.matchPercentage || 0,
          existingSkills: aiResult.existingSkills || [],
          missingSkills: aiResult.missingSkills || [],
          roadmap: aiResult.roadmap || [],
          completedActions: [],
          progressPercentage: 0,
        },
      },
      { upsert: true, new: true }
    )
      .populate("internshipId", "title company location requiredSkills")
      .populate("resumeId", "title");

    res.status(201).json({
      message: "Career Intelligence roadmap generated successfully",
      skillGap: record,
    });
  } catch (error) {
    console.error("Generate skill gap error:", error);
    res.status(500).json({ message: "Failed to generate AI career roadmap" });
  }
};

export const getUserSkillGaps = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const skillGaps = await SkillGap.find({ userId: req.userId })
      .populate("internshipId", "title company location requiredSkills")
      .populate("resumeId", "title")
      .sort({ updatedAt: -1 });

    res.json({ skillGaps });
  } catch (error) {
    console.error("Get skill gaps error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSkillGapById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.id))) {
      return res.status(404).json({ message: "Roadmap not found" });
    }

    const skillGap = await SkillGap.findOne({
      _id: req.params.id,
      userId: req.userId,
    })
      .populate("internshipId", "title company location requiredSkills")
      .populate("resumeId", "title");

    if (!skillGap) {
      return res.status(404).json({ message: "Roadmap not found" });
    }

    res.json({ skillGap });
  } catch (error) {
    console.error("Get skill gap error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateProgress = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.id))) {
      return res.status(404).json({ message: "Roadmap not found" });
    }

    const { completedActions, actionId, completed } = req.body;

    const skillGap = await SkillGap.findOne({
      _id: req.params.id,
      userId: req.userId,
    })
      .populate("internshipId", "title company location requiredSkills")
      .populate("resumeId", "title");

    if (!skillGap) {
      return res.status(404).json({ message: "Roadmap not found" });
    }

    // Count all available actions in the roadmap
    let totalActions = 0;
    const validActionIds = new Set<string>();
    skillGap.roadmap.forEach((week) => {
      week.actions.forEach((act) => {
        totalActions++;
        validActionIds.add(act.id);
      });
    });

    let newCompleted = Array.isArray(skillGap.completedActions)
      ? [...skillGap.completedActions]
      : [];

    if (Array.isArray(completedActions)) {
      newCompleted = completedActions.filter((id) => validActionIds.has(String(id)));
    } else if (actionId && validActionIds.has(String(actionId))) {
      const actId = String(actionId);
      if (completed === false) {
        newCompleted = newCompleted.filter((id) => id !== actId);
      } else {
        if (!newCompleted.includes(actId)) {
          newCompleted.push(actId);
        }
      }
    }

    const progressPercentage =
      totalActions > 0
        ? Math.round((newCompleted.length / totalActions) * 100)
        : 0;

    skillGap.completedActions = newCompleted;
    skillGap.progressPercentage = Math.min(100, Math.max(0, progressPercentage));
    await skillGap.save();

    res.json({
      message: "Progress updated successfully",
      progressPercentage: skillGap.progressPercentage,
      completedActions: skillGap.completedActions,
      skillGap,
    });
  } catch (error) {
    console.error("Update progress error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteSkillGap = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.id))) {
      return res.status(404).json({ message: "Roadmap not found" });
    }

    const deleted = await SkillGap.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Roadmap not found" });
    }

    res.json({
      message: "Roadmap deleted successfully",
      id: req.params.id,
    });
  } catch (error) {
    console.error("Delete skill gap error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
