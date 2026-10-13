export async function dispatchNotification({ alert, node }) {
  const channel = node.data?.channel || alert.channel;

  if (channel === "mock-sms") {
    console.log(`[mock-sms] ${node.data?.recipient || "manager"}: ${alert.message}`);
    return { status: "delivered", message: "Mock SMS accepted" };
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
