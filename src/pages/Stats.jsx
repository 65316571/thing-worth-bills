import { useItems } from "../context/ItemContext";
import { calcDays, calcDailyCost, CATEGORY_ICONS } from "../utils/calc";

export default function Stats({ navigate }) {
  const { items, loading, error } = useItems();

  const activeItems = items.filter((i) => i.status === "active");
  const total = items.length;
  const totalSpend = items.reduce((s, i) => s + i.price, 0);

  // avg daily cost across all active items
  const avgDaily = activeItems.length
    ? activeItems.reduce((s, i) => {
        const d = calcDays(i.buyDate, i.stopDate);
        return s + parseFloat(calcDailyCost(i.price, d));
      }, 0)
    : 0;

  // category breakdown
  const catMap = {};
  items.forEach((i) => {
    const c = i.category || "其他";
    catMap[c] = (catMap[c] || 0) + i.price;
  });
  const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const maxCat = cats[0]?.[1] || 1;

  // most expensive
  const mostExpensive = [...items].sort((a, b) => b.price - a.price)[0];
  // longest used
  const longestUsed = [...items].sort((a, b) => {
    return calcDays(b.buyDate, b.stopDate) - calcDays(a.buyDate, a.stopDate);
  })[0];
  // best value (lowest daily cost)
  const bestValue = [...activeItems].sort((a, b) => {
    return parseFloat(calcDailyCost(a.price, calcDays(a.buyDate))) -
           parseFloat(calcDailyCost(b.price, calcDays(b.buyDate)));
  })[0];

  return (
    <div className="app">
      <div className="page-header">
        <div className="page-title">消费统计</div>
        <div className="page-subtitle">总览你的物品价值</div>
      </div>

      <div className="scroll-area">
        {loading && <div className="notice">数据加载中...</div>}
        {error && <div className="notice">接口异常：{error}</div>}

        {/* Summary Cards */}
        <div className="stats-summary">
          <div className="summary-card dark">
            <div className="summary-value">¥{totalSpend.toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <div className="summary-label">累计消费金额</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{total}</div>
            <div className="summary-label">记录物品数</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{activeItems.length}</div>
            <div className="summary-label">在用物品数</div>
          </div>
          <div className="summary-card">
            <div className="summary-value" style={{ color: "var(--accent)", fontSize: 22 }}>
              ¥{avgDaily.toFixed(2)}
            </div>
            <div className="summary-label">平均每日成本</div>
          </div>
        </div>

        {/* Category Breakdown */}
        {cats.length > 0 && (
          <>
            <div className="section-divider" style={{ padding: "0 0 10px" }}>分类消费</div>
            <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "16px", marginBottom: 16 }}>
              {cats.map(([cat, amount]) => (
                <div className="category-bar-item" key={cat}>
                  <div className="cat-bar-header">
                    <span className="cat-bar-name">{CATEGORY_ICONS[cat] || "📦"} {cat}</span>
                    <span className="cat-bar-amount">¥{amount.toFixed(0)}</span>
                  </div>
                  <div className="cat-bar-track">
                    <div
                      className="cat-bar-fill"
                      style={{ width: `${(amount / maxCat) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Highlights */}
        <div className="section-divider" style={{ padding: "0 0 10px" }}>精华榜单</div>

        {mostExpensive && (
          <div className="highlight-card">
            <div className="highlight-icon">🏆</div>
            <div>
              <div style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 4, fontWeight: 300 }}>最贵物品</div>
              <div className="highlight-name">{mostExpensive.name}</div>
              <div className="highlight-meta">¥{mostExpensive.price}</div>
            </div>
          </div>
        )}

        {longestUsed && (
          <div className="highlight-card">
            <div className="highlight-icon">⏳</div>
            <div>
              <div style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 4, fontWeight: 300 }}>使用最久</div>
              <div className="highlight-name">{longestUsed.name}</div>
              <div className="highlight-meta">{calcDays(longestUsed.buyDate, longestUsed.stopDate)} 天</div>
            </div>
          </div>
        )}

        {bestValue && (
          <div className="highlight-card">
            <div className="highlight-icon">💚</div>
            <div>
              <div style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 4, fontWeight: 300 }}>最超值（日均最低）</div>
              <div className="highlight-name">{bestValue.name}</div>
              <div className="highlight-meta">
                ¥{calcDailyCost(bestValue.price, calcDays(bestValue.buyDate))}/天
              </div>
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <div className="empty-title">暂无数据</div>
            <div className="empty-desc">先去记录你的物品吧～</div>
          </div>
        )}
      </div>
    </div>
  );
}
