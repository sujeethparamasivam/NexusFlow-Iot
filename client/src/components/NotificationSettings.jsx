import { useState } from "react";
import { BellRing, Check, Send } from "lucide-react";
import { api } from "../api";

export default function NotificationSettings({ user }) {
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const test = async () => {
    setSaving(true);
    setStatus("");
    try {
      const { data } = await api.post("/auth/notifications/test");
      setStatus(`Email: ${data.email.status}.`);
    } catch (error) {
      setStatus(error.response?.data?.error || "Could not send test notification");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="page settings-page">
      <div className="page-title"><div><span className="eyebrow">ACCOUNT SETTINGS</span><h1>Notifications</h1><p>Choose where your NexusFlow rule alerts should be delivered.</p></div><BellRing size={22}/></div>
      <div className="settings-grid">
        <div className="panel settings-panel">
          <div className="panel-head"><div><b>Notification destinations</b><small>Stored securely with your user profile</small></div><Check size={17}/></div>
          <label>Email address<input type="email" value={user.email} readOnly /></label>
          <button className="text-btn settings-test" type="button" onClick={test} disabled={saving}><Send size={15}/> Send test notification</button>
          {status && <div className="settings-status">{status}</div>}
        </div>
      </div>
    </section>
  );
}
