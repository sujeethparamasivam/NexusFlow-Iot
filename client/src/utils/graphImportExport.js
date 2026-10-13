export const VALID_NODE_TYPES = ["sensor", "movingAverage", "threshold", "smsAlert", "webhook"];

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function validateImportedGraph(data) {
  if (!isRecord(data)) {
    return { valid: false, error: "Graph JSON must be a valid object." };
  }

  if (!Array.isArray(data.nodes)) {
    return { valid: false, error: 'Graph JSON must include a valid "nodes" array.' };
  }

  if (!Array.isArray(data.edges)) {
    return { valid: false, error: 'Graph JSON must include a valid "edges" array.' };
  }

  const nodeIds = new Set();
  const nodes = [];

  for (const [index, node] of data.nodes.entries()) {
    if (!isRecord(node)) {
      return { valid: false, error: `Node at index ${index} is not a valid object.` };
    }

    const id = typeof node.id === "string" ? node.id.trim() : "";
    if (!id) {
      return { valid: false, error: `Node at index ${index} is missing a valid id.` };
    }
    if (nodeIds.has(id)) {
      return { valid: false, error: `Node id "${id}" is used more than once.` };
    }
    if (!VALID_NODE_TYPES.includes(node.type)) {
      return { valid: false, error: `Node "${id}" has an unsupported type: "${node.type || ""}".` };
    }
    if (node.data !== undefined && !isRecord(node.data)) {
      return { valid: false, error: `Node "${id}" must include a valid data object.` };
    }

    const data = { ...(node.data || {}) };
    if (typeof data.label !== "string") data.label = id;
    if (node.type === "sensor") {
      data.deviceId ??= "turbine-01";
      data.metric ??= "temperature";
    } else if (node.type === "movingAverage") {
      data.windowSize ??= 5;
      data.windowSize = Number(data.windowSize);
      if (!Number.isFinite(data.windowSize) || data.windowSize < 1) {
        return { valid: false, error: `Node "${id}" has an invalid moving average window.` };
      }
    } else if (node.type === "threshold") {
      data.threshold ??= 75;
      data.threshold = Number(data.threshold);
      if (!Number.isFinite(data.threshold)) {
        return { valid: false, error: `Node "${id}" has an invalid threshold.` };
      }
      data.operator ??= ">";
      if (!["<", "<=", ">", ">=", "="].includes(data.operator)) {
        return { valid: false, error: `Node "${id}" has an unsupported threshold operator.` };
      }
    } else if (node.type === "smsAlert") {
      data.channel ??= "mock-sms";
      data.recipient ??= "";
    } else if (node.type === "webhook") {
      data.channel ??= "webhook";
      data.url ??= "";
    }

    if (node.position !== undefined && !isRecord(node.position)) {
      return { valid: false, error: `Node "${id}" has an invalid position.` };
    }
    const position = node.position || {};
    const x = position.x === undefined ? 0 : Number(position.x);
    const y = position.y === undefined ? 0 : Number(position.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return { valid: false, error: `Node "${id}" has an invalid position.` };
    }

    nodeIds.add(id);
    nodes.push({
      ...node,
      id,
      position: { ...position, x, y },
      data
    });
  }

  const edgeIds = new Set();
  const edges = [];

  for (const [index, edge] of data.edges.entries()) {
    if (!isRecord(edge)) {
      return { valid: false, error: `Edge at index ${index} is not a valid object.` };
    }

    const source = typeof edge.source === "string" ? edge.source.trim() : "";
    const target = typeof edge.target === "string" ? edge.target.trim() : "";
    if (!source || !target) {
      return { valid: false, error: `Edge at index ${index} is missing a valid source or target.` };
    }
    if (!nodeIds.has(source) || !nodeIds.has(target)) {
      return { valid: false, error: `Edge at index ${index} references a node that does not exist.` };
    }

    const id = typeof edge.id === "string" && edge.id.trim() ? edge.id.trim() : `edge-${index + 1}`;
    if (edgeIds.has(id)) {
      return { valid: false, error: `Edge id "${id}" is used more than once.` };
    }
    edgeIds.add(id);
    edges.push({ ...edge, id, source, target });
  }

  return { valid: true, nodes, edges };
}
