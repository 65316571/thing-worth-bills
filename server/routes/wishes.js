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

function formatDateOnly(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function mapWishBoardItemRow(row) {
  return {
    id: Number(row.id),
    name: row.name,
    targetPrice: Number(row.target_price),
    category: row.category,
    priority: row.priority,
    purpose: row.purchase_purpose,
    note: row.note,
    desiredChannel: row.desired_channel,
    targetDate: formatDateOnly(row.target_date),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/wishes - 获取心愿列表
router.get("/wishes", async (req, res) => {
  try {
    const result = await query(`
      SELECT id, name, target_price, category, priority, purchase_purpose, note, desired_channel, target_date, status, created_at, updated_at
      FROM wish_board_items
      ORDER BY created_at DESC, id DESC
    `);

    const wishes = result.rows.map(mapWishBoardItemRow);

    res.json({
      success: true,
      wishes,
    });
  } catch (error) {
    console.error("Error fetching wishes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch wishes",
      error: error.message,
    });
  }
});

// POST /api/wishes - 添加心愿
router.post("/wishes", async (req, res) => {
  const { name, targetPrice, category, priority, purpose, note, desiredChannel, targetDate, status } = req.body;

  if (!name?.trim() || targetPrice === undefined) {
    return res.status(400).json({
      success: false,
      message: "name and targetPrice are required",
    });
  }

  try {
    const result = await query(
      `
        INSERT INTO wish_board_items (name, target_price, category, priority, purchase_purpose, note, desired_channel, target_date, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, name, target_price, category, priority, purchase_purpose, note, desired_channel, target_date, status, created_at, updated_at
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

    const wish = mapWishBoardItemRow(result.rows[0]);

    res.status(201).json({
      success: true,
      wish,
    });
  } catch (error) {
    console.error("Error creating wish:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create wish",
      error: error.message,
    });
  }
});

// DELETE /api/wishes/:id - 删除心愿
router.delete("/wishes/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query("DELETE FROM wish_board_items WHERE id = $1", [id]);

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
    console.error("Error deleting wish:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete wish",
      error: error.message,
    });
  }
});

export default router;
