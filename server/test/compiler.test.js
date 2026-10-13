import test from "node:test";
import assert from "node:assert/strict";
import { StreamCompiler } from "../src/compiler.js";

const sensor = { id: "sensor", type: "sensor", data: { deviceId: "test-turbine" } };
const edge = (source, target) => ({ id: `${source}-${target}`, source, target });
const packet = (temperature) => ({ deviceId: "test-turbine", temperature, vibration: 2, pressure: 110 });

test("rejects cycles and disconnected graph nodes", () => {
  const compiler = new StreamCompiler(() => {});
  assert.throws(() => compiler.compile({ nodes: [sensor, { id: "rule", type: "threshold", data: { threshold: 75, operator: ">" } }], edges: [edge("sensor", "rule"), edge("rule", "sensor")] }), /cycle/);
  assert.throws(() => compiler.compile({ nodes: [sensor, { id: "orphan", type: "movingAverage", data: { windowSize: 5 } }], edges: [] }), /connected/);
});

test("executes moving average and threshold nodes from graph data", async () => {
  const events = [];
  const compiler = new StreamCompiler((event) => events.push(event));
  compiler.compile({
    nodes: [sensor, { id: "average", type: "movingAverage", data: { windowSize: 2 } }, { id: "rule", type: "threshold", data: { threshold: 75, operator: ">=" } }],
    edges: [edge("sensor", "average"), edge("average", "rule")]
  });

  compiler.push(packet(70));
  compiler.push(packet(80));
  await new Promise((resolve) => setImmediate(resolve));

  const pipelineEvents = events.filter((event) => event.type === "pipeline");
  assert.equal(pipelineEvents.length, 2);
  assert.equal(pipelineEvents[0].data.temperature, 70);
  assert.equal(pipelineEvents[0].data.exceeded, false);
  assert.equal(pipelineEvents[1].data.temperature, 75);
  assert.equal(pipelineEvents[1].data.exceeded, true);
});

test("rejects invalid webhook configuration", () => {
  const compiler = new StreamCompiler(() => {});
  assert.throws(() => compiler.compile({
    nodes: [sensor, { id: "hook", type: "webhook", data: { url: "localhost:9000" } }],
    edges: [edge("sensor", "hook")]
  }), /HTTP or HTTPS URL/);
});