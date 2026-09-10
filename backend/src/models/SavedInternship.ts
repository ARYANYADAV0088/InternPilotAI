import mongoose, { Schema, Document } from "mongoose";

export interface ISavedInternship extends Document {
  userId: mongoose.Types.ObjectId;
  internshipId: mongoose.Types.ObjectId;
}

const SavedInternshipSchema = new Schema<ISavedInternship>(
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
  },
  { timestamps: true }
);

SavedInternshipSchema.index(
  { userId: 1, internshipId: 1 },
  { unique: true }
);

export default mongoose.model<ISavedInternship>(
  "SavedInternship",
  SavedInternshipSchema
);