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

function normalizeBenefits(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).join(",");
  }

  if (typeof value === "string") {
    return value
      .split(/[,，、\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .join(",");
  }

  return "";
}

function mapVipRow(row) {
  return {
    id: Number(row.id),
    name: row.name,
    level: row.level,
    website: row.website,
    account: row.account_label,
    renewalCycle: row.renewal_cycle,
    price: row.price === null ? null : Number(row.price),
    currency: row.currency,
    benefits: row.benefits ? row.benefits.split(",").map((item) => item.trim()).filter(Boolean) : [],
    expireAt: row.expire_at,
    remindBeforeDays: Number(row.remind_before_days || 0),
    autoRenew: Boolean(row.auto_renew),
    status: row.status,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get("/vip-memberships", async (req, res) => {
  try {
    const result = await query(
      `
        SELECT id, name, level, website, account_label, renewal_cycle, price, currency,
               benefits, expire_at, remind_before_days, auto_renew, status, note, created_at, updated_at
        FROM vip_memberships
        ORDER BY expire_at ASC, id DESC
      `,
    );

    res.json({
      success: true,
      vips: result.rows.map(mapVipRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch vip memberships",
      error: error.message,
    });
  }
});

router.post("/vip-memberships", async (req, res) => {
  const {
    name,
    level,
    website,
    account,
    renewalCycle,
    price,
    currency,
    benefits,
    expireAt,
    remindBeforeDays,
    autoRenew,
    status,
    note,
  } = req.body;

  if (!name?.trim() || !website?.trim() || !expireAt) {
    return res.status(400).json({
      success: false,
      message: "name, website and expireAt are required",
    });
  }

  try {
    const result = await query(
      `
        INSERT INTO vip_memberships (
          name, level, website, account_label, renewal_cycle, price, currency, benefits,
          expire_at, remind_before_days, auto_renew, status, note
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, name, level, website, account_label, renewal_cycle, price, currency,
                  benefits, expire_at, remind_before_days, auto_renew, status, note, created_at, updated_at
      `,
      [
        name.trim(),
        normalizeOptionalText(level),
        website.trim(),
        normalizeOptionalText(account),
        normalizeOptionalText(renewalCycle),
        price === undefined || price === "" ? null : Number(price),
        currency || "CNY",
        normalizeBenefits(benefits),
        expireAt,
        Number.isFinite(Number(remindBeforeDays)) ? Number(remindBeforeDays) : 7,
        Boolean(autoRenew),
        status || "active",
        normalizeOptionalText(note),
      ],
    );

    res.status(201).json({
      success: true,
      vip: mapVipRow(result.rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create vip membership",
      error: error.message,
    });
  }
});

router.put("/vip-memberships/:id", async (req, res) => {
  const { id } = req.params;
  const {
    name,
    level,
    website,
    account,
    renewalCycle,
    price,
    currency,
    benefits,
    expireAt,
    remindBeforeDays,
    autoRenew,
    status,
    note,
  } = req.body;

  if (!name?.trim() || !website?.trim() || !expireAt) {
    return res.status(400).json({
      success: false,
      message: "name, website and expireAt are required",
    });
  }

  try {
    const result = await query(
      `
        UPDATE vip_memberships
        SET name = $1,
            level = $2,
            website = $3,
            account_label = $4,
            renewal_cycle = $5,
            price = $6,
            currency = $7,
            benefits = $8,
            expire_at = $9,
            remind_before_days = $10,
            auto_renew = $11,
            status = $12,
            note = $13
        WHERE id = $14
        RETURNING id, name, level, website, account_label, renewal_cycle, price, currency,
                  benefits, expire_at, remind_before_days, auto_renew, status, note, created_at, updated_at
      `,
      [
        name.trim(),
        normalizeOptionalText(level),
        website.trim(),
        normalizeOptionalText(account),
        normalizeOptionalText(renewalCycle),
        price === undefined || price === "" ? null : Number(price),
        currency || "CNY",
        normalizeBenefits(benefits),
        expireAt,
        Number.isFinite(Number(remindBeforeDays)) ? Number(remindBeforeDays) : 7,
        Boolean(autoRenew),
        status || "active",
        normalizeOptionalText(note),
        id,
      ],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Vip membership not found",
      });
    }

    res.json({
      success: true,
      vip: mapVipRow(result.rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update vip membership",
      error: error.message,
    });
  }
});

router.delete("/vip-memberships/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query("DELETE FROM vip_memberships WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Vip membership not found",
      });
    }

    res.json({
      success: true,
      message: "Vip membership deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete vip membership",
      error: error.message,
    });
  }
});

export default router;