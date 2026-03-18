import { useState, useEffect } from "react";
import { useItems } from "../context/ItemContext";
import { calcDays, calcDailyCost, CATEGORIES } from "../utils/calc";

export default function AddItem({ navigate, editItem }) {
  const { addItem, updateItem } = useItems();
  const isEdit = !!editItem;

  const [form, setForm] = useState({
    name: "",
    price: "",
    buyDate: new Date().toISOString().split("T")[0],
    category: "",
    note: "",
  });

  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name || "",
        price: editItem.price || "",
        buyDate: editItem.buyDate || new Date().toISOString().split("T")[0],
        category: editItem.category || "",
        note: editItem.note || "",
      });
    }
  }, [editItem]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const days = form.buyDate ? calcDays(form.buyDate) : 0;
  const daily =
    form.price && form.buyDate && days > 0
      ? calcDailyCost(parseFloat(form.price), days)
      : null;

  const handleSubmit = () => {
    if (!form.name.trim() || !form.price || !form.buyDate) {
      alert("请填写必填项：物品名称、购买价格、购买日期");
      return;
    }
    const data = {
      ...form,
      price: parseFloat(form.price),
    };
    if (isEdit) {
      updateItem(editItem.id, data);
    } else {
      addItem(data);
    }
    navigate("list");
  };

  return (
    <div className="sub-page">
      <div className="sub-header">
        <button className="back-btn" onClick={() => navigate("list")}>
          ←
        </button>
        <div className="sub-title">{isEdit ? "编辑物品" : "记录新物品"}</div>
      </div>

      <div className="form-wrap">
        <div className="form-section">
          <div className="form-label">
            物品名称 <span className="required">*</span>
          </div>
          <input
            className="form-input"
            placeholder="例如：小米2万mAh充电宝"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-section">
            <div className="form-label">
              购买价格 <span className="required">*</span>
            </div>
            <input
              className="form-input"
              type="number"
              placeholder="159.00"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          <div className="form-section">
            <div className="form-label">
              购买日期 <span className="required">*</span>
            </div>
            <input
              className="form-input"
              type="date"
              value={form.buyDate}
              onChange={(e) => set("buyDate", e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>

        <div className="form-section">
          <div className="form-label">物品分类</div>
          <select
            className="form-select"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          >
            <option value="">选择分类（可选）</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="form-section">
          <div className="form-label">备注</div>
          <textarea
            className="form-textarea"
            placeholder="使用感受、购买渠道等（可选）"
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
          />
        </div>

        {daily && (
          <div className="auto-calc-card">
            <div className="auto-calc-item">
              <div className="auto-calc-value">{days} 天</div>
              <div className="auto-calc-label">使用天数</div>
            </div>
            <div className="auto-calc-divider" />
            <div className="auto-calc-item">
              <div className="auto-calc-value">¥{daily}</div>
              <div className="auto-calc-label">每日成本</div>
            </div>
            <div className="auto-calc-divider" />
            <div className="auto-calc-item">
              <div className="auto-calc-value" style={{ fontSize: 13 }}>
                ¥{form.price}
              </div>
              <div className="auto-calc-label">总价格</div>
            </div>
          </div>
        )}

        <button className="submit-btn" onClick={handleSubmit}>
          {isEdit ? "保存修改" : "确认记录"}
        </button>
      </div>
    </div>
  );
}
