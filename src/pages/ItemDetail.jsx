import { useMemo, useState } from "react";
import { useItems } from "../context/ItemContext";
import { api } from "../utils/api";
import { calcDays, calcDailyCost, CATEGORY_ICONS } from "../utils/calc";

export default function ItemDetail({ item, navigate, backTarget = "list" }) {
  const {
    items,
    deleteItem,
    deactivateItem,
    reactivateItem,
    addItemAsset,
    deleteItemAsset,
  } = useItems();

  const [assetTitle, setAssetTitle] = useState("");
  const [assetUrl, setAssetUrl] = useState("");
  const [assetType, setAssetType] = useState("tutorial");
  const [uploading, setUploading] = useState(false);

  const resolvedItem = useMemo(() => {
    if (!item) {
      return null;
    }

    if (item.type === "bundle") {
      const bundleItems = (item.items || []).map((member) => items.find((it) => it.id === member.id) || member);
      const activeItems = bundleItems.filter((member) => member.status === "active");
      const status = activeItems.length > 0 ? "active" : "inactive";
      const earliestBuyDate = [...bundleItems].sort((a, b) => new Date(a.buyDate) - new Date(b.buyDate))[0]?.buyDate;
      const latestStopDate = [...bundleItems]
        .map((member) => member.stopDate)
        .filter(Boolean)
        .sort((a, b) => new Date(b) - new Date(a))[0] || null;

      return {
        ...item,
        items: bundleItems,
        status,
        buyDate: earliestBuyDate,
        stopDate: latestStopDate,
        price: bundleItems.reduce((sum, member) => sum + Number(member.price || 0), 0),
        purchaseChannel: bundleItems.map((member) => member.purchaseChannel).filter(Boolean).join(" / "),
      };
    }

    return items.find((it) => it.id === item.id) || item;
  }, [item, items]);

  if (!resolvedItem) { navigate(backTarget); return null; }

  const isBundle = resolvedItem.type === "bundle";
  const isInactive = resolvedItem.status === "inactive";
  const days = calcDays(resolvedItem.buyDate, resolvedItem.stopDate);
  const daily = calcDailyCost(Number(resolvedItem.price || 0), days);
  const icon = CATEGORY_ICONS[resolvedItem.category] || "📦";
  const assets = resolvedItem.assets || [];

  const handleDelete = async () => {
    if (window.confirm(`确定删除「${resolvedItem.name}」吗？`)) {
      try {
        await deleteItem(resolvedItem.id);
        navigate(backTarget);
      } catch (error) {
        alert(error.message || "删除物品失败");
      }
    }
  };

  const handleDeactivate = async () => {
    if (window.confirm(`标记「${resolvedItem.name}」为已停用？`)) {
      try {
        await deactivateItem(resolvedItem.id);
        navigate(backTarget);
      } catch (error) {
        alert(error.message || "停用物品失败");
      }
    }
  };

  const handleReactivate = async () => {
    try {
      await reactivateItem(resolvedItem.id);
      navigate(backTarget);
    } catch (error) {
      alert(error.message || "恢复物品失败");
    }
  };

  const handleAddLinkAsset = async () => {
    if (isBundle) {
      return;
    }

    if (!assetUrl.trim()) {
      alert("请先填写资料链接");
      return;
    }

    try {
      await addItemAsset(resolvedItem.id, {
        type: assetType,
        title: assetTitle,
        url: assetUrl,
      });
      setAssetTitle("");
      setAssetUrl("");
      setAssetType("tutorial");
    } catch (error) {
      alert(error.message || "添加资料失败");
    }
  };

  const handleUploadImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || isBundle) {
      return;
    }

    setUploading(true);
    try {
      const url = await api.uploadFileToOss(file);
      await addItemAsset(resolvedItem.id, {
        type: "image",
        title: assetTitle || file.name,
        url,
      });
      setAssetTitle("");
    } catch (error) {
      alert(error.message || "上传截图失败");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAsset = async (assetId) => {
    try {
      await deleteItemAsset(resolvedItem.id, assetId);
    } catch (error) {
      alert(error.message || "删除资料失败");
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    const date = new Date(d);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <div className="sub-page">
      <div className="sub-header">
        <button className="back-btn" onClick={() => navigate(backTarget)}>←</button>
        <div className="sub-title">{isBundle ? "整体详情" : "物品详情"}</div>
      </div>

      {/* Hero */}
      <div className="detail-hero">
        <div className="detail-icon" style={isInactive ? { background: "var(--gray-card)", border: "1.5px solid var(--gray-border)" } : {}}>
          {icon}
        </div>
        <div>
          <div className="detail-name">{resolvedItem.name}</div>
          <div className="detail-cat">
            {resolvedItem.category || "未分类"}
            {isBundle ? ` · 共 ${resolvedItem.items.length} 项` : ""} ·&nbsp;
            <span style={{ color: isInactive ? "var(--gray-text)" : "var(--green-text)", fontWeight: 500 }}>
              {isBundle ? (isInactive ? "整体已停用" : "整体使用中") : (isInactive ? "已停用" : "使用中")}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="detail-stats-grid">
        <div className="detail-stat-card accent">
          <div className="detail-stat-value">¥{daily}</div>
          <div className="detail-stat-label">{isBundle ? "整体日均" : "每日成本"}</div>
        </div>
        <div className="detail-stat-card">
          <div className="detail-stat-value">{days}</div>
          <div className="detail-stat-label">{isBundle ? "整体使用天数" : "已使用天数"}</div>
        </div>
        <div className="detail-stat-card">
          <div className="detail-stat-value">¥{Number(resolvedItem.price || 0).toFixed(2)}</div>
          <div className="detail-stat-label">{isBundle ? "整体价格" : "购买价格"}</div>
        </div>
        <div className="detail-stat-card">
          <div className="detail-stat-value" style={{ fontSize: 16 }}>
            ¥{(Number(resolvedItem.price || 0) * 0.6).toFixed(0)}
          </div>
          <div className="detail-stat-label">预估残值（60%）</div>
        </div>
      </div>

      {/* Details */}
      <div className="detail-section">
        <div className="detail-section-title">详细信息</div>
        <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "0 16px" }}>
          <div className="detail-row">
            <span className="detail-row-label">购买日期</span>
            <span className="detail-row-value" style={{ fontFamily: "var(--font-sans)", fontSize: 13 }}>{formatDate(resolvedItem.buyDate)}</span>
          </div>
          {isInactive && resolvedItem.stopDate && (
            <div className="detail-row">
              <span className="detail-row-label">停用日期</span>
              <span className="detail-row-value" style={{ fontFamily: "var(--font-sans)", fontSize: 13 }}>{formatDate(resolvedItem.stopDate)}</span>
            </div>
          )}
          <div className="detail-row">
            <span className="detail-row-label">物品分类</span>
            <span className="detail-row-value" style={{ fontFamily: "var(--font-sans)", fontSize: 13 }}>{resolvedItem.category || "未分类"}</span>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">购买渠道</span>
            <span className="detail-row-value" style={{ fontFamily: "var(--font-sans)", fontSize: 13 }}>{resolvedItem.purchaseChannel || "—"}</span>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">整体名称</span>
            <span className="detail-row-value" style={{ fontFamily: "var(--font-sans)", fontSize: 13 }}>{resolvedItem.bundleName || "—"}</span>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">总计成本</span>
            <span className="detail-row-value">¥{(parseFloat(daily) * days).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {isBundle && (
        <div className="detail-section">
          <div className="detail-section-title">整体包含的记录</div>
          <div className="detail-related-list">
            {resolvedItem.items.map((member) => {
              const memberDays = calcDays(member.buyDate, member.stopDate);
              return (
                <div className="detail-related-card" key={member.id}>
                  <div>
                    <div className="detail-related-name">{member.name}</div>
                    <div className="detail-related-meta">
                      {member.category || "未分类"} · ¥{Number(member.price || 0).toFixed(2)} · {memberDays} 天
                    </div>
                    <div className="detail-related-meta">
                      {member.purchaseChannel ? `渠道：${member.purchaseChannel}` : "未填写购买渠道"}
                    </div>
                  </div>
                  <div className="detail-related-actions">
                    <button className="action-btn outline detail-inline-btn" onClick={() => navigate("detail", member)}>
                      查看
                    </button>
                    <button className="action-btn outline detail-inline-btn" onClick={() => navigate("edit", member)}>
                      编辑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Note */}
      {resolvedItem.note && (
        <div className="detail-section">
          <div className="detail-section-title">备注</div>
          <div style={{
            background: "var(--surface)",
            border: "1.5px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: "14px 16px",
            fontSize: 14,
            color: "var(--ink-2)",
            lineHeight: 1.6,
            fontWeight: 300,
          }}>
            {resolvedItem.note}
          </div>
        </div>
      )}

      {!isBundle && (
        <div className="detail-section">
          <div className="detail-section-title">订单截图与教程资料</div>
          <div className="detail-assets-card">
            <div className="detail-assets-form">
              <input
                className="form-input"
                placeholder="资料标题（可选）"
                value={assetTitle}
                onChange={(e) => setAssetTitle(e.target.value)}
              />
              <select className="form-select" value={assetType} onChange={(e) => setAssetType(e.target.value)}>
                <option value="tutorial">教程链接</option>
                <option value="link">外部资料</option>
              </select>
              <input
                className="form-input"
                placeholder="粘贴教程/订单链接"
                value={assetUrl}
                onChange={(e) => setAssetUrl(e.target.value)}
              />
              <div className="detail-assets-actions">
                <button className="action-btn outline detail-inline-btn" onClick={handleAddLinkAsset}>
                  保存链接
                </button>
                <label className={`action-btn success detail-inline-btn ${uploading ? "disabled" : ""}`}>
                  {uploading ? "上传中..." : "上传订单截图"}
                  <input type="file" accept="image/*" hidden onChange={handleUploadImage} disabled={uploading} />
                </label>
              </div>
            </div>

            {assets.length === 0 ? (
              <div className="desktop-empty-inline">暂无资料，可上传订单截图或保存教程链接。</div>
            ) : (
              <div className="detail-assets-list">
                {assets.map((asset) => (
                  <div className="detail-asset-item" key={asset.id}>
                    <div>
                      <div className="detail-related-name">{asset.title || (asset.type === "image" ? "订单截图" : "资料链接")}</div>
                      <a className="detail-asset-link" href={asset.url} target="_blank" rel="noreferrer">
                        {asset.url}
                      </a>
                    </div>
                    <button className="action-btn danger detail-inline-btn" onClick={() => handleDeleteAsset(asset.id)}>
                      删除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {!isBundle && (
        <div className="detail-actions">
          <button className="action-btn outline" onClick={() => navigate("edit", resolvedItem)}>
            ✏️ 编辑物品
          </button>
          {isInactive ? (
            <button className="action-btn success" onClick={handleReactivate}>
              ♻️ 标记为使用中
            </button>
          ) : (
            <button className="action-btn warning" onClick={handleDeactivate}>
              📦 标记为已停用
            </button>
          )}
          <button className="action-btn danger" onClick={handleDelete}>
            🗑️ 删除物品
          </button>
        </div>
      )}
    </div>
  );
}
