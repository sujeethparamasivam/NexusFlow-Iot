import express from "express";
import { telemetryCollection } from "./db.js";
import { Workflow } from "./models/Workflow.js";
import { Alert } from "./models/Alert.js";
import { config } from "./config.js";
import { requireAuth } from "./auth.js";

export function createRoutes(compiler) {
  const router = express.Router();

  const validateGraph = (body) => {
    if (!body || !Array.isArray(body.nodes) || !Array.isArray(body.edges)) {
      throw new Error("Workflow must include nodes and edges arrays.");
    }
    if (body.nodes.length === 0) throw new Error("Workflow must contain at least one node.");
    if (body.nodes.some((node) => !node.id || !node.type)) throw new Error("Every node needs an id and type.");
  };

  const toPacket = (input = {}) => ({
    timestamp: new Date(),
    meta: { deviceId: input.deviceId || "turbine-01" },
    deviceId: input.deviceId || "turbine-01",
    temperature: Number(input.temperature ?? 72),
    vibration: Number(input.vibration ?? 2),
    pressure: Number(input.pressure ?? 110)
  });

  const validateTelemetry = (packet) => {
    if (!packet.deviceId || !Number.isFinite(packet.temperature) || !Number.isFinite(packet.vibration) || !Number.isFinite(packet.pressure)) {
      throw new Error("Telemetry requires a deviceId and finite temperature, vibration, and pressure values.");
    }
    return packet;
  };

  router.get("/health", (req, res) => {
    res.json({ ok: true, service: "NexusFlow API", time: new Date().toISOString() });
  });

  router.get("/notifications/status", (req, res) => {
    const { notifications } = config;
    res.json({
      emailConfigured: Boolean(notifications.emailUser && notifications.emailAppPassword),
      telegramConfigured: Boolean(notifications.telegramBotToken)
    });
  });

  router.get("/telemetry/latest", requireAuth, async (req, res) => {
    const rows = await telemetryCollection()
      .find({})
      .sort({ timestamp: -1 })
      .limit(60)
      .toArray();
    res.json(rows.reverse());
  });

  router.post("/telemetry/ingest", requireAuth, async (req, res) => {
    let packet;
    try { packet = validateTelemetry(toPacket(req.body)); } catch (error) { return res.status(400).json({ error: error.message }); }

    await telemetryCollection().insertOne(packet);
    compiler.push(packet, req.user);
    res.status(201).json(packet);
  });

  router.post("/telemetry/ingest/batch", requireAuth, async (req, res) => {
    const inputs = Array.isArray(req.body) ? req.body : req.body?.packets;
    if (!inputs?.length || inputs.length > 1000) {
      return res.status(400).json({ error: "Send between 1 and 1000 telemetry packets." });
    }
    let packets;
    try { packets = inputs.map(toPacket).map(validateTelemetry); } catch (error) { return res.status(400).json({ error: error.message }); }
    await telemetryCollection().insertMany(packets, { ordered: false });
    packets.forEach((packet) => compiler.push(packet, req.user));
    res.status(201).json({ inserted: packets.length, firstTimestamp: packets[0].timestamp, lastTimestamp: packets.at(-1).timestamp });
  });

  router.get("/workflows", requireAuth, async (req, res) => {
    res.json(await Workflow.find({ $or: [{ userId: req.user._id }, { userId: { $exists: false } }] }).sort({ updatedAt: -1 }).lean());
  });

  router.post("/workflows", requireAuth, async (req, res) => {
    try {
      validateGraph(req.body);
      const workflow = await Workflow.create({ ...req.body, userId: req.user._id });
      res.status(201).json(workflow);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.post("/workflows/compile", requireAuth, async (req, res) => {
    try {
      validateGraph(req.body);
      const graph = { ...req.body, userId: req.user._id };
      const result = compiler.compile(graph);
      await Workflow.updateMany({ $or: [{ userId: req.user._id }, { userId: { $exists: false } }] }, { $set: { active: false } });
      const workflow = await Workflow.findOneAndUpdate(
        req.body._id ? { _id: req.body._id, $or: [{ userId: req.user._id }, { userId: { $exists: false } }] } : { userId: req.user._id, name: req.body.name || "Untitled Workflow" },
        { $set: { userId: req.user._id, name: req.body.name || "Untitled Workflow", description: req.body.description, nodes: req.body.nodes, edges: req.body.edges, active: true } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      ).lean();
      compiler.setWorkflowId(workflow._id);
      res.json({ ...result, workflowId: workflow._id, workflow: workflow.name });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get("/alerts", requireAuth, async (req, res) => {
    res.json(await Alert.find({ $or: [{ userId: req.user._id }, { userId: { $exists: false } }] }).sort({ createdAt: -1 }).limit(30).lean());
  });

  router.get("/stats", requireAuth, async (req, res) => {
    const telemetry = await telemetryCollection().countDocuments();
    const alerts = await Alert.countDocuments({ $or: [{ userId: req.user._id }, { userId: { $exists: false } }] });
    const workflows = await Workflow.countDocuments({ $or: [{ userId: req.user._id }, { userId: { $exists: false } }] });
    res.json({ telemetry, alerts, workflows, compiler: compiler.status() });
  });

  return router;
}
