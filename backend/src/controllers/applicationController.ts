import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Application from "../models/Application";
import Internship from "../models/Internship";

export const createApplication = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { internshipId, status, notes } = req.body;

    if (!internshipId) {
      return res.status(400).json({
        message: "Internship ID is required",
      });
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
        message: "Internship already saved/applied",
        application: existingApplication,
      });
    }

   const application = await Application.create({
  userId: req.userId,
  internshipId,
  status: "applied",
  appliedAt: new Date(),
  notes,
});

    res.status(201).json({
      message: "Application created successfully",
      application,
    });
  } catch (error) {
    console.error("Create application error:", error);

    res.status(500).json({
      message: "Server error",
    });
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
      .sort({ createdAt: -1 });

    res.json({
      applications,
    });
  } catch (error) {
    console.error("Get applications error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const updateApplication = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { status, notes } = req.body;
const allowedStatuses = [
  "applied",
  "interview",
  "selected",
  "rejected",
];

if (
  status &&
  !allowedStatuses.includes(status)
) {
  return res.status(400).json({
    message: "Invalid application status",
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

    if (status) {
      application.status = status;

      if (status === "applied" && !application.appliedAt) {
        application.appliedAt = new Date();
      }
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

    res.status(500).json({
      message: "Server error",
    });
  }
};