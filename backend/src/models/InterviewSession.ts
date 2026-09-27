import mongoose, { Document, Schema } from "mongoose";

export interface IInterviewQuestion {
  id: string;
  question: string;
  type: string;
  whyItMatters?: string;
  expectedPoints?: string[];
  studentAnswer?: string;
  score?: number;
  feedback?: string;
  goodPoints?: string[];
  missingPoints?: string[];
  improvePoints?: string[];
  suggestedAnswer?: string;
}

export interface IInterviewSession extends Document {
  userId: mongoose.Types.ObjectId;
  resumeId: mongoose.Types.ObjectId;
  internshipId?: mongoose.Types.ObjectId;
  roleTitle: string;
  company: string;
  type: "technical" | "behavioral" | "mixed";
  difficulty: "junior" | "mid" | "senior";
  questions: IInterviewQuestion[];
  overallScore?: number;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const interviewSessionSchema = new Schema<IInterviewSession>(
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
    },
    roleTitle: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      default: "Tech Company",
      trim: true,
    },
    type: {
      type: String,
      enum: ["technical", "behavioral", "mixed"],
      default: "mixed",
    },
    difficulty: {
      type: String,
      enum: ["junior", "mid", "senior"],
      default: "junior",
    },
    questions: [
      {
        id: { type: String, required: true },
        question: { type: String, required: true },
        type: { type: String, default: "general" },
        whyItMatters: { type: String },
        expectedPoints: [{ type: String }],
        studentAnswer: { type: String },
        score: { type: Number },
        feedback: { type: String },
        goodPoints: [{ type: String }],
        missingPoints: [{ type: String }],
        improvePoints: [{ type: String }],
        suggestedAnswer: { type: String },
      },
    ],
    overallScore: {
      type: Number,
      default: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

interviewSessionSchema.index({ userId: 1, createdAt: -1 });

const InterviewSession = mongoose.model<IInterviewSession>(
  "InterviewSession",
  interviewSessionSchema
);

export default InterviewSession;
