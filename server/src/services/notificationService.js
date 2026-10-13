import { sendEmailNotification } from "./emailService.js";
import { sendTelegramNotification } from "./telegramService.js";

export async function sendNotification({ subject, emailMessage, telegramMessage, user }) {
  const results = await Promise.allSettled([
    sendEmailNotification({ subject, emailMessage, notificationEmail: user?.email }),
    sendTelegramNotification({ telegramMessage, telegramChatId: user?.telegramChatId })
  ]);
  const [email, telegram] = results.map((result, index) => result.status === "fulfilled"
    ? result.value
    : { status: "failed", message: `${index === 0 ? "Email" : "Telegram"} notification failed` });
  if (email.status === "failed") console.warn(email.message);
  if (telegram.status === "failed") console.warn(telegram.message);
  return { email, telegram };
}

export function sendUserNotification(user, notificationData) {
  return sendNotification({ ...notificationData, user });
}