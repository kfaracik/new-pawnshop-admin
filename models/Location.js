import mongoose, { model, models, Schema } from "mongoose";

const LocationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, default: "", trim: true },
    addressLine1: { type: String, default: "", trim: true },
    addressLine2: { type: String, default: "", trim: true },
    postalCode: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const Location = models?.Location || model("Location", LocationSchema);
