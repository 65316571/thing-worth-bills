export function calcDays(buyDate, stopDate = null) {
  const start = new Date(buyDate);
  const end = stopDate ? new Date(stopDate) : new Date();
  const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff);
}

export function formatUsageDuration(buyDate, stopDate = null) {
  const start = new Date(buyDate);
  const rawEnd = stopDate ? new Date(stopDate) : new Date();

  if (Number.isNaN(start.getTime()) || Number.isNaN(rawEnd.getTime())) {
    return "1天";
  }

  const end = new Date(rawEnd);

  if (end < start) {
    return "1天";
  }

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const previousMonthLastDay = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    days += previousMonthLastDay;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts = [];

  if (years > 0) {
    parts.push(`${years}年`);
  }

  if (months > 0) {
    parts.push(`${months}月`);
  }

  if (days > 0 || parts.length === 0) {
    parts.push(`${Math.max(1, days)}天`);
  }

  return parts.join("");
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
