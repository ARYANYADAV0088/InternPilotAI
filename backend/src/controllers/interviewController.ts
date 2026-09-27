import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import InterviewSession from "../models/InterviewSession";
import Resume from "../models/resume";
import Internship from "../models/Internship";
import {
  generateInterviewQuestions,
  evaluateAnswer,
} from "../services/aiService";
import mongoose from "mongoose";

export const startInterview = async (req: AuthRequest, res: Response) => {
  try {
    const { resumeId, internshipId, type = "mixed", difficulty = "junior" } =
      req.body;

    if (!resumeId) {
      return res.status(400).json({ message: "Resume ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(String(resumeId))) {
      return res.status(404).json({ message: "Invalid resume ID" });
    }

    const resume = await Resume.findOne({
      _id: resumeId,
      userId: req.userId,
    });

    if (!resume) {
      return res
        .status(404)
        .json({ message: "Resume not found or does not belong to you" });
    }

    let internship: any = null;
    if (internshipId) {
      if (mongoose.Types.ObjectId.isValid(String(internshipId))) {
        internship = await Internship.findById(internshipId);
      }
    }

    const questions = await generateInterviewQuestions(
      {
        title: resume.title,
        skills: resume.skills,
        education: resume.education,
        experience: resume.experience,
        projects: resume.projects,
      },
      internship
        ? {
            title: internship.title,
            company: internship.company,
            description: internship.description,
            requiredSkills: internship.requiredSkills,
          }
        : {
            title: resume.title || "Software Engineering Intern",
            company: "Target Tech Company",
            description: "Entry-level software engineering internship",
            requiredSkills: resume.skills?.slice(0, 5) || [],
          },
      type,
      difficulty
    );

    const session = await InterviewSession.create({
      userId: req.userId,
      resumeId: resume._id,
      internshipId: internship?._id || undefined,
      roleTitle: internship?.title || resume.title || "Software Engineering Intern",
      company: internship?.company || "Tech Company",
      type,
      difficulty,
      questions,
      completed: false,
      overallScore: 0,
    });

    res.status(201).json({
      message: "Mock interview session started",
      session,
    });
  } catch (error) {
    console.error("Start interview error:", error);
    res.status(500).json({ message: "Failed to start mock interview session" });
  }
};

export const submitAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const { questionId, answer } = req.body;

    if (!questionId || answer === undefined) {
      return res
        .status(400)
        .json({ message: "Question ID and answer are required" });
    }

    const session = await InterviewSession.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!session) {
      return res.status(404).json({ message: "Interview session not found" });
    }

    const qIndex = session.questions.findIndex((q) => q.id === questionId);
    if (qIndex === -1) {
      return res.status(404).json({ message: "Question not found in session" });
    }

    const targetQ = session.questions[qIndex];

    // Evaluate answer with AI
    const evaluation = await evaluateAnswer(
      targetQ.question,
      answer,
      {
        roleTitle: session.roleTitle,
        expectedPoints: targetQ.expectedPoints,
        difficulty: session.difficulty,
      }
    );

    // Save answer and evaluation into session question
    targetQ.studentAnswer = answer;
    targetQ.score = evaluation.score;
    targetQ.feedback = evaluation.feedback;
    targetQ.goodPoints = evaluation.goodPoints;
    targetQ.missingPoints = evaluation.missingPoints;
    targetQ.improvePoints = evaluation.improvePoints;
    targetQ.suggestedAnswer = evaluation.suggestedAnswer;

    session.markModified("questions");
    await session.save();

    res.json({
      message: "Answer evaluated successfully",
      evaluation,
      question: targetQ,
    });
  } catch (error) {
    console.error("Submit answer error:", error);
    res.status(500).json({ message: "Failed to evaluate answer" });
  }
};

export const finishInterview = async (req: AuthRequest, res: Response) => {
  try {
    const session = await InterviewSession.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!session) {
      return res.status(404).json({ message: "Interview session not found" });
    }

    const answered = session.questions.filter((q) => q.score !== undefined);
    const totalScore = answered.reduce((acc, q) => acc + (q.score || 0), 0);
    const overallScore = answered.length
      ? Math.round(totalScore / answered.length)
      : 0;

    session.overallScore = overallScore;
    session.completed = true;
    await session.save();

    res.json({
      message: "Mock interview session completed",
      session,
      overallScore,
    });
  } catch (error) {
    console.error("Finish interview error:", error);
    res.status(500).json({ message: "Failed to finalize interview session" });
  }
};

export const getMyInterviews = async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await InterviewSession.find({
      userId: req.userId,
    })
      .sort({ createdAt: -1 })
      .select("-questions.suggestedAnswer");

    res.json({ sessions });
  } catch (error) {
    console.error("Get interviews error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getInterviewById = async (req: AuthRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.id))) {
      return res.status(404).json({ message: "Session not found" });
    }

    const session = await InterviewSession.findOne({
      _id: req.params.id,
      userId: req.userId,
    })
      .populate("resumeId", "title")
      .populate("internshipId", "title company");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json({ session });
  } catch (error) {
    console.error("Get session error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
