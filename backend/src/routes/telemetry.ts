import { Router, Request, Response } from 'express';
import { Telemetry } from '../models/Telemetry.js';
import { publishTelemetry } from '../services/telemetryStream.js';

const router = Router();

function normalizeTelemetryPayload(payload: any): any {
  const deviceId = typeof payload?.deviceId === 'string' ? payload.deviceId.trim() : '';
  const metric = typeof payload?.metric === 'string' ? payload.metric.trim() : (typeof payload?.type === 'string' ? payload.type.trim() : 'temperature');
  const value = Number(payload?.value);

  if (!deviceId) throw new Error('Telemetry deviceId is required');
  if (!Number.isFinite(value)) throw new Error('Telemetry value must be a number');
  if (!metric) throw new Error('Telemetry metric is required');

  return {
    timestamp: payload?.timestamp ? new Date(payload.timestamp) : new Date(),
    deviceId,
    deviceName: typeof payload?.deviceName === 'string' ? payload.deviceName : deviceId,
    metric,
    value,
    unit: typeof payload?.unit === 'string' ? payload.unit : '',
    metadata: payload?.metadata && typeof payload.metadata === 'object' ? payload.metadata : {},
  };
}

router.post('/ingest', async (req: Request, res: Response) => {
  try {
    const normalized = normalizeTelemetryPayload(req.body);
    const telemetry = await Telemetry.create(normalized);
    const record = telemetry.toObject ? telemetry.toObject() : telemetry;

    publishTelemetry(record);
    if (req.app.locals?.io) {
      req.app.locals.io.emit('telemetry:update', record);
      req.app.locals.io.emit('device:update', {
        deviceId: record.deviceId,
        metric: record.metric,
        value: record.value,
        timestamp: record.timestamp,
      });
    }

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.post('/batch', async (req: Request, res: Response) => {
  try {
    const list = Array.isArray(req.body) ? req.body : [req.body];
    const sanitized = list.map(normalizeTelemetryPayload);
    const result = await Telemetry.insertMany(sanitized, { ordered: false });

    for (const item of result) {
      const record = item.toObject ? item.toObject() : item;
      publishTelemetry(record);
      if (req.app.locals?.io) {
        req.app.locals.io.emit('telemetry:update', record);
      }
    }

    res.status(201).json({ success: true, count: result.length, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/:deviceId', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { from, to, limit = 100 } = req.query;

    const query: any = { deviceId };
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from as string);
      if (to) query.timestamp.$lte = new Date(to as string);
    }

    const telemetry = await Telemetry.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string));

    res.json({ success: true, count: telemetry.length, data: telemetry });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/:deviceId/latest', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const latest = await Telemetry.findOne({ deviceId }).sort({ timestamp: -1 });

    if (!latest) {
      res.status(404).json({ success: false, error: 'No telemetry found for device' });
      return;
    }

    res.json({ success: true, data: latest });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
