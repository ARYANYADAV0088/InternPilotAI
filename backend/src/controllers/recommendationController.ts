import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Resume from "../models/resume";
import Internship from "../models/Internship";
import { getAIRecommendations } from "../services/matchingService";

export const getRecommendations = async (
  req: AuthRequest,
  res: Response
) => {
  try {
const resumeId = String(req.params.resumeId);
    const resume = await Resume.findOne({
      _id: resumeId,
      userId: req.userId,
    });

    if (!resume) {
      return res.status(404).json({
        message: "Resume not found",
      });
    }

    const internships = await Internship.find({});

    const result = await getAIRecommendations(
      resumeId,
      internships
    );

    res.json({
      message: "AI recommendations generated successfully",
      ...result,
    });
  } catch (error) {
    console.error("Recommendation error:", error);

    res.status(500).json({
      message: "Failed to generate AI recommendations",
    });
  }
};