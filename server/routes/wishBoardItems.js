import { Router } from "express";
import { query } from "../db/index.js";

const router = Router();

function normalizeOptionalText(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function mapWishBoardRow(row) {
  return {
    id: Number(row.id),
    name: row.name,
    targetPrice: Number(row.target_price || 0),
    category: row.category,
    priority: row.priority,
    purpose: row.purchase_purpose,
    note: row.note,
    desiredChannel: row.desired_channel,
    targetDate: row.target_date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get("/wish-board-items", async (req, res) => {
  try {
    const result = await query(
      `
        SELECT id, name, target_price, category, priority, purchase_purpose, note,
               desired_channel, target_date, status, created_at, updated_at
        FROM wish_board_items
        ORDER BY created_at DESC, id DESC
      `,
    );

    res.json({
      success: true,
      wishes: result.rows.map(mapWishBoardRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch wish board items",
      error: error.message,
    });
  }
});

router.post("/wish-board-items", async (req, res) => {
  const {
    name,
    targetPrice,
    category,
    priority,
    purpose,
    note,
    desiredChannel,
    targetDate,
    status,
  } = req.body;

  if (!name?.trim() || targetPrice === undefined || targetPrice === "") {
    return res.status(400).json({
      success: false,
      message: "name and targetPrice are required",
    });
  }

  try {
    const result = await query(
      `
        INSERT INTO wish_board_items (
          name, target_price, category, priority, purchase_purpose, note, desired_channel, target_date, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, name, target_price, category, priority, purchase_purpose, note,
                  desired_channel, target_date, status, created_at, updated_at
      `,
      [
        name.trim(),
        Number(targetPrice),
        category || "未分类",
        priority || "medium",
        normalizeOptionalText(purpose),
        normalizeOptionalText(note),
        normalizeOptionalText(desiredChannel),
        targetDate || null,
        status || "planning",
      ],
    );

    res.status(201).json({
      success: true,
      wish: mapWishBoardRow(result.rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create wish board item",
      error: error.message,
    });
  }
});

router.delete("/wish-board-items/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query("DELETE FROM wish_board_items WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Wish board item not found",
      });
    }

    res.json({
      success: true,
      message: "Wish board item deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete wish board item",
      error: error.message,
    });
  }
});

export default router;