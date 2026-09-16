import mongoose from 'mongoose';
import { setupLogger } from './logger.js';

const logger = setupLogger();

export async function connectDatabase(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexusflow';
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    logger.info(`✓ Connected to MongoDB: ${mongoUri}`);
  } catch (error) {
    logger.warn('⚠ MongoDB connection warning (running in demo mode):', error instanceof Error ? error.message : error);
    logger.info('Starting server in demo mode without persistent database');
    // Allow server to continue in demo mode
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('MongoDB disconnection error:', error);
    throw error;
  }
}
