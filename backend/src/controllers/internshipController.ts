import { Request, Response } from "express";
import Internship from "../models/Internship";

export const createInternship = async (
  req: Request,
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
        message:
          "Title, company, location and description are required",
      });
    }

    const internship = await Internship.create({
      title,
      company,
      location,
      description,
      requiredSkills: requiredSkills || [],
      duration,
      stipend,
      applicationUrl,
      deadline,
    });

    res.status(201).json({
      message: "Internship created successfully",
      internship,
    });
  } catch (error) {
    console.error("Create internship error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const getInternships = async (
  req: Request,
  res: Response
) => {
  try {
    const internships = await Internship.find().sort({
      createdAt: -1,
    });

    res.json({
      internships,
    });
  } catch (error) {
    console.error("Get internships error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};