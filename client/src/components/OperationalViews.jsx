import { useEffect, useState } from "react";
import { Activity, AlertTriangle, Database, RefreshCw, Server, Wifi } from "lucide-react";
import { api } from "../api";
import TelemetryChart from "./TelemetryChart";

export function LiveTelemetryView({ chart, connected, latest }) {
  return (
    <section className="page">
      <div className="page-title"><div><span className="eyebrow">STREAM INSPECTION</span><h1>Live Telemetry</h1><p>Inspect the current signal stream from connected factory equipment.</p></div><div className="live-badge"><span className={connected ? "pulse-dot" : "offline-dot"}/><span>WebSocket</span><b>{connected ? "CONNECTED" : "WAITING"}</b></div></div>
      <div className="metrics-grid"><div className="metric-card"><div className="metric-top"><span>Current signal</span><Activity size={16}/></div><div className="metric-value">{latest.toFixed(1)}<small>°C</small></div><div className="metric-foot">turbine-01 / temperature</div></div><div className="metric-card"><div className="metric-top"><span>Sampling</span><Wifi size={16}/></div><div className="metric-value">900<small>ms</small></div><div className="metric-foot">Mock sensor cadence</div></div></div>
      <div className="panel chart-panel telemetry-full"><div className="panel-head"><div><b>Temperature signal</b><small>Last 28 pipeline observations</small></div><span className="status-pill normal">STREAMING</span></div><TelemetryChart data={chart}/></div>
    </section>
  );
}

export function AlertsView({ alerts }) {
  return (
    <section className="page">
      <div className="page-title"><div><span className="eyebrow">RULE EVENTS</span><h1>Alerts</h1><p>Review threshold actions and notification delivery outcomes.</p></div><AlertTriangle size={22}/></div>
      <div className="panel table-panel"><div className="panel-head"><div><b>Alert history</b><small>Authenticated workspace events</small></div><span className="status-pill critical">{alerts.length} RECENT</span></div><div className="data-table"><div className="table-row table-head"><span>Event</span><span>Device</span><span>Value</span><span>Channel</span><span>Time</span></div>{alerts.length ? alerts.map((alert, index) => <div className="table-row" key={alert.id || alert._id || index}><span><b>{alert.message}</b><small>{alert.severity || "critical"}</small></span><span>{alert.deviceId || "-"}</span><span>{Number(alert.value || 0).toFixed(1)}°C</span><span><i className="table-dot"/> {alert.channel || "rule"}</span><span>{new Date(alert.createdAt || Date.now()).toLocaleString()}</span></div>) : <div className="table-empty">No rule alerts have been recorded yet.</div>}</div></div>
    </section>
  );
}

export function TimeSeriesView({ stats }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = () => { setLoading(true); api.get("/telemetry/latest").then(({ data }) => setRows(data)).catch(() => setRows([])).finally(() => setLoading(false)); };
  useEffect(load, []);
  return (
    <section className="page">
      <div className="page-title"><div><span className="eyebrow">MONGODB OBSERVABILITY</span><h1>Time-Series DB</h1><p>Inspect append-only telemetry stored in the native MongoDB time-series collection.</p></div><button className="text-btn refresh-btn" onClick={load}><RefreshCw size={15}/> Refresh</button></div>
      <div className="metrics-grid"><div className="metric-card"><div className="metric-top"><span>Total records</span><Database size={16}/></div><div className="metric-value">{Number(stats.telemetry || 0).toLocaleString()}</div><div className="metric-foot">telemetry collection</div></div><div className="metric-card"><div className="metric-top"><span>Storage mode</span><Server size={16}/></div><div className="metric-value text-value">TIME-SERIES</div><div className="metric-foot">timestamp + meta.deviceId</div></div></div>
      <div className="panel table-panel"><div className="panel-head"><div><b>Latest telemetry records</b><small>Newest 60 documents, chronological view</small></div></div><div className="data-table"><div className="table-row table-head"><span>Timestamp</span><span>Device</span><span>Temperature</span><span>Vibration</span><span>Pressure</span></div>{loading ? <div className="table-empty">Loading telemetry...</div> : rows.length ? rows.slice().reverse().map((row, index) => <div className="table-row" key={row._id || index}><span>{new Date(row.timestamp).toLocaleString()}</span><span>{row.deviceId || row.meta?.deviceId || "-"}</span><span>{Number(row.temperature).toFixed(1)}°C</span><span>{Number(row.vibration).toFixed(2)}</span><span>{Number(row.pressure).toFixed(1)}</span></div>) : <div className="table-empty">No telemetry records found.</div>}</div></div>
    </section>
  );
}
