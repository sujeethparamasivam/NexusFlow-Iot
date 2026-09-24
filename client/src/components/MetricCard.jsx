import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function MetricCard({ label, value, suffix, delta, icon: Icon, tone = "" }) {
  return (
    <div className="metric-card">
      <div className="metric-top"><span>{label}</span><div className={`metric-icon ${tone}`}><Icon size={17}/></div></div>
      <div className="metric-value">{value}<small>{suffix}</small></div>
      <div className={delta >= 0 ? "delta positive" : "delta negative"}>
        {delta >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>} {Math.abs(delta)}% <span>vs last hour</span>
      </div>
    </div>
  );
}
