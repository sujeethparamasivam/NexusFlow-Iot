export interface ITelemetryData {
  deviceId: string;
  deviceName: string;
  value: number;
  unit: string;
  timestamp: Date;
}

export interface INode {
  id: string;
  type: 'datasource' | 'operation' | 'trigger' | 'filter' | 'transform';
  label: string;
  config: Record<string, any>;
}

export interface IEdge {
  id: string;
  source: string;
  target: string;
}

export interface IGraph {
  _id?: string;
  name: string;
  description: string;
  nodes: INode[];
  edges: IEdge[];
  isActive?: boolean;
}

export interface IAlert {
  id: string;
  graphId: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: Date;
  data?: Record<string, any>;
}
