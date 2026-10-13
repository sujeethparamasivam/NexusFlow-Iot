import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const defaultClientUrls = ["http://localhost:5173", "http://localhost:5174"];
const defaultMongoUri = "mongodb://127.0.0.1:27017/nexusflow";

function normalizeList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isValidMongoUri(value) {
  if (!value) return false;
  return /^mongodb(?:\+srv)?:\/\//i.test(value);
}

export function createConfig(env = process.env) {
  const isProduction = env.NODE_ENV === "production";
  const mongoUri = (env.MONGO_URI || defaultMongoUri).trim();
  const jwtSecret = (env.JWT_SECRET || "development-secret-change-me").trim();
  const clientUrls = normalizeList(env.CLIENT_URL || defaultClientUrls.join(","));

  if (isProduction) {
    const missing = [];
    if (!env.MONGO_URI || !isValidMongoUri(env.MONGO_URI)) missing.push("MONGO_URI");
    if (!env.JWT_SECRET || !env.JWT_SECRET.trim()) missing.push("JWT_SECRET");
    if (!env.CLIENT_URL || !env.CLIENT_URL.trim()) missing.push("CLIENT_URL");
    if (missing.length) {
      throw new Error(`Missing required production environment variables: ${missing.join(", ")}.`);
    }
  }

  if (!isValidMongoUri(mongoUri)) {
    throw new Error("MONGO_URI must be a valid mongodb:// or mongodb+srv:// connection string.");
  }

  if (isProduction && !jwtSecret) {
    throw new Error("JWT_SECRET must be configured in production.");
  }

  return {
    port: Number(env.PORT || 5000),
    mongoUri,
    dbName: env.DB_NAME || "nexusflow",
    clientUrls,
    clientUrl: env.CLIENT_URL || "http://localhost:5173",
    alertCooldownMs: Number(env.ALERT_COOLDOWN_MS || 10000),
    jwtSecret,
    notifications: {
      emailUser: env.EMAIL_USER,
      emailAppPassword: env.EMAIL_APP_PASSWORD,
      telegramBotToken: env.TELEGRAM_BOT_TOKEN
    }
  };
}

export const config = createConfig();
