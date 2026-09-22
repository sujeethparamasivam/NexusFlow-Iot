export const VALID_NODE_TYPES = ['datasource', 'filter', 'transform', 'aggregate', 'trigger'];

export type ImportedGraphNode = {
  id: string;
  type: string;
  label?: string;
  position?: { x?: number; y?: number };
  data?: Record<string, any>;
  config?: Record<string, any>;
  [key: string]: any;
};

export type ImportedGraphEdge = {
  id?: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  [key: string]: any;
};

export function validateImportedGraph(data: unknown): {
  valid: boolean;
  error?: string;
  nodes?: ImportedGraphNode[];
  edges?: ImportedGraphEdge[];
} {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Graph JSON must be a valid object.' };
  }

  const graph = data as Record<string, unknown>;

  if (!Array.isArray(graph.nodes)) {
    return { valid: false, error: 'Graph JSON must include a valid "nodes" array.' };
  }

  if (!Array.isArray(graph.edges)) {
    return { valid: false, error: 'Graph JSON must include a valid "edges" array.' };
  }

  const normalizedNodes: ImportedGraphNode[] = [];

  for (const [index, node] of graph.nodes.entries()) {
    if (!node || typeof node !== 'object') {
      return { valid: false, error: `Node at index ${index} is not a valid object.` };
    }

    const nodeRecord = node as Record<string, unknown>;
    const nodeId = typeof nodeRecord.id === 'string' ? nodeRecord.id.trim() : '';
    const nodeType = typeof nodeRecord.type === 'string' ? nodeRecord.type : '';

    if (!nodeId) {
      return { valid: false, error: `Node at index ${index} is missing a valid id.` };
    }

    if (!VALID_NODE_TYPES.includes(nodeType)) {
      return {
        valid: false,
        error: `Node "${nodeId}" has an unsupported type: "${nodeType}".`,
      };
    }

    const position = nodeRecord.position && typeof nodeRecord.position === 'object' ? nodeRecord.position as Record<string, unknown> : null;

    const normalizedNode: ImportedGraphNode = {
      ...nodeRecord,
      id: nodeId,
      type: nodeType,
      position: {
        x: Number(position?.x ?? 0),
        y: Number(position?.y ?? 0),
      },
      data: {
        ...(typeof nodeRecord.data === 'object' && nodeRecord.data ? (nodeRecord.data as Record<string, unknown>) : {}),
        label:
          typeof nodeRecord.label === 'string'
            ? nodeRecord.label
            : typeof nodeRecord.data === 'object' && nodeRecord.data && typeof (nodeRecord.data as Record<string, unknown>).label === 'string'
              ? String((nodeRecord.data as Record<string, unknown>).label)
              : nodeId,
        config:
          typeof nodeRecord.config === 'object' && nodeRecord.config
            ? (nodeRecord.config as Record<string, unknown>)
            : typeof nodeRecord.data === 'object' && nodeRecord.data && typeof (nodeRecord.data as Record<string, unknown>).config === 'object' && (nodeRecord.data as Record<string, unknown>).config
              ? ((nodeRecord.data as Record<string, unknown>).config as Record<string, unknown>)
              : {},
      },
    };

    normalizedNodes.push(normalizedNode);
  }

  const normalizedEdges: ImportedGraphEdge[] = [];

  for (const [index, edge] of graph.edges.entries()) {
    if (!edge || typeof edge !== 'object') {
      return { valid: false, error: `Edge at index ${index} is not a valid object.` };
    }

    const edgeRecord = edge as Record<string, unknown>;
    const source = typeof edgeRecord.source === 'string' ? edgeRecord.source.trim() : '';
    const target = typeof edgeRecord.target === 'string' ? edgeRecord.target.trim() : '';

    if (!source) {
      return { valid: false, error: `Edge at index ${index} is missing a valid source.` };
    }

    if (!target) {
      return { valid: false, error: `Edge at index ${index} is missing a valid target.` };
    }

    normalizedEdges.push({
      ...edgeRecord,
      id: typeof edgeRecord.id === 'string' && edgeRecord.id.trim() ? edgeRecord.id : `edge-${index + 1}`,
      source,
      target,
    });
  }

  return { valid: true, nodes: normalizedNodes, edges: normalizedEdges };
}
