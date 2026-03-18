import { Router } from "express";
import { checkDatabaseConnection } from "../db/index.js";
import { env } from "../config/env.js";

const router = Router();

router.get("/health", async (req, res) => {
  try {
    const db = await checkDatabaseConnection();

    res.json({
      success: true,
      message: `${env.appName} backend is running`,
      appName: env.appName,
      environment: env.nodeEnv,
      databaseTime: db.now,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

export default router;
