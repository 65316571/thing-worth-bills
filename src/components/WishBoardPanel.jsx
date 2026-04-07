import { useMemo, useState, useCallback } from "react";
import { useItems } from "../context/ItemContext";
import { CATEGORIES, CATEGORY_ICONS } from "../utils/calc";
import { AlertDialog, ConfirmDialog } from "./CustomDialog";

export default function WishBoardPanel({ mobile = false }) {
  const { wishes, addWish, deleteWish, loading, error } = useItems();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({
    name: "",
    targetPrice: "",
    category: "",
    priority: "medium",
    purpose: "",
    note: "",
  });

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

  const wishSummary = useMemo(() => {
    const totalBudget = wishes.reduce((sum, wish) => sum + Number(wish.targetPrice || 0), 0);
    const categories = new Set(wishes.map((wish) => wish.category).filter(Boolean)).size;
    return {
      total: wishes.length,
      budget: totalBudget,
      categories,
    };
  }, [wishes]);

  const filteredWishes = useMemo(() => {
    let result = wishes;
    if (filter !== "all") {
      result = result.filter((wish) => (wish.category || "未分类") === filter);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((wish) =>
        wish.name.toLowerCase().includes(query) ||
        (wish.purpose || "").toLowerCase().includes(query) ||
        (wish.note || "").toLowerCase().includes(query)
      );
    }
    return result;
  }, [filter, searchQuery, wishes]);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.targetPrice) {
      showDialog({
        type: 'alert',
        title: '提示',
        message: '请填写物品名称和目标价格',
      });
      return;
    }
    try {
      await addWish({
        ...form,
        targetPrice: parseFloat(form.targetPrice),
        status: "planning"
      });
      setForm({
        name: "",
        targetPrice: "",
        category: "",
        priority: "medium",
        purpose: "",
        note: ""
      });
      setShowForm(false);
    } catch (requestError) {
      showDialog({
        type: 'alert',
        title: '错误',
        message: requestError.message || "添加心愿失败",
      });
    }
  };

  return (
    <section className={mobile ? "wish-mobile-shell" : "desktop-panel"}>
      <div className="desktop-panel-head">
        <div>
          <div className="desktop-panel-title">心愿墙</div>
          <div className="desktop-panel-subtitle">把短期想买的东西、预算和用途整理成清晰目标。</div>
        </div>
        <button className="desktop-primary-btn" onClick={() => setShowForm((value) => !value)}>
          {showForm ? "收起表单" : "+ 添加心愿"}
        </button>
      </div>
      {loading && <div className="notice">数据加载中...</div>}
      {error && <div className="notice">接口异常：{error}</div>}
      <div className="wish-summary-grid">
        <article className="wish-summary-card accent">
          <span>心愿数量</span>
          <strong>{wishSummary.total}</strong>
        </article>
        <article className="wish-summary-card">
          <span>目标预算</span>
          <strong>¥{wishSummary.budget.toFixed(0)}</strong>
        </article>
        <article className="wish-summary-card">
          <span>涉及分类</span>
          <strong>{wishSummary.categories}</strong>
        </article>
      </div>
      <div className="wish-toolbar">
        <div className="wish-filter-row">
          <button className={`wish-filter-chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>全部</button>
          {CATEGORIES.map((category) => (
            <button key={category} className={`wish-filter-chip ${filter === category ? "active" : ""}`} onClick={() => setFilter(category)}>
              {category}
            </button>
          ))}
        </div>
        <div className="wish-search-wrap">
          <input
            type="text"
            className="form-input wish-search-input"
            placeholder="搜索心愿..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      {showForm && (
        <div className="desktop-form-card wish-form-card">
          <div className="desktop-form-grid two-col">
            <input
              className="form-input"
              placeholder="物品名称 *"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input
              className="form-input"
              type="number"
              placeholder="目标价格 *"
              value={form.targetPrice}
              onChange={(e) => setForm((prev) => ({ ...prev, targetPrice: e.target.value }))}
            />
          </div>
          <div className="desktop-form-grid two-col">
            <select
              className="form-select"
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            >
              <option value="">选择分类</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              className="form-select"
              value={form.priority}
              onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
            >
              <option value="high">高优先级</option>
              <option value="medium">中优先级</option>
              <option value="low">低优先级</option>
            </select>
          </div>
          <input
            className="form-input"
            placeholder="购买用途 / 使用场景"
            value={form.purpose}
            onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))}
          />
          <textarea
            className="form-textarea"
            placeholder="补充说明（例如理想版本、想等的活动）"
            value={form.note}
            onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
          />
          <div className="desktop-form-actions">
            <button className="desktop-primary-btn" onClick={handleAdd}>保存心愿</button>
          </div>
        </div>
      )}
      <div className="wish-board-grid-container">
        <div className="wish-board-grid">
          {filteredWishes.map((wish) => (
            <article className="wish-board-card" key={wish.id}>
              <div className="wish-board-head">
                <div>
                  <div className="wish-board-name">
                    {CATEGORY_ICONS[wish.category] || "🛒"} {wish.name}
                  </div>
                  <div className="wish-board-price">目标价 ¥{Number(wish.targetPrice || 0).toFixed(2)}</div>
                </div>
                <button
                  className="desktop-action-btn danger"
                  onClick={async () => {
                    showDialog({
                      type: 'confirm',
                      title: '确认删除',
                      message: `确定删除「${wish.name}」吗？`,
                      danger: true,
                      onConfirm: async () => {
                        try {
                          await deleteWish(wish.id);
                        } catch (requestError) {
                          showDialog({
                            type: 'alert',
                            title: '错误',
                            message: requestError.message || "删除心愿失败",
                          });
                        }
                      },
                    });
                  }}
                >
                  删除
                </button>
              </div>
              <div className="wish-board-meta-row">
                <span className="wish-board-chip">{wish.category || "未分类"}</span>
                <span className="wish-board-chip purpose">
                  {wish.priority === "high" ? "高优先级" : wish.priority === "low" ? "低优先级" : "短期目标"}
                </span>
              </div>
              <div className="wish-board-section">
                <div className="wish-board-label">购买用途</div>
                <p>{wish.purpose || "暂未填写用途，可以补充为什么想买、买来做什么。"}</p>
              </div>
              <div className="wish-board-section muted">
                <div className="wish-board-label">备注</div>
                <p>{wish.note || "暂无备注"}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
      {filteredWishes.length === 0 && !showForm && (
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <div className="empty-title">心愿墙是空的</div>
          <div className="empty-desc">添加想买的物品与用途，慢慢把短期目标一项项实现。</div>
        </div>
      )}

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
    </section>
  );
}
