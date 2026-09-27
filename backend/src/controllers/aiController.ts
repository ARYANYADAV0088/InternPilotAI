import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Resume from "../models/resume";
import { analyzeResume } from "../services/aiService";

const sanitizeLogs = (text: string): string => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return text;
  return text.split(key).join("[REDACTED_API_KEY]");
};

export const safeGeminiError = (err: any, action: string): { status: number; message: string } => {
  const code = err?.status || err?.statusCode || 500;

  const safeModel = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  console.error(`[AI] ${action} failed — status: ${code}, model: ${safeModel}`);
  if (err?.message) {
    console.error(`[AI] Error detail: ${sanitizeLogs(String(err.message).slice(0, 500))}`);
  }

  if (code === 429 || String(err?.message).includes("RESOURCE_EXHAUSTED") || String(err?.message).includes("Quota exceeded")) {
    return { status: 429, message: "Gemini API daily quota exceeded. Please try again later or upgrade your API plan." };
  }
  if (code === 503 || String(err?.message).includes("high demand")) {
    return { status: 503, message: "Gemini AI is temporarily overloaded. Please try again in a few seconds." };
  }
  if (code === 404 || String(err?.message).includes("not found")) {
    return { status: 502, message: "The configured AI model is unavailable. Please contact the administrator." };
  }
  if (String(err?.message).includes("GEMINI_API_KEY")) {
    return { status: 503, message: "AI service is not configured. Please contact the administrator." };
  }
  if (String(err?.message).includes("invalid JSON") || String(err?.message).includes("JSON.parse")) {
    return { status: 502, message: "AI returned an unparseable response. Please try again." };
  }

  return { status: 500, message: `${action} failed. Please try again.` };
};

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
    const { status, message } = safeGeminiError(error, "AI resume analysis");
    res.status(status).json({ message });
  }
};