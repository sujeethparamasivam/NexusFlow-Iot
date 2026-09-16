import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import { setupLogger } from './config/logger.js';
import { initializeWebSocket } from './websocket/index.js';
import { RuleEngine } from './services/RuleEngine.js';
import errorHandler from './middleware/errorHandler.js';
import graphsRouter from './routes/graphs.js';
import telemetryRouter from './routes/telemetry.js';
import rulesRouter from './routes/rules.js';
import simulatorRouter from './routes/simulator.js';
import alertsRouter from './routes/alerts.js';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.WEBSOCKET_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST']
  }
});

app.locals.io = io;

// Initialize logger
const logger = setupLogger();

// Initialize Rule Engine
const ruleEngine = new RuleEngine(io);

// Make ruleEngine available to routes
app.use((req, _res, next) => {
  (req as any).ruleEngine = ruleEngine;
  (req as any).io = io;
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/graphs', graphsRouter);
app.use('/api/telemetry', telemetryRouter);
app.use('/api/rules', rulesRouter);
app.use('/api/simulator', simulatorRouter);
app.use('/api/alerts', alertsRouter);

// WebSocket initialization
initializeWebSocket(io);

// Error handling middleware
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDatabase();
    logger.info('✓ Database connected successfully');

    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      logger.info(`✓ Server running on port ${PORT}`);
      logger.info(`✓ WebSocket server ready for connections`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  ruleEngine.shutdown();
  httpServer.close(() => {
    logger.info('✓ Server shut down gracefully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  ruleEngine.shutdown();
  httpServer.close(() => {
    logger.info('✓ Server shut down gracefully');
    process.exit(0);
  });
});
