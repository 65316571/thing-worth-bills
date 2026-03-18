import { initializeDatabase } from "../db/schema.js";
import { pool } from "../db/index.js";

async function run() {
  try {
    const result = await initializeDatabase({ withSeed: true });
    console.log("Database initialization completed:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Database initialization failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
