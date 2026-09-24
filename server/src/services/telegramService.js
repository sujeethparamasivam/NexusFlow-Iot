import { config } from "../config.js";

export async function sendTelegramNotification({ telegramMessage, telegramChatId: userChatId }) {
  const { telegramBotToken } = config.notifications;
  const telegramChatId = userChatId;
  if (!telegramBotToken || !telegramChatId) {
    return { status: "skipped", message: "Telegram notification settings are incomplete" };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: telegramChatId, text: telegramMessage, parse_mode: "HTML" }),
      signal: AbortSignal.timeout(10000)
    });
    const result = await response.json();
    if (!response.ok || !result.ok) return { status: "failed", message: "Telegram API rejected the notification" };
    return { status: "sent", message: "Telegram notification sent" };
  } catch (error) {
    return { status: "failed", message: `Telegram delivery failed: ${error.message}` };
  }
}