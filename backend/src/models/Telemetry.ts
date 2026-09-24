import mongoose, { Schema, Document } from 'mongoose';

export interface ITelemetry extends Document {
  timestamp: Date;
  deviceId: string;
  deviceName?: string;
  metric: string;
  value: number;
  unit?: string;
  metadata?: Record<string, any>;
}

const TelemetrySchema = new Schema(
  {
    timestamp: { type: Date, required: true, index: true },
    deviceId: { type: String, required: true, index: true },
    deviceName: { type: String, default: '' },
    metric: { type: String, required: true, index: true },
    value: { type: Number, required: true },
    unit: { type: String, default: '' },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timeseries: {
      timeField: 'timestamp',
      metaField: 'metadata',
      granularity: 'minutes',
    },
    timestamps: true,
    expireAfterSeconds: 2592000,
  }
);

export const Telemetry = mongoose.model<ITelemetry>('Telemetry', TelemetrySchema);
