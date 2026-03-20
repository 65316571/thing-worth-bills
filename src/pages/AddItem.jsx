import { useState, useEffect, useMemo } from "react";
import { useItems } from "../context/ItemContext";
import { api } from "../utils/api";
import { calcDays, calcDailyCost, CATEGORIES } from "../utils/calc";

const EDIT_IMAGE_GROUPS = [
  { type: "product_image", label: "商品图片", empty: "暂无商品图片" },
  { type: "order_image", label: "订单信息", empty: "暂无订单信息" },
  { type: "tutorial_image", label: "教程资料", empty: "暂无教程资料" },
];

export default function AddItem({ navigate, editItem }) {
  const { addItem, updateItem, deleteItem, deactivateItem, reactivateItem, addItemAsset, deleteItemAsset } = useItems();
  const isEdit = !!editItem;
  const [uploading, setUploading] = useState(false);
  const [previewAsset, setPreviewAsset] = useState(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    buyDate: new Date().toISOString().split("T")[0],
    category: "",
    purchaseChannel: "",
    note: "",
  });

  const currentAssets = useMemo(() => editItem?.assets || [], [editItem]);
  const imageAssetGroups = useMemo(
    () => EDIT_IMAGE_GROUPS.map((group) => ({
      ...group,
      assets: currentAssets.filter((asset) => asset.type === group.type || (group.type === "product_image" && asset.type === "image")),
    })),
    [currentAssets],
  );

  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name || "",
        price: editItem.price || "",
        buyDate: editItem.buyDate || new Date().toISOString().split("T")[0],
        category: editItem.category || "",
        purchaseChannel: editItem.purchaseChannel || "",
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

  const handleUploadImage = async (event, targetType = "product_image") => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !editItem) {
      return;
    }

    setUploading(true);
    try {
      const url = await api.uploadFileToOss(file);
      const asset = await addItemAsset(editItem.id, {
        type: targetType,
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

  const handleDeleteItem = async () => {
    if (!editItem) {
      return;
    }

    if (!window.confirm(`确定删除「${editItem.name}」吗？`)) {
      return;
    }

    try {
      await deleteItem(editItem.id);
      navigate("list");
    } catch (error) {
      alert(error.message || "删除物品失败");
    }
  };

  return (
    <div className="sub-page">
      <div className="sub-header">
        <button className="back-btn" onClick={() => navigate("list")}>
          ←
        </button>
        <div className="sub-title">{isEdit ? "✏️ 编辑物品" : "记录新物品"}</div>
      </div>

      <div className="form-wrap form-layout">
        <div className="form-main-column">
          <div className="form-section form-card-section">
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

          <div className="form-row form-card-row">
            <div className="form-section form-card-section">
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
            <div className="form-section form-card-section">
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

          <div className="form-row form-card-row">
            <div className="form-section form-card-section">
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
            <div className="form-section form-card-section">
              <div className="form-label">购买渠道</div>
              <input
                className="form-input"
                placeholder="例如：京东、淘宝、线下门店"
                value={form.purchaseChannel}
                onChange={(e) => set("purchaseChannel", e.target.value)}
              />
            </div>
          </div>

          <div className="form-section form-card-section">
            <div className="form-label">备注</div>
            <textarea
              className="form-textarea"
              placeholder="使用感受、保修情况等（可选）"
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
            />
          </div>
        </div>

        <div className="form-side-column">
          {isEdit && (
            <div className="form-section form-card-section edit-image-panel">
              <div className="form-label edit-image-panel-title">图片资料</div>
                <div className="detail-assets-group-list">
                  {imageAssetGroups.map((group) => (
                    <div className="detail-asset-group edit-asset-upload-card" key={group.type}>
                      <div className="detail-asset-group-title edit-asset-upload-title">{group.label}</div>
                      {group.assets.length === 0 ? (
                        <label className={`edit-image-upload-slot ${uploading ? "disabled" : ""}`}>
                          <div className="edit-image-preview-area empty">{group.empty}</div>
                          <div className="edit-image-upload-action">{uploading ? "上传中..." : "点击上传"}</div>
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(event) => handleUploadImage(event, group.type)}
                            disabled={uploading}
                          />
                        </label>
                      ) : (
                        <div className="detail-assets-list">
                          {group.assets.map((asset) => (
                            <div className="detail-asset-item edit-asset-item" key={asset.id}>
                              <button className="edit-image-preview-area" type="button" onClick={() => setPreviewAsset(asset)}>
                                <img className="edit-image-preview-fixed" src={asset.url} alt={asset.title || group.label} />
                              </button>
                              <div className="edit-image-side-actions">
                                <label className={`edit-image-replace-btn ${uploading ? "disabled" : ""}`}>
                                  {uploading ? "上传中..." : "更换上传"}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={(event) => handleUploadImage(event, group.type)}
                                    disabled={uploading}
                                  />
                                </label>
                                <button className="action-btn danger detail-inline-btn" onClick={() => handleDeleteImage(asset.id)}>
                                  删除
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
            </div>
          )}
        </div>
      </div>

      <div className="edit-footer-actions">
        {daily && (
          <div className="auto-calc-card compact edit-footer-summary-card">
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
              <div className="auto-calc-value" style={{ fontSize: 18 }}>
                ¥{form.price}
              </div>
              <div className="auto-calc-label">总价格</div>
            </div>
          </div>
        )}

        <div className="edit-footer-btn-wrap">
          {isEdit && (
            <div className="footer-secondary-actions">
              <button className={`action-btn ${editItem.status === "active" ? "warning" : "success"}`} onClick={handleStatusToggle}>
                {editItem.status === "active" ? "📦 停用" : "♻️ 恢复"}
              </button>
              <button className="action-btn danger" onClick={handleDeleteItem}>
                🗑️ 删除
              </button>
            </div>
          )}

          <button className="submit-btn compact-submit-btn footer-submit-btn" onClick={handleSubmit}>
            {isEdit ? "✅ 保存修改" : "确认记录"}
          </button>
        </div>
      </div>

      {previewAsset && (
        <button className="image-lightbox" type="button" onClick={() => setPreviewAsset(null)}>
          <img className="image-lightbox-preview" src={previewAsset.url} alt={previewAsset.title || "图片预览"} />
        </button>
      )}
    </div>
  );
}
