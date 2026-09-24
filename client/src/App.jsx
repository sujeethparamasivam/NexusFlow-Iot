import { useEffect, useRef, useState } from "react";
import { Activity, BellRing, Database, Gauge, RadioTower, Server, Sparkles, Zap } from "lucide-react";
import { api, setAuthToken, wsUrl } from "./api";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import MetricCard from "./components/MetricCard";
import TelemetryChart from "./components/TelemetryChart";
import WorkflowMini from "./components/WorkflowMini";
import GraphBuilder from "./components/GraphBuilder";
import NotificationSettings from "./components/NotificationSettings";
import { AlertsView, LiveTelemetryView, TimeSeriesView } from "./components/OperationalViews";

const initialChart = Array.from({ length: 18 }, (_, i) => ({
  time: `${String(10 + Math.floor(i / 3)).padStart(2, "0")}:${String((i * 5) % 60).padStart(2, "0")}`,
  temperature: 68 + Math.sin(i / 2) * 5 + (i > 14 ? i - 14 : 0)
}));

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("nexusflow_theme") || "dark");
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("nexusflow_user") || "null"));
  const [authLoading, setAuthLoading] = useState(Boolean(localStorage.getItem("nexusflow_token")));
  const [active, setActive] = useState("Overview");
  const activePage = useRef("Overview");
  const [hasUnreadAlerts, setHasUnreadAlerts] = useState(true);
  const [connected, setConnected] = useState(false);
  const [simulation, setSimulation] = useState(() => localStorage.getItem("nexusflow_simulation") === "true");
  const [chart, setChart] = useState(initialChart);
  const [latest, setLatest] = useState(76.4);
  const [alerts, setAlerts] = useState([]);
  const [compiled, setCompiled] = useState(null);
  const [stats, setStats] = useState({ telemetry: 0, alerts: 0, workflows: 1 });
  const [simulationError, setSimulationError] = useState("");
  const [manualTemperature, setManualTemperature] = useState(76.4);
  const [useManualTemp, setUseManualTemp] = useState(false);
  const [activeEdgeIds, setActiveEdgeIds] = useState([]);
  const activeEdgeExpiry = useRef(new Map());
  const lastPipelineAt = useRef(0);

  useEffect(() => {
    activePage.current = active;
  }, [active]);

  useEffect(() => {
    const token = localStorage.getItem("nexusflow_token");
    if (!token) {
      setAuthLoading(false);
      return undefined;
    }
    api.get("/auth/me").then(({ data }) => {
      setUser(data.user);
      localStorage.setItem("nexusflow_user", JSON.stringify(data.user));
    }).catch(() => {
      localStorage.removeItem("nexusflow_token");
      localStorage.removeItem("nexusflow_user");
      setAuthToken(null);
      setUser(null);
    }).finally(() => setAuthLoading(false));
    return undefined;
  }, []);

  useEffect(() => {
    if (!user || authLoading) return undefined;
    api.get("/stats").then(r => setStats(r.data?.data || r.data)).catch(() => {});
    api.get("/alerts").then(r => setAlerts(Array.isArray(r.data) ? r.data : r.data?.data || [])).catch(() => {});
    let socket;
    let reconnectTimer;
    let disposed = false;
    const connect = () => {
      if (disposed) return;
      socket = new WebSocket(wsUrl());
      socket.onopen = () => setConnected(true);
      socket.onerror = () => setConnected(false);
      socket.onclose = () => {
        setConnected(false);
        if (!disposed) reconnectTimer = setTimeout(connect, 1000);
      };
      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "pipeline") {
          const temp = Number(msg.data.temperature);
          lastPipelineAt.current = Date.now();
          setLatest(temp);
          setChart(prev => [...prev.slice(-27), {
            time: new Date(msg.data.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            temperature: Number(temp.toFixed(1))
          }]);
        }
        if (msg.type === "pipeline_activity") {
          const edgeIds = msg.data?.edgeIds || (msg.data?.edgeId ? [msg.data.edgeId] : []);
          const expiry = Date.now() + 700;
          edgeIds.forEach((edgeId) => activeEdgeExpiry.current.set(edgeId, expiry));
          setActiveEdgeIds((current) => [...new Set([...current, ...edgeIds])]);
          setTimeout(() => {
            const now = Date.now();
            setActiveEdgeIds((current) => current.filter((edgeId) => (activeEdgeExpiry.current.get(edgeId) || 0) > now));
          }, 750);
        }
        if (msg.type === "alert") {
          setAlerts(prev => [msg.data, ...prev].slice(0, 12));
          if (activePage.current !== "Alerts") setHasUnreadAlerts(true);
        }
        if (msg.type === "alert_update") setAlerts(prev => prev.map((alert) => alert.id === msg.data.id ? { ...alert, ...msg.data } : alert));
      };
    };
    connect();
    return () => {
      disposed = true;
      clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [user, authLoading]);

  const openAlerts = () => {
    setHasUnreadAlerts(false);
    setActive("Alerts");
  };

  useEffect(() => {
    if (!simulation || !user) return undefined;
    const id = setInterval(async () => {
      const temperature = useManualTemp ? manualTemperature : (71 + Math.sin(Date.now() / 2400) * 8 + Math.random() * 10);
      try {
        const { data } = await api.post("/telemetry/ingest", { deviceId: "turbine-01", temperature, vibration: 2 + Math.random() * 2, pressure: 108 + Math.random() * 8 });
        setSimulationError("");
        setLatest(Number(data.temperature));
        if (Date.now() - lastPipelineAt.current > 1500) {
          setChart(prev => [...prev.slice(-27), {
            time: new Date(data.timestamp || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            temperature: Number(Number(data.temperature).toFixed(1))
          }]);
        }
      } catch (error) {
        setSimulationError(error.response?.data?.error || "Telemetry ingestion failed");
      }
    }, 900);
    return () => clearInterval(id);
  }, [simulation, user, manualTemperature, useManualTemp]);

  useEffect(() => {
    localStorage.setItem("nexusflow_simulation", String(simulation));
  }, [simulation]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("nexusflow_theme", theme);
  }, [theme]);

  if (authLoading) return <main className="auth-loading">Loading secure workspace...</main>;
  if (!user) return <Login onAuthenticated={setUser}/>;

  const logout = () => {
    localStorage.removeItem("nexusflow_token");
    localStorage.removeItem("nexusflow_user");
    setAuthToken(null);
    setUser(null);
  };
  const userInitial = (user.name || user.email || "U").trim().charAt(0).toUpperCase();
  const risk = latest > 80 ? "CRITICAL" : latest > 76 ? "ELEVATED" : "NORMAL";

  return (
    <div className="app-shell">
      <Sidebar active={active} onSelect={(page) => page === "Alerts" ? openAlerts() : setActive(page)} showNotificationDot={hasUnreadAlerts}/>
      <main className="main">
        <Topbar theme={theme} onThemeChange={setTheme} connected={connected} simulation={simulation} onSimulation={() => { setSimulationError(""); setSimulation(v => !v); }} onNotifications={openAlerts} showNotificationDot={hasUnreadAlerts} manualTemperature={manualTemperature} onManualTempChange={setManualTemperature} useManualTemp={useManualTemp} onUseManualTempChange={setUseManualTemp}/>
        {active === "Settings" ? (
          <NotificationSettings user={user} onUserUpdated={setUser}/>
        ) : active === "Live Telemetry" ? (
          <LiveTelemetryView chart={chart} connected={connected} latest={latest}/>
        ) : active === "Alerts" ? (
          <AlertsView alerts={alerts}/>
        ) : active === "Time-Series DB" ? (
          <TimeSeriesView stats={stats}/>
        ) : active === "Graph Builder" ? (
          <section className="page"><div className="page-title"><div><span className="eyebrow">NO-CODE AUTOMATION</span><h1>Graph Builder</h1><p>Build executable telemetry rules without writing business logic.</p></div><div className="page-actions"><span className="user-initial" title={user.name || user.email}>{userInitial}</span><button className="text-btn" onClick={logout}>Sign out</button></div></div><GraphBuilder onCompiled={setCompiled} activeEdgeIds={activeEdgeIds}/></section>
        ) : (
          <section className="page">
            <div className="page-title"><div><span className="eyebrow">FACTORY OPERATIONS / OVERVIEW</span><h1>Telemetry Command Center</h1><p>Monitor machine signals, stream health and active automation rules.</p></div><div className="page-actions"><div className="live-badge"><span className="pulse-dot"/><span>Real-time stream</span><b>{connected ? "CONNECTED" : "WAITING"}</b></div><span className="user-initial" title={user.name || user.email}>{userInitial}</span><button className="text-btn" onClick={logout}>Sign out</button></div></div>
            <div className="metrics-grid">
              <MetricCard label="Current temperature" value={latest.toFixed(1)} suffix="°C" delta={risk === "CRITICAL" ? 4.8 : 1.2} icon={Activity} tone="purple"/>
              <MetricCard label="Telemetry points" value={(stats.telemetry + chart.length).toLocaleString()} suffix="" delta={8.4} icon={RadioTower} tone="blue"/>
              <MetricCard label="Active rules" value="01" suffix="" delta={0} icon={Zap} tone="amber"/>
              <MetricCard label="Alerts triggered" value={alerts.length.toString().padStart(2, "0")} suffix="" delta={alerts.length ? 12.5 : 0} icon={BellRing} tone="red"/>
            </div>
            {simulationError && <div className="auth-error simulation-error">{simulationError}</div>}
            <div className="content-grid">
              <div className="panel chart-panel"><div className="panel-head"><div><b>Live temperature stream</b><small>turbine-01 / temperature</small></div><div className="chart-legend"><span/> Temperature <em>°C</em></div></div><TelemetryChart data={chart}/><div className="chart-footer"><span><i className="green-dot"/> Stream is healthy</span><span>Sampling every 900ms</span><span>WebSocket + RxJS</span></div></div>
              <div className="panel status-panel"><div className="panel-head"><div><b>Machine status</b><small>turbine-01</small></div><span className={`status-pill ${risk.toLowerCase()}`}>{risk}</span></div><div className="gauge"><div className="gauge-ring"><strong>{latest.toFixed(0)}<small>°C</small></strong><span>Current signal</span></div></div><div className="status-stats"><div><span>Pressure</span><b>112.4 psi</b></div><div><span>Vibration</span><b>2.8 mm/s</b></div></div></div>
            </div>
            <div className="lower-grid">
              <div className="panel workflow-panel"><div className="panel-head"><div><b>Active automation</b><small>Turbine Overheat Protection</small></div><button className="text-btn" onClick={() => setActive("Graph Builder")}>Open builder →</button></div><WorkflowMini active={simulation && connected}/><div className="compile-bar"><span><Server size={15}/> {compiled?.status || "Ready"} · RxJS stream compiler</span><span><Database size={14}/> MongoDB Time-Series</span></div></div>
              <div className="panel alert-panel"><div className="panel-head"><div><b>Recent alerts</b><small>Live rule evaluations</small></div><BellRing size={17}/></div><div className="alert-list">{alerts.length ? alerts.slice(0, 4).map((a, i) => <div className="alert-row" key={a.id || i}><span className="alert-icon"><BellRing size={14}/></span><div><b>{a.message}</b><small>{new Date(a.createdAt || Date.now()).toLocaleTimeString()}</small></div><span className="critical">CRITICAL</span></div>) : <div className="empty"><Sparkles size={18}/><span>No alerts yet. Start simulation to test the rule.</span></div>}</div></div>
            </div>
            <div className="footer-note"><Gauge size={14}/> Designed for high-frequency append-only telemetry · MongoDB Time-Series · Reactive RxJS pipelines · WebSocket streaming</div>
          </section>
        )}
      </main>
    </div>
  );
}
