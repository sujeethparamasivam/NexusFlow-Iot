import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  telegramChatId: { type: String, default: "", trim: true, match: /^(?:-?\d+)?$/ }
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);