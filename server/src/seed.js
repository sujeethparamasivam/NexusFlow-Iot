import { Workflow } from "./models/Workflow.js";

export async function seedWorkflow() {
  if (await Workflow.countDocuments()) return;

  await Workflow.create({
    name: "Turbine Overheat Protection",
    description: "Moving average temperature monitoring with critical SMS alerting.",
    active: true,
    nodes: [
      {
        id: "sensor-1",
        type: "sensor",
        position: { x: 60, y: 180 },
        data: { label: "Turbine Sensor", deviceId: "turbine-01", metric: "temperature" }
      },
      {
        id: "avg-1",
        type: "movingAverage",
        position: { x: 340, y: 180 },
        data: { label: "Moving Average", windowSize: 5 }
      },
      {
        id: "threshold-1",
        type: "threshold",
        position: { x: 620, y: 180 },
        data: { label: "Temperature Rule", threshold: 75, operator: ">" }
      },
      {
        id: "sms-1",
        type: "smsAlert",
        position: { x: 900, y: 180 },
        data: { label: "SMS Alert", channel: "mock-sms", recipient: "" }
      }
    ],
    edges: [
      { id: "e1", source: "sensor-1", target: "avg-1", animated: true },
      { id: "e2", source: "avg-1", target: "threshold-1", animated: true },
      { id: "e3", source: "threshold-1", target: "sms-1", animated: true }
    ]
  });
}
