import { useState } from "react";
import { useItems } from "../context/ItemContext";
import { CATEGORIES, CATEGORY_ICONS } from "../utils/calc";

export default function WishList({ navigate }) {
  const { wishes, addWish, deleteWish, loading, error } = useItems();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", targetPrice: "", category: "", note: "" });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleAdd = async () => {
    if (!form.name.trim() || !form.targetPrice) {
      alert("请填写物品名称和目标价格");
      return;
    }

    try {
      await addWish({ ...form, targetPrice: parseFloat(form.targetPrice) });
      setForm({ name: "", targetPrice: "", category: "", note: "" });
      setShowForm(false);
    } catch (requestError) {
      alert(requestError.message || "添加心愿失败");
    }
  };

  return (
    <div className="app">
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="page-title">心愿墙</div>
            <div className="page-subtitle">记录想要的物品，等待好价</div>
          </div>
          <button
            className="action-btn"
            style={{
              background: "var(--accent)",
              color: "white",
              padding: "8px 16px",
              minHeight: "38px",
              fontSize: "13px",
            }}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "收起表单" : "+ 添加心愿"}
          </button>
        </div>
      </div>

      <div className="scroll-area">
        {loading && <div className="notice">数据加载中...</div>}
        {error && <div className="notice">接口异常：{error}</div>}

        {/* Add form */}
        {showForm && (
          <div style={{
            background: "var(--surface)",
            border: "1.5px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: 16,
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-2)", marginBottom: 12 }}>添加心愿物品</div>
            <div className="form-section" style={{ marginBottom: 10 }}>
              <input
                className="form-input"
                placeholder="物品名称 *"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div className="form-row" style={{ marginBottom: 10 }}>
              <input
                className="form-input"
                type="number"
                placeholder="目标价格 *"
                value={form.targetPrice}
                onChange={(e) => set("targetPrice", e.target.value)}
              />
              <select
                className="form-select"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                <option value="">选择分类</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <textarea
              className="form-textarea"
              style={{ height: 64, marginBottom: 10 }}
              placeholder="备注（可选）"
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
            />
            <button className="submit-btn" style={{ marginTop: 0 }} onClick={handleAdd}>
              加入心愿墙
            </button>
          </div>
        )}

        <div className="notice">
          🔍 爬虫监控功能开发中 — 将自动抓取咸鱼价格，当出现符合目标价的商品时，
          发送邮件提醒并附上商品链接。
        </div>

        {wishes.length === 0 && !showForm ? (
          <div className="empty-state">
            <div className="empty-icon">🛒</div>
            <div className="empty-title">心愿墙是空的</div>
            <div className="empty-desc">添加想买的物品，<br />等咸鱼降价了提醒你</div>
          </div>
        ) : (
          wishes.map((wish) => (
            <div className="wish-card" key={wish.id}>
              <div style={{ paddingRight: 40 }}>
                <div className="wish-name">
                  {CATEGORY_ICONS[wish.category] || "🛒"} {wish.name}
                </div>
                <div className="wish-target">目标价 ≤ ¥{wish.targetPrice}</div>
                {wish.note && <div className="wish-note">{wish.note}</div>}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <span style={{
                    fontSize: 11,
                    padding: "3px 10px",
                    borderRadius: 20,
                    background: "var(--amber-bg)",
                    color: "var(--amber)",
                    border: "1px solid rgba(146,64,14,0.2)",
                    fontWeight: 500,
                  }}>
                    ⏳ 监控中
                  </span>
                  {wish.category && (
                    <span style={{ fontSize: 11, color: "var(--ink-4)", fontWeight: 300 }}>{wish.category}</span>
                  )}
                </div>
              </div>
              <button
                className="wish-delete"
                onClick={async () => {
                  try {
                    await deleteWish(wish.id);
                  } catch (requestError) {
                    alert(requestError.message || "删除心愿失败");
                  }
                }}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
