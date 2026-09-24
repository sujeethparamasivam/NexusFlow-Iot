import { describe, it, expect } from '@jest/globals';
import { Subject } from 'rxjs';
import { publishTelemetry, telemetryStream$ } from '../services/telemetryStream.js';
import { validateGraph, compileAndExecute, IGraph } from '../compiler/StreamCompiler.js';

function createGraph(): IGraph {
  return {
    name: 'Temperature alert',
    description: 'Alert when temp exceeds threshold',
    nodes: [
      { id: 'sensor-1', type: 'sensor', label: 'Sensor', config: { deviceId: 'turbine-01' } },
      { id: 'moving-1', type: 'movingAverage', label: 'Moving Average', config: { window: 3 } },
      { id: 'condition-1', type: 'condition', label: 'Condition', config: { operator: '>', threshold: 70 } },
      { id: 'alert-1', type: 'alert', label: 'Alert', config: { severity: 'critical' } },
    ],
    edges: [
      { id: 'e1', source: 'sensor-1', target: 'moving-1' },
      { id: 'e2', source: 'moving-1', target: 'condition-1' },
      { id: 'e3', source: 'condition-1', target: 'alert-1' },
    ],
  };
}

describe('NexusFlow core flow', () => {
  it('validates a graph structure', () => {
    const result = validateGraph(createGraph());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('publishes telemetry into the shared RxJS stream', () => {
    const values: any[] = [];
    const sub = telemetryStream$.subscribe((item) => values.push(item));
    publishTelemetry({
      timestamp: new Date(),
      deviceId: 'turbine-01',
      metric: 'temperature',
      value: 82,
      metadata: { source: 'test' },
    });

    expect(values.length).toBeGreaterThan(0);
    sub.unsubscribe();
  });

  it('compiles a graph and runs the telemetry pipeline', async () => {
    const source$ = new Subject<any>();
    const output: any[] = [];
    const graph = createGraph();

    const subscription = compileAndExecute(graph, source$).subscribe((value) => output.push(value));

    source$.next({ deviceId: 'turbine-01', metric: 'temperature', value: 70 });
    source$.next({ deviceId: 'turbine-01', metric: 'temperature', value: 75 });
    source$.next({ deviceId: 'turbine-01', metric: 'temperature', value: 82 });

    expect(output.length).toBeGreaterThan(0);
    subscription.unsubscribe();
  });
});
