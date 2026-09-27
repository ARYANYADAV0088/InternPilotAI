import mongoose, { Document, Schema } from "mongoose";

export interface ISkillGapItem {
  skill: string;
  priority: "High" | "Medium" | "Low";
  reason: string;
  relevance: string;
}

export interface IRoadmapAction {
  id: string;
  text: string;
}

export interface IRoadmapWeek {
  week: number;
  focus: string;
  actions: IRoadmapAction[];
}

export interface ISkillGap extends Document {
  userId: mongoose.Types.ObjectId;
  resumeId: mongoose.Types.ObjectId;
  internshipId: mongoose.Types.ObjectId;
  matchPercentage: number;
  existingSkills: string[];
  missingSkills: ISkillGapItem[];
  roadmap: IRoadmapWeek[];
  completedActions: string[];
  progressPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

const skillGapSchema = new Schema<ISkillGap>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },
    internshipId: {
      type: Schema.Types.ObjectId,
      ref: "Internship",
      required: true,
    },
    matchPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    existingSkills: {
      type: [String],
      default: [],
    },
    missingSkills: [
      {
        skill: { type: String, required: true },
        priority: {
          type: String,
          enum: ["High", "Medium", "Low"],
          default: "Medium",
        },
        reason: { type: String, default: "" },
        relevance: { type: String, default: "" },
      },
    ],
    roadmap: [
      {
        week: { type: Number, required: true },
        focus: { type: String, required: true },
        actions: [
          {
            id: { type: String, required: true },
            text: { type: String, required: true },
          },
        ],
      },
    ],
    completedActions: {
      type: [String],
      default: [],
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate skill-gaps per user + internship
skillGapSchema.index({ userId: 1, internshipId: 1 }, { unique: true });
skillGapSchema.index({ userId: 1, updatedAt: -1 });

const SkillGap = mongoose.model<ISkillGap>("SkillGap", skillGapSchema);

export default SkillGap;
