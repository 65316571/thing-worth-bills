import { useState, useEffect, useMemo, useCallback } from "react";
import { useItems } from "../context/ItemContext";
import { api } from "../utils/api";
import { calcDays, calcDailyCost, CATEGORIES } from "../utils/calc";
import { AlertDialog, ConfirmDialog } from "../components/CustomDialog";

const TYPE_LABELS = {
  product_image: "商品图片",
  order_image: "订单信息",
  tutorial_image: "教程资料",
  image: "其他图片",
};

export default function AddItem({ navigate, editItem }) {
  const { addItem, updateItem, deleteItem, deactivateItem, reactivateItem, addItemAsset, deleteItemAsset } = useItems();
  const isEdit = !!editItem;
  const [uploading, setUploading] = useState(false);
  const [imageIndexes, setImageIndexes] = useState({});
  
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

  const [form, setForm] = useState({
    name: "",
    price: "",
    buyDate: new Date().toISOString().split("T")[0],
    category: "",
    purchaseChannel: "",
    note: "",
  });

  const currentAssets = useMemo(() => editItem?.assets || [], [editItem]);
  const allImageAssets = useMemo(
    () =>
      (currentAssets || []).filter(
        (asset) =>
          asset.url &&
          ["product_image", "order_image", "tutorial_image", "image"].includes(asset.type),
      ),
    [currentAssets],
  );
  const viewerCount = allImageAssets.length;
  const viewerIndex = getGroupIndex("all", viewerCount);
  const viewerCurrent = viewerCount > 0 ? allImageAssets[viewerIndex] : null;

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

  // 当图片数量变化时，确保索引在有效范围内
  useEffect(() => {
    if (viewerCount > 0) {
      setImageIndexes((prev) => {
        const currentIdx = prev["all"] || 0;
        if (currentIdx >= viewerCount) {
          return { ...prev, "all": viewerCount - 1 };
        }
        return prev;
      });
    }
  }, [viewerCount]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const days = form.buyDate ? calcDays(form.buyDate) : 0;
  const daily =
    form.price && form.buyDate && days > 0
      ? calcDailyCost(parseFloat(form.price), days)
      : null;

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.price || !form.buyDate) {
      showDialog({
        type: 'alert',
        title: '提示',
        message: '请填写必填项：物品名称、购买价格、购买日期',
      });
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
      showDialog({
        type: 'alert',
        title: '错误',
        message: error.message || "保存物品失败",
      });
    }
  };

  const handleStatusToggle = async () => {
    if (!editItem) return;
    try {
      if (editItem.status === "active") {
        showDialog({
          type: 'confirm',
          title: '确认',
          message: `标记「${editItem.name}」为已停用？`,
          onConfirm: async () => {
            await deactivateItem(editItem.id);
            navigate("list");
          },
        });
      } else {
        await reactivateItem(editItem.id);
        navigate("list");
      }
    } catch (error) {
      showDialog({ type: 'alert', title: '错误', message: error.message || "更新状态失败" });
    }
  };

  const handleUploadImage = async (event, targetType = "product_image") => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !editItem) return;

    setUploading(true);
    try {
      const url = await api.uploadFileToOss(file);
      const asset = await addItemAsset(editItem.id, { type: targetType, title: file.name, url });
      navigate("edit", { ...editItem, assets: [asset, ...currentAssets] });
    } catch (error) {
      showDialog({ type: 'alert', title: '错误', message: error.message || "上传失败" });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (assetId) => {
    if (!editItem) return;
    try {
      await deleteItemAsset(editItem.id, assetId);
      navigate("edit", { ...editItem, assets: currentAssets.filter((a) => a.id !== assetId) });
    } catch (error) {
      showDialog({ type: 'alert', title: '错误', message: error.message || "删除失败" });
    }
  };

  const handleDeleteItem = async () => {
    if (!editItem) return;
    showDialog({
      type: 'confirm',
      title: '确认删除',
      message: `确定删除「${editItem.name}」吗？`,
      danger: true,
      onConfirm: async () => {
        try {
          await deleteItem(editItem.id);
          navigate("list");
        } catch (error) {
          showDialog({ type: 'alert', title: '错误', message: error.message || "删除失败" });
        }
      },
    });
  };

  function getGroupIndex(groupType, count) {
    const idx = imageIndexes[groupType] || 0;
    if (!count) return 0;
    return ((idx % count) + count) % count;
  }

  function changeGroupIndex(groupType, count, direction) {
    if (!count) return;
    setImageIndexes((prev) => {
      const current = prev[groupType] || 0;
      const next = (current + direction + count) % count;
      return { ...prev, [groupType]: next };
    });
  }

  return (
    <div className="sub-page">
      <div className="sub-header">
        <button className="back-btn" onClick={() => navigate("list")}>←</button>
        <div className="sub-title">{isEdit ? "✏️ 编辑物品" : "📝 记录新物品"}</div>
      </div>

      <div className="form-wrap form-layout">
        {/* 左侧主列 - 与查看页一致 */}
        <div className="form-main-column">
          <div className="form-section form-card-section">
            <div className="form-label">
              物品名称 <span className="required">*</span>
            </div>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="例如：iPhone 15 Pro"
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
                step="0.01"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="例如：7999"
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
                <option value="">选择分类</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="form-section form-card-section">
              <div className="form-label">购买渠道</div>
              <input
                className="form-input"
                value={form.purchaseChannel}
                onChange={(e) => set("purchaseChannel", e.target.value)}
                placeholder="例如：淘宝、京东"
              />
            </div>
          </div>

          <div className="form-section form-card-section note-stretch">
            <div className="form-label">备注</div>
            <textarea
              className="form-textarea"
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="可选：记录购买原因、使用感受等"
            />
          </div>
        </div>

        {/* 右侧栏 - 图片管理（与查看页面统一） */}
        <div className="form-side-column">
          <div className="form-section form-card-section image-viewer-panel">
            <div className="form-label image-viewer-title">
              {isEdit ? "图片管理" : "图片资料"}
            </div>
            
            {isEdit ? (
              <>
                <input
                  id="product-image-input"
                  type="file"
                  accept="image/*"
                  hidden
                  onClick={(e) => { e.target.value = ""; }}
                  onChange={(e) => handleUploadImage(e, "product_image")}
                />
                
                {viewerCurrent ? (
                  <div className="image-viewer-content">
                    {/* 图片信息栏 */}
                    <div className="image-viewer-info">
                      <div className="image-viewer-meta">
                        <span className="image-viewer-name" title={viewerCurrent.title || "未命名"}>
                          {viewerCurrent.title || "未命名"}
                        </span>
                        <span className="image-viewer-type">
                          {TYPE_LABELS[viewerCurrent.type] || "图片"}
                        </span>
                      </div>
                      <div className="image-viewer-page">
                        <span className="page-current">{viewerIndex + 1}</span>
                        <span className="page-separator">/</span>
                        <span className="page-total">{viewerCount}</span>
                      </div>
                    </div>
                    
                    {/* 图片展示区 - 600px高度 */}
                    <div className="image-viewer-display">
                      <div 
                        className="image-viewer-img-wrap edit-mode"
                        onClick={() => document.getElementById("product-image-input")?.click()}
                        title="点击更换图片"
                      >
                        <img 
                          className="image-viewer-img" 
                          src={viewerCurrent.url} 
                          alt={viewerCurrent.title || "图片"}
                        />
                        <div className="image-viewer-overlay">
                          <span className="image-viewer-overlay-text">点击更换图片</span>
                        </div>
                      </div>
                      
                      {/* 左右翻页按钮 */}
                      {viewerCount > 1 && (
                        <>
                          <button
                            className="viewer-nav-btn viewer-nav-prev"
                            onClick={(e) => {
                              e.stopPropagation();
                              changeGroupIndex("all", viewerCount, -1);
                            }}
                            disabled={viewerIndex === 0}
                            title="上一张"
                          >
                            ‹
                          </button>
                          <button
                            className="viewer-nav-btn viewer-nav-next"
                            onClick={(e) => {
                              e.stopPropagation();
                              changeGroupIndex("all", viewerCount, 1);
                            }}
                            disabled={viewerIndex === viewerCount - 1}
                            title="下一张"
                          >
                            ›
                          </button>
                        </>
                      )}
                    </div>
                    
                    {/* 底部操作栏 */}
                    <div className="image-viewer-toolbar">
                      <button
                        className="viewer-toolbar-btn delete"
                        onClick={() => handleDeleteImage(viewerCurrent.id)}
                      >
                        🗑️ 删除
                      </button>
                      <button
                        className="viewer-toolbar-btn upload"
                        onClick={() => document.getElementById("product-image-input")?.click()}
                      >
                        ＋ 添加
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="image-viewer-empty"
                    onClick={() => document.getElementById("product-image-input")?.click()}
                  >
                    <div className="image-viewer-empty-icon">📷</div>
                    <div className="image-viewer-empty-text">
                      {uploading ? "上传中..." : "点击上传图片"}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="image-viewer-empty readonly">
                <div className="image-viewer-empty-icon">🖼️</div>
                <div className="image-viewer-empty-text">保存后可上传图片</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部操作区 */}
      <div className="edit-footer-actions detail-footer-actions">
        <div className="auto-calc-card compact edit-footer-summary-card">
          <div className="auto-calc-item">
            <div className="auto-calc-value">{days}</div>
            <div className="auto-calc-label">使用天数</div>
          </div>
          <div className="auto-calc-divider" />
          <div className="auto-calc-item">
            <div className="auto-calc-value">
              {daily ? `¥${daily}` : "—"}
            </div>
            <div className="auto-calc-label">每日成本</div>
          </div>
          <div className="auto-calc-divider" />
          <div className="auto-calc-item">
            <div className="auto-calc-value" style={{ fontSize: 18 }}>
              ¥{Number(form.price || 0).toFixed(2)}
            </div>
            <div className="auto-calc-label">总价格</div>
          </div>
        </div>

        <div className="edit-footer-btn-wrap">
          {isEdit && (
            <div className="footer-secondary-actions">
              <button 
                className={`action-btn ${editItem.status === "inactive" ? "success" : "warning"}`}
                onClick={handleStatusToggle}
              >
                {editItem.status === "inactive" ? "♻️ 恢复" : "📦 停用"}
              </button>
              <button className="action-btn danger" onClick={handleDeleteItem}>
                🗑️ 删除
              </button>
            </div>
          )}
          <button className="submit-btn compact-submit-btn footer-submit-btn" onClick={handleSubmit}>
            {isEdit ? "💾 保存修改" : "✅ 确认添加"}
          </button>
        </div>
      </div>

      {/* 对话框 */}
      {dialogState.isOpen && dialogState.type === 'alert' && (
        <AlertDialog
          isOpen={dialogState.isOpen}
          title={dialogState.title}
          message={dialogState.message}
          onConfirm={() => { hideDialog(); dialogState.onConfirm?.(); }}
        />
      )}
      {dialogState.isOpen && dialogState.type === 'confirm' && (
        <ConfirmDialog
          isOpen={dialogState.isOpen}
          title={dialogState.title}
          message={dialogState.message}
          danger={dialogState.danger}
          onConfirm={() => { hideDialog(); dialogState.onConfirm?.(); }}
          onCancel={() => { hideDialog(); dialogState.onCancel?.(); }}
        />
      )}
    </div>
  );
}
