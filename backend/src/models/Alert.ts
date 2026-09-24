import mongoose, { Schema, Document } from 'mongoose';

export type AlertStatus = 'new' | 'acknowledged' | 'resolved';
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface IAlert extends Document {
  ruleId?: string;
  deviceId: string;
  severity: AlertSeverity;
  message: string;
  metric: string;
  value: number;
  threshold?: number;
  timestamp: Date;
  status: AlertStatus;
}

const AlertSchema = new Schema(
  {
    ruleId: { type: String, default: '' },
    deviceId: { type: String, required: true, index: true },
    severity: { type: String, enum: ['critical', 'warning', 'info'], default: 'warning' },
    message: { type: String, required: true },
    metric: { type: String, required: true },
    value: { type: Number, required: true },
    threshold: { type: Number },
    timestamp: { type: Date, required: true, default: Date.now },
    status: { type: String, enum: ['new', 'acknowledged', 'resolved'], default: 'new' },
  },
  { timestamps: true }
);

export const Alert = mongoose.model<IAlert>('Alert', AlertSchema);
