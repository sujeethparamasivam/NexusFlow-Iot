import mongoose from "mongoose";

const alertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  workflowId: { type: mongoose.Schema.Types.ObjectId, ref: "Workflow", index: true },
  severity: { type: String, enum: ["info", "warning", "critical"], default: "info" },
  message: String,
  deviceId: String,
  value: Number,
  channel: { type: String, enum: ["mock-sms", "twilio-sms", "webhook"], default: "mock-sms" },
  deliveryStatus: { type: String, enum: ["pending", "delivered", "failed"], default: "pending" },
  deliveredAt: Date,
  deliveryMessage: String
}, { timestamps: true });

export const Alert = mongoose.model("Alert", alertSchema);
