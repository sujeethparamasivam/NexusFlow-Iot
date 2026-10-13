import test from "node:test";
import assert from "node:assert/strict";
import { createConfig } from "../src/config.js";

test("requires secure production settings", () => {
  assert.throws(() => createConfig({
    NODE_ENV: "production",
    CLIENT_URL: "https://nexusflow-client.onrender.com",
    MONGO_URI: "",
    JWT_SECRET: "",
    PORT: "5000",
    DB_NAME: "nexusflow"
  }), /MONGO_URI.*JWT_SECRET/i);

  const config = createConfig({
    NODE_ENV: "production",
    CLIENT_URL: "https://nexusflow-client.onrender.com",
    MONGO_URI: "mongodb+srv://user:pass@example.mongodb.net/nexusflow",
    JWT_SECRET: "super-secure-secret",
    PORT: "5000",
    DB_NAME: "nexusflow"
  });

  assert.equal(config.clientUrl, "https://nexusflow-client.onrender.com");
  assert.equal(config.dbName, "nexusflow");
  assert.equal(config.mongoUri, "mongodb+srv://user:pass@example.mongodb.net/nexusflow");
});
