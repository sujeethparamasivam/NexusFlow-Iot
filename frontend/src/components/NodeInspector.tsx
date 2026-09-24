import { Node } from 'reactflow';

interface NodeInspectorProps {
  node: Node;
}

export function NodeInspector({ node }: NodeInspectorProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-y-auto max-h-96">
      <h3 className="font-bold text-lg mb-4">Node Inspector</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
          <input
            type="text"
            value={node.id}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
          <input
            type="text"
            defaultValue={node.data?.label}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
          <p className="text-sm text-gray-600">
            X: {node.position.x.toFixed(2)}, Y: {node.position.y.toFixed(2)}
          </p>
        </div>

        <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
          Delete Node
        </button>
      </div>
    </div>
  );
}
