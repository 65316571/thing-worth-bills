import { useState } from "react";
import { useItems } from "../context/ItemContext";
import { calcDays, calcDailyCost, CATEGORY_ICONS, SORT_OPTIONS } from "../utils/calc";

const ALL_CATS = ["全部", "电子产品", "游戏设备", "耳机", "存储设备", "手机", "其他"];

function sortItems(items, sortKey) {
  return [...items].sort((a, b) => {
    const daysA = calcDays(a.buyDate, a.stopDate);
    const daysB = calcDays(b.buyDate, b.stopDate);
    const costA = parseFloat(calcDailyCost(a.price, daysA));
    const costB = parseFloat(calcDailyCost(b.price, daysB));
    switch (sortKey) {
      case "days_desc": return daysB - daysA;
      case "cost_asc": return costA - costB;
      case "cost_desc": return costB - costA;
      case "price_desc": return b.price - a.price;
      case "price_asc": return a.price - b.price;
      case "date_desc": return new Date(b.buyDate) - new Date(a.buyDate);
      default: return daysB - daysA;
    }
  });
}

export default function ItemList({ navigate }) {
  const { items } = useItems();
  const [sort, setSort] = useState("days_desc");
  const [catFilter, setCatFilter] = useState("全部");
  const [showInactive, setShowInactive] = useState(true);

  const filtered = items
    .filter((it) => catFilter === "全部" || it.category === catFilter)
    .filter((it) => showInactive || it.status === "active");

  const sorted = sortItems(filtered, sort);
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
  const days = calcDays(item.buyDate, item.stopDate);
  const daily = calcDailyCost(item.price, days);
  const icon = CATEGORY_ICONS[item.category] || "📦";
  const isInactive = item.status === "inactive";

  return (
    <div className={`item-card ${isInactive ? "inactive" : ""}`} onClick={onClick}>
      <div className="item-card-top">
        <div className="item-icon-wrap">{icon}</div>
        <div className="item-info">
          <div className="item-name">{item.name}</div>
          <div className="item-category">{item.category || "未分类"}</div>
        </div>
        <div className={`item-status-badge ${isInactive ? "inactive" : ""}`}>
          {isInactive ? "已停用" : "使用中"}
        </div>
      </div>

      <div className="item-card-stats">
        <div className="stat-block">
          <div className="stat-value">¥{item.price}</div>
          <div className="stat-label">购买价格</div>
        </div>
        <div className="stat-block">
          <div className="stat-value">{days}</div>
          <div className="stat-label">使用天数</div>
        </div>
        <div className="stat-block">
          <div className="stat-value highlight">¥{daily}</div>
          <div className="stat-label">每日成本</div>
        </div>
      </div>
    </div>
  );
}
