import { Router, Request, Response } from 'express';
import { telemetrySimulator } from '../services/TelemetrySimulator.js';

const router = Router();

router.get('/status', (_req: Request, res: Response) => {
  res.json({ success: true, data: telemetrySimulator.getStatus() });
});

router.post('/start', (req: Request, res: Response) => {
  const intervalMs = Number(req.body?.intervalMs ?? 1500);
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
    res.status(400).json({ success: false, error: 'intervalMs must be a positive number' });
    return;
  }

  telemetrySimulator.start(intervalMs);
  res.json({ success: true, data: telemetrySimulator.getStatus() });
});

router.post('/stop', (_req: Request, res: Response) => {
  telemetrySimulator.stop();
  res.json({ success: true, data: telemetrySimulator.getStatus() });
});

export default router;
