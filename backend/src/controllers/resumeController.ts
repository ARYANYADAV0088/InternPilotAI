import { Response } from "express";
import Resume from "../models/resume";
import { AuthRequest } from "../middleware/authMiddleware";

export const createResume = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const {
      title,
      fileName,
      fileUrl,
      skills,
      education,
      experience,
      projects,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Resume title is required",
      });
    }

    const resume = await Resume.create({
      userId: req.userId,
      title,
      fileName,
      fileUrl,
      skills: skills || [],
      education: education || [],
      experience: experience || [],
      projects: projects || [],
    });

    res.status(201).json({
      message: "Resume created successfully",
      resume,
    });
  } catch (error) {
    console.error("Create resume error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const getMyResumes = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const resumes = await Resume.find({
      userId: req.userId,
    }).sort({ createdAt: -1 });

    res.json({
      resumes,
    });
  } catch (error) {
    console.error("Get resumes error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};