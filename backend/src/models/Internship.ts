import mongoose, { Document, Schema } from "mongoose";

export interface IInternship extends Document {
  title: string;
  company: string;
  location: string;
  description: string;
  requiredSkills: string[];
  duration?: string;
  stipend?: string;
  applicationUrl?: string;
  deadline?: Date;
  recruiterId?: mongoose.Types.ObjectId;
  status: "active" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

const internshipSchema = new Schema<IInternship>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    company: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    requiredSkills: {
      type: [String],
      default: [],
    },

    duration: {
      type: String,
    },

    stipend: {
      type: String,
    },

    applicationUrl: {
      type: String,
    },

    deadline: {
      type: Date,
    },

    recruiterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

const Internship = mongoose.model<IInternship>(
  "Internship",
  internshipSchema
);

export default Internship;