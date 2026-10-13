export const defaultNodes = [
  {
    id: "sensor-1",
    type: "sensor",
    position: { x: 70, y: 170 },
    data: { label: "Turbine Sensor", deviceId: "turbine-01", metric: "temperature" }
  },
  {
    id: "avg-1",
    type: "movingAverage",
    position: { x: 350, y: 170 },
    data: { label: "Moving Average", windowSize: 5 }
  },
  {
    id: "threshold-1",
    type: "threshold",
    position: { x: 640, y: 170 },
    data: { label: "Temperature Rule", threshold: 75, operator: ">" }
  },
  {
    id: "sms-1",
    type: "smsAlert",
    position: { x: 920, y: 170 },
    data: { label: "SMS Alert", channel: "mock-sms", recipient: "" }
  }
];

export const defaultEdges = [
  { id: "e1", source: "sensor-1", target: "avg-1", animated: true },
  { id: "e2", source: "avg-1", target: "threshold-1", animated: true },
  { id: "e3", source: "threshold-1", target: "sms-1", animated: true }
];
