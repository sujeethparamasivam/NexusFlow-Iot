import mongoose from "mongoose";
import { config } from "./config.js";

export async function connectDatabase() {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await mongoose.connect(config.mongoUri, {
        dbName: config.dbName,
        serverSelectionTimeoutMS: 10000
      });
      break;
    } catch (error) {
      lastError = error;
      if (attempt === 3) {
        throw new Error(
          `MongoDB connection failed after 3 attempts. Check MONGO_URI and whitelist this machine's public IP in MongoDB Atlas. Original error: ${error.message}`
        );
      }
      console.warn(`MongoDB connection attempt ${attempt} failed; retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  if (lastError && mongoose.connection.readyState !== 1) throw lastError;
  const db = mongoose.connection.db;
  const collections = await db.listCollections({ name: "telemetry" }).toArray();

  if (!collections.length) {
    await db.createCollection("telemetry", {
      timeseries: {
        timeField: "timestamp",
        metaField: "meta",
        granularity: "seconds"
      }
    });
    console.log("Created MongoDB Time-Series collection: telemetry");
  }
  console.log(`MongoDB connected: ${config.dbName}`);
}

export const telemetryCollection = () =>
  mongoose.connection.db.collection("telemetry");
