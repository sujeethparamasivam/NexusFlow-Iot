import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Settings, Copy, Trash2 } from 'lucide-react';
const configSchemas = {
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
export function EnhancedNodeInspector({ node, onUpdate, onDelete }) {
    const [config, setConfig] = useState(node.data?.config || {});
    const schema = configSchemas[node.type || 'datasource'] || [];
    const handleConfigChange = (key, value) => {
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
    return (_jsxs("div", { className: "bg-white rounded-lg border border-gray-200 p-5 overflow-y-auto max-h-96 shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h3", { className: "font-bold text-lg flex items-center gap-2", children: [_jsx(Settings, { className: "w-5 h-5 text-blue-600" }), "Node Inspector"] }), _jsx("span", { className: "bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium capitalize", children: node.type })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "ID" }), _jsx("input", { type: "text", value: node.id, disabled: true, className: "w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm font-mono" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Label" }), _jsx("input", { type: "text", defaultValue: node.data?.label, onChange: (e) => {
                                    if (onUpdate) {
                                        onUpdate({
                                            ...node,
                                            data: { ...node.data, label: e.target.value },
                                        });
                                    }
                                }, className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-gray-600 mb-1", children: "X" }), _jsx("p", { className: "text-sm font-mono text-gray-700", children: node.position.x.toFixed(0) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-gray-600 mb-1", children: "Y" }), _jsx("p", { className: "text-sm font-mono text-gray-700", children: node.position.y.toFixed(0) })] })] }), schema.length > 0 && (_jsxs("div", { className: "border-t pt-4", children: [_jsx("h4", { className: "text-sm font-semibold text-gray-800 mb-3", children: "Configuration" }), _jsx("div", { className: "space-y-3", children: schema.map((field) => (_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-gray-600 mb-1", children: field.label }), field.type === 'select' ? (_jsxs("select", { value: config[field.key] || '', onChange: (e) => handleConfigChange(field.key, e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm", children: [_jsx("option", { value: "", children: "Select..." }), field.options?.map((opt) => (_jsx("option", { value: opt, children: opt }, opt)))] })) : (_jsx("input", { type: field.type, value: config[field.key] || '', onChange: (e) => handleConfigChange(field.key, e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" }))] }, field.key))) })] })), _jsxs("div", { className: "border-t pt-4 flex gap-2", children: [_jsxs("button", { onClick: handleDuplicate, className: "flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium flex items-center justify-center gap-2", children: [_jsx(Copy, { className: "w-4 h-4" }), "Duplicate"] }), _jsxs("button", { onClick: () => onDelete?.(node.id), className: "flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium flex items-center justify-center gap-2", children: [_jsx(Trash2, { className: "w-4 h-4" }), "Delete"] })] })] })] }));
}
