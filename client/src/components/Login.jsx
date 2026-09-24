import { useState } from "react";
import { Activity, ArrowRight } from "lucide-react";
import { api, setAuthToken } from "../api";

export default function Login({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post(`/auth/${mode}`, form);
      localStorage.setItem("nexusflow_token", data.token);
      localStorage.setItem("nexusflow_user", JSON.stringify(data.user));
      setAuthToken(data.token);
      onAuthenticated(data.user);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-brand"><span className="auth-mark"><Activity size={18}/></span><div><b>NexusFlow</b><small>Telemetry command center</small></div></div>
        <div className="auth-heading"><span className="eyebrow">SECURE OPERATIONS</span><h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1><p>{mode === "login" ? "Sign in to monitor telemetry and receive rule alerts." : "Create an account to connect your notification destinations."}</p></div>
        <form className="auth-form" onSubmit={submit}>
          {mode === "register" && <label>Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Factory manager" /></label>}
          <label>Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@company.com" /></label>
          <label>Password<input required minLength={8} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" /></label>
          {error && <div className="auth-error">{error}</div>}
          <button className="auth-submit" disabled={busy}>{busy ? "Working..." : mode === "login" ? "Sign in" : "Create account"}<ArrowRight size={16}/></button>
        </form>
        <button className="auth-switch" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}> {mode === "login" ? "New to NexusFlow? Create an account" : "Already have an account? Sign in"}</button>
      </section>
    </main>
  );
}
