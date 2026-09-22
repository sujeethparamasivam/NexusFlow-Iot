import { useCallback, useState, useEffect, useRef } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  addEdge, 
  Connection,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { EnhancedSidebar } from './components/EnhancedSidebar';
import { EnhancedNodeInspector } from './components/EnhancedNodeInspector';
import { EnhancedDashboard } from './components/EnhancedDashboard';
import { useGraphStore } from './store/graphStore';
import { Save, Play, Square, Download, Upload } from 'lucide-react';
import glowingStyles from './styles/glowingEffects';
import { graphService } from './services/graphService';
import { validateImportedGraph } from './utils/graphImportExport';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isRuleActive, setIsRuleActive] = useState(false);
  const [savedGraphId, setSavedGraphId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { saveGraph } = useGraphStore();

  // Inject glowing styles
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = glowingStyles;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) => addEdge({ ...connection, animated: true }, eds)),
    [setEdges]
  );

  const handleAddNode = (nodeType: string) => {
    const newNode: Node = {
      id: `${nodeType}-${nodes.length + 1}-${Date.now()}`,
      data: { label: nodeType.charAt(0).toUpperCase() + nodeType.slice(1), config: {} },
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      type: nodeType,
      className: nodeType, // Add node type for styling
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleSaveGraph = async () => {
    const graphData = {
      name: `Rule-${Date.now()}`,
      description: 'Auto-generated rule from canvas',
      nodes: nodes.map(n => ({
        id: n.id,
        type: (n.type || 'datasource') as any,
        label: n.data?.label || '',
        config: n.data?.config || {},
        position: n.position,
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      })),
    };

    try {
      const savedGraph = await graphService.createGraph(graphData as any);
      setSavedGraphId(savedGraph?._id ?? `rule-${Date.now()}`);
      await saveGraph(graphData as any);
      alert('Graph saved successfully!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save graph');
    }
  };

  const handleActivateRule = async () => {
    if (nodes.length === 0) {
      alert('Please add nodes to your graph first');
      return;
    }

    const graphId = savedGraphId ?? `rule-${Date.now()}`;
    const graphData = {
      name: `Rule-${Date.now()}`,
      description: 'Live rule from canvas',
      nodes: nodes.map(n => ({
        id: n.id,
        type: (n.type || 'datasource') as any,
        label: n.data?.label || '',
        config: n.data?.config || {},
        position: n.position,
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      })),
    };

    try {
      const response = await fetch(`/api/rules/${graphId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graph: graphData }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to activate rule');
      }

      setIsRuleActive(true);
      setNodes((nds) => nds.map((node) => ({ ...node, className: 'processing' })));
      setEdges((eds) => eds.map((edge) => ({ ...edge, animated: true, className: 'active-edge' })));
      alert('Rule activated! Monitoring backend telemetry...');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to activate rule');
    }
  };

  const handleDeactivateRule = async () => {
    const graphId = savedGraphId ?? `rule-${Date.now()}`;

    try {
      const response = await fetch(`/api/rules/${graphId}/deactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to deactivate rule');
      }

      setIsRuleActive(false);
      setNodes((nds) => nds.map((node) => ({ ...node, className: '' })));
      setEdges((eds) => eds.map((edge) => ({ ...edge, animated: false, className: '' })));
      alert('Rule deactivated');
    } catch (error) {
      setIsRuleActive(false);
      alert(error instanceof Error ? error.message : 'Failed to deactivate rule');
    }
  };

  const handleGenerateMockData = async () => {
    try {
      const response = await fetch('/api/simulator/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervalMs: 1500 }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to start backend simulator');
      }

      alert('Backend simulator started. Real telemetry is now flowing.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to start backend simulator');
    }
  };

  const handleExportGraph = () => {
    const graphData = {
      name: `Rule-${Date.now()}`,
      description: 'Exported graph from NexusFlow',
      nodes: nodes.map((node) => ({
        ...node,
        type: node.type || 'datasource',
        data: node.data || { label: node.id, config: {} },
        position: node.position || { x: 0, y: 0 },
      })),
      edges: edges.map((edge) => ({
        ...edge,
      })),
    };

    const json = JSON.stringify(graphData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexusflow-graph-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportGraph = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const validation = validateImportedGraph(parsed);

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      if (!validation.nodes || !validation.edges) {
        throw new Error('Graph import validation did not return supported graph data.');
      }

      setNodes(validation.nodes as Node[]);
      setEdges(validation.edges as Edge[]);
      setSelectedNode(null);
      alert('Graph imported successfully.');
    } catch (error) {
      alert(error instanceof Error ? `Unable to import graph: ${error.message}` : 'Unable to import graph. Please check the file and try again.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="flex w-full h-screen bg-gray-50">
      <EnhancedSidebar onAddNode={handleAddNode} onGenerateMockData={handleGenerateMockData} />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-r from-sky-700 via-indigo-700 to-violet-700 text-white px-6 py-4 flex justify-between items-center shadow-lg shadow-indigo-900/20 border-b border-white/10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">NexusFlow</h1>
            <p className="text-sm text-indigo-100">Visual IoT Telemetry & Rule Engine</p>
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            <button
              onClick={handleExportGraph}
              className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 font-medium transition-all duration-200 shadow-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 font-medium transition-all duration-200 shadow-sm flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImportGraph}
            />
            <button
              onClick={handleSaveGraph}
              className="px-4 py-2 bg-white text-indigo-700 rounded-xl hover:bg-indigo-50 font-semibold transition-all duration-200 shadow-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Graph
            </button>
            {!isRuleActive ? (
              <button
                onClick={handleActivateRule}
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-400 font-semibold transition-all duration-200 shadow-sm flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Activate Rule
              </button>
            ) : (
              <button
                onClick={handleDeactivateRule}
                className="px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-400 font-semibold transition-all duration-200 shadow-sm flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                Stop Rule
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex gap-4 p-4 overflow-auto">
          {/* Canvas */}
          <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-inner shadow-slate-200/60">
            <ReactFlow
              nodes={nodes.map((node) => ({
                ...node,
                className: `${node.type || 'datasource'} ${
                  selectedNode?.id === node.id ? 'active' : ''
                } ${isRuleActive ? 'processing' : ''}`,
              }))}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_event, node) => setSelectedNode(node)}
              onPaneClick={() => setSelectedNode(null)}
            >
              <Background color="#aaa" gap={16} />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>

          {/* Right Sidebar */}
          <div className={`${selectedNode ? 'w-1/2 min-w-0' : 'flex-1'} flex gap-4`}>
            {selectedNode && (
              <div className="flex-1 min-w-0">
                <EnhancedNodeInspector
                  node={selectedNode}
                  onUpdate={(updatedNode) => {
                    setNodes((nds) =>
                      nds.map((n) => (n.id === updatedNode.id ? updatedNode : n))
                    );
                  }}
                  onDelete={(nodeId) => {
                    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
                    setSelectedNode(null);
                  }}
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <EnhancedDashboard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
