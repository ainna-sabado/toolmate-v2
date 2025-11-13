import mongoose from "mongoose";

const ShadowboardSchema = new mongoose.Schema(
  {
    // Unique QR location for a specific drawer / shelf / slot
    qrLocation: { type: String, required: true, unique: true, trim: true },

    // Path to the shadowboard image file
    imagePath: { type: String, required: true, trim: true },

    // Optional versioning for changes
    version: { type: Number, default: 1 },

    // Who updated the image
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    updatedAt: { type: Date, default: Date.now },

    // Optional notes
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export const Shadowboard =
  mongoose.models.Shadowboard ||
  mongoose.model("Shadowboard", ShadowboardSchema);
