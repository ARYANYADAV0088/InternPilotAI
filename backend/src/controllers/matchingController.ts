import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Resume from "../models/Resume";
import Internship from "../models/Internship";
import { analyzeResume } from "../services/aiService";

export const matchResumeToInternship = async (
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

    // Find user's resume
    const resume = await Resume.findOne({
      _id: resumeId,
      userId: req.userId,
    });

    if (!resume) {
      return res.status(404).json({
        message: "Resume not found",
      });
    }

    // Find internship
    const internship = await Internship.findById(internshipId);

    if (!internship) {
      return res.status(404).json({
        message: "Internship not found",
      });
    }

    // Send both resume + internship to AI
    const analysis = await analyzeResume(
      {
        title: resume.title,
        skills: resume.skills || [],
        education: resume.education || [],
        experience: resume.experience || [],
        projects: resume.projects || [],
      },
      {
        title: internship.title,
        company: internship.company,
        description: internship.description,
        requiredSkills: internship.requiredSkills || [],
        location: internship.location,
        duration: internship.duration,
        stipend: internship.stipend,
      }
    );

    return res.json({
      message: "Resume matched successfully",
      analysis,
    });
  } catch (error) {
    console.error("Resume matching error:", error);

    return res.status(500).json({
      message: "AI resume matching failed",
    });
  }
};