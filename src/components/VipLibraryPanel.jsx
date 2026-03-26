import { useMemo, useState } from "react";
import { useItems } from "../context/ItemContext";

function formatDateOnly(value) {
  if (!value) {
    return "未填写";
  }

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "未填写";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDaysLeft(expireAt) {
  const today = new Date();
  const end = new Date(expireAt);
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
}

function getMonthlyAveragePrice(vip) {
  const price = Number(vip.price || 0);

  if (!price) {
    return 0;
  }

  const renewalCycle = String(vip.renewalCycle || vip.level || "").toLowerCase();
  const rawLevel = String(vip.level || "");

  if (renewalCycle.includes("year") || rawLevel.includes("年")) {
    return price / 12;
  }

  if (renewalCycle.includes("quarter") || rawLevel.includes("季")) {
    return price / 3;
  }

  return price;
}

function formatCurrencyPrice(price) {
  const amount = Number(price || 0);

  if (amount === 0) {
    return "免费";
  }

  return `¥${amount.toFixed(2)}`;
}

function getVipStatus(expireAt) {
  const daysLeft = getDaysLeft(expireAt);

  if (daysLeft < 0) return "expired";
  if (daysLeft <= 7) return "urgent";
  if (daysLeft <= 30) return "expiring";
  return "active";
}

const STATUS_TEXT = {
  active: "正常有效",
  expiring: "即将到期",
  urgent: "7天内到期",
  expired: "已过期",
};

export default function VipLibraryPanel({ mobile = false }) {
  const { vipMemberships, addVipMembership, updateVipMembership, deleteVipMembership, loading, error } = useItems();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [sortBy, setSortBy] = useState("expireAtAsc");
  const [form, setForm] = useState({
    name: "",
    level: "yearly",
    website: "",
    account: "",
    price: "",
    benefits: "",
    expireAt: "",
    note: "",
  });

  const cycleOptions = [
    { value: "yearly", label: "年度" },
    { value: "quarterly", label: "季度" },
    { value: "monthly", label: "月度" },
  ];

  const resetForm = () => {
    setForm({
      name: "",
      level: "yearly",
      website: "",
      account: "",
      price: "",
      benefits: "",
      expireAt: "",
      note: "",
    });
    setEditingId(null);
  };

  const summary = useMemo(() => {
    const vips = vipMemberships || [];
    const total = vips.length;
    const active = vips.filter((vip) => getVipStatus(vip.expireAt) === "active").length;
    const expiring = vips.filter((vip) => {
      const status = getVipStatus(vip.expireAt);
      return status === "expiring" || status === "urgent";
    }).length;
    const expired = vips.filter((vip) => getVipStatus(vip.expireAt) === "expired").length;
    const currentYear = new Date().getFullYear();
    const validVips = vips.filter((vip) => getVipStatus(vip.expireAt) !== "expired");
    const yearlyTotal = validVips
      .filter((vip) => Number(vip.price || 0) > 0)
      .reduce((sum, vip) => sum + Number(vip.price || 0), 0);
    const monthlyTotal = validVips.reduce((sum, vip) => sum + Number(getMonthlyAveragePrice(vip) || 0), 0);

    return { total, active, expiring, expired, currentYear, yearlyTotal, monthlyTotal };
  }, [vipMemberships]);

  const filteredVips = useMemo(() => {
    const vips = vipMemberships || [];
    const lowerKeyword = keyword.trim().toLowerCase();

    return vips
      .filter((vip) => filter === "all" || getVipStatus(vip.expireAt) === filter)
      .filter((vip) => {
        if (!lowerKeyword) return true;

        return [vip.name, vip.level, vip.website, vip.account, vip.note, ...(vip.benefits || [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(lowerKeyword);
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "expireAtDesc":
            return new Date(b.expireAt) - new Date(a.expireAt);
          case "monthlyCostDesc":
            return getMonthlyAveragePrice(b) - getMonthlyAveragePrice(a);
          case "monthlyCostAsc":
            return getMonthlyAveragePrice(a) - getMonthlyAveragePrice(b);
          case "priceDesc":
            return Number(b.price || 0) - Number(a.price || 0);
          case "priceAsc":
            return Number(a.price || 0) - Number(b.price || 0);
          case "nameAsc":
            return String(a.name || "").localeCompare(String(b.name || ""), "zh-CN");
          case "nameDesc":
            return String(b.name || "").localeCompare(String(a.name || ""), "zh-CN");
          case "expireAtAsc":
          default:
            return new Date(a.expireAt) - new Date(b.expireAt);
        }
      });
  }, [filter, keyword, sortBy, vipMemberships]);

  const handleAddVip = async () => {
    if (!form.name.trim() || !form.website.trim() || !form.expireAt) {
      alert("请至少填写会员名称、网址和到期时间；如果免费会员，金额可填 0");
      return;
    }

    if (form.price === "") {
      alert("请填写花费金额，免费会员请填写 0");
      return;
    }

    const selectedCycle = cycleOptions.find((option) => option.value === form.level);
    const payload = {
      name: form.name.trim(),
      level: selectedCycle?.label || "月度",
      website: form.website.trim(),
      account: form.account.trim(),
      price: Number(form.price),
      renewalCycle: form.level,
      benefits: form.benefits,
      expireAt: form.expireAt,
      note: form.note.trim(),
      status: getVipStatus(form.expireAt),
    };

    try {
      if (editingId) {
        await updateVipMembership(editingId, payload);
      } else {
        await addVipMembership(payload);
      }

      resetForm();
      setShowForm(false);
    } catch (requestError) {
      alert(requestError.message || `${editingId ? "修改" : "保存"}会员失败`);
    }
  };

  const handleEditVip = (vip) => {
    const matchedCycle = cycleOptions.find((option) => option.label === vip.level || option.value === vip.renewalCycle);

    setForm({
      name: vip.name || "",
      level: matchedCycle?.value || "monthly",
      website: vip.website || "",
      account: vip.account || "",
      price: vip.price === null || vip.price === undefined ? "0" : String(vip.price),
      benefits: Array.isArray(vip.benefits) ? vip.benefits.join(",") : vip.benefits || "",
      expireAt: formatDateOnly(vip.expireAt),
      note: vip.note || "",
    });
    setEditingId(vip.id);
    setShowForm(true);
  };

  const handleDeleteVip = async (vip) => {
    if (!window.confirm(`确定删除会员「${vip.name}」吗？`)) {
      return;
    }

    try {
      await deleteVipMembership(vip.id);
    } catch (requestError) {
      alert(requestError.message || "删除会员失败");
    }
  };

  return (
    <section className={mobile ? "vip-mobile-shell" : "desktop-panel"}>
      <div className="desktop-panel-head">
        <div>
          <div className="desktop-panel-title">会员库</div>
          <div className="desktop-panel-subtitle">记录 VIP 信息、会员网址、核心权益与到期提醒。</div>
        </div>
        <button className="desktop-primary-btn" onClick={() => {
          if (showForm) {
            resetForm();
          }
          setShowForm((value) => !value);
        }}>
          {showForm ? "收起表单" : "+ 添加会员"}
        </button>
      </div>

      {loading && <div className="notice">数据加载中...</div>}
      {error && <div className="notice">接口异常：{error}</div>}

      <div className="vip-summary-grid">
        <article className="vip-summary-card accent">
          <span>会员总数</span>
          <strong>{summary.total}</strong>
        </article>
        <article className="vip-summary-card">
          <span>正常有效</span>
          <strong>{summary.active}</strong>
        </article>
        <article className="vip-summary-card warning">
          <span>即将到期</span>
          <strong>{summary.expiring}</strong>
        </article>
        <article className="vip-summary-card danger">
          <span>已过期</span>
          <strong>{summary.expired}</strong>
        </article>
        <article className="vip-summary-card accent">
          <span>{summary.currentYear} 会员花费</span>
          <strong>{formatCurrencyPrice(summary.yearlyTotal)}</strong>
        </article>
        <article className="vip-summary-card warning">
          <span>本月开销</span>
          <strong>{formatCurrencyPrice(summary.monthlyTotal)}</strong>
        </article>
      </div>

      <div className="vip-toolbar">
        <input
          className="form-input vip-toolbar-search"
          placeholder="搜索会员名称、网址、权益"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <div className="vip-filter-group">
          {[
            ["all", "全部"],
            ["active", "正常"],
            ["expiring", "30天内"],
            ["urgent", "7天内"],
            ["expired", "已过期"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={`vip-filter-chip ${filter === value ? "active" : ""}`}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="expireAtAsc">按到期时间升序</option>
          <option value="expireAtDesc">按到期时间降序</option>
          <option value="monthlyCostDesc">按月均开销从高到低</option>
          <option value="monthlyCostAsc">按月均开销从低到高</option>
          <option value="priceDesc">按花费金额从高到低</option>
          <option value="priceAsc">按花费金额从低到高</option>
          <option value="nameAsc">按名称 A-Z</option>
          <option value="nameDesc">按名称 Z-A</option>
        </select>
      </div>

      {showForm && (
        <div className="desktop-form-card vip-form-card">
          <div className="desktop-panel-subtitle" style={{ marginBottom: 16 }}>
            {editingId ? "正在修改会员信息" : "填写会员信息后即可保存到会员库"}
          </div>
          <div className="desktop-form-grid two-col">
            <input className="form-input" placeholder="会员名称 *" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            <select className="form-select" value={form.level} onChange={(e) => setForm((prev) => ({ ...prev, level: e.target.value }))}>
              {cycleOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="desktop-form-grid two-col">
            <input className="form-input" placeholder="网址 *" value={form.website} onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))} />
            <input className="form-input" placeholder="账号 / 用途说明" value={form.account} onChange={(e) => setForm((prev) => ({ ...prev, account: e.target.value }))} />
          </div>
          <div className="desktop-form-grid two-col">
            <input className="form-input" type="date" value={form.expireAt} onChange={(e) => setForm((prev) => ({ ...prev, expireAt: e.target.value }))} />
            <input className="form-input" type="number" min="0" step="0.01" placeholder="花费金额（免费填 0）*" value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} />
          </div>
          <div className="desktop-form-grid two-col">
            <input className="form-input" placeholder="权益，用逗号分隔" value={form.benefits} onChange={(e) => setForm((prev) => ({ ...prev, benefits: e.target.value }))} />
            <div className="form-input" style={{ display: "flex", alignItems: "center", opacity: 0.75 }}>
              续费周期将用于计算月均花销
            </div>
          </div>
          <textarea className="form-textarea" placeholder="备注（如续费策略、共享说明）" value={form.note} onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))} />
          <div className="desktop-form-actions">
            {editingId && (
              <button className="desktop-action-btn" onClick={() => resetForm()}>取消修改</button>
            )}
            <button className="desktop-primary-btn" onClick={handleAddVip}>{editingId ? "保存修改" : "保存会员"}</button>
          </div>
        </div>
      )}

      <div className="vip-grid">
        {filteredVips.map((vip) => {
          const status = getVipStatus(vip.expireAt);
          const daysLeft = getDaysLeft(vip.expireAt);

          return (
            <article key={vip.id} className={`vip-card status-${status}`}>
              <div className="vip-card-head">
                <div>
                  <div className="vip-name-row">
                    <h3 className="vip-name">{vip.name}</h3>
                    <span className={`vip-status-badge ${status}`}>{STATUS_TEXT[status]}</span>
                  </div>
                  <div className="vip-level">{vip.level || "未注明套餐"}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="desktop-action-btn" onClick={() => handleEditVip(vip)}>
                    修改
                  </button>
                  <button className="desktop-action-btn danger" onClick={() => handleDeleteVip(vip)}>
                    删除
                  </button>
                </div>
              </div>

              <div className="vip-info-list">
                <div className="vip-info-item">
                  <span>网址</span>
                  <a href={vip.website} target="_blank" rel="noreferrer">{vip.website}</a>
                </div>
                <div className="vip-info-item">
                  <span>账号</span>
                  <strong>{vip.account || "未填写"}</strong>
                </div>
                <div className="vip-info-item">
                  <span>到期时间</span>
                  <strong>{formatDateOnly(vip.expireAt)}</strong>
                </div>
                <div className="vip-info-item">
                  <span>剩余时间</span>
                  <strong>{daysLeft >= 0 ? `${daysLeft} 天` : `已过期 ${Math.abs(daysLeft)} 天`}</strong>
                </div>
                <div className="vip-info-item">
                  <span>花费金额</span>
                  <strong>{formatCurrencyPrice(vip.price)}</strong>
                </div>
                <div className="vip-info-item">
                  <span>月均花销</span>
                  <strong>
                    {Number(vip.price || 0) === 0
                      ? "免费"
                      : `${formatCurrencyPrice(getMonthlyAveragePrice(vip))} / 月`}
                  </strong>
                </div>
              </div>

              <div className="vip-benefits">
                <div className="vip-section-label">会员权益</div>
                <div className="vip-tag-list">
                  {(vip.benefits || []).length > 0 ? (
                    vip.benefits.map((benefit) => <span key={benefit} className="vip-tag">{benefit}</span>)
                  ) : (
                    <span className="vip-tag muted">暂无权益说明</span>
                  )}
                </div>
              </div>

              <div className="vip-note-block">
                <div className="vip-section-label">备注</div>
                <p>{vip.note || "暂无备注，可补充续费策略或使用说明。"}</p>
              </div>
            </article>
          );
        })}
      </div>

      {filteredVips.length === 0 && <div className="desktop-empty-inline">当前筛选条件下暂无会员记录。</div>}
    </section>
  );
}