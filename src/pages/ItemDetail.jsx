import { useMemo, useState } from "react";
import { useItems } from "../context/ItemContext";
import { calcDays, calcDailyCost, CATEGORY_ICONS, formatUsageDuration } from "../utils/calc";

const DETAIL_IMAGE_GROUPS = [
  { type: "product_image", label: "商品图片", empty: "暂无商品图片" },
  { type: "order_image", label: "订单信息", empty: "暂无订单信息" },
  { type: "tutorial_image", label: "教程资料", empty: "暂无教程资料" },
];

export default function ItemDetail({ item, navigate, backTarget = "list" }) {
  const { items } = useItems();
  const [previewAsset, setPreviewAsset] = useState(null);

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
  const detailAssetGroups = DETAIL_IMAGE_GROUPS.map((group) => ({
    ...group,
    assets: assets.filter((asset) => asset.type === group.type || (group.type === "product_image" && asset.type === "image")),
  }));

  const formatDate = (d) => {
    if (!d) return "—";
    const date = new Date(d);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <div className="sub-page">
      <div className="sub-header">
        <button className="back-btn" onClick={() => navigate(backTarget)}>←</button>
        <div className="sub-title">{isBundle ? "📖 整体详情" : "📖 物品详情"}</div>
      </div>

      <div className="form-wrap form-layout">
        <div className="form-main-column">
          <div className="form-section form-card-section">
            <div className="form-label">物品名称</div>
            <input className="form-input" value={resolvedItem.name} readOnly />
          </div>

          <div className="form-row form-card-row">
            <div className="form-section form-card-section">
              <div className="form-label">购买价格</div>
              <input className="form-input" value={`¥${Number(resolvedItem.price || 0).toFixed(2)}`} readOnly />
            </div>
            <div className="form-section form-card-section">
              <div className="form-label">购买日期</div>
              <input className="form-input" value={formatDate(resolvedItem.buyDate)} readOnly />
            </div>
          </div>

          <div className="form-row form-card-row">
            <div className="form-section form-card-section">
              <div className="form-label">物品分类</div>
              <input className="form-input" value={resolvedItem.category || "未分类"} readOnly />
            </div>
            <div className="form-section form-card-section">
              <div className="form-label">购买渠道</div>
              <input className="form-input" value={resolvedItem.purchaseChannel || "—"} readOnly />
            </div>
          </div>

          {isInactive && resolvedItem.stopDate && (
            <div className="form-section form-card-section">
              <div className="form-label">停用日期</div>
              <input className="form-input" value={formatDate(resolvedItem.stopDate)} readOnly />
            </div>
          )}

          {isBundle && (
            <div className="form-section form-card-section">
              <div className="form-label">整体包含的记录</div>
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

          <div className="form-section form-card-section">
            <div className="form-label">备注</div>
            <textarea className="form-textarea" value={resolvedItem.note || "—"} readOnly />
          </div>
        </div>

        <div className="form-side-column">
          {!isBundle && (
            <div className="form-section form-card-section edit-image-panel">
              <div className="form-label edit-image-panel-title">图片资料</div>
                <div className="detail-assets-group-list">
                  {detailAssetGroups.map((group) => (
                    <div className="detail-asset-group edit-asset-upload-card" key={group.type}>
                      <div className="detail-asset-group-title edit-asset-upload-title">{group.label}</div>
                      {group.assets.length === 0 ? (
                        <div className="edit-image-upload-slot detail-image-readonly-slot">
                          <div className="edit-image-preview-area empty">{group.empty}</div>
                          <div className="edit-image-upload-action readonly">仅支持查看</div>
                        </div>
                      ) : (
                        <div className="detail-assets-list">
                          {group.assets.map((asset) => (
                            <div className="detail-asset-item edit-asset-item" key={asset.id}>
                              <button className="edit-image-preview-area" type="button" onClick={() => setPreviewAsset(asset)}>
                                <img className="edit-image-preview-fixed" src={asset.url} alt={asset.title || group.label} />
                              </button>
                              <div className="edit-image-side-actions detail-image-readonly-side">
                                <div className="detail-related-name">{asset.title || group.label}</div>
                                <a className="detail-asset-link" href={asset.url} target="_blank" rel="noreferrer">
                                  查看原图
                                </a>
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

      <div className="edit-footer-actions detail-footer-actions">
        <div className="auto-calc-card compact edit-footer-summary-card">
          <div className="auto-calc-item">
            <div className="auto-calc-value">{formatUsageDuration(resolvedItem.buyDate, resolvedItem.stopDate)}</div>
            <div className="auto-calc-label">{isBundle ? "整体使用时间" : "使用时间"}</div>
          </div>
          <div className="auto-calc-divider" />
          <div className="auto-calc-item">
            <div className="auto-calc-value">¥{daily}</div>
            <div className="auto-calc-label">{isBundle ? "整体日均" : "每日成本"}</div>
          </div>
          <div className="auto-calc-divider" />
          <div className="auto-calc-item">
            <div className="auto-calc-value" style={{ fontSize: 18 }}>¥{Number(resolvedItem.price || 0).toFixed(2)}</div>
            <div className="auto-calc-label">{isBundle ? "整体价格" : "总价格"}</div>
          </div>
        </div>

        <div className="edit-footer-btn-wrap">
          {!isBundle && (
            <div className="footer-secondary-actions">
              <button className={`action-btn ${isInactive ? "success" : "warning"} disabled`}>
                {isInactive ? "♻️ 恢复" : "📦 停用"}
              </button>
              <button className="action-btn danger disabled">
                🗑️ 删除
              </button>
            </div>
          )}

          {!isBundle && (
            <button className="submit-btn compact-submit-btn footer-submit-btn" onClick={() => navigate("edit", resolvedItem)}>
              ✏️ 编辑物品
            </button>
          )}
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
