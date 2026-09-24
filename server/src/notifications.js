import { config } from "./config.js";

export async function dispatchNotification({ alert, node }) {
  const channel = node.data?.channel || alert.channel;

  if (channel === "mock-sms") {
    console.log(`[mock-sms] ${node.data?.recipient || "manager"}: ${alert.message}`);
    return { status: "delivered", message: "Mock SMS accepted" };
  }

  if (channel === "twilio-sms") {
    return sendTwilioSms(alert, node.data?.recipient);
  }

  if (channel === "webhook") {
    const url = node.data?.url;
    if (!url) return { status: "failed", message: "Webhook URL is missing" };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          severity: alert.severity,
          message: alert.message,
          deviceId: alert.deviceId,
          value: alert.value,
          createdAt: alert.createdAt
        }),
        signal: AbortSignal.timeout(5000)
      });
      return response.ok
        ? { status: "delivered", message: `Webhook responded ${response.status}` }
        : { status: "failed", message: `Webhook responded ${response.status}` };
    } catch (error) {
      return { status: "failed", message: error.message };
    }
  }

  return { status: "failed", message: `Unsupported notification channel: ${channel}` };
}

async function sendTwilioSms(alert, recipient) {
  const { accountSid, authToken, fromNumber } = config.twilio;
  if (!accountSid || !authToken || !fromNumber || !recipient) {
    return { status: "failed", message: "Twilio credentials, sender, and recipient are required" };
  }

  const body = new URLSearchParams({
    To: recipient,
    From: fromNumber,
    Body: `[NexusFlow] ${alert.message}`
  });

  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "content-type": "application/x-www-form-urlencoded"
      },
      body,
      signal: AbortSignal.timeout(10000)
    });
    const result = await response.json();
    if (!response.ok) return { status: "failed", message: result.message || `Twilio responded ${response.status}` };
    return { status: "delivered", message: `Twilio message accepted (${result.sid})` };
  } catch (error) {
    return { status: "failed", message: error.message };
  }
}