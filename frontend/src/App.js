import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useState, useEffect } from 'react';
import ReactFlow, { addEdge, useNodesState, useEdgesState, Background, Controls, MiniMap, } from 'reactflow';
import 'reactflow/dist/style.css';
import { EnhancedSidebar } from './components/EnhancedSidebar';
import { EnhancedNodeInspector } from './components/EnhancedNodeInspector';
import { EnhancedDashboard } from './components/EnhancedDashboard';
import { useGraphStore } from './store/graphStore';
import { Save, Play, Square } from 'lucide-react';
import glowingStyles from './styles/glowingEffects';
import { graphService } from './services/graphService';
const initialNodes = [];
const initialEdges = [];
function App() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNode, setSelectedNode] = useState(null);
    const [isRuleActive, setIsRuleActive] = useState(false);
    const [savedGraphId, setSavedGraphId] = useState(null);
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
    const onConnect = useCallback((connection) => setEdges((eds) => addEdge({ ...connection, animated: true }, eds)), [setEdges]);
    const handleAddNode = (nodeType) => {
        const newNode = {
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
                type: (n.type || 'datasource'),
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
            const savedGraph = await graphService.createGraph(graphData);
            setSavedGraphId(savedGraph?._id ?? `rule-${Date.now()}`);
            await saveGraph(graphData);
            alert('Graph saved successfully!');
        }
        catch (error) {
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
                type: (n.type || 'datasource'),
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
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to start backend simulator');
        }
    };
    return (_jsxs("div", { className: "flex w-full h-screen bg-gray-50", children: [_jsx(EnhancedSidebar, { onAddNode: handleAddNode, onGenerateMockData: handleGenerateMockData }), _jsxs("div", { className: "flex-1 flex flex-col", children: [_jsxs("header", { className: "bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4 flex justify-between items-center shadow-lg", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold", children: "NexusFlow" }), _jsx("p", { className: "text-sm text-blue-100", children: "Visual IoT Telemetry & Rule Engine" })] }), _jsxs("div", { className: "flex gap-3", children: [_jsxs("button", { onClick: handleSaveGraph, className: "px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors flex items-center gap-2", children: [_jsx(Save, { className: "w-4 h-4" }), "Save Graph"] }), !isRuleActive ? (_jsxs("button", { onClick: handleActivateRule, className: "px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors flex items-center gap-2", children: [_jsx(Play, { className: "w-4 h-4" }), "Activate Rule"] })) : (_jsxs("button", { onClick: handleDeactivateRule, className: "px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors flex items-center gap-2", children: [_jsx(Square, { className: "w-4 h-4" }), "Stop Rule"] }))] })] }), _jsxs("div", { className: "flex-1 flex gap-4 p-4 overflow-hidden", children: [_jsx("div", { className: "flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm", children: _jsxs(ReactFlow, { nodes: nodes.map((node) => ({
                                        ...node,
                                        className: `${node.type || 'datasource'} ${selectedNode?.id === node.id ? 'active' : ''} ${isRuleActive ? 'processing' : ''}`,
                                    })), edges: edges, onNodesChange: onNodesChange, onEdgesChange: onEdgesChange, onConnect: onConnect, onNodeClick: (_event, node) => setSelectedNode(node), onPaneClick: () => setSelectedNode(null), children: [_jsx(Background, { color: "#aaa", gap: 16 }), _jsx(Controls, {}), _jsx(MiniMap, {})] }) }), _jsxs("div", { className: "w-96 flex flex-col gap-4 overflow-auto", children: [selectedNode && (_jsx(EnhancedNodeInspector, { node: selectedNode, onUpdate: (updatedNode) => {
                                            setNodes((nds) => nds.map((n) => (n.id === updatedNode.id ? updatedNode : n)));
                                        }, onDelete: (nodeId) => {
                                            setNodes((nds) => nds.filter((n) => n.id !== nodeId));
                                            setSelectedNode(null);
                                        } })), _jsx(EnhancedDashboard, {})] })] })] })] }));
}
export default App;
