import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Resume from "../models/resume";
import { analyzeResume } from "../services/aiService";

export const analyzeMyResume = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.resumeId,
      userId: req.userId,
    });

    if (!resume) {
      return res.status(404).json({
        message: "Resume not found",
      });
    }

    // Analyze resume using Gemini
    const analysis = await analyzeResume(resume);

    // Save the AI result directly in MongoDB.
    // Using findOneAndUpdate avoids Mongoose VersionError
    // after the Gemini request takes some time.
    const updatedResume = await Resume.findOneAndUpdate(
      {
        _id: req.params.resumeId,
        userId: req.userId,
      },
      {
        $set: {
          aiScore: analysis.score,
          aiBreakdown: analysis.breakdown,
          matchedSkills: analysis.matchedSkills || [],
          missingSkills: analysis.missingSkills || [],
          strengths: analysis.strengths || [],
          weaknesses: analysis.weaknesses || [],
          suggestions: analysis.suggestions || [],
          analyzedAt: new Date(),
        },
      },
      {
        new: true,
      }
    );

    if (!updatedResume) {
      return res.status(404).json({
        message: "Resume no longer exists",
      });
    }

    res.json({
      message: "Resume analyzed successfully",
      analysis,
    });
  } catch (error) {
    console.error("AI analysis error:", error);

    res.status(500).json({
      message: "AI analysis failed",
    });
  }
};