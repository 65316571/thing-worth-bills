export function calcDays(buyDate, stopDate = null) {
  const start = new Date(buyDate);
  const end = stopDate ? new Date(stopDate) : new Date();
  const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff);
}

export function calcDailyCost(price, days) {
  return (price / days).toFixed(2);
}

export function formatPrice(price) {
  return price.toFixed(2);
}

export const CATEGORIES = [
  "电子产品",
  "游戏设备",
  "耳机",
  "存储设备",
  "手机",
  "其他",
];

export const CATEGORY_ICONS = {
  电子产品: "💻",
  游戏设备: "🎮",
  耳机: "🎧",
  存储设备: "💾",
  手机: "📱",
  其他: "📦",
};

export const SORT_OPTIONS = [
  { value: "days_desc", label: "使用最久" },
  { value: "cost_asc", label: "每日最省" },
  { value: "cost_desc", label: "每日最贵" },
  { value: "price_desc", label: "价格最高" },
  { value: "price_asc", label: "价格最低" },
  { value: "date_desc", label: "最近购买" },
];
