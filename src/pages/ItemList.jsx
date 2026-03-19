import { useState } from "react";
import { useItems } from "../context/ItemContext";
import { calcDays, calcDailyCost, CATEGORY_ICONS, SORT_OPTIONS } from "../utils/calc";

const ALL_CATS = ["全部", "电子产品", "游戏设备", "耳机", "存储设备", "手机", "其他"];

function buildBundleEntry(bundleName, bundleItems) {
  const sortedItems = [...bundleItems].sort((a, b) => new Date(b.buyDate) - new Date(a.buyDate));
  const totalPrice = sortedItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const activeItems = sortedItems.filter((item) => item.status === "active");
  const status = activeItems.length > 0 ? "active" : "inactive";
  const earliestBuyDate = [...sortedItems].sort((a, b) => new Date(a.buyDate) - new Date(b.buyDate))[0]?.buyDate;
  const latestStopDate = [...sortedItems]
    .map((item) => item.stopDate)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a))[0] || null;
  const days = calcDays(earliestBuyDate, status === "inactive" ? latestStopDate : null);

  return {
    id: `bundle:${bundleName}`,
    type: "bundle",
    name: bundleName,
    category: sortedItems[0]?.category || "未分类",
    bundleName,
    price: totalPrice,
    buyDate: earliestBuyDate,
    stopDate: latestStopDate,
    status,
    purchaseChannel: sortedItems.map((item) => item.purchaseChannel).filter(Boolean).join(" / "),
    note: sortedItems.map((item) => item.note).filter(Boolean).join("；"),
    items: sortedItems,
    days,
  };
}

function buildDisplayEntries(items) {
  const bundleMap = new Map();
  const singles = [];

  items.forEach((item) => {
    if (item.bundleName) {
      const list = bundleMap.get(item.bundleName) || [];
      list.push(item);
      bundleMap.set(item.bundleName, list);
      return;
    }

    singles.push({
      ...item,
      type: "item",
      items: [item],
    });
  });

  const bundles = [];
  bundleMap.forEach((bundleItems, bundleName) => {
    if (bundleItems.length === 1) {
      singles.push({
        ...bundleItems[0],
        type: "item",
        items: [bundleItems[0]],
      });
      return;
    }

    bundles.push(buildBundleEntry(bundleName, bundleItems));
  });

  return [...singles, ...bundles];
}

function sortEntries(items, sortKey) {
  return [...items].sort((a, b) => {
    const daysA = a.type === "bundle" ? a.days : calcDays(a.buyDate, a.stopDate);
    const daysB = b.type === "bundle" ? b.days : calcDays(b.buyDate, b.stopDate);
    const costA = parseFloat(calcDailyCost(Number(a.price || 0), daysA));
    const costB = parseFloat(calcDailyCost(Number(b.price || 0), daysB));

    switch (sortKey) {
      case "days_desc":
        return daysB - daysA;
      case "cost_asc":
        return costA - costB;
      case "cost_desc":
        return costB - costA;
      case "price_desc":
        return Number(b.price || 0) - Number(a.price || 0);
      case "price_asc":
        return Number(a.price || 0) - Number(b.price || 0);
      case "date_desc":
        return new Date(b.buyDate) - new Date(a.buyDate);
      default:
        return daysB - daysA;
    }
  });
}

export default function ItemList({ navigate }) {
  const { items, loading, error } = useItems();
  const [sort, setSort] = useState("days_desc");
  const [catFilter, setCatFilter] = useState("全部");
  const [showInactive, setShowInactive] = useState(true);

  const filtered = items
    .filter((it) => catFilter === "全部" || it.category === catFilter)
    .filter((it) => showInactive || it.status === "active");

  const sorted = sortEntries(buildDisplayEntries(filtered), sort);
  const activeCount = items.filter((i) => i.status === "active").length;
  const totalSpend = items.reduce((s, i) => s + i.price, 0);

  return (
    <div className="app">
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="page-title">物值账</div>
            <div className="page-subtitle">
              {activeCount} 件在用 · 累计 ¥{totalSpend.toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
          <button
            style={{
              fontSize: 11,
              color: showInactive ? "var(--ink-3)" : "var(--accent)",
              fontWeight: 500,
              padding: "6px 12px",
              borderRadius: 8,
              border: "1.5px solid var(--border)",
              background: "var(--surface)",
            }}
            onClick={() => setShowInactive((v) => !v)}
          >
            {showInactive ? "隐藏停用" : "显示停用"}
          </button>
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="sort-bar">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`sort-chip ${sort === opt.value ? "active" : ""}`}
                onClick={() => setSort(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-tabs">
          {ALL_CATS.map((c) => (
            <button
              key={c}
              className={`filter-tab ${catFilter === c ? "active" : ""}`}
              onClick={() => setCatFilter(c)}
            >
              {c !== "全部" && (CATEGORY_ICONS[c] || "")} {c}
            </button>
          ))}
        </div>
      </div>

      <div className="scroll-area">
        {loading && <div className="notice">数据加载中...</div>}
        {error && <div className="notice">接口异常：{error}</div>}

        {sorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-title">还没有物品记录</div>
            <div className="empty-desc">点击下方 + 按钮，<br />开始记录你的第一件物品</div>
          </div>
        ) : (
          sorted.map((item) => <ItemCard key={item.id} item={item} onClick={() => navigate("detail", item)} />)
        )}
      </div>
    </div>
  );
}

function ItemCard({ item, onClick }) {
  const isBundle = item.type === "bundle";
  const days = isBundle ? item.days : calcDays(item.buyDate, item.stopDate);
  const daily = calcDailyCost(Number(item.price || 0), days);
  const icon = CATEGORY_ICONS[item.category] || "📦";
  const isInactive = item.status === "inactive";

  return (
    <div className={`item-card ${isInactive ? "inactive" : ""} ${isBundle ? "bundle-card" : ""}`} onClick={onClick}>
      <div className="item-card-top">
        <div className="item-icon-wrap">{icon}</div>
        <div className="item-info">
          <div className="item-name">{item.name}</div>
          <div className="item-category">
            {item.category || "未分类"}
            {isBundle ? ` · 共 ${item.items.length} 项` : ""}
          </div>
          {item.purchaseChannel && <div className="item-category">渠道：{item.purchaseChannel}</div>}
        </div>
        <div className={`item-status-badge ${isInactive ? "inactive" : ""}`}>
          {isBundle ? (isInactive ? "整体停用" : "整体使用中") : (isInactive ? "已停用" : "使用中")}
        </div>
      </div>

      {isBundle && (
        <div className="bundle-members">
          {item.items.map((member) => (
            <span className="bundle-member-chip" key={member.id}>
              {member.name}
            </span>
          ))}
        </div>
      )}

      <div className="item-card-stats">
        <div className="stat-block">
          <div className="stat-value">¥{Number(item.price || 0).toFixed(2)}</div>
          <div className="stat-label">{isBundle ? "整体价格" : "购买价格"}</div>
        </div>
        <div className="stat-block">
          <div className="stat-value">{days}</div>
          <div className="stat-label">{isBundle ? "整体天数" : "使用天数"}</div>
        </div>
        <div className="stat-block">
          <div className="stat-value highlight">¥{daily}</div>
          <div className="stat-label">{isBundle ? "整体日均" : "每日成本"}</div>
        </div>
      </div>
    </div>
  );
}
