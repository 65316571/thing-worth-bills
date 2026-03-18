import { Router } from "express";
import { initializeDatabase } from "../db/schema.js";

const router = Router();

router.post("/setup/init", async (req, res) => {
  const withSeed = req.body?.withSeed !== false;

  try {
    const result = await initializeDatabase({ withSeed });

    res.json({
      success: true,
      message: "Database schema initialized successfully",
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to initialize database schema",
      error: error.message,
    });
  }
});

export default router;
