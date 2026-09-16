import { Alert } from '../models/Alert.js';
import { setupLogger } from '../config/logger.js';

const logger = setupLogger();

export class AlertService {
  static async createAlert(input: {
    ruleId?: string;
    deviceId: string;
    severity?: 'critical' | 'warning' | 'info';
    message: string;
    metric: string;
    value: number;
    threshold?: number;
  }): Promise<any> {
    const alert = await Alert.create({
      ...input,
      severity: input.severity ?? 'warning',
      timestamp: new Date(),
      status: 'new',
    });

    logger.info('Alert created', alert.toObject ? alert.toObject() : alert);
    return alert;
  }

  static async listAlerts(filters: Record<string, any> = {}): Promise<any[]> {
    const query: any = {};

    if (filters.severity) query.severity = filters.severity;
    if (filters.device) query.deviceId = filters.device;
    if (filters.rule) query.ruleId = filters.rule;
    if (filters.status) query.status = filters.status;
    if (filters.from || filters.to) {
      query.timestamp = {};
      if (filters.from) query.timestamp.$gte = new Date(filters.from);
      if (filters.to) query.timestamp.$lte = new Date(filters.to);
    }

    return Alert.find(query).sort({ timestamp: -1 }).lean();
  }

  static async updateAlert(id: string, updates: Record<string, any>): Promise<any> {
    const alert = await Alert.findByIdAndUpdate(id, updates, { new: true });
    if (!alert) throw new Error('Alert not found');
    return alert;
  }
}
