import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { AlertCircle, TrendingUp, Activity, Zap } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

interface TelemetryPoint {
  timestamp: string;
  value: number;
  deviceId: string;
  [key: string]: any;
}

interface AlertEvent {
  id: string;
  graphId: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: Date;
  value?: number;
}

interface Stats {
  avgValue: number;
  minValue: number;
  maxValue: number;
  lastValue: number;
  alertCount: number;
  status: 'active' | 'inactive';
}

export function EnhancedDashboard() {
  const [telemetryData, setTelemetryData] = useState<TelemetryPoint[]>([]);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [stats, setStats] = useState<Stats>({
    avgValue: 0,
    minValue: 0,
    maxValue: 0,
    lastValue: 0,
    alertCount: 0,
    status: 'active',
  });
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');
  const { subscribe } = useWebSocket('http://localhost:5000');

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch('/api/alerts');
        const result = await response.json();
        if (response.ok && Array.isArray(result?.data)) {
          setAlerts(result.data.map((alert: any) => ({
            id: alert._id ?? alert.id ?? `${alert.deviceId}-${Date.now()}`,
            graphId: alert.ruleId ?? alert.graphId ?? 'unknown',
            message: alert.message ?? 'Alert triggered',
            severity: alert.severity === 'critical' ? 'error' : (alert.severity ?? 'info'),
            timestamp: new Date(alert.timestamp ?? Date.now()),
            value: alert.value,
          })));
        }
      } catch (error) {
        console.error('Failed to fetch alerts', error);
      }
    };

    fetchAlerts();

    subscribe('telemetry:update', (data: TelemetryPoint) => {
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

    subscribe('alert:created', (alert: any) => {
      const normalizedAlert: AlertEvent = {
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

    subscribe('rule:update', (event: any) => {
      if (event?.status) {
        setStats((s) => ({ ...s, status: event.status === 'Active' ? 'active' : 'inactive' }));
      }
    });

    return () => {
      // Subscribers are kept stable in the hook and are disconnected on unmount.
    };
  }, [subscribe]);

  const updateStats = (data: TelemetryPoint[]) => {
    if (data.length === 0) return;
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

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Avg Value"
          value={stats.avgValue.toFixed(1)}
          unit="°C"
          color="blue"
        />
        <StatCard
          icon={<Activity className="w-5 h-5" />}
          label="Current"
          value={stats.lastValue.toFixed(1)}
          unit="°C"
          color="green"
        />
        <StatCard
          icon={<Zap className="w-5 h-5" />}
          label="Max"
          value={stats.maxValue.toFixed(1)}
          unit="°C"
          color="orange"
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5" />}
          label="Alerts"
          value={stats.alertCount.toString()}
          unit=""
          color="red"
        />
      </div>

      {/* Charts */}
      <div className="bg-white/90 rounded-2xl border border-slate-200 p-4 shadow-lg shadow-slate-200/60 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Live Telemetry</h3>
          <div className="flex gap-2">
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="px-3 py-1 border border-indigo-200 bg-indigo-50/60 text-indigo-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="all">All Devices</option>
              <option value="turbine-01">Turbine 01</option>
              <option value="turbine-02">Turbine 02</option>
              <option value="pump-01">Pump 01</option>
            </select>
            <div className="flex gap-1 border border-indigo-100 bg-slate-100 rounded-lg p-1">
              {(['line', 'area', 'bar'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`px-3 py-1 text-sm rounded capitalize ${
                    chartType === type
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-transparent text-slate-600 hover:bg-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <ChartComponent data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {chartType === 'line' && (
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0f766e"
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {chartType === 'area' && (
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#0f766e"
                  fill="#99f6e4"
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {chartType === 'bar' && (
                <Bar
                  dataKey="value"
                  fill="#14b8a6"
                  isAnimationActive={false}
                />
              )}
            </ChartComponent>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            Waiting for telemetry data...
          </div>
        )}
      </div>

      {/* Alerts */}
      <div className="bg-white/90 rounded-2xl border border-slate-200 p-4 shadow-lg shadow-slate-200/60 backdrop-blur-sm">
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          Recent Alerts
        </h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg text-sm border-l-4 ${
                  alert.severity === 'error'
                    ? 'bg-rose-50 border-rose-400'
                    : alert.severity === 'warning'
                    ? 'bg-amber-50 border-amber-400'
                    : 'bg-cyan-50 border-cyan-400'
                }`}
              >
                <p className="font-medium">{alert.message}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {alert.timestamp.toLocaleTimeString()}
                  {alert.value && ` • Value: ${alert.value.toFixed(1)}`}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No alerts</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  color: 'blue' | 'green' | 'orange' | 'red';
}

function StatCard({ icon, label, value, unit, color }: StatCardProps) {
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

  return (
    <div className={`${bgColors[color]} border rounded-2xl p-3 shadow-sm`}>
      <div className={`flex items-center justify-between ${textColors[color]}`}>
        {icon}
      </div>
      <p className="text-xs text-gray-600 mt-2">{label}</p>
      <p className="text-lg font-bold text-gray-900">
        {value}
        {unit && <span className="text-sm text-gray-600 ml-1">{unit}</span>}
      </p>
    </div>
  );
}
