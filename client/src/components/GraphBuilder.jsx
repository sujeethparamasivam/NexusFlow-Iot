import { useCallback, useEffect, useState } from "react";
import { ReactFlow, Background, Controls, MiniMap, addEdge, Handle, Position, useEdgesState, useNodesState, useReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Activity, Filter, GitBranch, Link2, MessageSquareText, Plus, Play } from "lucide-react";
import { defaultEdges, defaultNodes } from "../data/defaultGraph";
import { api } from "../api";

function NodeShell({ icon: Icon, title, subtitle, color, children }) {
  return (
    <div className="custom-node">
      <Handle type="target" position={Position.Left} />
      <div className="node-head"><span className={`node-symbol ${color}`}><Icon size={15}/></span><div><b>{title}</b><small>{subtitle}</small></div><span className="node-live"/></div>
      {children}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function SensorNode({ data }) {
  return <NodeShell icon={Activity} title={data.label} subtitle="DATA SOURCE" color="blue"><div className="node-body"><span>{data.metric}</span><b>{data.deviceId}</b></div></NodeShell>;
}
function AverageNode({ data }) {
  return <NodeShell icon={Filter} title={data.label} subtitle="MATH OPERATION" color="purple"><div className="node-body"><span>Window</span><input className="nodrag node-number" type="number" min="1" max="1000" value={data.windowSize || 5} aria-label="Moving average window" onChange={(event) => data.onWindowChange?.(Number(event.target.value))}/><small>samples</small></div></NodeShell>;
}
function ThresholdNode({ data }) {
  return <NodeShell icon={GitBranch} title={data.label} subtitle="RULE" color="amber"><div className="node-body"><span>Alert above</span><b>{data.threshold}°C</b><select className="nodrag node-select" value={data.operator || ">"} aria-label="Threshold operator" onChange={(event) => data.onOperatorChange?.(event.target.value)}><option value=">">Greater than</option><option value=">=">At least</option><option value="<">Less than</option><option value="<=">At most</option><option value="=">Equal to</option></select></div></NodeShell>;
}
function AlertNode({ data }) {
  return <NodeShell icon={MessageSquareText} title={data.label} subtitle="ACTION TRIGGER" color="red"><div className="node-body"><select className="nodrag node-select" value={data.channel || "mock-sms"} aria-label="Alert channel" onChange={(event) => data.onChannelChange?.(event.target.value)}><option value="mock-sms">Mock SMS</option><option value="twilio-sms">Real SMS (Twilio)</option></select><input className="nodrag node-input" type="tel" placeholder="+15551234567" value={data.recipient || ""} aria-label="SMS recipient" onChange={(event) => data.onRecipientChange?.(event.target.value)} /></div></NodeShell>;
}
function WebhookNode({ data }) {
  return <NodeShell icon={Link2} title={data.label} subtitle="OUTBOUND ACTION" color="red"><div className="node-body"><span>Endpoint</span><input className="nodrag webhook-input" type="url" placeholder="https://example.test/hook" value={data.url || ""} aria-label="Webhook URL" onChange={(event) => data.onChange?.(event.target.value)}/></div></NodeShell>;
}

const nodeTypes = { sensor: SensorNode, movingAverage: AverageNode, threshold: ThresholdNode, smsAlert: AlertNode, webhook: WebhookNode };

export default function GraphBuilder({ onCompiled, activeEdgeIds = [] }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);
  const [status, setStatus] = useState("Draft");
  const [saving, setSaving] = useState(false);
  const [workflowId, setWorkflowId] = useState(null);
  const [alertThreshold, setAlertThreshold] = useState(75);
  const { screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    api.get("/workflows").then(({ data }) => {
      const activeWorkflow = data.find((workflow) => workflow.active) || data[0];
      if (!activeWorkflow) return;
      setWorkflowId(activeWorkflow._id);
      setNodes(activeWorkflow.nodes);
      setEdges(activeWorkflow.edges);
      const thresholdNode = activeWorkflow.nodes.find((node) => node.type === "threshold" || node.type === "rule");
      if (thresholdNode) setAlertThreshold(Number(thresholdNode.data?.threshold ?? thresholdNode.threshold ?? 75));
      setStatus("Saved");
    }).catch(() => {});
  }, [setEdges, setNodes]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)), [setEdges]);

  const updateThreshold = useCallback((value) => {
    setAlertThreshold(value);
    setNodes((currentNodes) => currentNodes.map((node) => node.type === "threshold" ? { ...node, data: { ...node.data, threshold: value } } : node));
  }, [setNodes]);

  const updateThresholdOperator = useCallback((value) => {
    setNodes((currentNodes) => currentNodes.map((node) => node.type === "threshold" ? { ...node, data: { ...node.data, operator: value } } : node));
  }, [setNodes]);

  const updateAverageWindow = useCallback((value) => {
    setNodes((currentNodes) => currentNodes.map((node) => node.type === "movingAverage" ? { ...node, data: { ...node.data, windowSize: value } } : node));
  }, [setNodes]);

  const updateWebhook = useCallback((value) => {
    setNodes((currentNodes) => currentNodes.map((node) => node.type === "webhook" ? { ...node, data: { ...node.data, url: value } } : node));
  }, [setNodes]);

  const updateSms = useCallback((field, value) => {
    setNodes((currentNodes) => currentNodes.map((node) => node.type === "smsAlert" ? { ...node, data: { ...node.data, [field]: value } } : node));
  }, [setNodes]);

  const canvasNodes = nodes.map((node) => {
    if (node.type === "threshold") return { ...node, data: { ...node.data, onChange: updateThreshold, onOperatorChange: updateThresholdOperator } };
    if (node.type === "movingAverage") return { ...node, data: { ...node.data, onWindowChange: updateAverageWindow } };
    if (node.type === "smsAlert") return { ...node, data: { ...node.data, onChannelChange: (value) => updateSms("channel", value), onRecipientChange: (value) => updateSms("recipient", value) } };
    if (node.type === "webhook") return { ...node, data: { ...node.data, onChange: updateWebhook } };
    return node;
  });
  const canvasEdges = edges.map((edge) => activeEdgeIds.includes(edge.id)
    ? { ...edge, animated: true, className: "pipeline-edge-active", style: { stroke: "#f5b94c", strokeWidth: 3 } }
    : edge);

  const addNode = (type, position = { x: 180 + Math.random() * 400, y: 350 + Math.random() * 120 }) => {
    const id = `${type}-${Date.now()}`;
    const data = {
      label: type === "sensor" ? "Turbine Sensor" : type === "movingAverage" ? "Moving Average" : type === "threshold" ? "Temperature Rule" : type === "webhook" ? "Webhook Alert" : "SMS Alert",
      deviceId: "turbine-01", metric: "temperature", windowSize: 5, threshold: alertThreshold, operator: ">", channel: type === "webhook" ? "webhook" : type === "smsAlert" ? "twilio-sms" : "mock-sms", recipient: "", url: ""
    };
    setNodes((n) => [...n, { id, type, position, data }]);
  };

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData("application/nexusflow-node");
    if (!type) return;
    addNode(type, screenToFlowPosition({ x: event.clientX, y: event.clientY }));
  }, [screenToFlowPosition]);

  const onDragStart = (event, type) => {
    event.dataTransfer.setData("application/nexusflow-node", type);
    event.dataTransfer.effectAllowed = "move";
  };

  const compile = async () => {
    setSaving(true);
    try {
      const { data } = await api.post("/workflows/compile", { _id: workflowId, name: "Turbine Overheat Protection", nodes, edges });
      setWorkflowId(data.workflowId);
      setStatus("Compiled");
      onCompiled?.(data);
    } catch (error) {
      setStatus(error.response?.data?.error || "Backend offline");
    } finally { setSaving(false); }
  };

  return (
    <div className="builder">
      <div className="builder-toolbar">
        <div><b>Visual Rule Canvas</b><small>Drag, connect and compile your telemetry logic</small></div>
        <div className="builder-actions">
          <button draggable onDragStart={(event) => onDragStart(event, "sensor")} onClick={() => addNode("sensor")}><Plus size={15}/> Source</button>
          <button draggable onDragStart={(event) => onDragStart(event, "movingAverage")} onClick={() => addNode("movingAverage")}><Plus size={15}/> Filter</button>
          <button draggable onDragStart={(event) => onDragStart(event, "threshold")} onClick={() => addNode("threshold")}><Plus size={15}/> Rule</button>
          <button draggable onDragStart={(event) => onDragStart(event, "smsAlert")} onClick={() => addNode("smsAlert")}><Plus size={15}/> Action</button>
          <button draggable onDragStart={(event) => onDragStart(event, "webhook")} onClick={() => addNode("webhook")}><Plus size={15}/> Webhook</button>
          <label className="threshold-setting">Alert above <input type="number" min="0" max="200" value={alertThreshold} aria-label="Alert threshold" onChange={(event) => updateThreshold(Number(event.target.value))}/>°C</label>
          <button className="compile-btn" onClick={compile} disabled={saving}><Play size={15}/>{saving ? "Compiling..." : "Save & Compile"}</button>
        </div>
      </div>
      <div className="canvas">
        <ReactFlow nodes={canvasNodes} edges={canvasEdges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }} onDrop={onDrop} nodeTypes={nodeTypes} fitView>
          <Background color="#1e2636" gap={24} />
          <Controls />
          <MiniMap nodeColor="#7c5cff" maskColor="rgba(5,8,15,.75)" />
        </ReactFlow>
        <div className="canvas-status"><span className="pulse-dot"/><b>{status}</b><span>• {nodes.length} nodes • {edges.length} connections</span></div>
      </div>
    </div>
  );
}
