import mongoose, { Document, Schema } from "mongoose";

export interface IResume extends Document {
  userId: mongoose.Types.ObjectId;

  title: string;
  fileName?: string;
  fileUrl?: string;

  skills: string[];
  education: string[];
  experience: string[];
  projects: string[];

  aiScore?: number;

  aiBreakdown?: {
    technicalSkills: number;
    projects: number;
    experience: number;
    education: number;
    completeness: number;
    relevance: number;
  };

  matchedSkills?: string[];
  missingSkills?: string[];
  strengths?: string[];
  weaknesses?: string[];
  suggestions?: string[];

  analyzedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new Schema<IResume>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    fileName: {
      type: String,
    },

    fileUrl: {
      type: String,
    },

    skills: {
      type: [String],
      default: [],
    },

    education: {
      type: [String],
      default: [],
    },

    experience: {
      type: [String],
      default: [],
    },

    projects: {
      type: [String],
      default: [],
    },

    aiScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    aiBreakdown: {
      technicalSkills: { type: Number, min: 0, max: 30 },
      projects: { type: Number, min: 0, max: 25 },
      experience: { type: Number, min: 0, max: 20 },
      education: { type: Number, min: 0, max: 10 },
      completeness: { type: Number, min: 0, max: 10 },
      relevance: { type: Number, min: 0, max: 5 },
    },

    matchedSkills: {
      type: [String],
      default: [],
    },

    missingSkills: {
      type: [String],
      default: [],
    },

    strengths: {
      type: [String],
      default: [],
    },

    weaknesses: {
      type: [String],
      default: [],
    },

    suggestions: {
      type: [String],
      default: [],
    },

    analyzedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Resume = mongoose.model<IResume>("Resume", resumeSchema);

export default Resume;