import { Router } from "express";
import { query } from "../db/index.js";

const router = Router();

function mapWishRow(row) {
  return {
    id: Number(row.id),
    name: row.name,
    targetPrice: Number(row.target_price),
    currentPrice: row.current_price === null ? null : Number(row.current_price),
    category: row.category,
    note: row.note,
    link: row.link,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get("/wishes", async (req, res) => {
  try {
    const result = await query(`
      SELECT id, name, target_price, current_price, category, note, link, created_at, updated_at
      FROM wishes
      ORDER BY id DESC
    `);

    res.json({
      success: true,
      wishes: result.rows.map(mapWishRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch wishes",
      error: error.message,
    });
  }
});

router.post("/wishes", async (req, res) => {
  const { name, targetPrice, currentPrice, category, note, link } = req.body;

  if (!name?.trim() || targetPrice === undefined) {
    return res.status(400).json({
      success: false,
      message: "name and targetPrice are required",
    });
  }

  try {
    const result = await query(
      `
        INSERT INTO wishes (name, target_price, current_price, category, note, link)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, target_price, current_price, category, note, link, created_at, updated_at
      `,
      [
        name.trim(),
        Number(targetPrice),
        currentPrice === undefined || currentPrice === "" ? null : Number(currentPrice),
        category || "未分类",
        note || null,
        link || null,
      ],
    );

    res.status(201).json({
      success: true,
      wish: mapWishRow(result.rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create wish",
      error: error.message,
    });
  }
});

router.delete("/wishes/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query("DELETE FROM wishes WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Wish not found",
      });
    }

    res.json({
      success: true,
      message: "Wish deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete wish",
      error: error.message,
    });
  }
});

export default router;
