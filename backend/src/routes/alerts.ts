import { Router, Request, Response } from 'express';
import { AlertService } from '../services/AlertService.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const alerts = await AlertService.listAlerts(req.query as Record<string, any>);
    res.json({ success: true, data: alerts, count: alerts.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const alerts = await AlertService.listAlerts({});
    const byStatus = { new: 0, acknowledged: 0, resolved: 0 };
    const bySeverity = { critical: 0, warning: 0, info: 0 };

    alerts.forEach((alert) => {
      byStatus[alert.status as keyof typeof byStatus] = (byStatus[alert.status as keyof typeof byStatus] ?? 0) + 1;
      bySeverity[alert.severity as keyof typeof bySeverity] = (bySeverity[alert.severity as keyof typeof bySeverity] ?? 0) + 1;
    });

    res.json({ success: true, data: { total: alerts.length, byStatus, bySeverity } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const alert = await (await import('../models/Alert.js')).Alert.findById(req.params.id).lean();
    if (!alert) {
      res.status(404).json({ success: false, error: 'Alert not found' });
      return;
    }
    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const updated = await AlertService.updateAlert(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
