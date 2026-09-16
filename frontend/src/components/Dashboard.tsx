import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useWebSocket } from '../hooks/useWebSocket';

interface DashboardData {
  timestamp: string;
  temperature: number;
  humidity: number;
  pressure: number;
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData[]>([]);
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-y-auto max-h-96">
      <h3 className="font-bold text-lg mb-4">Live Dashboard</h3>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-blue-50 p-2 rounded text-center">
          <p className="text-xs text-gray-600">Devices</p>
          <p className="text-lg font-bold text-blue-600">{stats.devices}</p>
        </div>
        <div className="bg-green-50 p-2 rounded text-center">
          <p className="text-xs text-gray-600">Avg Temp</p>
          <p className="text-lg font-bold text-green-600">{stats.avgTemp.toFixed(1)}°C</p>
        </div>
        <div className="bg-red-50 p-2 rounded text-center">
          <p className="text-xs text-gray-600">Alerts</p>
          <p className="text-lg font-bold text-red-600">{stats.alerts}</p>
        </div>
      </div>

      {data.length > 0 && (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="temperature" stroke="#ff7300" dot={false} />
            <Line type="monotone" dataKey="humidity" stroke="#0088ff" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
