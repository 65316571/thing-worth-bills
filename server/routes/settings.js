import { Router } from "express";
import { query } from "../db/index.js";

const router = Router();

// 获取所有图片类型
router.get("/image-types", async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM image_types WHERE is_active = true ORDER BY sort_order ASC, id ASC"
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("获取图片类型失败:", error);
    res.status(500).json({ success: false, message: "获取图片类型失败" });
  }
});

// 获取所有图片类型（包含已禁用）
router.get("/image-types/all", async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM image_types ORDER BY sort_order ASC, id ASC"
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("获取图片类型失败:", error);
    res.status(500).json({ success: false, message: "获取图片类型失败" });
  }
});

// 创建图片类型
router.post("/image-types", async (req, res) => {
  try {
    const { key, label, description, sort_order = 0 } = req.body;
    
    if (!key || !label) {
      return res.status(400).json({ success: false, message: "标识和名称不能为空" });
    }
    
    const existing = await query("SELECT id FROM image_types WHERE key = $1", [key]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: "该标识已存在" });
    }
    
    const result = await query(
      "INSERT INTO image_types (key, label, description, sort_order) VALUES ($1, $2, $3, $4) RETURNING *",
      [key, label, description, sort_order]
    );
    
    res.json({ success: true, data: result.rows[0], message: "创建成功" });
  } catch (error) {
    console.error("创建图片类型失败:", error);
    res.status(500).json({ success: false, message: "创建图片类型失败" });
  }
});

// 更新图片类型
router.put("/image-types/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { label, description, sort_order, is_active } = req.body;
    
    const result = await query(
      "UPDATE image_types SET label = $1, description = $2, sort_order = $3, is_active = $4 WHERE id = $5 RETURNING *",
      [label, description, sort_order, is_active, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "图片类型不存在" });
    }
    
    res.json({ success: true, data: result.rows[0], message: "更新成功" });
  } catch (error) {
    console.error("更新图片类型失败:", error);
    res.status(500).json({ success: false, message: "更新图片类型失败" });
  }
});

// 删除图片类型
router.delete("/image-types/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const assets = await query(
      "SELECT COUNT(*)::int as count FROM item_assets WHERE asset_type = (SELECT key FROM image_types WHERE id = $1)", 
      [id]
    );
    if (assets.rows[0].count > 0) {
      return res.status(400).json({ success: false, message: "该图片类型下有关联资产，无法删除" });
    }
    
    const result = await query("DELETE FROM image_types WHERE id = $1 RETURNING *", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "图片类型不存在" });
    }
    
    res.json({ success: true, message: "删除成功" });
  } catch (error) {
    console.error("删除图片类型失败:", error);
    res.status(500).json({ success: false, message: "删除图片类型失败" });
  }
});

// 获取所有分类
router.get("/categories", async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM categories WHERE is_active = true ORDER BY sort_order ASC, id ASC"
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("获取分类失败:", error);
    res.status(500).json({ success: false, message: "获取分类失败" });
  }
});

// 获取所有分类（包含已禁用）
router.get("/categories/all", async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM categories ORDER BY sort_order ASC, id ASC"
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("获取分类失败:", error);
    res.status(500).json({ success: false, message: "获取分类失败" });
  }
});

// 创建分类
router.post("/categories", async (req, res) => {
  try {
    const { name, description, color = "#C84B31", sort_order = 0 } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: "分类名称不能为空" });
    }
    
    const existing = await query("SELECT id FROM categories WHERE name = $1", [name]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: "该分类名称已存在" });
    }
    
    const result = await query(
      "INSERT INTO categories (name, description, color, sort_order) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, description, color, sort_order]
    );
    
    res.json({ success: true, data: result.rows[0], message: "创建成功" });
  } catch (error) {
    console.error("创建分类失败:", error);
    res.status(500).json({ success: false, message: "创建分类失败" });
  }
});

// 更新分类
router.put("/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, sort_order, is_active } = req.body;
    
    if (name) {
      const existing = await query("SELECT id FROM categories WHERE name = $1 AND id != $2", [name, id]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ success: false, message: "该分类名称已存在" });
      }
    }
    
    const result = await query(
      "UPDATE categories SET name = $1, description = $2, color = $3, sort_order = $4, is_active = $5 WHERE id = $6 RETURNING *",
      [name, description, color, sort_order, is_active, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "分类不存在" });
    }
    
    res.json({ success: true, data: result.rows[0], message: "更新成功" });
  } catch (error) {
    console.error("更新分类失败:", error);
    res.status(500).json({ success: false, message: "更新分类失败" });
  }
});

// 删除分类
router.delete("/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await query("SELECT name FROM categories WHERE id = $1", [id]);
    if (category.rows.length === 0) {
      return res.status(404).json({ success: false, message: "分类不存在" });
    }
    
    const items = await query("SELECT COUNT(*)::int as count FROM items WHERE category = $1", [category.rows[0].name]);
    if (items.rows[0].count > 0) {
      return res.status(400).json({ success: false, message: "该分类下有关联物品，无法删除" });
    }
    
    await query("DELETE FROM categories WHERE id = $1", [id]);
    
    res.json({ success: true, message: "删除成功" });
  } catch (error) {
    console.error("删除分类失败:", error);
    res.status(500).json({ success: false, message: "删除分类失败" });
  }
});

export default router;

