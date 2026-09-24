import { WebSocketServer } from "ws";
import { getUserFromToken } from "./auth.js";

export function createWebSocketServer(server, { onTelemetry } = {}) {
  const wss = new WebSocketServer({ server, path: "/ws" });
  const clients = new Map();

  wss.on("connection", async (socket, request) => {
    const token = new URL(request.url, "http://localhost").searchParams.get("token");
    const user = await getUserFromToken(token);
    if (!user) {
      socket.send(JSON.stringify({ type: "error", data: { message: "WebSocket authentication required" } }));
      socket.close(1008, "Authentication required");
      return;
    }
    clients.set(socket, user._id.toString());
    socket.send(JSON.stringify({
      type: "connection",
      data: { message: "NexusFlow WebSocket connected", connectedAt: new Date().toISOString() }
    }));

    socket.on("message", async (raw) => {
      try {
        const message = JSON.parse(raw.toString());
        if (message.type !== "telemetry") return;
        const packet = normalizeTelemetry(message.data);
        await onTelemetry?.(packet, user);
      } catch (error) {
        socket.send(JSON.stringify({ type: "error", data: { message: error.message || "Invalid WebSocket message" } }));
      }
    });
    socket.on("error", () => clients.delete(socket));
    socket.on("close", () => clients.delete(socket));
  });

  const broadcast = (payload, targetUserId = null) => {
    const message = JSON.stringify(payload);
    for (const [client, userId] of clients) {
      if (client.readyState === 1 && (!targetUserId || userId === targetUserId.toString())) client.send(message);
    }
  };

  return { wss, broadcast };
}

function normalizeTelemetry(input = {}) {
  const packet = {
    timestamp: new Date(),
    meta: { deviceId: input.deviceId || "turbine-01" },
    deviceId: input.deviceId || "turbine-01",
    temperature: Number(input.temperature),
    vibration: Number(input.vibration),
    pressure: Number(input.pressure)
  };
  if (!Number.isFinite(packet.temperature) || !Number.isFinite(packet.vibration) || !Number.isFinite(packet.pressure)) throw new Error("Telemetry values must be finite numbers.");
  return packet;
}
