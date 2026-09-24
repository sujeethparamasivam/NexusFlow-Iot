import { setupLogger } from '../config/logger.js';

const logger = setupLogger();

export interface SmsDeliveryResult {
  success: boolean;
  to: string;
  message: string;
  deliveredAt: string;
}

export class MockSmsService {
  static async send({ to, message }: { to: string; message: string }): Promise<SmsDeliveryResult> {
    if (!to || !message) {
      throw new Error('Recipient and message are required');
    }

    const result = {
      success: true,
      to,
      message,
      deliveredAt: new Date().toISOString(),
    };

    logger.info('MOCK SMS SENT', result);
    return result;
  }
}
