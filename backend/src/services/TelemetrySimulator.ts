import { Server as SocketIOServer } from 'socket.io';
import { setupLogger } from '../config/logger.js';
import { Telemetry } from '../models/Telemetry.js';
import { publishTelemetry } from './telemetryStream.js';

const logger = setupLogger();

type SimulatorDevice = {
  deviceId: string;
  deviceName: string;
  metric: string;
  base: number;
  range: [number, number];
  unit: string;
  drift: number;
};

export class TelemetrySimulator {
  private io?: SocketIOServer;
  private timer?: NodeJS.Timeout;
  private isRunning = false;
  private readonly devices: SimulatorDevice[] = [
    { deviceId: 'turbine-01', deviceName: 'Turbine 01', metric: 'temperature', base: 72, range: [60, 96], unit: '°C', drift: 3 },
    { deviceId: 'turbine-02', deviceName: 'Turbine 02', metric: 'temperature', base: 68, range: [55, 90], unit: '°C', drift: 2.5 },
    { deviceId: 'pressure-01', deviceName: 'Pressure 01', metric: 'pressure', base: 120, range: [90, 170], unit: 'psi', drift: 8 },
    { deviceId: 'pressure-02', deviceName: 'Pressure 02', metric: 'pressure', base: 118, range: [85, 165], unit: 'psi', drift: 7 },
    { deviceId: 'motor-01', deviceName: 'Motor 01', metric: 'vibration', base: 0.8, range: [0.2, 1.6], unit: 'mm/s', drift: 0.2 },
    { deviceId: 'motor-02', deviceName: 'Motor 02', metric: 'vibration', base: 0.9, range: [0.3, 1.8], unit: 'mm/s', drift: 0.25 },
    { deviceId: 'temperature-01', deviceName: 'Temperature 01', metric: 'temperature', base: 74, range: [62, 88], unit: '°C', drift: 2.7 },
    { deviceId: 'temperature-02', deviceName: 'Temperature 02', metric: 'temperature', base: 71, range: [58, 84], unit: '°C', drift: 2.4 },
    { deviceId: 'vibration-01', deviceName: 'Vibration 01', metric: 'vibration', base: 1.1, range: [0.4, 2.1], unit: 'mm/s', drift: 0.3 },
    { deviceId: 'vibration-02', deviceName: 'Vibration 02', metric: 'vibration', base: 1.2, range: [0.5, 2.2], unit: 'mm/s', drift: 0.28 },
  ];

  constructor(io?: SocketIOServer) {
    this.io = io;
  }

  setSocket(io: SocketIOServer): void {
    this.io = io;
  }

  start(intervalMs = 1500): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.timer = setInterval(async () => {
      await this.emitSample();
    }, intervalMs);

    logger.info(`Telemetry simulator started with ${intervalMs}ms interval`);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }

    this.isRunning = false;
    logger.info('Telemetry simulator stopped');
  }

  getStatus(): { running: boolean; devices: number; intervalMs: number } {
    return {
      running: this.isRunning,
      devices: this.devices.length,
      intervalMs: this.timer ? 1500 : 0,
    };
  }

  private async emitSample(): Promise<void> {
    const baseDevice = this.devices[Math.floor(Math.random() * this.devices.length)];
    const value = Number((baseDevice.base + (Math.random() - 0.5) * baseDevice.drift * 2).toFixed(2));
    const bounded = Math.min(Math.max(value, baseDevice.range[0]), baseDevice.range[1]);
    const telemetry = {
      timestamp: new Date(),
      deviceId: baseDevice.deviceId,
      deviceName: baseDevice.deviceName,
      metric: baseDevice.metric,
      value: bounded,
      unit: baseDevice.unit,
      metadata: {
        deviceType: baseDevice.deviceId.split('-')[0],
        metric: baseDevice.metric,
        source: 'simulator',
      },
    };

    try {
      const saved = await Telemetry.create(telemetry);
      const published = saved.toObject ? saved.toObject() : saved;
      if (!('metric' in published)) {
        throw new Error('Unexpected telemetry payload missing metric');
      }

      publishTelemetry({
        ...published,
        metric: String(published.metric),
      });

      this.io?.emit('telemetry:update', { ...published, metric: String(published.metric) });
      this.io?.emit('device:update', {
        deviceId: published.deviceId,
        metric: String(published.metric),
        value: published.value,
        timestamp: published.timestamp,
      });
    } catch (error) {
      logger.error('Telemetry simulation ingestion failed', error);
    }
  }
}

export const telemetrySimulator = new TelemetrySimulator();
