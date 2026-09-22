import { useState } from 'react';
import { Plus } from 'lucide-react';

interface NodeTypes {
  [key: string]: {
    icon: string;
    color: string;
    description: string;
    config: Record<string, any>;
  };
}

const nodeTypes: NodeTypes = {
  datasource: {
    icon: '📊',
    color: 'bg-blue-500',
    description: 'Data Source / Sensor',
    config: { deviceId: '', interval: 1000 }
  },
  filter: {
    icon: '🔍',
    color: 'bg-green-500',
    description: 'Filter Data',
    config: { operator: '>', threshold: 0 }
  },
  transform: {
    icon: '⚙️',
    color: 'bg-purple-500',
    description: 'Transform / Map',
    config: { operation: 'multiply', value: 1 }
  },
  aggregate: {
    icon: '📈',
    color: 'bg-orange-500',
    description: 'Aggregate (Moving Average)',
    config: { window: 10 }
  },
  trigger: {
    icon: '🚨',
    color: 'bg-red-500',
    description: 'Alert / Trigger',
    config: { type: 'webhook', url: '' }
  },
};

interface EnhancedSidebarProps {
  onAddNode: (type: string) => void;
  onGenerateMockData: () => void;
}

export function EnhancedSidebar({ onAddNode, onGenerateMockData }: EnhancedSidebarProps) {
  const [activeTab, setActiveTab] = useState<'nodes' | 'tools' | 'help'>('nodes');

  return (
    <aside className="w-72 bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6 overflow-y-auto border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          NexusFlow
        </h2>
        <p className="text-xs text-gray-400 mt-1">IoT Rule Engine</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-700">
        {(['nodes', 'tools', 'help'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'nodes' && (
        <div className="space-y-3 flex-1">
          {Object.entries(nodeTypes).map(([type, { icon, description, color }]) => (
            <button
              key={type}
              onClick={() => onAddNode(type)}
              className={`w-full px-4 py-3 ${color} hover:opacity-90 rounded-lg text-left transition-all flex items-center gap-3 group`}
            >
              <span className="text-xl">{icon}</span>
              <div className="flex-1">
                <p className="font-medium text-white capitalize">{type}</p>
                <p className="text-xs text-white text-opacity-80">{description}</p>
              </div>
              <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      )}

      {activeTab === 'tools' && (
        <div className="space-y-3 flex-1">
          <button
            onClick={onGenerateMockData}
            className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90 rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <span>🎯</span>
            Start Backend Simulator
          </button>
          <div className="bg-gray-700 p-3 rounded-lg">
            <p className="text-xs text-gray-300">
              <strong>Tools:</strong>
              <br />• Save graph as JSON
              <br />• Load from JSON
              <br />• Clear canvas
              <br />• Export config
            </p>
          </div>
        </div>
      )}

      {activeTab === 'help' && (
        <div className="space-y-3 flex-1">
          <div className="bg-blue-900 bg-opacity-30 p-3 rounded-lg border border-blue-700">
            <h3 className="font-semibold text-blue-400 mb-2">📖 Getting Started</h3>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>1. Add nodes from the left panel</li>
              <li>2. Connect nodes by dragging edges</li>
              <li>3. Configure each node</li>
              <li>4. Click &quot;Activate Rule&quot; to start</li>
              <li>5. View live data in dashboard</li>
            </ul>
          </div>

          <div className="bg-green-900 bg-opacity-30 p-3 rounded-lg border border-green-700">
            <h3 className="font-semibold text-green-400 mb-2">🎯 Example Rule</h3>
            <p className="text-xs text-gray-300">
              Sensor → Filter (temp &gt; 80) → Alert
            </p>
          </div>

          <div className="bg-purple-900 bg-opacity-30 p-3 rounded-lg border border-purple-700">
            <h3 className="font-semibold text-purple-400 mb-2">⚡ Features</h3>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>✓ Real-time data streaming</li>
              <li>✓ Custom rule compilation</li>
              <li>✓ Live alerts</li>
              <li>✓ Time-series storage</li>
            </ul>
          </div>
        </div>
      )}

      <hr className="my-4 border-gray-700" />

      {/* Footer */}
      <div className="text-xs text-gray-500 text-center">
        <p>NexusFlow v1.0</p>
        <p>IoT Telemetry Engine</p>
      </div>
    </aside>
  );
}
