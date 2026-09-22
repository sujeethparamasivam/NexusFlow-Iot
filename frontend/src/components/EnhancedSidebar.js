import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Plus } from 'lucide-react';
const nodeTypes = {
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
export function EnhancedSidebar({ onAddNode, onGenerateMockData }) {
    const [activeTab, setActiveTab] = useState('nodes');
    return (_jsxs("aside", { className: "w-72 bg-gradient-to-b from-slate-950 to-slate-900 text-white p-6 overflow-y-auto border-r border-slate-700 flex flex-col shadow-xl shadow-slate-900/20", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h2", { className: "text-xl font-bold bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent", children: "NexusFlow" }), _jsx("p", { className: "text-xs text-slate-400 mt-1", children: "IoT Rule Engine" })] }), _jsx("div", { className: "flex gap-2 mb-4 border-b border-gray-700", children: ['nodes', 'tools', 'help'].map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab), className: `px-3 py-2 text-sm font-medium transition-colors ${activeTab === tab
                        ? 'border-b-2 border-indigo-400 text-indigo-300'
                        : 'text-slate-400 hover:text-slate-200'}`, children: tab.charAt(0).toUpperCase() + tab.slice(1) }, tab))) }), activeTab === 'nodes' && (_jsx("div", { className: "space-y-3 flex-1", children: Object.entries(nodeTypes).map(([type, { icon, description, color }]) => (_jsxs("button", { onClick: () => onAddNode(type), className: `w-full px-4 py-3 ${color} hover:opacity-90 rounded-xl text-left transition-all duration-200 flex items-center gap-3 group shadow-lg shadow-slate-950/20 ring-1 ring-white/10`, children: [_jsx("span", { className: "text-xl", children: icon }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-white capitalize", children: type }), _jsx("p", { className: "text-xs text-white text-opacity-80", children: description })] }), _jsx(Plus, { className: "w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" })] }, type))) })), activeTab === 'tools' && (_jsxs("div", { className: "space-y-3 flex-1", children: [_jsxs("button", { onClick: onGenerateMockData, className: "w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 shadow-lg shadow-emerald-900/20", children: [_jsx("span", { children: "\uD83C\uDFAF" }), "Start Backend Simulator"] }), _jsx("div", { className: "bg-gray-700 p-3 rounded-lg", children: _jsxs("p", { className: "text-xs text-gray-300", children: [_jsx("strong", { children: "Tools:" }), _jsx("br", {}), "\u2022 Save graph as JSON", _jsx("br", {}), "\u2022 Load from JSON", _jsx("br", {}), "\u2022 Clear canvas", _jsx("br", {}), "\u2022 Export config"] }) })] })), activeTab === 'help' && (_jsxs("div", { className: "space-y-3 flex-1", children: [_jsxs("div", { className: "bg-blue-900 bg-opacity-30 p-3 rounded-lg border border-blue-700", children: [_jsx("h3", { className: "font-semibold text-blue-400 mb-2", children: "\uD83D\uDCD6 Getting Started" }), _jsxs("ul", { className: "text-xs text-gray-300 space-y-1", children: [_jsx("li", { children: "1. Add nodes from the left panel" }), _jsx("li", { children: "2. Connect nodes by dragging edges" }), _jsx("li", { children: "3. Configure each node" }), _jsx("li", { children: "4. Click \"Activate Rule\" to start" }), _jsx("li", { children: "5. View live data in dashboard" })] })] }), _jsxs("div", { className: "bg-green-900 bg-opacity-30 p-3 rounded-lg border border-green-700", children: [_jsx("h3", { className: "font-semibold text-green-400 mb-2", children: "\uD83C\uDFAF Example Rule" }), _jsx("p", { className: "text-xs text-gray-300", children: "Sensor \u2192 Filter (temp > 80) \u2192 Alert" })] }), _jsxs("div", { className: "bg-purple-900 bg-opacity-30 p-3 rounded-lg border border-purple-700", children: [_jsx("h3", { className: "font-semibold text-purple-400 mb-2", children: "\u26A1 Features" }), _jsxs("ul", { className: "text-xs text-gray-300 space-y-1", children: [_jsx("li", { children: "\u2713 Real-time data streaming" }), _jsx("li", { children: "\u2713 Custom rule compilation" }), _jsx("li", { children: "\u2713 Live alerts" }), _jsx("li", { children: "\u2713 Time-series storage" })] })] })] })), _jsx("hr", { className: "my-4 border-gray-700" }), _jsxs("div", { className: "text-xs text-gray-500 text-center", children: [_jsx("p", { children: "NexusFlow v1.0" }), _jsx("p", { children: "IoT Telemetry Engine" })] })] }));
}
