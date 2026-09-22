import { Edge, Node } from 'reactflow';

export const VALID_NODE_TYPES = ['datasource', 'filter', 'transform', 'aggregate', 'trigger'] as const;
export type ValidNodeType = (typeof VALID_NODE_TYPES)[number];

export interface GraphJsonExport {
  version: number;
  exportedAt: string;
  nodes: Node[];
  edges: Edge[];
}

export function validateImportedGraph(data: unknown):
  | { valid: true; nodes: Node[]; edges: Edge[] }
  | { valid: false; error: string } {
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

  const normalizedNodes: Node[] = [];

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

    if (!VALID_NODE_TYPES.includes(nodeType as ValidNodeType)) {
      return {
        valid: false,
        error: `Node "${nodeId}" has an unsupported type: "${nodeType}".`,
      };
    }

    const position =
      nodeRecord.position && typeof nodeRecord.position === 'object'
        ? (nodeRecord.position as Record<string, unknown>)
        : null;

    const normalizedNode: Node = {
      ...(node as Node),
      id: nodeId,
      type: nodeType,
      position: {
        x: Number(position?.x ?? 0),
        y: Number(position?.y ?? 0),
      },
      data: {
        ...(typeof (node as Node).data === 'object' && (node as Node).data ? ((node as Node).data as Record<string, unknown>) : {}),
        label: (nodeRecord.label as string) || (typeof (node as Record<string, unknown>).data === 'object' && (node as Record<string, unknown>).data && typeof ((node as Record<string, unknown>).data as Record<string, unknown>).label === 'string' ? String(((node as Record<string, unknown>).data as Record<string, unknown>).label) : nodeId),
        config:
          typeof (node as Record<string, unknown>).config === 'object' && (node as Record<string, unknown>).config
            ? ((node as Record<string, unknown>).config as Record<string, unknown>)
            : typeof ((node as Node).data as Record<string, unknown>)?.config === 'object' && ((node as Node).data as Record<string, unknown>)?.config
              ? (((node as Node).data as Record<string, unknown>).config as Record<string, unknown>)
              : {},
      },
    };

    normalizedNodes.push(normalizedNode);
  }

  const normalizedEdges: Edge[] = [];

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
      ...(edge as Edge),
      id: typeof edgeRecord.id === 'string' && edgeRecord.id.trim() ? edgeRecord.id : `edge-${index + 1}`,
      source,
      target,
    });
  }

  return { valid: true, nodes: normalizedNodes, edges: normalizedEdges };
}
