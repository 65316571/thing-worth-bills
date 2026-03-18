import { Router } from "express";
import { query } from "../db/index.js";

const router = Router();

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

function mapItemRow(row) {
  return {
    id: Number(row.id),
    name: row.name,
    price: Number(row.price),
    buyDate: formatDateOnly(row.buy_date),
    stopDate: formatDateOnly(row.stop_date),
    category: row.category,
    icon: row.icon,
    status: row.status,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get("/items", async (req, res) => {
  try {
    const result = await query(`
      SELECT id, name, price, buy_date, stop_date, category, icon, status, note, created_at, updated_at
      FROM items
      ORDER BY buy_date DESC, id DESC
    `);

    res.json({
      success: true,
      items: result.rows.map(mapItemRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch items",
      error: error.message,
    });
  }
});

router.post("/items", async (req, res) => {
  const { name, price, buyDate, category, note, icon } = req.body;

  if (!name?.trim() || price === undefined || !buyDate) {
    return res.status(400).json({
      success: false,
      message: "name, price and buyDate are required",
    });
  }

  try {
    const result = await query(
      `
        INSERT INTO items (name, price, buy_date, category, note, icon, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'active')
        RETURNING id, name, price, buy_date, stop_date, category, icon, status, note, created_at, updated_at
      `,
      [name.trim(), Number(price), buyDate, category || "未分类", note || null, icon || null],
    );

    res.status(201).json({
      success: true,
      item: mapItemRow(result.rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create item",
      error: error.message,
    });
  }
});

router.put("/items/:id", async (req, res) => {
  const { id } = req.params;
  const { name, price, buyDate, stopDate, category, note, icon, status } = req.body;

  if (!name?.trim() || price === undefined || !buyDate) {
    return res.status(400).json({
      success: false,
      message: "name, price and buyDate are required",
    });
  }

  try {
    const result = await query(
      `
        UPDATE items
        SET name = $1,
            price = $2,
            buy_date = $3,
            stop_date = $4,
            category = $5,
            note = $6,
            icon = $7,
            status = $8
        WHERE id = $9
        RETURNING id, name, price, buy_date, stop_date, category, icon, status, note, created_at, updated_at
      `,
      [
        name.trim(),
        Number(price),
        buyDate,
        stopDate || null,
        category || "未分类",
        note || null,
        icon || null,
        status || "active",
        id,
      ],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    res.json({
      success: true,
      item: mapItemRow(result.rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update item",
      error: error.message,
    });
  }
});

router.patch("/items/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["active", "inactive"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "status must be active or inactive",
    });
  }

  const stopDate = status === "inactive" ? new Date().toISOString().split("T")[0] : null;

  try {
    const result = await query(
      `
        UPDATE items
        SET status = $1,
            stop_date = $2
        WHERE id = $3
        RETURNING id, name, price, buy_date, stop_date, category, icon, status, note, created_at, updated_at
      `,
      [status, stopDate, id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    res.json({
      success: true,
      item: mapItemRow(result.rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update item status",
      error: error.message,
    });
  }
});

router.delete("/items/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query("DELETE FROM items WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    res.json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete item",
      error: error.message,
    });
  }
});

export default router;
