import { useEffect, useMemo, useState } from "react";
import { useItems } from "../context/ItemContext";
import { api } from "../utils/api";

const TYPES = [
  { value: "product_image", label: "商品照片" },
  { value: "order_image", label: "订单截图" },
  { value: "image", label: "其他图片" },
];

function getTypeLabel(type) {
  return TYPES.find((t) => t.value === type)?.label || type || "未分类";
}

export default function Gallery() {
  const { items, addItemAsset, deleteItemAsset, updateAsset } = useItems();
  const [assets, setAssets] = useState([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [titleSearch, setTitleSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadItemId, setUploadItemId] = useState(() => (items[0]?.id || ""));
  const [uploadType, setUploadType] = useState(TYPES[0].value);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState(null);
  const [expandedAssetId, setExpandedAssetId] = useState(null);
  const [draftTitles, setDraftTitles] = useState({});
  const [replacingAssetId, setReplacingAssetId] = useState(null);

  useEffect(() => {
    api.getAssets({
      type: typeFilter || undefined,
      itemKeyword: itemSearch || undefined,
      titleKeyword: titleSearch || undefined,
    }).then((res) => {
      setAssets(res.assets || []);
    }).catch(() => setAssets([]));
  }, [typeFilter, itemSearch, titleSearch]);

  useEffect(() => {
    if (!uploadItemId && items.length > 0) {
      setUploadItemId(items[0].id);
    }
  }, [items, uploadItemId]);

  const filteredAssets = useMemo(() => {
    const keyword = [titleSearch, itemSearch].join(" ").trim().toLowerCase();
    return (assets || []).filter((a) => {
      const base = [a.title, a.type, a.itemName, a.url].filter(Boolean).join(" ").toLowerCase();
      return keyword ? base.includes(keyword) : true;
    });
  }, [assets, itemSearch, titleSearch]);

  const saveRename = async (asset) => {
    const nextTitle = draftTitles[asset.id];
    const updated = await updateAsset(asset.id, { title: nextTitle });
    setAssets((prev) => prev.map((a) => (a.id === asset.id ? { ...a, ...updated } : a)));
  };

  const handleReclassify = async (asset, type) => {
    const updated = await updateAsset(asset.id, { type });
    setAssets((prev) => prev.map((a) => (a.id === asset.id ? { ...a, ...updated } : a)));
  };

  const handleRelink = async (asset, nextItemId) => {
    const updated = await updateAsset(asset.id, { itemId: Number(nextItemId) });
    setAssets((prev) => prev.map((a) => (a.id === asset.id ? { ...a, ...updated } : a)));
  };

  const handleDelete = async (asset) => {
    await deleteItemAsset(asset.itemId, asset.id);
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
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
      alert(err.message || "更换图片失败");
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
      alert(err.message || "上传失败");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="desktop-panel">
      <div className="desktop-panel-head">
        <div>
          <div className="desktop-panel-title">图库管理</div>
          <div className="desktop-panel-subtitle">统一管理所有图片资产，支持分类、重命名与上传。</div>
        </div>
      </div>

      <div className="gallery-toolbar">
        <div className="gallery-toolbar-left">
          <div className="desktop-segmented gallery-segmented">
            <button className={`desktop-segmented-btn ${typeFilter === "" ? "active" : ""}`} onClick={() => setTypeFilter("")}>全部</button>
            {TYPES.map((t) => (
              <button key={t.value} className={`desktop-segmented-btn ${typeFilter === t.value ? "active" : ""}`} onClick={() => setTypeFilter(t.value)}>{t.label}</button>
            ))}
          </div>
          <input className="form-input gallery-search" placeholder="搜索图片名称" value={titleSearch} onChange={(e) => setTitleSearch(e.target.value)} />
          <input className="form-input gallery-search gallery-item-search" placeholder="搜索物品名称" value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} />
        </div>
        <div className="gallery-toolbar-right">
          <div className="gallery-count">共 {filteredAssets.length} 张</div>
          <button className="desktop-primary-btn gallery-upload-btn" onClick={() => setUploadOpen(true)} disabled={items.length === 0}>
            上传图片
          </button>
        </div>
      </div>

      <div className="gallery-grid">
        {filteredAssets.map((asset) => (
          <div className="gallery-card" key={asset.id}>
            <button className="gallery-preview" type="button" onClick={() => setPreviewAsset(asset)}>
              <img className="gallery-image" src={asset.url} alt={asset.title || "图片"} />
            </button>
            <div className="gallery-card-head">
              <div className="gallery-card-title">{asset.title || "未命名图片"}</div>
              <div className="gallery-card-actions">
                <button
                  className={`desktop-action-btn ${expandedAssetId === asset.id ? "active" : ""}`}
                  onClick={() => setExpandedAssetId((prev) => (prev === asset.id ? null : asset.id))}
                >
                  {expandedAssetId === asset.id ? "收起" : "管理"}
                </button>
              </div>
            </div>
            <div className="gallery-card-sub">
              <span className="gallery-chip">{getTypeLabel(asset.type)}</span>
              <span className="gallery-item-name">关联物品：{asset.itemName}</span>
            </div>

            {expandedAssetId === asset.id && (
              <div className="gallery-meta">
                <div className="gallery-field">
                  <div className="gallery-label">关联物品</div>
                  <select className="form-select" value={asset.itemId} onChange={(e) => handleRelink(asset, e.target.value)}>
                    {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                  </select>
                </div>
                <div className="gallery-field">
                  <div className="gallery-label">重命名</div>
                  <input
                    className="form-input"
                    value={draftTitles[asset.id] ?? asset.title ?? ""}
                    placeholder="输入图片名称"
                    onChange={(e) => setDraftTitles((prev) => ({ ...prev, [asset.id]: e.target.value }))}
                  />
                </div>
                <div className="gallery-field">
                  <div className="gallery-label">更换图片</div>
                  <label className={`desktop-action-btn ${replacingAssetId === asset.id ? "disabled" : ""}`} style={{ textAlign: "center", cursor: "pointer" }}>
                    {replacingAssetId === asset.id ? "上传中..." : "选择新图片"}
                    <input type="file" accept="image/*" hidden onChange={(e) => handleReplaceImage(asset, e)} disabled={replacingAssetId === asset.id} />
                  </label>
                </div>
                <div className="gallery-row">
                  <select className="form-select" value={asset.type} onChange={(e) => handleReclassify(asset, e.target.value)}>
                    {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <button className="desktop-action-btn" onClick={() => saveRename(asset)}>保存名称</button>
                  <button className="desktop-action-btn danger" onClick={() => handleDelete(asset)}>删除</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filteredAssets.length === 0 && (
          <div className="desktop-empty-inline">暂无图片资产</div>
        )}
      </div>

      {uploadOpen && (
        <div className="gallery-upload-overlay" role="dialog" aria-modal="true">
          <div className="gallery-upload-modal">
            <div className="gallery-upload-head">
              <div>
                <div className="gallery-upload-title">上传图片</div>
                <div className="gallery-upload-subtitle">选择物品与类型后上传，系统会自动归档到对应分类。</div>
              </div>
              <button className="desktop-action-btn" onClick={() => setUploadOpen(false)}>关闭</button>
            </div>

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
                <label className={`desktop-primary-btn gallery-file-btn ${uploading ? "disabled" : ""}`}>
                  {uploading ? "上传中..." : "选择文件"}
                  <input type="file" accept="image/*" hidden onChange={handleUpload} disabled={uploading} />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewAsset && (
        <button className="image-lightbox" type="button" onClick={() => setPreviewAsset(null)}>
          <img className="image-lightbox-preview" src={previewAsset.url} alt={previewAsset.title || "图片预览"} />
        </button>
      )}
    </div>
  );
}
