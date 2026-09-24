import mongoose from "mongoose";

const nodeSchema = new mongoose.Schema({
  id: String,
  type: String,
  position: { x: Number, y: Number },
  data: mongoose.Schema.Types.Mixed
}, { _id: false });

const edgeSchema = new mongoose.Schema({
  id: String,
  source: String,
  target: String,
  sourceHandle: String,
  targetHandle: String,
  animated: Boolean
}, { _id: false });

const workflowSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  name: { type: String, required: true },
  description: String,
  nodes: [nodeSchema],
  edges: [edgeSchema],
  active: { type: Boolean, default: false }
}, { timestamps: true });

export const Workflow = mongoose.model("Workflow", workflowSchema);
