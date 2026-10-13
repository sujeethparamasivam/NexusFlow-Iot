import { Activity, Filter, GitBranch, MessageSquareText } from "lucide-react";

const nodes = [
  ["Turbine Sensor", Activity, "source"],
  ["Moving Average", Filter, "filter"],
  ["Temp > 80°C", GitBranch, "rule"],
  ["SMS Alert", MessageSquareText, "alert"]
];

export default function WorkflowMini({ active }) {
  return (
    <div className="workflow-mini">
      {nodes.map(([name, Icon, type], i) => (
        <div className="workflow-step" key={name}>
          <div className={`workflow-node ${type} ${active ? "active-flow" : ""}`}><Icon size={18}/><span>{name}</span><small>{i === 0 ? "INPUT" : i === 3 ? "ACTION" : "PROCESS"}</small></div>
          {i < nodes.length - 1 && <div className={`workflow-line ${active ? "flowing" : ""}`}><i/></div>}
        </div>
      ))}
    </div>
  );
}
