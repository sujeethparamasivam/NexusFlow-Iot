import { Activity, BellRing, Database, GitBranch, Gauge, LayoutDashboard, LogOut, Settings2, ShieldCheck, Zap } from "lucide-react";

const items = [
  [LayoutDashboard, "Overview"],
  [GitBranch, "Graph Builder"],
  [Activity, "Live Telemetry"],
  [BellRing, "Alerts"],
  [Database, "Time-Series DB"],
];

export default function Sidebar({ active, onSelect, showNotificationDot, user, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><Zap size={20} /></div>
        <div>
          <strong>Nexus<span>Flow</span></strong>
          <small>IoT RULE ENGINE</small>
        </div>
      </div>

      <div className="workspace-label">WORKSPACE</div>
      <nav>
        {items.map(([Icon, label]) => (
          <button key={label} className={active === label ? "nav-item active" : "nav-item"} onClick={() => onSelect(label)}>
            <Icon size={18} />
            <span>{label}</span>
            {label === "Alerts" && showNotificationDot && <i className="nav-dot" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="system-card">
          <div className="system-icon"><Gauge size={17} /></div>
          <div>
            <b>System health</b>
            <small><span className="pulse-dot" /> All systems operational</small>
          </div>
        </div>
        <button className={active === "Settings" ? "nav-item active" : "nav-item"} onClick={() => onSelect("Settings")}><Settings2 size={18} /><span>Settings</span></button>
        <div className="profile">
          <div className="avatar">{(user?.name || user?.email || "U").charAt(0).toUpperCase()}</div>
          <div><b>{user?.name || "System Manager"}</b><small>{user?.email || "Factory Operations"}</small></div>
          <ShieldCheck size={16} />
        </div>
        <button className="logout-btn" onClick={onLogout}><LogOut size={16}/><span>Sign out</span></button>
      </div>
    </aside>
  );
}
