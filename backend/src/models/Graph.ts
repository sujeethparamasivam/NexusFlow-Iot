import mongoose, { Schema, Document } from 'mongoose';

export interface INode {
  id: string;
  type: 'sensor' | 'movingAverage' | 'average' | 'minimum' | 'maximum' | 'math' | 'condition' | 'alert' | 'webhook' | 'sms' | 'log' | 'datasource' | 'operation' | 'trigger' | 'filter' | 'transform';
  label: string;
  config: Record<string, any>;
  position?: { x: number; y: number };
}

export interface IEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface IGraph extends Document {
  name: string;
  description: string;
  nodes: INode[];
  edges: IEdge[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  version: number;
}

const NodeSchema = new Schema({
  id: String,
  type: {
    type: String,
    enum: ['sensor', 'movingAverage', 'average', 'minimum', 'maximum', 'math', 'condition', 'alert', 'webhook', 'sms', 'log', 'datasource', 'operation', 'trigger', 'filter', 'transform'],
  },
  label: String,
  config: Schema.Types.Mixed,
  position: { x: Number, y: Number },
});

const EdgeSchema = new Schema({
  id: String,
  source: String,
  target: String,
  sourceHandle: String,
  targetHandle: String,
});

const GraphSchema = new Schema(
  {
    name: { type: String, required: true },
    description: String,
    nodes: [NodeSchema],
    edges: [EdgeSchema],
    isActive: { type: Boolean, default: false },
    createdBy: String,
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const Graph = mongoose.model<IGraph>('Graph', GraphSchema);
