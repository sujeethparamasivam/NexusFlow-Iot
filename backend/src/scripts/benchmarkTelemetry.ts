import { Telemetry } from '../models/Telemetry.js';

async function runBenchmark() {
  const writes = [1000, 5000, 10000];

  for (const count of writes) {
    const start = Date.now();
    let errors = 0;

    const payloads = Array.from({ length: count }, (_, index) => ({
      timestamp: new Date(Date.now() + index),
      deviceId: `benchmark-${(index % 4) + 1}`,
      deviceName: `Benchmark Device ${index % 4 + 1}`,
      metric: ['temperature', 'pressure', 'vibration'][index % 3],
      value: Number((50 + (index % 100) * 0.7).toFixed(2)),
      unit: '°C',
      metadata: { benchmark: true, source: 'benchmark' },
    }));

    try {
      await Telemetry.insertMany(payloads, { ordered: false });
    } catch (error) {
      errors += 1;
      console.error('Benchmark write error:', error);
    }

    const durationMs = Date.now() - start;
    const writesPerSecond = durationMs > 0 ? (count / durationMs) * 1000 : 0;

    console.log('Telemetry Performance Benchmark');
    console.log(`Writes: ${count}`);
    console.log(`Duration: ${durationMs} ms`);
    console.log(`Throughput: ${writesPerSecond.toFixed(2)} writes/sec`);
    console.log(`Errors: ${errors}`);
    console.log('---');
  }
}

runBenchmark().catch((error) => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
