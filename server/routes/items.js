import { Router } from "express";
import { query } from "../db/index.js";

const router = Router();

function mapAssetRow(row) {
  return {
    id: Number(row.id),
    itemId: Number(row.item_id),
    type: row.asset_type,
    title: row.title,
    url: row.url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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

function normalizeOptionalText(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function mapItemRow(row) {
  return {
    id: Number(row.id),
    name: row.name,
    price: Number(row.price),
    buyDate: formatDateOnly(row.buy_date),
    stopDate: formatDateOnly(row.stop_date),
    category: row.category,
    purchaseChannel: row.purchase_channel,
    bundleName: row.bundle_name,
    icon: row.icon,
    status: row.status,
    note: row.note,
    assets: Array.isArray(row.assets) ? row.assets : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function attachAssets(items) {
  if (!items.length) {
    return items;
  }

  const ids = items.map((item) => item.id);
  const assetsResult = await query(
    `
      SELECT id, item_id, asset_type, title, url, created_at, updated_at
      FROM item_assets
      WHERE item_id = ANY($1::bigint[])
      ORDER BY created_at DESC, id DESC
    `,
    [ids],
  );

  const assetsByItemId = assetsResult.rows.reduce((acc, row) => {
    const asset = mapAssetRow(row);
    if (!acc[asset.itemId]) {
      acc[asset.itemId] = [];
    }
    acc[asset.itemId].push(asset);
    return acc;
  }, {});

  return items.map((item) => ({
    ...item,
    assets: assetsByItemId[item.id] || [],
  }));
}

async function getItemById(id) {
  const result = await query(
    `
      SELECT id, name, price, buy_date, stop_date, category, purchase_channel, bundle_name, icon, status, note, created_at, updated_at
      FROM items
      WHERE id = $1
    `,
    [id],
  );

  if (result.rowCount === 0) {
    return null;
  }

  const [item] = await attachAssets(result.rows.map(mapItemRow));
  return item;
}

router.get("/items", async (req, res) => {
  try {
    const result = await query(`
      SELECT id, name, price, buy_date, stop_date, category, purchase_channel, bundle_name, icon, status, note, created_at, updated_at
      FROM items
      ORDER BY buy_date DESC, id DESC
    `);

    const items = await attachAssets(result.rows.map(mapItemRow));

    res.json({
      success: true,
      items,
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
  const { name, price, buyDate, category, purchaseChannel, bundleName, note, icon } = req.body;

  if (!name?.trim() || price === undefined || !buyDate) {
    return res.status(400).json({
      success: false,
      message: "name, price and buyDate are required",
    });
  }

  try {
    const result = await query(
      `
        INSERT INTO items (name, price, buy_date, category, purchase_channel, bundle_name, note, icon, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
        RETURNING id, name, price, buy_date, stop_date, category, purchase_channel, bundle_name, icon, status, note, created_at, updated_at
      `,
      [
        name.trim(),
        Number(price),
        buyDate,
        category || "未分类",
        normalizeOptionalText(purchaseChannel),
        normalizeOptionalText(bundleName),
        normalizeOptionalText(note),
        normalizeOptionalText(icon),
      ],
    );

    const item = await attachAssets(result.rows.map(mapItemRow));

    res.status(201).json({
      success: true,
      item: item[0],
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
  const { name, price, buyDate, stopDate, category, purchaseChannel, bundleName, note, icon, status } = req.body;

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
            purchase_channel = $6,
            bundle_name = $7,
            note = $8,
            icon = $9,
            status = $10
        WHERE id = $11
        RETURNING id, name, price, buy_date, stop_date, category, purchase_channel, bundle_name, icon, status, note, created_at, updated_at
      `,
      [
        name.trim(),
        Number(price),
        buyDate,
        stopDate || null,
        category || "未分类",
        normalizeOptionalText(purchaseChannel),
        normalizeOptionalText(bundleName),
        normalizeOptionalText(note),
        normalizeOptionalText(icon),
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

    const item = await attachAssets(result.rows.map(mapItemRow));

    res.json({
      success: true,
      item: item[0],
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
        RETURNING id, name, price, buy_date, stop_date, category, purchase_channel, bundle_name, icon, status, note, created_at, updated_at
      `,
      [status, stopDate, id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    const item = await attachAssets(result.rows.map(mapItemRow));

    res.json({
      success: true,
      item: item[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update item status",
      error: error.message,
    });
  }
});

router.post("/items/:id/assets", async (req, res) => {
  const { id } = req.params;
  const { type, title, url } = req.body;

  if (!["image", "product_image", "order_image", "tutorial_image", "tutorial", "link"].includes(type)) {
    return res.status(400).json({
      success: false,
      message: "asset type must be image, product_image, order_image, tutorial_image, tutorial or link",
    });
  }

  if (!url?.trim()) {
    return res.status(400).json({
      success: false,
      message: "asset url is required",
    });
  }

  try {
    const item = await getItemById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    const result = await query(
      `
        INSERT INTO item_assets (item_id, asset_type, title, url)
        VALUES ($1, $2, $3, $4)
        RETURNING id, item_id, asset_type, title, url, created_at, updated_at
      `,
      [id, type, title?.trim() || null, url.trim()],
    );

    res.status(201).json({
      success: true,
      asset: mapAssetRow(result.rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create item asset",
      error: error.message,
    });
  }
});

router.delete("/items/:id/assets/:assetId", async (req, res) => {
  const { id, assetId } = req.params;

  try {
    const result = await query(
      "DELETE FROM item_assets WHERE id = $1 AND item_id = $2",
      [assetId, id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Item asset not found",
      });
    }

    res.json({
      success: true,
      message: "Item asset deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete item asset",
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
