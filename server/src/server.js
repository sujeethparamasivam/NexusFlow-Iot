import express from "express";
import cors from "cors";
import http from "http";
import { config } from "./config.js";
import { connectDatabase } from "./db.js";
import { createWebSocketServer } from "./ws.js";
import { createRoutes } from "./routes.js";
import { StreamCompiler } from "./compiler.js";
import { seedWorkflow } from "./seed.js";
import { Workflow } from "./models/Workflow.js";
import { createAuthRoutes } from "./authRoutes.js";
import { User } from "./models/User.js";
import { telemetryCollection } from "./db.js";

await connectDatabase();
const legacyUsers = await User.collection.find({
  telegramChatId: { $exists: false },
  "notifications.telegramChatId": { $exists: true }
}).toArray();
for (const user of legacyUsers) {
  await User.collection.updateOne(
    { _id: user._id },
    { $set: { telegramChatId: user.notifications.telegramChatId }, $unset: { notifications: "" } }
  );
}
await seedWorkflow();

const activeWorkflow = await Workflow.findOne({ active: true });
if (activeWorkflow) {
  activeWorkflow.nodes = activeWorkflow.nodes.map((node) => {
    if (node.type !== "smsAlert" && node.type !== "action") return node;
    return {
      ...node.toObject(),
      type: node.type === "action" ? "smsAlert" : node.type,
      data: {
        ...node.data,
        channel: node.data?.channel === "twilio-sms"
          ? (/^\+[1-9]\d{7,14}$/.test(String(node.data?.recipient || "")) ? "twilio-sms" : "mock-sms")
          : (node.data?.channel || "mock-sms"),
        recipient: node.data?.recipient || ""
      }
    };
  });
  await activeWorkflow.save();
}

const app = express();
const server = http.createServer(app);
const { broadcast } = createWebSocketServer(server, {
  onTelemetry: async (packet, user) => {
    await telemetryCollection().insertOne(packet);
    compiler.push(packet, user);
  }
});
const compiler = new StreamCompiler(broadcast);
const compiledWorkflow = await Workflow.findOne({ active: true }).lean();
if (compiledWorkflow) compiler.compile({ ...compiledWorkflow, workflowId: compiledWorkflow._id });

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = new Set([...config.clientUrls, "http://localhost:5173", "http://localhost:5174"]);
    if (allowed.has(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true
}));
app.use(express.json({ limit: "2mb" }));
app.get("/", (req, res) => res.json({ name: "NexusFlow", status: "online" }));
app.use("/api/auth", createAuthRoutes());
app.use("/api", createRoutes(compiler));

server.listen(config.port, () => {
  console.log(`NexusFlow API running on http://localhost:${config.port}`);
  console.log(`WebSocket running on ws://localhost:${config.port}/ws`);
});
