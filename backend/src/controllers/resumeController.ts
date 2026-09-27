import { Response } from "express";
import Resume from "../models/resume";
import { AuthRequest } from "../middleware/authMiddleware";
import mongoose from "mongoose";

export const createResume = async (req: AuthRequest, res: Response) => {
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
      skills: Array.isArray(skills) ? skills : [],
      education: Array.isArray(education) ? education : [],
      experience: Array.isArray(experience) ? experience : [],
      projects: Array.isArray(projects) ? projects : [],
    });

    res.status(201).json({
      message: "Resume created successfully",
      resume,
    });
  } catch (error) {
    console.error("Create resume error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMyResumes = async (req: AuthRequest, res: Response) => {
  try {
    const resumes = await Resume.find({
      userId: req.userId,
    }).sort({ createdAt: -1 });

    res.json({ resumes });
  } catch (error) {
    console.error("Get resumes error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getResumeById = async (req: AuthRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.id))) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    res.json({ resume });
  } catch (error) {
    console.error("Get resume error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateResume = async (req: AuthRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.id))) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const {
      title,
      fileName,
      fileUrl,
      skills,
      education,
      experience,
      projects,
    } = req.body;

    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!resume) {
      return res.status(404).json({
        message: "Resume not found or does not belong to you",
      });
    }

    if (title !== undefined) resume.title = title;
    if (fileName !== undefined) resume.fileName = fileName;
    if (fileUrl !== undefined) resume.fileUrl = fileUrl;
    if (skills !== undefined) resume.skills = Array.isArray(skills) ? skills : [];
    if (education !== undefined) resume.education = Array.isArray(education) ? education : [];
    if (experience !== undefined) resume.experience = Array.isArray(experience) ? experience : [];
    if (projects !== undefined) resume.projects = Array.isArray(projects) ? projects : [];

    await resume.save();

    res.json({
      message: "Resume updated successfully",
      resume,
    });
  } catch (error) {
    console.error("Update resume error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteResume = async (req: AuthRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.id))) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const deleted = await Resume.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!deleted) {
      return res.status(404).json({
        message: "Resume not found or does not belong to you",
      });
    }

    res.json({
      message: "Resume deleted successfully",
      id: req.params.id,
    });
  } catch (error) {
    console.error("Delete resume error:", error);
    res.status(500).json({ message: "Server error" });
  }
};