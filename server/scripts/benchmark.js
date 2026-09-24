import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { config } from "../src/config.js";

const apiUrl = process.env.API_URL || "http://localhost:5000/api/telemetry/ingest/batch";
const authUrl = process.env.AUTH_URL || "http://localhost:5000/api/auth";
const count = Number(process.env.COUNT || 5000);
const concurrency = Math.max(1, Number(process.env.CONCURRENCY || 5));
const batchSize = Math.max(1, Math.min(1000, Number(process.env.BATCH_SIZE || 1000)));
const target = Number(process.env.TARGET || 5000);
const reportPath = path.resolve(process.env.REPORT_PATH || fileURLToPath(new URL("../docs/performance-benchmark.json", import.meta.url)));
const deviceId = `benchmark-turbine-${Date.now()}`;

async function getBenchmarkToken() {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = process.env.BENCHMARK_EMAIL || `benchmark-${suffix}@example.invalid`;
  const password = process.env.BENCHMARK_PASSWORD || `Benchmark-${suffix}-Pass!`;
  const response = await fetch(`${authUrl}/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Performance Benchmark", email, password, telegramChatId: "0" })
  });
  if (!response.ok) throw new Error(`Benchmark authentication failed with ${response.status}`);
  return (await response.json()).token;
}

async function ingestBatch(startIndex, token) {
  const packets = Array.from({ length: Math.min(batchSize, count - startIndex) }, (_, offset) => {
    const index = startIndex + offset;
    return {
      deviceId,
      temperature: 70 + (index % 30),
      vibration: 2 + (index % 4) / 10,
      pressure: 110 + (index % 8)
    };
  });
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(packets)
  });
  if (!response.ok) throw new Error(`Batch starting at ${startIndex} failed with ${response.status}`);
  return packets.length;
}

async function getTelemetryStats() {
  await mongoose.connect(config.mongoUri, { dbName: config.dbName, serverSelectionTimeoutMS: 10000 });
  try {
    const db = mongoose.connection.db;
    const collection = db.collection("telemetry");
    const persistedRecords = await collection.countDocuments({ deviceId });
    const stats = await db.command({ collStats: "telemetry" });
    const collectionInfo = (await db.listCollections({ name: "telemetry" }).toArray())[0];
    const timeSeries = collectionInfo?.options?.timeseries;
    return {
      persistedRecords,
      logicalBytes: Number(stats.size ?? 0),
      storageBytes: Number(stats.storageSize ?? stats.size ?? 0),
      timeSeries: Boolean(timeSeries && timeSeries.timeField === "timestamp" && timeSeries.metaField === "meta")
    };
  } finally {
    await mongoose.disconnect();
  }
}

async function saveReport(result) {
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  let history = [];
  try {
    const previous = JSON.parse(await fs.readFile(reportPath, "utf8"));
    history = Array.isArray(previous.history) ? previous.history : [];
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  history.push(result);
  const recentHistory = history.slice(-20);
  const throughputs = recentHistory.map((entry) => entry.throughputRecordsPerSecond);
  const summary = {
    runs: recentHistory.length,
    latestResult: recentHistory.at(-1),
    targetRecordsPerSecond: recentHistory.at(-1).targetRecordsPerSecond,
    averageThroughputRecordsPerSecond: Number((throughputs.reduce((sum, value) => sum + value, 0) / throughputs.length).toFixed(2)),
    minimumThroughputRecordsPerSecond: Math.min(...throughputs),
    maximumThroughputRecordsPerSecond: Math.max(...throughputs),
    bestResult: recentHistory.reduce((best, entry) => entry.throughputRecordsPerSecond > best.throughputRecordsPerSecond ? entry : best)
  };
  await fs.writeFile(reportPath, JSON.stringify({ summary, history: recentHistory }, null, 2));
}

const token = await getBenchmarkToken();
const storageBefore = await getTelemetryStats();
const startedAtIso = new Date().toISOString();
const startedAt = performance.now();
const memoryBefore = process.memoryUsage().rss;
let completed = 0;
for (let offset = 0; offset < count; offset += batchSize * concurrency) {
  const batch = Array.from({ length: Math.min(concurrency, Math.ceil((count - offset) / batchSize)) }, (_, index) => ingestBatch(offset + index * batchSize, token));
  const inserted = await Promise.all(batch);
  completed += inserted.reduce((sum, value) => sum + value, 0);
  if (completed === count || completed % (batchSize * concurrency * 10) === 0) {
    process.stdout.write(`\rCompleted ${completed}/${count}`);
  }
}

const elapsedSeconds = (performance.now() - startedAt) / 1000;
const endedAtIso = new Date().toISOString();
const memoryAfter = process.memoryUsage().rss;
const storageAfter = await getTelemetryStats();
const throughput = completed / elapsedSeconds;
const storageIncrease = storageAfter.storageBytes - storageBefore.storageBytes;
const logicalIncrease = storageAfter.logicalBytes - storageBefore.logicalBytes;
const result = {
  measuredAt: endedAtIso,
  startTime: startedAtIso,
  endTime: endedAtIso,
  nodeVersion: process.version,
  platform: `${os.platform()} ${os.arch()}`,
  mongoEnvironment: process.env.MONGO_URI ? "Configured MongoDB URI" : "Default local MongoDB",
  totalRecords: completed,
  batchSize,
  requests: Math.ceil(completed / batchSize),
  concurrency,
  durationMs: Number((elapsedSeconds * 1000).toFixed(2)),
  throughputRecordsPerSecond: Number(throughput.toFixed(2)),
  storageBeforeBytes: storageBefore.storageBytes,
  storageAfterBytes: storageAfter.storageBytes,
  storageIncreaseBytes: storageIncrease,
  approximateBytesPerRecord: completed ? Number((storageIncrease / completed).toFixed(2)) : 0,
  logicalSizeBeforeBytes: storageBefore.logicalBytes,
  logicalSizeAfterBytes: storageAfter.logicalBytes,
  logicalSizeIncreaseBytes: logicalIncrease,
  approximateLogicalBytesPerRecord: completed ? Number((logicalIncrease / completed).toFixed(2)) : 0,
  storageStatus: storageAfter.timeSeries && storageIncrease >= 0 ? "INFO" : "FAIL",
  persistedRecords: storageAfter.persistedRecords,
  targetRecordsPerSecond: target,
  memoryRssDeltaMb: Number(((memoryAfter - memoryBefore) / 1024 / 1024).toFixed(2)),
  mongodbTimeSeries: storageAfter.timeSeries && storageAfter.persistedRecords === completed,
  result: completed === count && storageAfter.persistedRecords === completed && throughput >= target ? "PASS" : "FAIL"
};
await saveReport(result);
console.log("\nNexusFlow Telemetry Performance Benchmark");
console.log("-----------------------------------------");
console.log(`Total records: ${result.totalRecords}`);
console.log(`Persisted records: ${result.persistedRecords}`);
console.log(`Batch size: ${result.batchSize}`);
console.log(`Requests: ${result.requests}`);
console.log(`Concurrency: ${result.concurrency}`);
console.log(`Duration: ${result.durationMs} ms`);
console.log(`Throughput: ${result.throughputRecordsPerSecond} records/sec`);
console.log(`Storage before: ${result.storageBeforeBytes} bytes`);
console.log(`Storage after: ${result.storageAfterBytes} bytes`);
console.log(`Storage increase: ${result.storageIncreaseBytes} bytes`);
console.log(`Approx. bytes/record: ${result.approximateBytesPerRecord} bytes`);
console.log(`Logical size increase: ${result.logicalSizeIncreaseBytes} bytes`);
console.log(`Approx. logical bytes/record: ${result.approximateLogicalBytesPerRecord} bytes`);
console.log(`MongoDB Time-Series: ${result.mongodbTimeSeries ? "PASS" : "FAIL"}`);
console.log(`Target: ${result.targetRecordsPerSecond} records/sec`);
console.log(`Result: ${result.result}`);
console.log(`Report: ${reportPath}`);
