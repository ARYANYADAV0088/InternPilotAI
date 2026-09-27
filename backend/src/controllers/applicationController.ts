import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Application from "../models/Application";
import Internship from "../models/Internship";
import Notification from "../models/Notification";
import mongoose from "mongoose";

export const createApplication = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { internshipId, resumeId, notes } = req.body;

    if (!internshipId) {
      return res.status(400).json({
        message: "Internship ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(String(internshipId))) {
      return res.status(404).json({ message: "Invalid internship ID" });
    }

    const internship = await Internship.findById(internshipId);

    if (!internship) {
      return res.status(404).json({
        message: "Internship not found",
      });
    }

    const existingApplication = await Application.findOne({
      userId: req.userId,
      internshipId,
    });

    if (existingApplication) {
      return res.status(409).json({
        message: "Internship already applied",
        application: existingApplication,
      });
    }

    const application = await Application.create({
      userId: req.userId,
      internshipId,
      resumeId: resumeId || undefined,
      status: "applied",
      appliedAt: new Date(),
      notes,
    });

    // Notify recruiter if internship is associated with one
    if (internship.recruiterId) {
      await Notification.create({
        userId: internship.recruiterId,
        type: "application_received",
        title: "New Application Received",
        message: `A candidate has applied for "${internship.title}".`,
        link: "/recruiter/applications",
      });
    }

    res.status(201).json({
      message: "Application submitted successfully",
      application,
    });
  } catch (error) {
    console.error("Create application error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMyApplications = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const applications = await Application.find({
      userId: req.userId,
    })
      .populate("internshipId")
      .populate("resumeId", "title aiScore")
      .sort({ createdAt: -1 });

    res.json({
      applications,
    });
  } catch (error) {
    console.error("Get applications error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateApplication = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { status, interviewDate, notes } = req.body;

    // Student RBAC Protection: Students CANNOT modify recruiter-controlled fields
    if (status !== undefined || interviewDate !== undefined) {
      return res.status(403).json({
        message:
          "Forbidden: Application status and interview scheduling can only be modified by the recruiter.",
      });
    }

    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    if (notes !== undefined) {
      application.notes = notes;
    }

    await application.save();

    res.json({
      message: "Application updated successfully",
      application,
    });
  } catch (error) {
    console.error("Update application error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const withdrawApplication = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const deleted = await Application.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!deleted) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    res.json({
      message: "Application withdrawn successfully",
      id: req.params.id,
    });
  } catch (error) {
    console.error("Withdraw application error:", error);
    res.status(500).json({ message: "Server error" });
  }
};