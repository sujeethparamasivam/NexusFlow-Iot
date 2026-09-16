import { Server as SocketIOServer, Socket } from 'socket.io';
import { setupLogger } from '../config/logger.js';

const logger = setupLogger();

export function initializeWebSocket(io: SocketIOServer): void {
  io.on('connection', (socket: Socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Listen for telemetry subscription
    socket.on('subscribe:telemetry', (data: { deviceId: string }) => {
      const room = `telemetry:${data.deviceId}`;
      socket.join(room);
      logger.info(`Client ${socket.id} subscribed to ${room}`);
    });

    // Listen for graph updates
    socket.on('subscribe:graph', (data: { graphId: string }) => {
      const room = `graph:${data.graphId}`;
      socket.join(room);
      logger.info(`Client ${socket.id} subscribed to ${room}`);
    });

    // Broadcast telemetry data to subscribers
    socket.on('emit:telemetry', (data: any) => {
      const room = `telemetry:${data.deviceId}`;
      io.to(room).emit('telemetry:update', data);
    });

    // Broadcast alerts
    socket.on('emit:alert', (data: any) => {
      io.emit('alert:triggered', data);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });
}
