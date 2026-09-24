import { Request, Response, NextFunction } from 'express';
import { setupLogger } from '../config/logger.js';

const logger = setupLogger();

interface AppError extends Error {
  status?: number;
}

export default function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const status = error.status || 500;
  const message = error.message || 'Internal Server Error';

  logger.error('Error:', {
    status,
    message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  res.status(status).json({
    error: {
      status,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  });
}
