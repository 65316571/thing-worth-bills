import { Router } from "express";
import { query } from "../db/index.js";

const router = Router();
const ALLOWED_ASSET_TYPES = ["image", "product_image", "order_image", "tutorial_image", "tutorial", "link"];

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

  if (!ALLOWED_ASSET_TYPES.includes(type)) {
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

router.put("/items/:id/assets/:assetId", async (req, res) => {
  const { id, assetId } = req.params;
  const body = req.body || {};
  const hasType = Object.prototype.hasOwnProperty.call(body, "type");
  const hasTitle = Object.prototype.hasOwnProperty.call(body, "title");
  const { type, title } = body;

  if (!hasType && !hasTitle) {
    return res.status(400).json({
      success: false,
      message: "type or title is required",
    });
  }

  if (hasType && !type) {
    return res.status(400).json({
      success: false,
      message: "type is required",
    });
  }

  if (hasType && !ALLOWED_ASSET_TYPES.includes(type)) {
    return res.status(400).json({
      success: false,
      message: "asset type must be image, product_image, order_image, tutorial_image, tutorial or link",
    });
  }

  try {
    const nextTitle = hasTitle ? (title === null ? null : String(title).trim() || null) : undefined;
    const result = await query(
      `
        UPDATE item_assets
        SET asset_type = CASE WHEN $1 THEN $2 ELSE asset_type END,
            title = CASE WHEN $3 THEN $4 ELSE title END,
            updated_at = NOW()
        WHERE id = $5 AND item_id = $6
        RETURNING id, item_id, asset_type, title, url, created_at, updated_at
      `,
      [hasType, type || null, hasTitle, nextTitle ?? null, assetId, id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Item asset not found",
      });
    }

    res.json({
      success: true,
      asset: mapAssetRow(result.rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update item asset",
      error: error.message,
    });
  }
});

router.put("/assets/:assetId", async (req, res) => {
  const { assetId } = req.params;
  const body = req.body || {};
  const hasItemId = Object.prototype.hasOwnProperty.call(body, "itemId");
  const hasType = Object.prototype.hasOwnProperty.call(body, "type");
  const hasTitle = Object.prototype.hasOwnProperty.call(body, "title");
  const hasUrl = Object.prototype.hasOwnProperty.call(body, "url");
  const { itemId, type, title, url } = body;

  if (!hasItemId && !hasType && !hasTitle && !hasUrl) {
    return res.status(400).json({
      success: false,
      message: "itemId, type, title or url is required",
    });
  }

  if (hasItemId && (!Number.isFinite(Number(itemId)) || Number(itemId) <= 0)) {
    return res.status(400).json({
      success: false,
      message: "itemId must be a positive number",
    });
  }

  if (hasType && !type) {
    return res.status(400).json({
      success: false,
      message: "type is required",
    });
  }

  if (hasType && !ALLOWED_ASSET_TYPES.includes(type)) {
    return res.status(400).json({
      success: false,
      message: "asset type must be image, product_image, order_image, tutorial_image, tutorial or link",
    });
  }

  if (hasUrl && !String(url || "").trim()) {
    return res.status(400).json({
      success: false,
      message: "url is required",
    });
  }

  try {
    const nextItemId = hasItemId ? Number(itemId) : null;
    const nextTitle = hasTitle ? (title === null ? null : String(title).trim() || null) : null;
    const nextUrl = hasUrl ? String(url).trim() : null;

    if (hasItemId) {
      const itemResult = await query("SELECT id FROM items WHERE id = $1", [nextItemId]);
      if (itemResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Item not found",
        });
      }
    }

    const result = await query(
      `
        UPDATE item_assets
        SET item_id = CASE WHEN $1 THEN $2 ELSE item_id END,
            asset_type = CASE WHEN $3 THEN $4 ELSE asset_type END,
            title = CASE WHEN $5 THEN $6 ELSE title END,
            url = CASE WHEN $7 THEN $8 ELSE url END,
            updated_at = NOW()
        WHERE id = $9
        RETURNING id, item_id, asset_type, title, url, created_at, updated_at
      `,
      [hasItemId, nextItemId, hasType, type || null, hasTitle, nextTitle, hasUrl, nextUrl, assetId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Item asset not found",
      });
    }

    const updated = result.rows[0];
    const itemNameResult = await query("SELECT name FROM items WHERE id = $1", [updated.item_id]);
    const itemName = itemNameResult.rows[0]?.name || "";

    res.json({
      success: true,
      asset: {
        ...mapAssetRow(updated),
        itemName,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update asset",
      error: error.message,
    });
  }
});

router.get("/assets", async (req, res) => {
  const { type, itemKeyword, titleKeyword } = req.query;

  try {
    const where = [];
    const params = [];
    let index = 1;

    if (type) {
      where.push(`a.asset_type = $${index}`);
      params.push(type);
      index += 1;
    }

    if (itemKeyword) {
      where.push(`i.name ILIKE $${index}`);
      params.push(`%${String(itemKeyword)}%`);
      index += 1;
    }

    if (titleKeyword) {
      where.push(`COALESCE(a.title, '') ILIKE $${index}`);
      params.push(`%${String(titleKeyword)}%`);
      index += 1;
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const result = await query(
      `
        SELECT a.id, a.item_id, a.asset_type, a.title, a.url, a.created_at, a.updated_at,
               i.name AS item_name
        FROM item_assets a
        JOIN items i ON i.id = a.item_id
        ${whereSql}
        ORDER BY a.created_at DESC, a.id DESC
      `,
      params,
    );

    const assets = result.rows.map((row) => ({
      ...mapAssetRow(row),
      itemName: row.item_name,
    }));

    res.json({
      success: true,
      assets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch assets",
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
