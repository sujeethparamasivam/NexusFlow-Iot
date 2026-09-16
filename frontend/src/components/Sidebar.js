import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const nodeTypes = [
    { type: 'DataSource', icon: '📊', description: 'Sensor/Device Data' },
    { type: 'Filter', icon: '🔍', description: 'Data Filter' },
    { type: 'Transform', icon: '⚙️', description: 'Data Transform' },
    { type: 'Operation', icon: '🧮', description: 'Math Operation' },
    { type: 'Trigger', icon: '🚨', description: 'Alert/Trigger' },
];
export function Sidebar({ onAddNode }) {
    return (_jsxs("aside", { className: "w-64 bg-gray-900 text-white p-6 overflow-y-auto border-r border-gray-700", children: [_jsx("h2", { className: "text-lg font-bold mb-6", children: "Node Library" }), _jsx("div", { className: "space-y-3", children: nodeTypes.map((node) => (_jsxs("button", { onClick: () => onAddNode(node.type), className: "w-full px-4 py-3 bg-gray-800 hover:bg-blue-600 rounded-lg text-left transition-colors flex items-center gap-2", children: [_jsx("span", { children: node.icon }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: node.type }), _jsx("p", { className: "text-xs text-gray-400", children: node.description })] })] }, node.type))) }), _jsx("hr", { className: "my-6 border-gray-700" }), _jsxs("div", { className: "bg-blue-900 p-4 rounded-lg text-sm", children: [_jsx("h3", { className: "font-bold mb-2", children: "\uD83D\uDCA1 Tip" }), _jsx("p", { children: "Drag nodes from the library, connect them, and define logic to build your rule engine." })] })] }));
}
