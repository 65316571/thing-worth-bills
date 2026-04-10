import { useEffect, useMemo, useState, useCallback } from "react";
import { useItems } from "../context/ItemContext";
import { api } from "../utils/api";
import { AlertDialog, ConfirmDialog } from "../components/CustomDialog";

const TYPES = [
  { value: "product_image", label: "商品照片" },
  { value: "order_image", label: "订单截图" },
  { value: "tutorial_image", label: "教程资料" },
  { value: "image", label: "其他图片" },
];

const TYPE_LABELS = {
  product_image: "商品照片",
  order_image: "订单截图",
  tutorial_image: "教程资料",
  image: "其他图片",
};

function getTypeLabel(type) {
  return TYPE_LABELS[type] || type || "未分类";
}

export default function Gallery() {
  const { items, addItemAsset, deleteItemAsset, updateAsset } = useItems();
  const [assets, setAssets] = useState([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [itemFilter, setItemFilter] = useState(""); // 物品筛选
  const [titleSearch, setTitleSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadItemId, setUploadItemId] = useState(() => (items[0]?.id || ""));
  const [uploadType, setUploadType] = useState(TYPES[0].value);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [editingAssetId, setEditingAssetId] = useState(null);
  const [draftTitles, setDraftTitles] = useState({});
  const [replacingAssetId, setReplacingAssetId] = useState(null);

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

  useEffect(() => {
    api.getAssets({
      type: typeFilter || undefined,
      itemKeyword: itemFilter || undefined,
      titleKeyword: titleSearch || undefined,
    }).then((res) => {
      setAssets(res.assets || []);
    }).catch(() => setAssets([]));
  }, [typeFilter, itemFilter, titleSearch]);

  useEffect(() => {
    if (!uploadItemId && items.length > 0) {
      setUploadItemId(items[0].id);
    }
  }, [items, uploadItemId]);

  // 筛选逻辑
  const filteredAssets = useMemo(() => {
    return (assets || []).filter((a) => {
      // 类型筛选
      if (typeFilter && a.type !== typeFilter) return false;
      // 物品筛选
      if (itemFilter && String(a.itemId) !== itemFilter) return false;
      // 名称搜索
      if (titleSearch && !(a.title || "").toLowerCase().includes(titleSearch.toLowerCase())) return false;
      return true;
    });
  }, [assets, typeFilter, itemFilter, titleSearch]);

  const handlePreview = (asset, index) => {
    setPreviewIndex(index);
    setPreviewAsset({
      assets: filteredAssets,
      index: index,
      label: "图片",
    });
  };

  const handlePreviewNavigate = (direction) => {
    if (!previewAsset) return;
    const newIndex = (previewAsset.index + direction + previewAsset.assets.length) % previewAsset.assets.length;
    setPreviewIndex(newIndex);
    setPreviewAsset((prev) => ({ ...prev, index: newIndex }));
  };

  const saveRename = async (asset) => {
    const nextTitle = draftTitles[asset.id];
    if (!nextTitle || nextTitle === asset.title) {
      setEditingAssetId(null);
      return;
    }
    try {
      const updated = await updateAsset(asset.id, { title: nextTitle });
      setAssets((prev) => prev.map((a) => (a.id === asset.id ? { ...a, ...updated } : a)));
    } catch (err) {
      showDialog({ type: 'alert', title: '错误', message: err.message || "重命名失败" });
    }
    setEditingAssetId(null);
  };

  const handleReclassify = async (asset, type) => {
    try {
      const updated = await updateAsset(asset.id, { type });
      setAssets((prev) => prev.map((a) => (a.id === asset.id ? { ...a, ...updated } : a)));
    } catch (err) {
      showDialog({ type: 'alert', title: '错误', message: err.message || "分类失败" });
    }
  };

  const handleRelink = async (asset, nextItemId) => {
    try {
      const updated = await updateAsset(asset.id, { itemId: Number(nextItemId) });
      setAssets((prev) => prev.map((a) => (a.id === asset.id ? { ...a, ...updated } : a)));
    } catch (err) {
      showDialog({ type: 'alert', title: '错误', message: err.message || "关联失败" });
    }
  };

  const handleDelete = async (asset) => {
    showDialog({
      type: 'confirm',
      title: '确认删除',
      message: `确定删除图片「${asset.title || '未命名'}」吗？`,
      danger: true,
      onConfirm: async () => {
        try {
          await deleteItemAsset(asset.itemId, asset.id);
          setAssets((prev) => prev.filter((a) => a.id !== asset.id));
        } catch (err) {
          showDialog({ type: 'alert', title: '错误', message: err.message || "删除失败" });
        }
      },
    });
  };

  const handleReplaceImage = async (asset, event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setReplacingAssetId(asset.id);
    try {
      const url = await api.uploadFileToOss(file);
      const nextTitle = asset.title ? undefined : file.name;
      const updated = await updateAsset(asset.id, { url, ...(nextTitle ? { title: nextTitle } : {}) });
      setAssets((prev) => prev.map((a) => (a.id === asset.id ? { ...a, ...updated } : a)));
    } catch (err) {
      showDialog({ type: 'alert', title: '错误', message: err.message || "更换图片失败" });
    } finally {
      setReplacingAssetId(null);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !uploadItemId) return;
    setUploading(true);
    try {
      const url = await api.uploadFileToOss(file);
      const created = await addItemAsset(Number(uploadItemId), {
        type: uploadType,
        title: file.name,
        url,
      });
      setAssets((prev) => [{ ...created, itemName: (items.find((i) => i.id === Number(uploadItemId)) || {}).name }, ...prev]);
      setUploadOpen(false);
    } catch (err) {
      showDialog({ type: 'alert', title: '错误', message: err.message || "上传失败" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="desktop-panel gallery-panel">
      {/* 头部工具栏 */}
      <div className="desktop-panel-head gallery-head">
        <div>
          <div className="desktop-panel-title">图库管理</div>
          <div className="desktop-panel-subtitle">统一管理所有图片资产，支持分类、重命名与上传。</div>
        </div>
        <div className="gallery-header-actions">
          <div className="gallery-count">共 {filteredAssets.length} 张</div>
          <button className="desktop-primary-btn" onClick={() => setUploadOpen(true)} disabled={items.length === 0}>
            ＋ 上传图片
          </button>
        </div>
      </div>

      {/* 筛选工具栏 - 三栏布局 */}
      <div className="gallery-filter-bar">
        {/* 左侧：类型筛选 */}
        <div className="gallery-filter-left">
          <div className="gallery-filter-segmented">
            <button className={`desktop-segmented-btn ${typeFilter === "" ? "active" : ""}`} onClick={() => setTypeFilter("")}>
              全部
            </button>
            {TYPES.map((t) => (
              <button key={t.value} className={`desktop-segmented-btn ${typeFilter === t.value ? "active" : ""}`} onClick={() => setTypeFilter(t.value)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* 中间：搜索框 */}
        <div className="gallery-filter-center">
          <div className="gallery-filter-search">
            <input 
              className="form-input" 
              placeholder="搜索图片名称..." 
              value={titleSearch} 
              onChange={(e) => setTitleSearch(e.target.value)} 
            />
          </div>
        </div>
        
        {/* 右侧：物品筛选 */}
        <div className="gallery-filter-right">
          <div className="gallery-filter-item">
            <span className="gallery-filter-label">物品</span>
            <select 
              className="gallery-item-select" 
              value={itemFilter} 
              onChange={(e) => setItemFilter(e.target.value)}
            >
              <option value="">全部物品</option>
              {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* 图片网格 */}
      <div className="gallery-grid">
        {filteredAssets.map((asset, index) => (
          <div className="gallery-card" key={asset.id}>
            {/* 顶部：关联物品（可修改） */}
            <div className="gallery-card-header">
              <select 
                className="gallery-item-select" 
                value={asset.itemId} 
                onChange={(e) => handleRelink(asset, e.target.value)}
                title="点击修改关联物品"
              >
                {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
              </select>
              <span className="gallery-card-index">#{index + 1}</span>
            </div>

            {/* 图片展示区 */}
            <div className="gallery-image-display">
              <button className="gallery-image-wrap" type="button" onClick={() => handlePreview(asset, index)}>
                <img className="gallery-image" src={asset.url} alt={asset.title || "图片"} />
              </button>
            </div>

            {/* 图片信息栏 */}
            <div className="gallery-image-info">
              <div className="gallery-image-meta">
                {/* 图片名称 - 双击编辑 */}
                {editingAssetId === asset.id ? (
                  <input
                    type="text"
                    className="gallery-image-name-input"
                    value={draftTitles[asset.id] ?? asset.title ?? ""}
                    placeholder="输入名称"
                    autoFocus
                    onChange={(e) => setDraftTitles((prev) => ({ ...prev, [asset.id]: e.target.value }))}
                    onBlur={() => saveRename(asset)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRename(asset);
                      if (e.key === 'Escape') setEditingAssetId(null);
                    }}
                  />
                ) : (
                  <span 
                    className="gallery-image-name" 
                    title={asset.title || "未命名"}
                    onDoubleClick={() => {
                      setDraftTitles((prev) => ({ ...prev, [asset.id]: asset.title || "" }));
                      setEditingAssetId(asset.id);
                    }}
                  >
                    {asset.title || "未命名"}
                  </span>
                )}
                
                {/* 图片类型 - 下拉修改 */}
                <select 
                  className="gallery-image-type-select"
                  value={asset.type}
                  onChange={(e) => handleReclassify(asset, e.target.value)}
                  title="点击修改类型"
                >
                  {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            {/* 操作栏 */}
            <div className="gallery-image-toolbar">
              <label className={`viewer-toolbar-btn upload ${replacingAssetId === asset.id ? "disabled" : ""}`}>
                {replacingAssetId === asset.id ? "更换中..." : "更换图片"}
                <input type="file" accept="image/*" hidden onChange={(e) => handleReplaceImage(asset, e)} disabled={replacingAssetId === asset.id} />
              </label>
              <button className="viewer-toolbar-btn delete" onClick={() => handleDelete(asset)}>
                删除
              </button>
            </div>
          </div>
        ))}
        
        {filteredAssets.length === 0 && (
          <div className="gallery-empty">
            <div className="gallery-empty-icon">🖼️</div>
            <div className="gallery-empty-text">暂无图片资产</div>
          </div>
        )}
      </div>

      {/* 上传弹窗 */}
      {uploadOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-container" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div className="modal-title">上传图片</div>
              <button className="modal-close-btn" onClick={() => setUploadOpen(false)}>✖</button>
            </div>
            <div className="modal-body">
              <div className="gallery-upload-form">
                <div className="gallery-field">
                  <div className="gallery-label">上传到物品</div>
                  <select className="form-select" value={uploadItemId} onChange={(e) => setUploadItemId(e.target.value)}>
                    {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                  </select>
                </div>
                <div className="gallery-field">
                  <div className="gallery-label">图片类型</div>
                  <select className="form-select" value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
                    {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="gallery-field">
                  <div className="gallery-label">选择图片</div>
                  <label className={`submit-btn ${uploading ? "disabled" : ""}`} style={{ textAlign: 'center', cursor: 'pointer' }}>
                    {uploading ? "上传中..." : "选择文件"}
                    <input type="file" accept="image/*" hidden onChange={handleUpload} disabled={uploading} />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 图片预览灯箱 - 与编辑页面统一 */}
      {previewAsset && (
        <div className="image-lightbox" onClick={() => setPreviewAsset(null)}>
          <div className="image-lightbox-body" onClick={(e) => e.stopPropagation()}>
            {/* 顶部信息栏 */}
            <div className="image-lightbox-top">
              <div className="image-lightbox-meta">
                <div className="gallery-chip">{getTypeLabel(previewAsset.assets[previewAsset.index]?.type)}</div>
                <div className="detail-related-meta">{previewAsset.index + 1}/{previewAsset.assets.length}</div>
              </div>
              <button className="image-lightbox-close" onClick={() => setPreviewAsset(null)}>✖</button>
            </div>
            
            {/* 图片展示区 - 带左右翻页 */}
            <div className="image-lightbox-display">
              <button
                className="lightbox-nav-btn lightbox-nav-prev"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreviewNavigate(-1);
                }}
                title="上一张"
              >
                ‹
              </button>
              
              <img
                className="image-lightbox-preview"
                src={previewAsset.assets[previewAsset.index]?.url}
                alt={previewAsset.assets[previewAsset.index]?.title || "图片预览"}
                onClick={(e) => e.stopPropagation()}
              />
              
              <button
                className="lightbox-nav-btn lightbox-nav-next"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreviewNavigate(1);
                }}
                title="下一张"
              >
                ›
              </button>
            </div>
            
            {/* 底部提示 */}
            <div className="image-lightbox-hint">
              {previewAsset.assets[previewAsset.index]?.title || "未命名"}
            </div>
          </div>
        </div>
      )}

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
