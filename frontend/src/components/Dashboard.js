import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useWebSocket } from '../hooks/useWebSocket';
export function Dashboard() {
    const [data, setData] = useState([]);
    const [stats] = useState({ alerts: 0, avgTemp: 0, devices: 0 });
    const { subscribe } = useWebSocket('http://localhost:5000');
    useEffect(() => {
        // Subscribe to telemetry updates
        subscribe('telemetry:update', (newData) => {
            setData((prev) => [
                ...prev.slice(-29),
                {
                    timestamp: new Date().toLocaleTimeString(),
                    temperature: newData.value,
                    humidity: Math.random() * 100,
                    pressure: 1013 + Math.random() * 10,
                },
            ]);
        });
        // Simulate initial data
        const initialData = Array.from({ length: 10 }, (_, i) => ({
            timestamp: new Date(Date.now() - (10 - i) * 5000).toLocaleTimeString(),
            temperature: 20 + Math.random() * 10,
            humidity: 50 + Math.random() * 30,
            pressure: 1013 + Math.random() * 10,
        }));
        setData(initialData);
    }, [subscribe]);
    return (_jsxs("div", { className: "bg-white rounded-lg border border-gray-200 p-4 overflow-y-auto max-h-96", children: [_jsx("h3", { className: "font-bold text-lg mb-4", children: "Live Dashboard" }), _jsxs("div", { className: "grid grid-cols-3 gap-2 mb-4", children: [_jsxs("div", { className: "bg-blue-50 p-2 rounded text-center", children: [_jsx("p", { className: "text-xs text-gray-600", children: "Devices" }), _jsx("p", { className: "text-lg font-bold text-blue-600", children: stats.devices })] }), _jsxs("div", { className: "bg-green-50 p-2 rounded text-center", children: [_jsx("p", { className: "text-xs text-gray-600", children: "Avg Temp" }), _jsxs("p", { className: "text-lg font-bold text-green-600", children: [stats.avgTemp.toFixed(1), "\u00B0C"] })] }), _jsxs("div", { className: "bg-red-50 p-2 rounded text-center", children: [_jsx("p", { className: "text-xs text-gray-600", children: "Alerts" }), _jsx("p", { className: "text-lg font-bold text-red-600", children: stats.alerts })] })] }), data.length > 0 && (_jsx(ResponsiveContainer, { width: "100%", height: 200, children: _jsxs(LineChart, { data: data, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "timestamp", tick: { fontSize: 12 } }), _jsx(YAxis, { tick: { fontSize: 12 } }), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "temperature", stroke: "#ff7300", dot: false }), _jsx(Line, { type: "monotone", dataKey: "humidity", stroke: "#0088ff", dot: false })] }) }))] }));
}
