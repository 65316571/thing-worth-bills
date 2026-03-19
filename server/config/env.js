import dotenv from "dotenv";

dotenv.config();

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
}

function trimTrailingSlash(value) {
  return value ? String(value).replace(/\/+$/, "") : "";
}

export const env = {
  appName: process.env.APP_NAME || "ThingWorthBills",
  nodeEnv: process.env.NODE_ENV || "development",
  port: toNumber(process.env.PORT, 3001),
  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: toNumber(process.env.DB_PORT, 5432),
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "thing_worth_bills",
    ssl: toBoolean(process.env.DB_SSL, false),
  },
  oss: {
    region: process.env.OSS_REGION || "",
    accessKeyId: process.env.OSS_ACCESS_KEY_ID || "",
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || "",
    bucket: process.env.OSS_BUCKET || "",
    publicBaseUrl: trimTrailingSlash(process.env.OSS_PUBLIC_URL || ""),
  },
};
