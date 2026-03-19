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
    CONSTRAINT item_assets_type_check CHECK (asset_type IN ('image', 'tutorial', 'link'))
  );
`;

const CREATE_WISHES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS wishes (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    target_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    current_price NUMERIC(12, 2),
    category VARCHAR(100) NOT NULL DEFAULT '未分类',
    note TEXT,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

const CREATE_WISHES_UPDATED_AT_TRIGGER_SQL = `
  DROP TRIGGER IF EXISTS wishes_set_updated_at ON wishes;
  CREATE TRIGGER wishes_set_updated_at
  BEFORE UPDATE ON wishes
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

const CREATE_WISHES_CATEGORY_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_wishes_category ON wishes(category);
`;

const seedItems = [
  ["小米2万mAh充电宝", 159, "2023-02-15", null, "电子产品", "京东", null, null, "active", "出行必备，很耐用"],
  ["飞智黑武士3 Pro", 264.38, "2023-01-08", null, "游戏设备", "淘宝", null, null, "active", "手游神器"],
  ["黑铁牛键盘", 281.92, "2023-01-01", null, "电子产品", "拼多多", null, null, "active", "段落感很棒"],
  ["索尼WH-1000XM4", 1899, "2022-08-20", null, "耳机", "京东", null, null, "active", "降噪效果一流"],
  ["旧款机械键盘", 399, "2021-03-10", "2023-01-01", "电子产品", "淘宝", null, null, "inactive", "已换掉"],
];

const seedWishes = [
  ["iPad Pro 11寸", 3000, null, "电子产品", "等价格降到3000以下再买", null],
  ["Switch OLED", 1800, null, "游戏设备", "咸鱼找个好价", null],
];

export async function initializeDatabase({ withSeed = true } = {}) {
  await query(CREATE_UPDATED_AT_FUNCTION_SQL);
  await query(CREATE_ITEMS_TABLE_SQL);
  await query(ALTER_ITEMS_ADD_PURCHASE_CHANNEL_SQL);
  await query(ALTER_ITEMS_ADD_BUNDLE_NAME_SQL);
  await query(CREATE_ITEM_ASSETS_TABLE_SQL);
  await query(CREATE_WISHES_TABLE_SQL);
  await query(CREATE_ITEMS_UPDATED_AT_TRIGGER_SQL);
  await query(CREATE_ITEM_ASSETS_UPDATED_AT_TRIGGER_SQL);
  await query(CREATE_WISHES_UPDATED_AT_TRIGGER_SQL);
  await query(CREATE_ITEMS_INDEX_SQL);
  await query(CREATE_ITEMS_CATEGORY_INDEX_SQL);
  await query(CREATE_ITEMS_BUNDLE_INDEX_SQL);
  await query(CREATE_ITEM_ASSETS_ITEM_INDEX_SQL);
  await query(CREATE_WISHES_CATEGORY_INDEX_SQL);

  let insertedItems = 0;
  let insertedWishes = 0;

  if (withSeed) {
    const itemsCountResult = await query("SELECT COUNT(*)::int AS count FROM items");
    const wishesCountResult = await query("SELECT COUNT(*)::int AS count FROM wishes");

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

    if (wishesCountResult.rows[0].count === 0) {
      for (const wish of seedWishes) {
        await query(
          `
            INSERT INTO wishes (name, target_price, current_price, category, note, link)
            VALUES ($1, $2, $3, $4, $5, $6)
          `,
          wish,
        );
        insertedWishes += 1;
      }
    }
  }

  return {
    success: true,
    tables: ["items", "item_assets", "wishes"],
    insertedItems,
    insertedWishes,
  };
}
