import { useMemo, useState, useCallback } from "react";
import { useItems } from "../context/ItemContext";
import { calcDays, calcDailyCost } from "../utils/calc";
import VipLibraryPanel from "../components/VipLibraryPanel";
import { AlertDialog, ConfirmDialog } from "../components/CustomDialog";

export default function Data({ navigate }) {
  const { items, deleteItem, deactivateItem, reactivateItem } = useItems();
  const [search, setSearch] = useState("");
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [tab, setTab] = useState("items");
  
  // 对话框状态
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    type: 'alert',
    title: '提示',
    message: '',
    onConfirm: null,
    onCancel: null,
    danger: false,
  });

  const showDialog = useCallback((config) => {
    setDialogState({
      isOpen: true,
      type: config.type || 'alert',
      title: config.title || '提示',
      message: config.message || '',
      onConfirm: config.onConfirm || null,
      onCancel: config.onCancel || null,
      danger: config.danger || false,
    });
  }, []);

  const hideDialog = useCallback(() => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, []);

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
    showDialog({
      type: 'confirm',
      title: '确认删除',
      message: `确定删除「${item.name}」吗？`,
      danger: true,
      onConfirm: async () => {
        try {
          await deleteItem(item.id);
        } catch (error) {
          showDialog({
            type: 'alert',
            title: '错误',
            message: error.message || "删除物品失败",
          });
        }
      },
    });
  };

  const handleToggleStatus = async (item) => {
    const nextAction = item.status === "active" ? "停用" : "启用";
    showDialog({
      type: 'confirm',
      title: '确认',
      message: `确定${nextAction}「${item.name}」吗？`,
      onConfirm: async () => {
        try {
          if (item.status === "active") await deactivateItem(item.id);
          else await reactivateItem(item.id);
        } catch (error) {
          showDialog({
            type: 'alert',
            title: '错误',
            message: error.message || `${nextAction}物品失败`,
          });
        }
      },
    });
  };

  return (
    <div className="app">
      <div className="page-header">
        <div className="page-title">数据 / 会员</div>
        <div className="page-subtitle">物品数据总表与会员库统一放在这里管理</div>
      </div>

      <div className="scroll-area">
        <div className="wish-filter-row" style={{ marginBottom: 16 }}>
          <button className={`wish-filter-chip ${tab === "items" ? "active" : ""}`} onClick={() => setTab("items")}>物品数据</button>
          <button className={`wish-filter-chip ${tab === "vip" ? "active" : ""}`} onClick={() => setTab("vip")}>会员库</button>
        </div>

        {tab === "vip" ? (
          <VipLibraryPanel mobile />
        ) : (
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
        )}
      </div>

      {/* 自定义对话框 */}
      {dialogState.isOpen && dialogState.type === 'alert' && (
        <AlertDialog
          isOpen={dialogState.isOpen}
          title={dialogState.title}
          message={dialogState.message}
          onConfirm={() => {
            hideDialog();
            dialogState.onConfirm?.();
          }}
        />
      )}

      {dialogState.isOpen && dialogState.type === 'confirm' && (
        <ConfirmDialog
          isOpen={dialogState.isOpen}
          title={dialogState.title}
          message={dialogState.message}
          danger={dialogState.danger}
          onConfirm={() => {
            hideDialog();
            dialogState.onConfirm?.();
          }}
          onCancel={() => {
            hideDialog();
            dialogState.onCancel?.();
          }}
        />
      )}
    </div>
  );
}
