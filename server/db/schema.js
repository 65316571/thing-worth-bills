import { query } from "./index.js";

const CREATE_ITEMS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS items (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    buy_date DATE NOT NULL,
    stop_date DATE,
    category VARCHAR(100) NOT NULL DEFAULT '未分类',
    purchase_channel VARCHAR(255),
    bundle_name VARCHAR(255),
    icon TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT items_status_check CHECK (status IN ('active', 'inactive'))
  );
`;

const ALTER_ITEMS_ADD_PURCHASE_CHANNEL_SQL = `
  ALTER TABLE items
  ADD COLUMN IF NOT EXISTS purchase_channel VARCHAR(255);
`;

const ALTER_ITEMS_ADD_BUNDLE_NAME_SQL = `
  ALTER TABLE items
  ADD COLUMN IF NOT EXISTS bundle_name VARCHAR(255);
`;

const CREATE_ITEM_ASSETS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS item_assets (
    id BIGSERIAL PRIMARY KEY,
    item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    asset_type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT item_assets_type_check CHECK (asset_type IN ('image', 'product_image', 'order_image', 'tutorial_image', 'tutorial', 'link'))
  );
`;

const FIX_ITEM_ASSETS_TYPE_CONSTRAINT_SQL = `
  ALTER TABLE item_assets
  DROP CONSTRAINT IF EXISTS item_assets_type_check;
`;

const ADD_ITEM_ASSETS_TYPE_CONSTRAINT_SQL = `
  ALTER TABLE item_assets
  ADD CONSTRAINT item_assets_type_check
  CHECK (asset_type IN ('image', 'product_image', 'order_image', 'tutorial_image', 'tutorial', 'link'));
`;

const CREATE_WISH_BOARD_ITEMS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS wish_board_items (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    target_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    category VARCHAR(100) NOT NULL DEFAULT '未分类',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    purchase_purpose TEXT,
    note TEXT,
    desired_channel VARCHAR(255),
    target_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'planning',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT wish_board_items_priority_check CHECK (priority IN ('low', 'medium', 'high')),
    CONSTRAINT wish_board_items_status_check CHECK (status IN ('planning', 'watching', 'ready', 'purchased', 'archived'))
  );
`;

const CREATE_VIP_MEMBERSHIPS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS vip_memberships (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    level VARCHAR(100),
    website TEXT NOT NULL,
    account_label VARCHAR(255),
    renewal_cycle VARCHAR(50),
    price NUMERIC(12, 2),
    currency VARCHAR(20) NOT NULL DEFAULT 'CNY',
    benefits TEXT NOT NULL DEFAULT '',
    expire_at DATE NOT NULL,
    remind_before_days INTEGER NOT NULL DEFAULT 7,
    auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT vip_memberships_status_check CHECK (status IN ('active', 'expiring', 'expired', 'urgent')),
    CONSTRAINT vip_memberships_remind_before_days_check CHECK (remind_before_days >= 0)
  );
`;

const CREATE_UPDATED_AT_FUNCTION_SQL = `
  CREATE OR REPLACE FUNCTION set_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
`;

const CREATE_ITEMS_UPDATED_AT_TRIGGER_SQL = `
  DROP TRIGGER IF EXISTS items_set_updated_at ON items;
  CREATE TRIGGER items_set_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
`;

const CREATE_ITEM_ASSETS_UPDATED_AT_TRIGGER_SQL = `
  DROP TRIGGER IF EXISTS item_assets_set_updated_at ON item_assets;
  CREATE TRIGGER item_assets_set_updated_at
  BEFORE UPDATE ON item_assets
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
`;

const CREATE_WISH_BOARD_ITEMS_UPDATED_AT_TRIGGER_SQL = `
  DROP TRIGGER IF EXISTS wish_board_items_set_updated_at ON wish_board_items;
  CREATE TRIGGER wish_board_items_set_updated_at
  BEFORE UPDATE ON wish_board_items
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
`;

const CREATE_VIP_MEMBERSHIPS_UPDATED_AT_TRIGGER_SQL = `
  DROP TRIGGER IF EXISTS vip_memberships_set_updated_at ON vip_memberships;
  CREATE TRIGGER vip_memberships_set_updated_at
  BEFORE UPDATE ON vip_memberships
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
`;

const CREATE_ITEMS_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
`;

const CREATE_ITEMS_CATEGORY_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
`;

const CREATE_ITEMS_BUNDLE_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_items_bundle_name ON items(bundle_name);
`;

const CREATE_ITEM_ASSETS_ITEM_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_item_assets_item_id ON item_assets(item_id);
`;

const CREATE_WISH_BOARD_STATUS_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_wish_board_items_status ON wish_board_items(status);
`;

const CREATE_WISH_BOARD_CATEGORY_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_wish_board_items_category ON wish_board_items(category);
`;

const CREATE_VIP_MEMBERSHIPS_STATUS_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_vip_memberships_status ON vip_memberships(status);
`;

const CREATE_VIP_MEMBERSHIPS_EXPIRE_AT_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_vip_memberships_expire_at ON vip_memberships(expire_at);
`;

// 设置表：图片类型
const CREATE_IMAGE_TYPES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS image_types (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

// 设置表：商品分类
const CREATE_CATEGORIES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#C84B31',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

const CREATE_IMAGE_TYPES_UPDATED_AT_TRIGGER_SQL = `
  DROP TRIGGER IF EXISTS image_types_set_updated_at ON image_types;
  CREATE TRIGGER image_types_set_updated_at
  BEFORE UPDATE ON image_types
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
`;

const CREATE_CATEGORIES_UPDATED_AT_TRIGGER_SQL = `
  DROP TRIGGER IF EXISTS categories_set_updated_at ON categories;
  CREATE TRIGGER categories_set_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
`;

const seedItems = [
  ["小米2万mAh充电宝", 159, "2023-02-15", null, "电子产品", "京东", null, null, "active", "出行必备，很耐用"],
  ["飞智黑武士3 Pro", 264.38, "2023-01-08", null, "游戏设备", "淘宝", null, null, "active", "手游神器"],
  ["黑铁牛键盘", 281.92, "2023-01-01", null, "电子产品", "拼多多", null, null, "active", "段落感很棒"],
  ["索尼WH-1000XM4", 1899, "2022-08-20", null, "耳机", "京东", null, null, "active", "降噪效果一流"],
  ["旧款机械键盘", 399, "2021-03-10", "2023-01-01", "电子产品", "淘宝", null, null, "inactive", "已换掉"],
];

const seedWishBoardItems = [
  ["iPad mini 7", 3299, "电子产品", "high", "通勤看书、记灵感和轻量手账", "等教育优惠或二手好价", "京东 / 闲鱼", "2026-05-31", "watching"],
  ["人体工学椅", 1800, "其他", "medium", "改善久坐办公和剪视频时的腰背支撑", "优先关注二手成色好的品牌款", "闲鱼", "2026-06-20", "planning"],
  ["SONY WH-1000XM6", 2199, "耳机", "medium", "出差降噪、专注办公和夜间听歌", "等首发热度过后关注活动价", "天猫国际", null, "watching"],
];

const seedVipMemberships = [
  ["哔哩哔哩大会员", "年度", "https://www.bilibili.com", "主账号", "yearly", 238, "CNY", "番剧抢先看,高码率画质,专属装扮", "2026-11-18", 15, false, "active", "主要给追番和投屏用"],
  ["网易云音乐黑胶", "连续包月", "https://music.163.com", "手机尾号 5521", "monthly", 18, "CNY", "无损音质,会员曲库,听歌识曲增强", "2026-04-06", 7, true, "expiring", "如果下月使用频率不高可以先停"],
  ["ChatGPT Plus", "月付", "https://chatgpt.com", "创作账号", "monthly", 20, "USD", "更强模型,更快响应,高级工具能力", "2026-04-22", 5, true, "active", "写作和原型设计都在用"],
];

const seedImageTypes = [
  ["product_image", "商品照片", "物品的产品图片、外观展示", 1, true],
  ["order_image", "订单截图", "购买凭证、订单信息截图", 2, true],
  ["tutorial_image", "教程资料", "使用教程、说明书相关图片", 3, true],
  ["image", "其他图片", "其他未分类图片", 4, true],
];

const seedCategories = [
  ["电子产品", "数码电子设备", "#C84B31", 1, true],
  ["游戏设备", "游戏相关硬件", "#2D6A4F", 2, true],
  ["耳机", "耳机音响设备", "#92400E", 3, true],
  ["其他", "其他未分类物品", "#666666", 4, true],
];

export async function initializeDatabase({ withSeed = true } = {}) {
  await query(CREATE_UPDATED_AT_FUNCTION_SQL);
  await query(CREATE_ITEMS_TABLE_SQL);
  await query(ALTER_ITEMS_ADD_PURCHASE_CHANNEL_SQL);
  await query(ALTER_ITEMS_ADD_BUNDLE_NAME_SQL);
  await query(CREATE_ITEM_ASSETS_TABLE_SQL);
  await query(FIX_ITEM_ASSETS_TYPE_CONSTRAINT_SQL);
  await query(ADD_ITEM_ASSETS_TYPE_CONSTRAINT_SQL);
  await query(CREATE_WISH_BOARD_ITEMS_TABLE_SQL);
  await query(CREATE_VIP_MEMBERSHIPS_TABLE_SQL);
  await query(CREATE_ITEMS_UPDATED_AT_TRIGGER_SQL);
  await query(CREATE_ITEM_ASSETS_UPDATED_AT_TRIGGER_SQL);
  await query(CREATE_WISH_BOARD_ITEMS_UPDATED_AT_TRIGGER_SQL);
  await query(CREATE_VIP_MEMBERSHIPS_UPDATED_AT_TRIGGER_SQL);
  await query(CREATE_ITEMS_INDEX_SQL);
  await query(CREATE_ITEMS_CATEGORY_INDEX_SQL);
  await query(CREATE_ITEMS_BUNDLE_INDEX_SQL);
  await query(CREATE_ITEM_ASSETS_ITEM_INDEX_SQL);
  await query(CREATE_WISH_BOARD_STATUS_INDEX_SQL);
  await query(CREATE_WISH_BOARD_CATEGORY_INDEX_SQL);
  await query(CREATE_VIP_MEMBERSHIPS_STATUS_INDEX_SQL);
  await query(CREATE_VIP_MEMBERSHIPS_EXPIRE_AT_INDEX_SQL);
  await query(CREATE_IMAGE_TYPES_TABLE_SQL);
  await query(CREATE_CATEGORIES_TABLE_SQL);
  await query(CREATE_IMAGE_TYPES_UPDATED_AT_TRIGGER_SQL);
  await query(CREATE_CATEGORIES_UPDATED_AT_TRIGGER_SQL);

  let insertedItems = 0;
  let insertedWishBoardItems = 0;
  let insertedVipMemberships = 0;
  let insertedImageTypes = 0;
  let insertedCategories = 0;

  if (withSeed) {
    const itemsCountResult = await query("SELECT COUNT(*)::int AS count FROM items");
    const wishBoardCountResult = await query("SELECT COUNT(*)::int AS count FROM wish_board_items");
    const vipMembershipsCountResult = await query("SELECT COUNT(*)::int AS count FROM vip_memberships");
    const imageTypesCountResult = await query("SELECT COUNT(*)::int AS count FROM image_types");
    const categoriesCountResult = await query("SELECT COUNT(*)::int AS count FROM categories");

    if (itemsCountResult.rows[0].count === 0) {
      for (const item of seedItems) {
        await query(
          `
            INSERT INTO items (name, price, buy_date, stop_date, category, purchase_channel, bundle_name, icon, status, note)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `,
          item,
        );
        insertedItems += 1;
      }
    }

    if (wishBoardCountResult.rows[0].count === 0) {
      for (const wishBoardItem of seedWishBoardItems) {
        await query(
          `
            INSERT INTO wish_board_items (
              name, target_price, category, priority, purchase_purpose, note, desired_channel, target_date, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `,
          wishBoardItem,
        );
        insertedWishBoardItems += 1;
      }
    }

    if (vipMembershipsCountResult.rows[0].count === 0) {
      for (const vipMembership of seedVipMemberships) {
        await query(
          `
            INSERT INTO vip_memberships (
              name, level, website, account_label, renewal_cycle, price, currency, benefits,
              expire_at, remind_before_days, auto_renew, status, note
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `,
          vipMembership,
        );
        insertedVipMemberships += 1;
      }
    }

    if (imageTypesCountResult.rows[0].count === 0) {
      for (const imageType of seedImageTypes) {
        await query(
          `
            INSERT INTO image_types (key, label, description, sort_order, is_active)
            VALUES ($1, $2, $3, $4, $5)
          `,
          imageType,
        );
        insertedImageTypes += 1;
      }
    }

    if (categoriesCountResult.rows[0].count === 0) {
      for (const category of seedCategories) {
        await query(
          `
            INSERT INTO categories (name, description, color, sort_order, is_active)
            VALUES ($1, $2, $3, $4, $5)
          `,
          category,
        );
        insertedCategories += 1;
      }
    }
  }

  return {
    success: true,
    tables: ["items", "item_assets", "wish_board_items", "vip_memberships", "image_types", "categories"],
    insertedItems,
    insertedWishBoardItems,
    insertedVipMemberships,
    insertedImageTypes,
    insertedCategories,
  };
}
