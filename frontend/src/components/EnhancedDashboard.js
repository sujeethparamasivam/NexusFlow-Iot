import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingUp, Activity, Zap } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
export function EnhancedDashboard() {
    const [telemetryData, setTelemetryData] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [stats, setStats] = useState({
        avgValue: 0,
        minValue: 0,
        maxValue: 0,
        lastValue: 0,
        alertCount: 0,
        status: 'active',
    });
    const [selectedDevice, setSelectedDevice] = useState('all');
    const [chartType, setChartType] = useState('line');
    const { subscribe } = useWebSocket('http://localhost:5000');
    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const response = await fetch('/api/alerts');
                const result = await response.json();
                if (response.ok && Array.isArray(result?.data)) {
                    setAlerts(result.data.map((alert) => ({
                        id: alert._id ?? alert.id ?? `${alert.deviceId}-${Date.now()}`,
                        graphId: alert.ruleId ?? alert.graphId ?? 'unknown',
                        message: alert.message ?? 'Alert triggered',
                        severity: alert.severity === 'critical' ? 'error' : (alert.severity ?? 'info'),
                        timestamp: new Date(alert.timestamp ?? Date.now()),
                        value: alert.value,
                    })));
                }
            }
            catch (error) {
                console.error('Failed to fetch alerts', error);
            }
        };
        fetchAlerts();
        subscribe('telemetry:update', (data) => {
            setTelemetryData((prev) => {
                const nextPoint = {
                    ...data,
                    timestamp: new Date(data.timestamp || Date.now()).toLocaleTimeString(),
                };
                const newData = [...prev.slice(-49), nextPoint];
                updateStats(newData);
                return newData;
            });
        });
        subscribe('alert:created', (alert) => {
            const normalizedAlert = {
                id: alert.alertId ?? alert._id ?? `${alert.deviceId}-${Date.now()}`,
                graphId: alert.graphId ?? alert.ruleId ?? 'unknown',
                message: alert.message ?? 'Alert triggered',
                severity: alert.severity === 'critical' ? 'error' : (alert.severity ?? 'info'),
                timestamp: new Date(alert.timestamp ?? Date.now()),
                value: alert.value,
            };
            setAlerts((prev) => [normalizedAlert, ...prev.slice(0, 9)]);
            setStats((s) => ({ ...s, alertCount: s.alertCount + 1 }));
        });
        subscribe('rule:update', (event) => {
            if (event?.status) {
                setStats((s) => ({ ...s, status: event.status === 'Active' ? 'active' : 'inactive' }));
            }
        });
        return () => {
            // Subscribers are kept stable in the hook and are disconnected on unmount.
        };
    }, [subscribe]);
    const updateStats = (data) => {
        if (data.length === 0)
            return;
        const values = data.map((d) => d.value);
        setStats((s) => ({
            ...s,
            avgValue: values.reduce((a, b) => a + b) / values.length,
            minValue: Math.min(...values),
            maxValue: Math.max(...values),
            lastValue: values[values.length - 1],
        }));
    };
    const filteredData = selectedDevice === 'all'
        ? telemetryData
        : telemetryData.filter((d) => d.deviceId === selectedDevice);
    const ChartComponent = chartType === 'line' ? LineChart
        : chartType === 'area' ? AreaChart
            : BarChart;
    return (_jsxs("div", { className: "flex-1 flex flex-col gap-4", children: [_jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3", children: [_jsx(StatCard, { icon: _jsx(TrendingUp, { className: "w-5 h-5" }), label: "Avg Value", value: stats.avgValue.toFixed(1), unit: "\u00B0C", color: "blue" }), _jsx(StatCard, { icon: _jsx(Activity, { className: "w-5 h-5" }), label: "Current", value: stats.lastValue.toFixed(1), unit: "\u00B0C", color: "green" }), _jsx(StatCard, { icon: _jsx(Zap, { className: "w-5 h-5" }), label: "Max", value: stats.maxValue.toFixed(1), unit: "\u00B0C", color: "orange" }), _jsx(StatCard, { icon: _jsx(AlertCircle, { className: "w-5 h-5" }), label: "Alerts", value: stats.alertCount.toString(), unit: "", color: "red" })] }), _jsxs("div", { className: "bg-white/90 rounded-2xl border border-slate-200 p-4 shadow-lg shadow-slate-200/60 backdrop-blur-sm", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h3", { className: "font-bold text-lg", children: "Live Telemetry" }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("select", { value: selectedDevice, onChange: (e) => setSelectedDevice(e.target.value), className: "px-3 py-1 border border-indigo-200 bg-indigo-50/60 text-indigo-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300", children: [_jsx("option", { value: "all", children: "All Devices" }), _jsx("option", { value: "turbine-01", children: "Turbine 01" }), _jsx("option", { value: "turbine-02", children: "Turbine 02" }), _jsx("option", { value: "pump-01", children: "Pump 01" })] }), _jsx("div", { className: "flex gap-1 border border-indigo-100 bg-slate-100 rounded-lg p-1", children: ['line', 'area', 'bar'].map((type) => (_jsx("button", { onClick: () => setChartType(type), className: `px-3 py-1 text-sm rounded capitalize ${chartType === type
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'bg-transparent text-slate-600 hover:bg-white'}`, children: type }, type))) })] })] }), filteredData.length > 0 ? (_jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(ChartComponent, { data: filteredData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "timestamp", tick: { fontSize: 12 } }), _jsx(YAxis, { tick: { fontSize: 12 } }), _jsx(Tooltip, {}), _jsx(Legend, {}), chartType === 'line' && (_jsx(Line, { type: "monotone", dataKey: "value", stroke: "#0f766e", dot: false, isAnimationActive: false })), chartType === 'area' && (_jsx(Area, { type: "monotone", dataKey: "value", stroke: "#0f766e", fill: "#99f6e4", dot: false, isAnimationActive: false })), chartType === 'bar' && (_jsx(Bar, { dataKey: "value", fill: "#14b8a6", isAnimationActive: false }))] }) })) : (_jsx("div", { className: "h-64 flex items-center justify-center text-gray-500", children: "Waiting for telemetry data..." }))] }), _jsxs("div", { className: "bg-white/90 rounded-2xl border border-slate-200 p-4 shadow-lg shadow-slate-200/60 backdrop-blur-sm", children: [_jsxs("h3", { className: "font-bold text-lg mb-3 flex items-center gap-2", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-600" }), "Recent Alerts"] }), _jsx("div", { className: "space-y-2 max-h-40 overflow-y-auto", children: alerts.length > 0 ? (alerts.map((alert) => (_jsxs("div", { className: `p-3 rounded-lg text-sm border-l-4 ${alert.severity === 'error'
                                ? 'bg-rose-50 border-rose-400'
                                : alert.severity === 'warning'
                                    ? 'bg-amber-50 border-amber-400'
                                    : 'bg-cyan-50 border-cyan-400'}`, children: [_jsx("p", { className: "font-medium", children: alert.message }), _jsxs("p", { className: "text-xs text-gray-600 mt-1", children: [alert.timestamp.toLocaleTimeString(), alert.value && ` • Value: ${alert.value.toFixed(1)}`] })] }, alert.id)))) : (_jsx("p", { className: "text-gray-500 text-center py-4", children: "No alerts" })) })] })] }));
}
function StatCard({ icon, label, value, unit, color }) {
    const bgColors = {
        blue: 'bg-indigo-50 border-indigo-200',
        green: 'bg-teal-50 border-teal-200',
        orange: 'bg-amber-50 border-amber-200',
        red: 'bg-rose-50 border-rose-200',
    };
    const textColors = {
        blue: 'text-indigo-600',
        green: 'text-teal-600',
        orange: 'text-amber-600',
        red: 'text-rose-600',
    };
    return (_jsxs("div", { className: `${bgColors[color]} border rounded-2xl p-3 shadow-sm`, children: [_jsx("div", { className: `flex items-center justify-between ${textColors[color]}`, children: icon }), _jsx("p", { className: "text-xs text-gray-600 mt-2", children: label }), _jsxs("p", { className: "text-lg font-bold text-gray-900", children: [value, unit && _jsx("span", { className: "text-sm text-gray-600 ml-1", children: unit })] })] }));
}
