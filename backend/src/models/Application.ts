import mongoose, { Document, Schema } from "mongoose";

export interface IApplication extends Document {
  userId: mongoose.Types.ObjectId;
  internshipId: mongoose.Types.ObjectId;
  resumeId?: mongoose.Types.ObjectId;
  status:
    | "saved"
    | "applied"
    | "under_review"
    | "shortlisted"
    | "interview"
    | "selected"
    | "rejected";
  appliedAt?: Date;
  interviewDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    internshipId: {
      type: Schema.Types.ObjectId,
      ref: "Internship",
      required: true,
    },

    resumeId: {
      type: Schema.Types.ObjectId,
      ref: "Resume",
    },

    status: {
      type: String,
      enum: [
        "saved",
        "applied",
        "under_review",
        "shortlisted",
        "interview",
        "selected",
        "rejected",
      ],
      default: "saved",
    },

    appliedAt: {
      type: Date,
    },

    interviewDate: {
      type: Date,
    },

    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

applicationSchema.index(
  { userId: 1, internshipId: 1 },
  { unique: true }
);

const Application = mongoose.model<IApplication>(
  "Application",
  applicationSchema
);

export default Application;