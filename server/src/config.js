import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be configured in production.");
}

const defaultClientUrls = ["http://localhost:5173", "http://localhost:5174"];
const parseClientUrls = () => {
  const configured = String(process.env.CLIENT_URL || "").trim();
  const urls = configured ? configured.split(",").map((item) => item.trim()).filter(Boolean) : [];
  return urls.length ? urls : defaultClientUrls;
};

export const config = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017",
  dbName: process.env.DB_NAME || "nexusflow",
  clientUrls: parseClientUrls(),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_FROM_NUMBER
  },
  alertCooldownMs: Number(process.env.ALERT_COOLDOWN_MS || 10000),
  jwtSecret: process.env.JWT_SECRET || "change-this-development-secret",
  notifications: {
    emailUser: process.env.EMAIL_USER,
    emailAppPassword: process.env.EMAIL_APP_PASSWORD,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN
  }
};
