import { Bell, Palette, Wifi } from "lucide-react";

export default function Topbar({ theme, onThemeChange, connected, simulation, onSimulation, onNotifications, showNotificationDot, manualTemperature, onManualTempChange, useManualTemp, onUseManualTempChange }) {
  return (
    <header className="topbar">
      <div className="breadcrumbs">
        <span>Workspace</span><b>/</b><strong>NexusFlow</strong>
      </div>
      <div className="top-actions">
        <div className="connection"><span className={connected ? "pulse-dot" : "offline-dot"} /> {connected ? "Live" : "Offline"}</div>
        <label className="theme-picker"><Palette size={15}/><span>Theme</span><select value={theme} onChange={(event) => onThemeChange(event.target.value)} aria-label="Choose theme"><option value="dark">Night</option><option value="white">White</option><option value="shy-blue">Shy blue</option></select></label>
        <button className="icon-button notification" aria-label="Open notifications" onClick={onNotifications}><Bell size={18}/>{showNotificationDot && <i/>}</button>
                {simulation && (
                  <div className="manual-temp-control">
                    <label className="temp-toggle">
                      <input type="checkbox" checked={useManualTemp} onChange={(e) => onUseManualTempChange(e.target.checked)} />
                      <span>Manual °C</span>
                    </label>
                    <input type="number" className="temp-input" value={manualTemperature} onChange={(e) => onManualTempChange(Number(e.target.value))} min="0" max="150" step="0.1" placeholder="Temperature" />
                  </div>
                )}
        <button className={simulation ? "simulation running" : "simulation"} onClick={onSimulation}>
          <Wifi size={16}/>{simulation ? "Stop simulation" : "Start simulation"}
        </button>
      </div>
    </header>
  );
}
