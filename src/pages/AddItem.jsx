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
  const [previewAsset, setPreviewAsset] = useState(null);
  const [imageIndexes, setImageIndexes] = useState({});
  const [viewerTip, setViewerTip] = useState("");
  
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
    if (!editItem) {
      return;
    }

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
      showDialog({
        type: 'alert',
        title: '错误',
        message: error.message || "更新物品状态失败",
      });
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
      showDialog({
        type: 'alert',
        title: '错误',
        message: error.message || "上传图片失败",
      });
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
      showDialog({
        type: 'alert',
        title: '错误',
        message: error.message || "删除图片失败",
      });
    }
  };

  const handleDeleteItem = async () => {
    if (!editItem) {
      return;
    }

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
          showDialog({
            type: 'alert',
            title: '错误',
            message: error.message || "删除物品失败",
          });
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
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="例如：iPhone 15 Pro"
            />
          </div>

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
            {form.price && (
              <div className="form-hint">
                当前填写金额：¥{parseFloat(form.price || 0).toFixed(2)}
              </div>
            )}
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
            {form.buyDate && (
              <div className="form-hint">
                已使用 {calcDays(form.buyDate)} 天
              </div>
            )}
          </div>

          <div className="form-section form-card-section">
            <div className="form-label">分类</div>
            <select
              className="form-select"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              <option value="">选择分类</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-section form-card-section">
            <div className="form-label">购买渠道</div>
            <input
              className="form-input"
              value={form.purchaseChannel}
              onChange={(e) => set("purchaseChannel", e.target.value)}
              placeholder="例如：淘宝、京东、拼多多"
            />
          </div>

          <div className="form-section form-card-section">
            <div className="form-label">备注</div>
            <textarea
              className="form-textarea"
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="可选：记录购买原因、使用感受等"
            />
          </div>

          {daily !== null && (
            <div className="auto-calc-card">
              <div className="auto-calc-item">
                <div className="auto-calc-value">{days}</div>
                <div className="auto-calc-label">使用天数</div>
              </div>
              <div className="auto-calc-divider" />
              <div className="auto-calc-item">
                <div className="auto-calc-value">¥{daily}</div>
                <div className="auto-calc-label">每日成本</div>
              </div>
            </div>
          )}

          <button className="submit-btn" onClick={handleSubmit}>
            {isEdit ? "保存修改" : "确认添加"}
          </button>

          {isEdit && (
            <>
              <div className="form-section" style={{ marginTop: 24 }}>
                <div className="detail-section-title">图片管理</div>
              </div>

              <div className="edit-image-panel edit-image-upload-card">
                <div className="edit-image-upload-slot" onClick={() => document.getElementById("product-image-input")?.click()}>
                  <input
                    id="product-image-input"
                    type="file"
                    accept="image/*"
                    hidden
                    onClick={(e) => {
                      e.target.value = "";
                    }}
                    onChange={(e) => handleUploadImage(e, "product_image")}
                  />
                  {viewerCurrent ? (
                    <div className="edit-image-preview-area">
                      <img
                        className="edit-image-preview-fixed"
                        src={viewerCurrent.url}
                        alt={viewerCurrent.title || "预览"}
                      />
                    </div>
                  ) : (
                    <div className="edit-image-upload-action">
                      {uploading ? "上传中..." : "点击上传商品图片"}
                    </div>
                  )}
                </div>
                {viewerCount > 1 && (
                  <div className="edit-image-side-actions">
                    <button
                      className="edit-image-replace-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        changeGroupIndex("all", viewerCount, -1);
                      }}
                    >
                      ← 上一张
                    </button>
                    <button
                      className="edit-image-replace-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        changeGroupIndex("all", viewerCount, 1);
                      }}
                    >
                      下一张 →
                    </button>
                  </div>
                )}
              </div>

              <div className="detail-actions detail-side-actions" style={{ marginTop: 16 }}>
                <button className="action-btn outline" onClick={handleStatusToggle}>
                  {editItem.status === "active" ? "标记为已停用" : "标记为使用中"}
                </button>
                <button className="action-btn danger" onClick={handleDeleteItem}>
                  删除物品
                </button>
              </div>
            </>
          )}
        </div>
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