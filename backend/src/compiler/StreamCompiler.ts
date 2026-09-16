import { Observable, merge, throwError } from 'rxjs';
import { filter, map, mergeMap, scan, tap } from 'rxjs/operators';
import { setupLogger } from '../config/logger.js';
import { telemetryStream$ } from '../services/telemetryStream.js';

const logger = setupLogger();

export type NodeType =
  | 'sensor'
  | 'movingAverage'
  | 'average'
  | 'minimum'
  | 'maximum'
  | 'math'
  | 'condition'
  | 'alert'
  | 'webhook'
  | 'sms'
  | 'log'
  | 'datasource'
  | 'operation'
  | 'trigger'
  | 'filter'
  | 'transform';

export interface INode {
  id: string;
  type: NodeType;
  label: string;
  config: Record<string, any>;
  position?: { x: number; y: number };
}

export interface IEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface IGraph {
  name: string;
  description?: string;
  nodes: INode[];
  edges: IEdge[];
}

export interface GraphValidationError {
  nodeId?: string;
  message: string;
}

export interface GraphValidationResult {
  valid: boolean;
  errors: GraphValidationError[];
}

type NodeHandler = (source$: Observable<any>, node: INode, context: StreamCompiler) => Observable<any>;

const validNodeTypes = new Set<NodeType>([
  'sensor',
  'movingAverage',
  'average',
  'minimum',
  'maximum',
  'math',
  'condition',
  'alert',
  'webhook',
  'sms',
  'log',
  'datasource',
  'operation',
  'trigger',
  'filter',
  'transform',
]);

export function validateGraph(graph: IGraph): GraphValidationResult {
  const errors: GraphValidationError[] = [];

  if (!graph) {
    return { valid: false, errors: [{ message: 'Graph is required' }] };
  }

  if (!graph.nodes || !Array.isArray(graph.nodes) || graph.nodes.length === 0) {
    errors.push({ message: 'Graph must contain at least one node' });
  }

  if (!graph.edges || !Array.isArray(graph.edges)) {
    errors.push({ message: 'Graph must contain a valid edges array' });
  }

  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();

  for (const node of graph.nodes ?? []) {
    if (!node?.id) {
      errors.push({ message: 'Node missing id' });
      continue;
    }

    if (nodeIds.has(node.id)) {
      errors.push({ nodeId: node.id, message: 'Duplicate node id' });
    }
    nodeIds.add(node.id);

    if (!validNodeTypes.has(node.type as NodeType)) {
      errors.push({ nodeId: node.id, message: `Invalid node type: ${String(node.type)}` });
    }

    if ((node.type === 'condition' || node.type === 'filter') && (node.config?.threshold === undefined || node.config?.threshold === null)) {
      errors.push({ nodeId: node.id, message: 'Condition node requires a threshold' });
    }

    if ((node.type === 'movingAverage' || node.type === 'average') && (!Number.isFinite(Number(node.config?.window)) || Number(node.config?.window) <= 0)) {
      errors.push({ nodeId: node.id, message: 'Moving average window must be greater than zero' });
    }

    if (node.type === 'math' && !['ADD', 'SUBTRACT', 'MULTIPLY', 'DIVIDE'].includes(String(node.config?.operation ?? '').toUpperCase())) {
      errors.push({ nodeId: node.id, message: 'Math node requires a valid operation' });
    }

    if (node.type === 'webhook' && !/^https?:\/\//i.test(String(node.config?.url ?? ''))) {
      errors.push({ nodeId: node.id, message: 'Webhook node requires a valid URL' });
    }
  }

  for (const edge of graph.edges ?? []) {
    if (!edge?.id) {
      errors.push({ message: 'Edge missing id' });
      continue;
    }

    if (edgeIds.has(edge.id)) {
      errors.push({ nodeId: edge.source, message: `Duplicate edge id: ${edge.id}` });
    }
    edgeIds.add(edge.id);

    if (!edge.source || !edge.target) {
      errors.push({ message: `Invalid edge ${edge.id}: source and target are required` });
      continue;
    }

    if (!nodeIds.has(edge.source)) {
      errors.push({ nodeId: edge.source, message: `Edge references missing source node: ${edge.source}` });
    }

    if (!nodeIds.has(edge.target)) {
      errors.push({ nodeId: edge.target, message: `Edge references missing target node: ${edge.target}` });
    }
  }

  const incoming = new Set<string>();
  for (const edge of graph.edges ?? []) {
    if (edge?.target) incoming.add(edge.target);
  }

  const hasRoot = (graph.nodes ?? []).some((node) => !incoming.has(node.id));
  if (!hasRoot) {
    errors.push({ message: 'Graph must contain at least one root data source node' });
  }

  return { valid: errors.length === 0, errors };
}

export class StreamCompiler {
  private readonly nodeMap = new Map<string, INode>();
  private readonly edgeMap = new Map<string, IEdge[]>();

  constructor(private readonly graph: IGraph) {
    this.parseGraph(graph);
  }

  private parseGraph(graph: IGraph): void {
    for (const node of graph.nodes ?? []) {
      this.nodeMap.set(node.id, node);
    }

    for (const edge of graph.edges ?? []) {
      const next = this.edgeMap.get(edge.source) ?? [];
      next.push(edge);
      this.edgeMap.set(edge.source, next);
    }
  }

  compile(sourceData?: Observable<any>): Observable<any> {
    const validation = validateGraph(this.graph);
    if (!validation.valid) {
      return throwError(() => new Error(validation.errors.map((e) => e.message).join('; ')));
    }

    const roots = this.findRootNodes();
    if (roots.length === 0) {
      return throwError(() => new Error('No root nodes found in graph'));
    }

    const source$ = sourceData ?? telemetryStream$;

    const pipelines = roots.map((node) => this.buildPipeline(node.id, source$));
    return pipelines.length === 1 ? pipelines[0] : merge(...pipelines);
  }

  private buildPipeline(nodeId: string, source$: Observable<any>): Observable<any> {
    const node = this.nodeMap.get(nodeId);
    if (!node) {
      return throwError(() => new Error(`Node ${nodeId} not found`));
    }

    const mapped$ = this.applyNodeHandlers(node, source$);
    const childEdges = this.edgeMap.get(nodeId) ?? [];

    if (childEdges.length === 0) {
      return mapped$;
    }

    const nextPipelines = childEdges.map((edge) => this.buildPipeline(edge.target, mapped$));
    return nextPipelines.length === 1 ? nextPipelines[0] : merge(...nextPipelines);
  }

  private findRootNodes(): INode[] {
    const incoming = new Set<string>();
    for (const edges of this.edgeMap.values()) {
      for (const edge of edges) {
        incoming.add(edge.target);
      }
    }

    return Array.from(this.nodeMap.values()).filter((node) => !incoming.has(node.id));
  }

  private applyNodeHandlers(node: INode, source$: Observable<any>): Observable<any> {
    const handlers: Record<string, NodeHandler> = {
      sensor: (obs) => obs.pipe(map((data) => ({ ...data, nodeId: node.id, nodeType: node.type, label: node.label, source: 'sensor' }))),
      datasource: (obs) => obs.pipe(map((data) => ({ ...data, nodeId: node.id, nodeType: node.type, label: node.label }))),
      movingAverage: (obs) => this.movingAverageHandler(obs, node),
      average: (obs) => this.averageHandler(obs, node),
      minimum: (obs) => this.minMaxHandler(obs, node, 'min'),
      maximum: (obs) => this.minMaxHandler(obs, node, 'max'),
      math: (obs) => this.mathHandler(obs, node),
      condition: (obs) => this.conditionHandler(obs, node),
      alert: (obs) => this.alertHandler(obs, node),
      webhook: (obs) => this.webhookHandler(obs, node),
      sms: (obs) => this.smsHandler(obs, node),
      log: (obs) => this.logHandler(obs, node),
      filter: (obs) => this.conditionHandler(obs, node),
      transform: (obs) => this.mathHandler(obs, node),
      operation: (obs) => this.mathHandler(obs, node),
      trigger: (obs) => this.alertHandler(obs, node),
    };

    const handler = handlers[node.type] ?? handlers.sensor;
    return handler(source$, node, this);
  }

  private movingAverageHandler(source$: Observable<any>, node: INode): Observable<any> {
    const window = Math.max(1, Number(node.config?.window ?? 5));

    return source$.pipe(
      scan((acc: number[], value) => {
        const currentValue = Number((value && value.value !== undefined ? value.value : value) ?? 0);
        const next = [...acc, currentValue];
        if (next.length > window) next.shift();
        return next;
      }, [] as number[]),
      filter((values) => values.length === window),
      map((values) => {
        const average = values.reduce((total, item) => total + item, 0) / values.length;
        return {
          nodeId: node.id,
          value: Number(average.toFixed(4)),
          average,
          metric: 'movingAverage',
          timestamp: new Date(),
        };
      })
    );
  }

  private averageHandler(source$: Observable<any>, node: INode): Observable<any> {
    return this.movingAverageHandler(source$, node).pipe(map((payload) => ({ ...payload, nodeType: node.type })));
  }

  private minMaxHandler(source$: Observable<any>, node: INode, mode: 'min' | 'max'): Observable<any> {
    const window = Math.max(1, Number(node.config?.window ?? 3));

    return source$.pipe(
      scan((acc: number[], value) => {
        const currentValue = Number((value && value.value !== undefined ? value.value : value) ?? 0);
        const next = [...acc, currentValue];
        if (next.length > window) next.shift();
        return next;
      }, [] as number[]),
      filter((values) => values.length === window),
      map((values) => ({
        nodeId: node.id,
        value: mode === 'min' ? Math.min(...values) : Math.max(...values),
        metric: mode,
        timestamp: new Date(),
      }))
    );
  }

  private mathHandler(source$: Observable<any>, node: INode): Observable<any> {
    const operation = String(node.config?.operation ?? 'MULTIPLY').toUpperCase();
    const factor = Number(node.config?.value ?? 1);

    return source$.pipe(
      map((data) => {
        const currentValue = Number(data?.value ?? data ?? 0);
        const nextValue = (() => {
          switch (operation) {
            case 'ADD':
              return currentValue + factor;
            case 'SUBTRACT':
              return currentValue - factor;
            case 'MULTIPLY':
              return currentValue * factor;
            case 'DIVIDE':
              if (factor === 0) throw new Error('Division by zero is not allowed');
              return currentValue / factor;
            default:
              return currentValue;
          }
        })();

        return { ...data, nodeId: node.id, value: Number(nextValue.toFixed(4)), metric: data?.metric ?? 'math' };
      })
    );
  }

  private conditionHandler(source$: Observable<any>, node: INode): Observable<any> {
    const operator = String(node.config?.operator ?? '>');
    const threshold = Number(node.config?.threshold ?? 0);

    return source$.pipe(
      filter((data) => {
        const currentValue = Number(data?.value ?? data ?? 0);
        switch (operator) {
          case '>': return currentValue > threshold;
          case '<': return currentValue < threshold;
          case '>=': return currentValue >= threshold;
          case '<=': return currentValue <= threshold;
          case '==': return currentValue === threshold;
          case '!=': return currentValue !== threshold;
          default: return true;
        }
      }),
      map((data) => ({ ...data, nodeId: node.id, condition: operator, threshold, passed: true }))
    );
  }

  private alertHandler(source$: Observable<any>, node: INode): Observable<any> {
    return source$.pipe(
      tap((data) => {
        logger.info(`Alert node ${node.id} triggered`, { nodeId: node.id, data });
      }),
      map((data) => ({ ...data, nodeId: node.id, alert: true, severity: node.config?.severity ?? 'warning' }))
    );
  }

  private webhookHandler(source$: Observable<any>, node: INode): Observable<any> {
    const url = String(node.config?.url ?? '');

    return source$.pipe(
      mergeMap(async (data) => {
        if (!/^https?:\/\//i.test(url)) {
          throw new Error('Invalid webhook URL');
        }

        const payload = {
          event: 'rule.triggered',
          ruleId: node.config?.ruleId ?? 'unknown',
          deviceId: data?.deviceId ?? 'unknown',
          metric: data?.metric ?? 'value',
          value: data?.value ?? 0,
          threshold: node.config?.threshold ?? 0,
          severity: node.config?.severity ?? 'warning',
          timestamp: new Date().toISOString(),
        };

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2500);

        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new Error(`Webhook returned ${response.status}`);
          }

          return { ...data, webhook: true, webhookStatus: 'sent' };
        } finally {
          clearTimeout(timer);
        }
      })
    );
  }

  private smsHandler(source$: Observable<any>, node: INode): Observable<any> {
    return source$.pipe(
      tap((data) => {
        logger.info(`MOCK SMS SENT: ${node.config?.to ?? 'Factory Manager'} | ${node.config?.message ?? 'Critical alert'}`, data);
      }),
      map((data) => ({ ...data, nodeId: node.id, sms: true, state: 'mock-delivered' }))
    );
  }

  private logHandler(source$: Observable<any>, node: INode): Observable<any> {
    return source$.pipe(
      tap((data) => logger.info(`LOG: ${node.label}`, data)),
      map((data) => ({ ...data, nodeId: node.id, logged: true }))
    );
  }
}

export function compileAndExecute(graph: IGraph, dataSource?: Observable<any>): Observable<any> {
  const compiler = new StreamCompiler(graph);
  return compiler.compile(dataSource);
}
