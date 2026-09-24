interface SidebarProps {
  onAddNode: (type: string) => void;
}

const nodeTypes = [
  { type: 'DataSource', icon: '📊', description: 'Sensor/Device Data' },
  { type: 'Filter', icon: '🔍', description: 'Data Filter' },
  { type: 'Transform', icon: '⚙️', description: 'Data Transform' },
  { type: 'Operation', icon: '🧮', description: 'Math Operation' },
  { type: 'Trigger', icon: '🚨', description: 'Alert/Trigger' },
];

export function Sidebar({ onAddNode }: SidebarProps) {
  return (
    <aside className="w-64 bg-gray-900 text-white p-6 overflow-y-auto border-r border-gray-700">
      <h2 className="text-lg font-bold mb-6">Node Library</h2>
      
      <div className="space-y-3">
        {nodeTypes.map((node) => (
          <button
            key={node.type}
            onClick={() => onAddNode(node.type)}
            className="w-full px-4 py-3 bg-gray-800 hover:bg-blue-600 rounded-lg text-left transition-colors flex items-center gap-2"
          >
            <span>{node.icon}</span>
            <div>
              <p className="font-medium">{node.type}</p>
              <p className="text-xs text-gray-400">{node.description}</p>
            </div>
          </button>
        ))}
      </div>

      <hr className="my-6 border-gray-700" />

      <div className="bg-blue-900 p-4 rounded-lg text-sm">
        <h3 className="font-bold mb-2">💡 Tip</h3>
        <p>Drag nodes from the library, connect them, and define logic to build your rule engine.</p>
      </div>
    </aside>
  );
}
