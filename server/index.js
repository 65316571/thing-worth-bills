import cors from "cors";
import express from "express";
import healthRouter from "./routes/health.js";
import itemsRouter from "./routes/items.js";
import setupRouter from "./routes/setup.js";
import wishesRouter from "./routes/wishes.js";
import { env } from "./config/env.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: `Welcome to ${env.appName} API`,
  });
});

app.use("/api", healthRouter);
app.use("/api", itemsRouter);
app.use("/api", setupRouter);
app.use("/api", wishesRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

app.listen(env.port, () => {
  console.log(`${env.appName} server listening on http://localhost:${env.port}`);
});
