import { useState, useEffect, useMemo } from "react";
import { useItems } from "../context/ItemContext";
import { api } from "../utils/api";
import { calcDays, calcDailyCost, CATEGORIES } from "../utils/calc";

export default function AddItem({ navigate, editItem }) {
  const { addItem, updateItem, deactivateItem, reactivateItem, addItemAsset, deleteItemAsset } = useItems();
  const isEdit = !!editItem;
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    buyDate: new Date().toISOString().split("T")[0],
    category: "",
    purchaseChannel: "",
    bundleName: "",
    note: "",
  });

  const currentAssets = useMemo(() => editItem?.assets || [], [editItem]);
  const imageAssets = currentAssets.filter((asset) => asset.type === "image");

  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name || "",
        price: editItem.price || "",
        buyDate: editItem.buyDate || new Date().toISOString().split("T")[0],
        category: editItem.category || "",
        purchaseChannel: editItem.purchaseChannel || "",
        bundleName: editItem.bundleName || "",
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

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.price || !form.buyDate) {
      alert("请填写必填项：物品名称、购买价格、购买日期");
      return;
    }
    const data = {
      ...form,
      price: parseFloat(form.price),
    };

    try {
      if (isEdit) {
        await updateItem(editItem.id, data);
      } else {
        await addItem(data);
      }
      navigate("list");
    } catch (error) {
      alert(error.message || "保存物品失败");
    }
  };

  const handleStatusToggle = async () => {
    if (!editItem) {
      return;
    }

    try {
      if (editItem.status === "active") {
        if (!window.confirm(`标记「${editItem.name}」为已停用？`)) {
          return;
        }
        await deactivateItem(editItem.id);
      } else {
        await reactivateItem(editItem.id);
      }
      navigate("list");
    } catch (error) {
      alert(error.message || "更新物品状态失败");
    }
  };

  const handleUploadImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !editItem) {
      return;
    }

    setUploading(true);
    try {
      const url = await api.uploadFileToOss(file);
      const asset = await addItemAsset(editItem.id, {
        type: "image",
        title: file.name,
        url,
      });
      navigate("edit", {
        ...editItem,
        assets: [
          asset,
          ...currentAssets,
        ],
      });
    } catch (error) {
      alert(error.message || "上传图片失败");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (assetId) => {
    if (!editItem) {
      return;
    }

    try {
      await deleteItemAsset(editItem.id, assetId);
      navigate("edit", {
        ...editItem,
        assets: currentAssets.filter((asset) => asset.id !== assetId),
      });
    } catch (error) {
      alert(error.message || "删除图片失败");
    }
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

        <div className="form-row">
          <div className="form-section">
            <div className="form-label">购买渠道</div>
            <input
              className="form-input"
              placeholder="例如：京东、淘宝、线下门店"
              value={form.purchaseChannel}
              onChange={(e) => set("purchaseChannel", e.target.value)}
            />
          </div>
          <div className="form-section">
            <div className="form-label">整体名称</div>
            <input
              className="form-input"
              placeholder="例如：Switch 游戏套装"
              value={form.bundleName}
              onChange={(e) => set("bundleName", e.target.value)}
            />
          </div>
        </div>

        <div className="form-hint">
          如果多个物品属于同一个整体，请给它们填写相同的“整体名称”，例如游戏机和配套手柄。
        </div>

        <div className="form-section">
          <div className="form-label">备注</div>
          <textarea
            className="form-textarea"
            placeholder="使用感受、保修情况等（可选）"
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
          />
        </div>

        {isEdit && (
          <div className="detail-section desktop-edit-section">
            <div className="detail-section-title">订单截图</div>
            <div className="detail-assets-card">
              <div className="detail-assets-actions">
                <label className={`action-btn success detail-inline-btn ${uploading ? "disabled" : ""}`}>
                  {uploading ? "上传中..." : "上传图片"}
                  <input type="file" accept="image/*" hidden onChange={handleUploadImage} disabled={uploading} />
                </label>
              </div>

              {imageAssets.length === 0 ? (
                <div className="desktop-empty-inline">暂无订单截图，可直接上传图片。</div>
              ) : (
                <div className="detail-assets-list">
                  {imageAssets.map((asset) => (
                    <div className="detail-asset-item" key={asset.id}>
                      <div className="detail-image-preview-wrap">
                        <img className="detail-image-preview" src={asset.url} alt={asset.title || "订单截图"} />
                        <div>
                          <div className="detail-related-name">{asset.title || "订单截图"}</div>
                          <a className="detail-asset-link" href={asset.url} target="_blank" rel="noreferrer">
                            查看原图
                          </a>
                        </div>
                      </div>
                      <button className="action-btn danger detail-inline-btn" onClick={() => handleDeleteImage(asset.id)}>
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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

        {isEdit && (
          <div className="desktop-edit-actions">
            <button className={`action-btn ${editItem.status === "active" ? "warning" : "success"}`} onClick={handleStatusToggle}>
              {editItem.status === "active" ? "📦 标记为已停用" : "♻️ 标记为使用中"}
            </button>
          </div>
        )}

        <button className="submit-btn" onClick={handleSubmit}>
          {isEdit ? "保存修改" : "确认记录"}
        </button>
      </div>
    </div>
  );
}
