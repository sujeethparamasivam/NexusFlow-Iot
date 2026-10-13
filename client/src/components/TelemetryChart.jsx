import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function TelemetryChart({ data }) {
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c5cff" stopOpacity={0.32}/>
              <stop offset="100%" stopColor="#7c5cff" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#20283a" vertical={false}/>
          <XAxis dataKey="time" stroke="#64708a" tickLine={false} axisLine={false}/>
          <YAxis domain={["auto", "auto"]} stroke="#64708a" tickLine={false} axisLine={false} width={36}/>
          <Tooltip contentStyle={{ background: "#101625", border: "1px solid #29334a", borderRadius: 12, color: "#fff" }} />
          <Area type="monotone" dataKey="temperature" stroke="#8c72ff" strokeWidth={2.5} fill="url(#tempFill)" dot={false} activeDot={{ r: 4 }}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
