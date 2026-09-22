import { useState } from 'react';
import { Settings, Copy, Trash2 } from 'lucide-react';
import { Node } from 'reactflow';

interface NodeConfig {
  [key: string]: any;
}

interface EnhancedNodeInspectorProps {
  node: Node;
  onUpdate?: (node: Node) => void;
  onDelete?: (nodeId: string) => void;
}

const configSchemas: Record<string, Array<{ key: string; label: string; type: string; options?: string[] }>> = {
  datasource: [
    { key: 'deviceId', label: 'Device ID', type: 'text' },
    { key: 'deviceName', label: 'Device Name', type: 'text' },
    { key: 'interval', label: 'Interval (ms)', type: 'number' },
    { key: 'unit', label: 'Unit', type: 'text' },
  ],
  filter: [
    { key: 'operator', label: 'Operator', type: 'select', options: ['>', '<', '>=', '<=', '==', '!='] },
    { key: 'threshold', label: 'Threshold Value', type: 'number' },
  ],
  transform: [
    { key: 'operation', label: 'Operation', type: 'select', options: ['multiply', 'divide', 'add', 'subtract', 'sqrt', 'abs'] },
    { key: 'value', label: 'Value', type: 'number' },
  ],
  aggregate: [
    { key: 'window', label: 'Window Size', type: 'number' },
    { key: 'type', label: 'Type', type: 'select', options: ['average', 'min', 'max', 'sum'] },
  ],
  trigger: [
    { key: 'type', label: 'Action Type', type: 'select', options: ['webhook', 'email', 'sms', 'log', 'websocket'] },
    { key: 'url', label: 'Webhook URL', type: 'text' },
    { key: 'message', label: 'Alert Message', type: 'text' },
  ],
};

export function EnhancedNodeInspector({ node, onUpdate, onDelete }: EnhancedNodeInspectorProps) {
  const [config, setConfig] = useState<NodeConfig>(node.data?.config || {});

  const schema = configSchemas[node.type || 'datasource'] || [];

  const handleConfigChange = (key: string, value: any) => {
    const updated = { ...config, [key]: value };
    setConfig(updated);
    if (onUpdate) {
      onUpdate({
        ...node,
        data: { ...node.data, config: updated },
      });
    }
  };

  const handleDuplicate = () => {
    const newNode = {
      ...node,
      id: `${node.id}-copy-${Date.now()}`,
      position: { x: node.position.x + 50, y: node.position.y + 50 },
    };
    if (onUpdate) {
      onUpdate(newNode);
    }
  };

  return (
    <div className="bg-white/95 rounded-2xl border border-indigo-100 p-8 shadow-lg shadow-indigo-100/60">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-2xl flex items-center gap-3">
          <Settings className="w-6 h-6 text-indigo-600" />
          Node Inspector
        </h3>
          <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-lg font-medium capitalize">
          {node.type}
        </span>
      </div>

      <div className="space-y-4">
        {/* Node ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
          <input
            type="text"
            value={node.id}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm font-mono"
          />
        </div>

        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
          <input
            type="text"
            defaultValue={node.data?.label}
            onChange={(e) => {
              if (onUpdate) {
                onUpdate({
                  ...node,
                  data: { ...node.data, label: e.target.value },
                });
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        {/* Position */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">X</label>
            <p className="text-sm font-mono text-gray-700">{node.position.x.toFixed(0)}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Y</label>
            <p className="text-sm font-mono text-gray-700">{node.position.y.toFixed(0)}</p>
          </div>
        </div>

        {/* Configuration */}
        {schema.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Configuration</h4>
            <div className="space-y-3">
              {schema.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={config[field.key] || ''}
                      onChange={(e) => handleConfigChange(field.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Select...</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={config[field.key] || ''}
                      onChange={(e) => handleConfigChange(field.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="border-t pt-4 flex gap-2">
          <button
            onClick={handleDuplicate}
            className="flex-1 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </button>
          <button
            onClick={() => onDelete?.(node.id)}
            className="flex-1 px-3 py-2 bg-rose-100 text-rose-700 rounded-xl hover:bg-rose-200 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
