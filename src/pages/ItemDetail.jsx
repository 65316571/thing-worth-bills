import { useItems } from "../context/ItemContext";
import { calcDays, calcDailyCost, CATEGORY_ICONS } from "../utils/calc";

export default function ItemDetail({ item, navigate }) {
  const { deleteItem, deactivateItem, reactivateItem } = useItems();

  if (!item) { navigate("list"); return null; }

  const isInactive = item.status === "inactive";
  const days = calcDays(item.buyDate, item.stopDate);
  const daily = calcDailyCost(item.price, days);
  const icon = CATEGORY_ICONS[item.category] || "📦";

  const handleDelete = async () => {
    if (window.confirm(`确定删除「${item.name}」吗？`)) {
      try {
        await deleteItem(item.id);
        navigate("list");
      } catch (error) {
        alert(error.message || "删除物品失败");
      }
    }
  };

  const handleDeactivate = async () => {
    if (window.confirm(`标记「${item.name}」为已停用？`)) {
      try {
        await deactivateItem(item.id);
        navigate("list");
      } catch (error) {
        alert(error.message || "停用物品失败");
      }
    }
  };

  const handleReactivate = async () => {
    try {
      await reactivateItem(item.id);
      navigate("list");
    } catch (error) {
      alert(error.message || "恢复物品失败");
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    const date = new Date(d);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <div className="sub-page">
      <div className="sub-header">
        <button className="back-btn" onClick={() => navigate("list")}>←</button>
        <div className="sub-title">物品详情</div>
      </div>

      {/* Hero */}
      <div className="detail-hero">
        <div className="detail-icon" style={isInactive ? { background: "var(--gray-card)", border: "1.5px solid var(--gray-border)" } : {}}>
          {icon}
        </div>
        <div>
          <div className="detail-name">{item.name}</div>
          <div className="detail-cat">
            {item.category || "未分类"} ·&nbsp;
            <span style={{ color: isInactive ? "var(--gray-text)" : "var(--green-text)", fontWeight: 500 }}>
              {isInactive ? "已停用" : "使用中"}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="detail-stats-grid">
        <div className="detail-stat-card accent">
          <div className="detail-stat-value">¥{daily}</div>
          <div className="detail-stat-label">每日成本</div>
        </div>
        <div className="detail-stat-card">
          <div className="detail-stat-value">{days}</div>
          <div className="detail-stat-label">已使用天数</div>
        </div>
        <div className="detail-stat-card">
          <div className="detail-stat-value">¥{item.price}</div>
          <div className="detail-stat-label">购买价格</div>
        </div>
        <div className="detail-stat-card">
          <div className="detail-stat-value" style={{ fontSize: 16 }}>
            ¥{(item.price * 0.6).toFixed(0)}
          </div>
          <div className="detail-stat-label">预估残值（60%）</div>
        </div>
      </div>

      {/* Details */}
      <div className="detail-section">
        <div className="detail-section-title">详细信息</div>
        <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "0 16px" }}>
          <div className="detail-row">
            <span className="detail-row-label">购买日期</span>
            <span className="detail-row-value" style={{ fontFamily: "var(--font-sans)", fontSize: 13 }}>{formatDate(item.buyDate)}</span>
          </div>
          {isInactive && item.stopDate && (
            <div className="detail-row">
              <span className="detail-row-label">停用日期</span>
              <span className="detail-row-value" style={{ fontFamily: "var(--font-sans)", fontSize: 13 }}>{formatDate(item.stopDate)}</span>
            </div>
          )}
          <div className="detail-row">
            <span className="detail-row-label">物品分类</span>
            <span className="detail-row-value" style={{ fontFamily: "var(--font-sans)", fontSize: 13 }}>{item.category || "未分类"}</span>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">总计成本</span>
            <span className="detail-row-value">¥{(parseFloat(daily) * days).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Note */}
      {item.note && (
        <div className="detail-section">
          <div className="detail-section-title">备注</div>
          <div style={{
            background: "var(--surface)",
            border: "1.5px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: "14px 16px",
            fontSize: 14,
            color: "var(--ink-2)",
            lineHeight: 1.6,
            fontWeight: 300,
          }}>
            {item.note}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="detail-actions">
        <button className="action-btn outline" onClick={() => navigate("edit", item)}>
          ✏️ 编辑物品
        </button>
        {isInactive ? (
          <button className="action-btn success" onClick={handleReactivate}>
            ♻️ 标记为使用中
          </button>
        ) : (
          <button className="action-btn warning" onClick={handleDeactivate}>
            📦 标记为已停用
          </button>
        )}
        <button className="action-btn danger" onClick={handleDelete}>
          🗑️ 删除物品
        </button>
      </div>
    </div>
  );
}
