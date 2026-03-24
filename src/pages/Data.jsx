import { useMemo, useState } from "react";
import { useItems } from "../context/ItemContext";
import { calcDays, calcDailyCost } from "../utils/calc";

export default function Data({ navigate }) {
  const { items, deleteItem, deactivateItem, reactivateItem } = useItems();
  const [search, setSearch] = useState("");
  const [expandedItemId, setExpandedItemId] = useState(null);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) => {
      const fields = [
        item.name,
        item.category,
        item.purchaseChannel,
        item.note,
        item.status === "active" ? "使用中" : "已停用",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return fields.includes(keyword);
    });
  }, [items, search]);

  const handleDelete = async (item) => {
    if (!window.confirm(`确定删除「${item.name}」吗？`)) return;
    try {
      await deleteItem(item.id);
    } catch (error) {
      alert(error.message || "删除物品失败");
    }
  };

  const handleToggleStatus = async (item) => {
    const nextAction = item.status === "active" ? "停用" : "启用";
    if (!window.confirm(`确定${nextAction}「${item.name}」吗？`)) return;
    try {
      if (item.status === "active") await deactivateItem(item.id);
      else await reactivateItem(item.id);
    } catch (error) {
      alert(error.message || `${nextAction}物品失败`);
    }
  };

  return (
    <div className="app">
      <div className="page-header">
        <div className="page-title">数据</div>
        <div className="page-subtitle">名称 · 使用天数 · 每日成本</div>
      </div>

      <div className="scroll-area">
        <div className="desktop-panel">
          <div className="desktop-panel-head desktop-items-panel-head">
            <div>
              <div className="desktop-panel-title">全部物品</div>
              <div className="desktop-panel-subtitle">点击条目展开操作菜单。</div>
            </div>
            <div className="desktop-items-panel-actions">
              <input
                className="form-input desktop-items-search-input"
                placeholder="搜索名称、分类、渠道、备注"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="desktop-primary-btn" onClick={() => navigate("add")}>
                + 新增物品
              </button>
            </div>
          </div>

          <div className="data-list">
            {filtered.map((item) => {
              const days = calcDays(item.buyDate, item.stopDate);
              const daily = calcDailyCost(Number(item.price || 0), days);
              const isExpanded = expandedItemId === item.id;
              
              return (
                <div key={item.id} className={`data-row-wrap ${item.status === "inactive" ? "inactive" : ""}`}>
                  <button
                    type="button"
                    className="data-row"
                    onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                  >
                    <div className="data-name">
                      {item.name}
                      {item.status === "inactive" && <span className="data-status-badge">已停用</span>}
                    </div>
                    <div className="data-metrics">
                      <div className="data-metric">
                        <div className="data-metric-value">{days}天</div>
                        <div className="data-metric-label">使用天数</div>
                      </div>
                      <div className="data-metric">
                        <div className="data-metric-value">¥{daily}</div>
                        <div className="data-metric-label">每日成本</div>
                      </div>
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="data-row-actions">
                      <button className="action-btn outline" onClick={() => navigate("detail", item)}>
                        查看
                      </button>
                      <button className="action-btn outline" onClick={() => navigate("edit", item)}>
                        编辑
                      </button>
                      <button className={`action-btn ${item.status === "active" ? "warning" : "success"}`} onClick={() => handleToggleStatus(item)}>
                        {item.status === "active" ? "停用" : "启用"}
                      </button>
                      <button className="action-btn danger" onClick={() => handleDelete(item)}>
                        删除
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="desktop-empty-inline desktop-items-empty">没有匹配的物品</div>
          )}
        </div>
      </div>
    </div>
  );
}
