import { Subject, filter, map, scan, tap } from "rxjs";
import { Alert } from "./models/Alert.js";
import { dispatchNotification } from "./notifications.js";
import { config } from "./config.js";
import { sendUserNotification } from "./services/notificationService.js";

export class StreamCompiler {
  constructor(broadcast) {
    this.broadcast = broadcast;
    this.telemetry$ = new Subject();
    this.subscriptions = new Map();
    this.compiledByOwner = new Map();
    this.compiled = null;
    this.lastNotificationAt = new Map();
  }

  compile(graph) {
    const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
    const edges = Array.isArray(graph.edges) ? graph.edges : [];
    if (!nodes.length) throw new Error("Graph must contain at least one node.");
    if (nodes.some((node) => !node.id || !node.type)) throw new Error("Every graph node requires an id and type.");
    if (new Set(nodes.map((node) => node.id)).size !== nodes.length) throw new Error("Graph node ids must be unique.");
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
    const incoming = new Map(nodes.map((node) => [node.id, 0]));
    const outgoing = new Map(nodes.map((node) => [node.id, []]));

    for (const edge of edges) {
      if (!edge.source || !edge.target || edge.source === edge.target) throw new Error("Graph edges must connect two different nodes.");
      if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) {
        throw new Error(`Edge references an unknown node: ${edge.source} -> ${edge.target}`);
      }
      outgoing.get(edge.source).push(edge.target);
      incoming.set(edge.target, incoming.get(edge.target) + 1);
    }

    const source = nodes.find((node) => node.type === "sensor" || node.type === "source");
    if (!source) throw new Error("Graph requires a Turbine Sensor node.");

    const queue = nodes.filter((node) => incoming.get(node.id) === 0).map((node) => node.id);
    const orderedIds = [];
    while (queue.length) {
      const id = queue.shift();
      orderedIds.push(id);
      for (const target of outgoing.get(id)) {
        incoming.set(target, incoming.get(target) - 1);
        if (incoming.get(target) === 0) queue.push(target);
      }
    }
    if (orderedIds.length !== nodes.length) throw new Error("Graph contains a cycle.");

    const reachable = new Set([source.id]);
    const reachableQueue = [source.id];
    while (reachableQueue.length) {
      const id = reachableQueue.shift();
      for (const target of outgoing.get(id)) {
        reachable.add(target);
        reachableQueue.push(target);
      }
    }
    if (reachable.size !== nodes.length) throw new Error("Every node must be connected to the sensor.");

    const orderedNodes = orderedIds.map((id) => nodeMap.get(id));
    const ownerId = graph.userId?.toString() || "global";
    const workflowId = graph.workflowId || graph._id;
    const incomingEdges = new Map(nodes.map((node) => [node.id, edges.filter((edge) => edge.target === node.id)]));
    this.subscriptions.get(ownerId)?.unsubscribe();
    const unsupported = orderedNodes.find((node) => !["sensor", "source", "movingAverage", "threshold", "rule", "smsAlert", "action", "webhook"].includes(node.type));
    if (unsupported) throw new Error(`Unsupported node type: ${unsupported.type}`);
    for (const node of orderedNodes) {
      if (node.type === "movingAverage") {
        const windowSize = Number(node.data?.windowSize);
        if (!Number.isInteger(windowSize) || windowSize < 1 || windowSize > 1000) throw new Error(`Invalid moving average window on node ${node.id}.`);
      }
      if (node.type === "threshold" || node.type === "rule") {
        const threshold = Number(node.data?.threshold ?? node.threshold);
        const operator = node.data?.operator || node.operator;
        if (!Number.isFinite(threshold) || ![">", ">=", "<", "<=", "=", "==", "!="].includes(operator)) throw new Error(`Invalid threshold configuration on node ${node.id}.`);
      }
      if (node.type === "webhook" && !/^https?:\/\//i.test(String(node.data?.url || ""))) throw new Error(`Webhook node ${node.id} requires an HTTP or HTTPS URL.`);
    }

    let stream = this.telemetry$.pipe(
      filter((packet) => packet.pipelineOwner === ownerId),
      filter((packet) => packet.deviceId === (source.data?.deviceId || "turbine-01"))
    );

    for (const node of orderedNodes) {
      if (node.id === source.id) continue;
      stream = stream.pipe(
        tap((packet) => {
          const edgeIds = (incomingEdges.get(node.id) || []).map((edge) => edge.id);
          if (!edgeIds.length) return;
          this.broadcast({
            type: "pipeline_activity",
            data: { workflowId: workflowId || null, nodeId: node.id, edgeIds, timestamp: new Date().toISOString() }
          }, packet.notificationUser?._id);
        })
      );
      if (node.type === "movingAverage") {
        const windowSize = Math.max(1, Number(node.data?.windowSize || 5));
        stream = stream.pipe(
          scan((state, packet) => {
            const values = [...state.values, Number(packet.temperature)].slice(-windowSize);
            const average = values.reduce((sum, value) => sum + value, 0) / values.length;
            return { values, packet, average };
          }, { values: [], packet: null, average: 0 }),
          map((state) => ({ ...state.packet, temperature: state.average, rawTemperature: state.packet.temperature }))
        );
      }
      if (node.type === "threshold" || node.type === "rule") {
        const limit = Number(node.data?.threshold ?? node.threshold ?? 80);
        const operator = node.data?.operator || node.operator || ">";
        stream = stream.pipe(
          map((packet) => ({ ...packet, threshold: limit, exceeded: compare(Number(packet.temperature), operator, limit) }))
        );
      }
      if (node.type === "smsAlert" || node.type === "action" || node.type === "webhook") {
        stream = stream.pipe(
          tap(async (packet) => {
            if (packet.exceeded !== true) return;
            const key = `${packet.deviceId}:${node.id}`;
            const lastSent = this.lastNotificationAt.get(key) || 0;
            if (Date.now() - lastSent < config.alertCooldownMs) return;
            this.lastNotificationAt.set(key, Date.now());
            await this.createAlert(packet, node, workflowId).catch((error) => console.warn(`Rule action failed: ${error.message}`));
          })
        );
      }
    }

    stream = stream.pipe(
      tap((packet) => {
        this.broadcast({
          type: "pipeline",
          data: {
            temperature: packet.temperature,
            rawTemperature: packet.rawTemperature ?? packet.temperature,
            exceeded: packet.exceeded ?? false,
            timestamp: new Date().toISOString()
          }
        }, packet.notificationUser?._id);
      })
    );

    const subscription = stream.subscribe();
    this.subscriptions.set(ownerId, subscription);

    this.compiled = {
      source: source.id,
      nodes: nodes.length,
      edges: edges.length,
      order: orderedIds,
      workflowId: graph.workflowId || null,
      ownerId,
      status: "running",
      compiledAt: new Date().toISOString()
    };
    this.compiledByOwner.set(ownerId, this.compiled);

    return this.compiled;
  }

  push(packet, user = null) {
    const ownerId = user?._id?.toString() && this.compiledByOwner.has(user._id.toString()) ? user._id.toString() : "global";
    this.telemetry$.next({ ...packet, notificationUser: user, pipelineOwner: ownerId });
  }

  status() {
    return this.compiled;
  }

  setWorkflowId(workflowId) {
    if (this.compiled) this.compiled.workflowId = workflowId;
    if (this.compiled?.ownerId) this.compiledByOwner.set(this.compiled.ownerId, this.compiled);
  }

  async createAlert(packet, node, workflowId) {
    const channel = node.data?.channel || (node.type === "webhook" ? "webhook" : "mock-sms");
    const alert = await Alert.create({
      userId: packet.notificationUser?._id,
      workflowId: workflowId || undefined,
      severity: "critical",
      message: `Temperature threshold exceeded: ${Number(packet.temperature).toFixed(1)}°C`,
      deviceId: packet.deviceId,
      value: packet.temperature,
      channel,
      deliveryStatus: "pending"
    });
    this.broadcastAlert(alert, { status: "pending", message: "Delivery in progress" }, null, packet.notificationUser?._id);

    const delivery = await dispatchNotification({ alert, node });
    alert.deliveryStatus = delivery.status;
    alert.deliveredAt = delivery.status === "delivered" ? new Date() : undefined;
    alert.deliveryMessage = delivery.message;
    await alert.save();

    const notificationText = [
      "NexusFlow alert",
      `Device: ${alert.deviceId}`,
      `Temperature: ${Number(alert.value).toFixed(1)}°C`,
      `Message: ${alert.message}`,
      `Channel: ${alert.channel}`
    ].join("\n");
    const notifications = await sendUserNotification(packet.notificationUser, {
      subject: `[NexusFlow] Critical alert for ${alert.deviceId}`,
      emailMessage: notificationText,
      telegramMessage: escapeTelegramHtml(notificationText)
    });

    this.broadcastAlert(alert, delivery, notifications, packet.notificationUser?._id);
  }

  broadcastAlert(alert, delivery, notifications, targetUserId) {
    this.broadcast({
      type: notifications ? "alert_update" : "alert",
      data: {
        id: alert._id,
        severity: alert.severity,
        message: alert.message,
        deviceId: alert.deviceId,
        value: alert.value,
        channel: alert.channel,
        deliveryStatus: delivery.status,
        deliveryMessage: delivery.message,
        notifications,
        createdAt: alert.createdAt
      }
    }, targetUserId);
  }
}

function escapeTelegramHtml(value) {
  return String(value).replace(/[&<>]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[character]));
}

function compare(value, operator, limit) {
  return {
    ">": value > limit,
    ">=": value >= limit,
    "<": value < limit,
    "<=": value <= limit,
    "=": value === limit,
    "==": value === limit,
    "!=": value !== limit
  }[operator] ?? value > limit;
}
