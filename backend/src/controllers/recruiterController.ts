import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Internship from "../models/Internship";
import Application from "../models/Application";
import Notification from "../models/Notification";
import mongoose from "mongoose";

export const getRecruiterInternships = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const internships = await Internship.find({
      recruiterId: req.userId,
    }).sort({ createdAt: -1 });

    // Count applications for each internship
    const internshipIds = internships.map((i) => i._id);
    const appCounts = await Application.aggregate([
      { $match: { internshipId: { $in: internshipIds } } },
      { $group: { _id: "$internshipId", count: { $sum: 1 } } },
    ]);

    const countMap: Record<string, number> = {};
    appCounts.forEach((c) => {
      countMap[c._id.toString()] = c.count;
    });

    const enriched = internships.map((i) => ({
      ...i.toObject(),
      applicationCount: countMap[i._id.toString()] || 0,
    }));

    res.json({ internships: enriched });
  } catch (error) {
    console.error("Get recruiter internships error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const createRecruiterInternship = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const {
      title,
      company,
      location,
      description,
      requiredSkills,
      duration,
      stipend,
      applicationUrl,
      deadline,
    } = req.body;

    if (!title || !company || !location || !description) {
      return res.status(400).json({
        message: "Title, company, location, and description are required",
      });
    }

    const internship = await Internship.create({
      title,
      company,
      location,
      description,
      requiredSkills: Array.isArray(requiredSkills)
        ? requiredSkills
        : typeof requiredSkills === "string"
        ? requiredSkills.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      duration,
      stipend,
      applicationUrl,
      deadline: deadline ? new Date(deadline) : undefined,
      recruiterId: req.userId,
      status: "active",
    });

    res.status(201).json({
      message: "Internship posted successfully",
      internship,
    });
  } catch (error) {
    console.error("Create recruiter internship error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateRecruiterInternship = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const internship = await Internship.findOne({
      _id: req.params.id,
      recruiterId: req.userId,
    });

    if (!internship) {
      return res.status(404).json({
        message: "Internship not found or not owned by you",
      });
    }

    const {
      title,
      company,
      location,
      description,
      requiredSkills,
      duration,
      stipend,
      applicationUrl,
      deadline,
      status,
    } = req.body;

    if (title !== undefined) internship.title = title;
    if (company !== undefined) internship.company = company;
    if (location !== undefined) internship.location = location;
    if (description !== undefined) internship.description = description;
    if (requiredSkills !== undefined) {
      internship.requiredSkills = Array.isArray(requiredSkills)
        ? requiredSkills
        : typeof requiredSkills === "string"
        ? requiredSkills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
    }
    if (duration !== undefined) internship.duration = duration;
    if (stipend !== undefined) internship.stipend = stipend;
    if (applicationUrl !== undefined) internship.applicationUrl = applicationUrl;
    if (deadline !== undefined) internship.deadline = deadline ? new Date(deadline) : undefined;
    if (status !== undefined) internship.status = status;

    await internship.save();

    res.json({
      message: "Internship updated successfully",
      internship,
    });
  } catch (error) {
    console.error("Update recruiter internship error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteRecruiterInternship = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const deleted = await Internship.findOneAndDelete({
      _id: req.params.id,
      recruiterId: req.userId,
    });

    if (!deleted) {
      return res.status(404).json({
        message: "Internship not found or not owned by you",
      });
    }

    res.json({
      message: "Internship deleted successfully",
      id: req.params.id,
    });
  } catch (error) {
    console.error("Delete recruiter internship error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getRecruiterApplications = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // 1. Find all internships owned by this recruiter
    const myInternships = await Internship.find({
      recruiterId: req.userId,
    }).select("_id");

    const myInternshipIds = myInternships.map((i) => i._id);

    // 2. Query applications for these internships
    const applications = await Application.find({
      internshipId: { $in: myInternshipIds },
    })
      .populate("userId", "name email role")
      .populate("internshipId", "title company location requiredSkills")
      .populate("resumeId")
      .sort({ createdAt: -1 });

    res.json({ applications });
  } catch (error) {
    console.error("Get recruiter applications error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getRecruiterApplicationById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.id))) {
      return res.status(404).json({ message: "Application not found" });
    }

    const application = await Application.findById(req.params.id)
      .populate("userId", "name email")
      .populate("internshipId")
      .populate("resumeId");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Verify ownership of the internship
    const internship = await Internship.findById(application.internshipId);
    if (!internship || String(internship.recruiterId) !== String(req.userId)) {
      return res.status(403).json({
        message: "Forbidden: You do not manage the internship for this application",
      });
    }

    res.json({ application });
  } catch (error) {
    console.error("Get application detail error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateApplicationStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { status, interviewDate, notes } = req.body;

    const allowedStatuses = [
      "applied",
      "under_review",
      "shortlisted",
      "interview",
      "selected",
      "rejected",
    ];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${allowedStatuses.join(", ")}`,
      });
    }

    const application = await Application.findById(req.params.id).populate(
      "internshipId"
    );

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Verify recruiter owns this internship
    const internship: any = application.internshipId;
    if (!internship || String(internship.recruiterId) !== String(req.userId)) {
      return res.status(403).json({
        message: "Forbidden: You are not authorized to update applications for this internship",
      });
    }

    const oldStatus = application.status;
    if (status) {
      application.status = status;
    }

    if (interviewDate !== undefined) {
      application.interviewDate = interviewDate ? new Date(interviewDate) : undefined;
    }

    if (notes !== undefined) {
      application.notes = notes;
    }

    await application.save();

    // Notify the student about the status update
    if (status && status !== oldStatus) {
      const statusLabels: Record<string, string> = {
        under_review: "Under Review",
        shortlisted: "Shortlisted",
        interview: "Interview Scheduled",
        selected: "Offer / Selected",
        rejected: "Not Selected",
      };

      const title =
        status === "interview"
          ? "🎉 Interview Scheduled!"
          : status === "selected"
          ? "🌟 Application Selected!"
          : "Application Status Update";

      const dateStr = interviewDate
        ? ` for ${new Date(interviewDate).toLocaleDateString()}`
        : "";

      const msg = `Your application for "${internship.title}" at ${internship.company} is now ${statusLabels[status] || status}${dateStr}.`;

      await Notification.create({
        userId: application.userId,
        type: status === "interview" ? "interview_scheduled" : "status_change",
        title,
        message: msg,
        link: "/applications",
      });
    }

    res.json({
      message: "Application status updated successfully",
      application,
    });
  } catch (error) {
    console.error("Update application status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
