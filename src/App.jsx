import { useEffect, useMemo, useState } from "react";
import ItemList from "./pages/ItemList";
import AddItem from "./pages/AddItem";
import ItemDetail from "./pages/ItemDetail";
import Stats from "./pages/Stats";
import WishList from "./pages/WishList";
import Data from "./pages/Data";
import Gallery from "./pages/Gallery";
import { ItemProvider } from "./context/ItemContext";
import { useItems } from "./context/ItemContext";
import { CATEGORIES, SORT_OPTIONS, calcDays, calcDailyCost, formatUsageDuration } from "./utils/calc";
import { api } from "./utils/api";
import "./App.css";

const DESKTOP_ALL_CATS = ["全部", ...CATEGORIES, "未分类"];

export default function App() {
  return (
    <ItemProvider>
      <AppContent />
    </ItemProvider>
  );
}

function AppContent() {
  const [mode, setMode] = useState("chooser");
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    return window.localStorage.getItem("thing-worth-theme") || "light";
  });
  const [page, setPage] = useState("list");
  const [toolbarExpanded, setToolbarExpanded] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [desktopDetailReturnTab, setDesktopDetailReturnTab] = useState("items");
  const [desktopTab, setDesktopTab] = useState("value");
  const [desktopOverviewCategory, setDesktopOverviewCategory] = useState("全部");
  const [desktopOverviewSort, setDesktopOverviewSort] = useState("date_desc");
  const [desktopOverviewStatus, setDesktopOverviewStatus] = useState("all");
  const [desktopItemFormOpen, setDesktopItemFormOpen] = useState(false);
  const [desktopSidebarExpanded, setDesktopSidebarExpanded] = useState(true);
  const [desktopItemsSearch, setDesktopItemsSearch] = useState("");
  const [desktopWishFormOpen, setDesktopWishFormOpen] = useState(false);
  const [desktopValueImageIndex, setDesktopValueImageIndex] = useState({});
  const [desktopValueUploading, setDesktopValueUploading] = useState({});
  const [desktopWishForm, setDesktopWishForm] = useState({
    name: "",
    targetPrice: "",
    category: "",
    note: "",
  });

  const {
    items,
    wishes,
    loading,
    error,
    addWish,
    deleteWish,
    deleteItem,
    deactivateItem,
    reactivateItem,
    addItemAsset,
  } = useItems();

  const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 900;
  const recommendedMode = isMobileDevice ? "mobile" : "desktop";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("thing-worth-theme", theme);
  }, [theme]);

  const activeItems = items.filter((item) => item.status === "active");
  const inactiveItems = items.filter((item) => item.status === "inactive");
  const totalValue = items.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const activeValue = activeItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const categorySummary = items.reduce((acc, item) => {
    const key = item.category || "未分类";
    acc[key] = (acc[key] || 0) + Number(item.price || 0);
    return acc;
  }, {});

  const topCategories = Object.entries(categorySummary)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const latestItems = [...items]
    .sort((a, b) => new Date(b.buyDate) - new Date(a.buyDate))
    .slice(0, 5);
  const recentChangedItems = [...items]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || b.buyDate) - new Date(a.updatedAt || a.createdAt || a.buyDate))
    .slice(0, 6);

  const desktopOverviewItems = [...items]
    .filter((item) => desktopOverviewCategory === "全部" || (item.category || "未分类") === desktopOverviewCategory)
    .filter((item) => desktopOverviewStatus === "all" || item.status === desktopOverviewStatus)
    .sort((a, b) => {
      const daysA = calcDays(a.buyDate, a.stopDate);
      const daysB = calcDays(b.buyDate, b.stopDate);
      const costA = Number(calcDailyCost(Number(a.price || 0), daysA));
      const costB = Number(calcDailyCost(Number(b.price || 0), daysB));

      switch (desktopOverviewSort) {
        case "days_desc":
          return daysB - daysA;
        case "cost_asc":
          return costA - costB;
        case "cost_desc":
          return costB - costA;
        case "price_desc":
          return Number(b.price || 0) - Number(a.price || 0);
        case "price_asc":
          return Number(a.price || 0) - Number(b.price || 0);
        case "date_desc":
        default:
          return new Date(b.buyDate) - new Date(a.buyDate);
      }
    });

  const desktopOverviewSpend = desktopOverviewItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const desktopOverviewActiveCount = desktopOverviewItems.filter((item) => item.status === "active").length;
  const desktopOverviewInactiveCount = desktopOverviewItems.filter((item) => item.status === "inactive").length;
  const desktopOverviewBestValue = [...desktopOverviewItems]
    .filter((item) => item.status === "active")
    .sort((a, b) => {
      const costA = Number(calcDailyCost(Number(a.price || 0), calcDays(a.buyDate, a.stopDate)));
      const costB = Number(calcDailyCost(Number(b.price || 0), calcDays(b.buyDate, b.stopDate)));
      return costA - costB;
    })[0];
  const desktopOverviewLongestOwned = [...desktopOverviewItems]
    .sort((a, b) => calcDays(b.buyDate, b.stopDate) - calcDays(a.buyDate, a.stopDate))[0];
  const desktopOverviewListItems = desktopOverviewItems.slice(0, 6);
  const desktopOverviewListConfig = {
    days_desc: {
      title: "使用最久",
      meta: (item) => `${item.category || "未分类"} · 已使用 ${calcDays(item.buyDate, item.stopDate)} 天`,
    },
    cost_asc: {
      title: "每日最省",
      meta: (item) => `${item.category || "未分类"} · 日均 ¥${calcDailyCost(Number(item.price || 0), calcDays(item.buyDate, item.stopDate))}`,
    },
    cost_desc: {
      title: "每日最贵",
      meta: (item) => `${item.category || "未分类"} · 日均 ¥${calcDailyCost(Number(item.price || 0), calcDays(item.buyDate, item.stopDate))}`,
    },
    price_desc: {
      title: "价格最高",
      meta: (item) => `${item.category || "未分类"} · 总价最高档位`,
    },
    price_asc: {
      title: "价格最低",
      meta: (item) => `${item.category || "未分类"} · 当前最低价位`,
    },
    date_desc: {
      title: "最近变更",
      meta: (item) => `${item.category || "未分类"} · 购入于 ${String(item.buyDate).slice(0, 10)}`,
    },
  }[desktopOverviewSort] || {
    title: "最近变更",
    meta: (item) => `${item.category || "未分类"} · 购入于 ${String(item.buyDate).slice(0, 10)}`,
  };

  const desktopItemsFiltered = useMemo(() => {
    const keyword = desktopItemsSearch.trim().toLowerCase();

    if (!keyword) {
      return items;
    }

    return items.filter((item) => [
      item.name,
      item.category,
      item.purchaseChannel,
      item.note,
      item.buyDate,
      item.status === "active" ? "使用中" : "已停用",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(keyword));
  }, [items, desktopItemsSearch]);

  const resetDesktopItemView = () => {
    setSelectedItem(null);
    setEditItem(null);
    setDesktopItemFormOpen(false);
  };

  const openDesktopDetail = (item, sourceTab = "items") => {
    setDesktopDetailReturnTab(sourceTab);
    setDesktopTab("items");
    setSelectedItem(item);
    setEditItem(null);
    setDesktopItemFormOpen(false);
  };

  const toggleTheme = () => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  };

  const navigate = (to, data = null) => {
    if (to === "detail") setSelectedItem(data);
    if (to === "edit") {
      setEditItem(data);
      setPage("add");
      return;
    }
    setPage(to);
    if (to !== "detail") setSelectedItem(null);
    if (to !== "add") setEditItem(null);
  };

  const desktopNavigate = (to, data = null) => {
    if (to === "detail") {
      openDesktopDetail(data, desktopTab === "value" ? "value" : "items");
      return;
    }

    if (to === "edit") {
      setDesktopTab("items");
      setEditItem(data);
      setSelectedItem(null);
      setDesktopItemFormOpen(true);
      return;
    }

    if (to === "add") {
      setDesktopTab("items");
      setEditItem(null);
      setSelectedItem(null);
      setDesktopItemFormOpen(true);
      return;
    }

    if (to === "list") {
      setDesktopTab(desktopDetailReturnTab || "items");
      resetDesktopItemView();
      return;
    }

    if (to === "wish") {
      setDesktopTab("wishes");
      resetDesktopItemView();
      return;
    }

    resetDesktopItemView();
    setDesktopTab(to);
  };

  const setDesktopWishField = (key, value) => {
    setDesktopWishForm((prev) => ({ ...prev, [key]: value }));
  };

  const getDesktopValueImages = (item) => {
    const assets = (item.assets || []).filter((asset) => asset.url);
    const productImages = assets.filter((asset) => asset.type === "product_image");

    if (productImages.length > 0) {
      return productImages;
    }

    return assets.filter((asset) => asset.type === "image");
  };

  const getDesktopValueImageIndex = (itemId, imageCount) => {
    if (!imageCount) {
      return 0;
    }

    const currentIndex = desktopValueImageIndex[itemId] || 0;
    return ((currentIndex % imageCount) + imageCount) % imageCount;
  };

  const changeDesktopValueImage = (event, itemId, imageCount, direction) => {
    event.stopPropagation();

    if (!imageCount) {
      return;
    }

    setDesktopValueImageIndex((prev) => {
      const currentIndex = prev[itemId] || 0;
      const nextIndex = (currentIndex + direction + imageCount) % imageCount;
      return {
        ...prev,
        [itemId]: nextIndex,
      };
    });
  };

  const handleDesktopValueImageUpload = async (event, item) => {
    event.stopPropagation();

    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setDesktopValueUploading((prev) => ({
      ...prev,
      [item.id]: true,
    }));

    try {
      const url = await api.uploadFileToOss(file);
      await addItemAsset(item.id, {
        type: "product_image",
        title: file.name,
        url,
      });
      setDesktopValueImageIndex((prev) => ({
        ...prev,
        [item.id]: 0,
      }));
    } catch (uploadError) {
      alert(uploadError.message || "上传图片失败");
    } finally {
      setDesktopValueUploading((prev) => ({
        ...prev,
        [item.id]: false,
      }));
    }
  };

  const handleDesktopWishAdd = async () => {
    if (!desktopWishForm.name.trim() || !desktopWishForm.targetPrice) {
      alert("请填写物品名称和目标价格");
      return;
    }

    try {
      await addWish({
        ...desktopWishForm,
        targetPrice: parseFloat(desktopWishForm.targetPrice),
      });
      setDesktopWishForm({ name: "", targetPrice: "", category: "", note: "" });
      setDesktopWishFormOpen(false);
    } catch (requestError) {
      alert(requestError.message || "添加心愿失败");
    }
  };

  const handleDesktopDeleteItem = async (item) => {
    if (!window.confirm(`确定删除「${item.name}」吗？`)) {
      return;
    }

    try {
      await deleteItem(item.id);
      resetDesktopItemView();
    } catch (requestError) {
      alert(requestError.message || "删除物品失败");
    }
  };

  const handleDesktopToggleItemStatus = async (item) => {
    const nextAction = item.status === "active" ? "禁用" : "启用";

    if (!window.confirm(`确定${nextAction}「${item.name}」吗？`)) {
      return;
    }

    try {
      if (item.status === "active") {
        await deactivateItem(item.id);
      } else {
        await reactivateItem(item.id);
      }

      resetDesktopItemView();
    } catch (requestError) {
      alert(requestError.message || `${nextAction}物品失败`);
    }
  };

  const chooseMode = (nextMode) => {
    setMode(nextMode);
    if (nextMode === "desktop") {
      setDesktopTab("value");
      resetDesktopItemView();
    } else {
      setPage("list");
      setSelectedItem(null);
      setEditItem(null);
    }
  };

  if (mode === "chooser") {
    return (
      <div className="entry-shell">
        <div className="entry-card">
          <div className="entry-badge">物值账</div>
          <h1 className="entry-title">选择进入方式</h1>
          <p className="entry-desc">
            首次进入时可选择更适合你的浏览方式，手机推荐卡片式 移动端 页面，电脑推荐常规网站页面。
          </p>

          <div className="entry-recommend">
            当前设备推荐：
            <strong>{recommendedMode === "mobile" ? " 移动端卡片页" : " 电脑网站页"}</strong>
          </div>

          <button className="theme-toggle entry-theme-toggle" onClick={toggleTheme}>
            <span title={theme === "light" ? "切换到深色模式" : "切换到浅色模式"}>
              {theme === "light" ? "🌙" : "☀️"}
            </span>
          </button>

          <div className="entry-options">
            <button
              className={`entry-option ${recommendedMode === "mobile" ? "recommended" : ""}`}
              onClick={() => chooseMode("mobile")}
            >
              <span className="entry-option-tag">移动端</span>
              <strong>卡片页面</strong>
              <span>适合手机浏览，延续你当前的卡片式操作体验。</span>
            </button>

            <button
              className={`entry-option ${recommendedMode === "desktop" ? "recommended" : ""}`}
              onClick={() => chooseMode("desktop")}
            >
              <span className="entry-option-tag">电脑端</span>
              <strong>常规网站页面</strong>
              <span>适合桌面大屏浏览，信息更集中，适合总览和管理。</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "desktop") {
    return (
      <div className={`desktop-shell ${desktopSidebarExpanded ? "sidebar-expanded" : "sidebar-collapsed"}`}>
        <aside className="desktop-sidebar">
          <button 
            className="desktop-sidebar-toggle" 
            onClick={() => setDesktopSidebarExpanded(!desktopSidebarExpanded)}
            title={desktopSidebarExpanded ? "收起侧边栏" : "展开侧边栏"}
          >
            {desktopSidebarExpanded ? "◂" : "▸"}
          </button>
          <div className="desktop-sidebar-content">
            <div>
              <div className="desktop-brand">物值账</div>
              <div className="desktop-brand-subtitle">你的物品价值管理台</div>
            </div>

            <div className="desktop-menu">
              <button
                className={`desktop-menu-btn ${desktopTab === "value" ? "active" : ""}`}
                onClick={() => setDesktopTab("value")}
                title="主页"
              >
                <span className="desktop-menu-icon">⌂</span>
                <span className="desktop-menu-text">主页</span>
              </button>
              <button
                className={`desktop-menu-btn ${desktopTab === "overview" ? "active" : ""}`}
                onClick={() => setDesktopTab("overview")}
                title="总览"
              >
                <span className="desktop-menu-icon">◎</span>
                <span className="desktop-menu-text">总览</span>
              </button>
              <button
                className={`desktop-menu-btn ${desktopTab === "items" ? "active" : ""}`}
                onClick={() => setDesktopTab("items")}
                title="清单"
              >
                <span className="desktop-menu-icon">◈</span>
                <span className="desktop-menu-text">清单</span>
              </button>
              <button
                className={`desktop-menu-btn ${desktopTab === "wishes" ? "active" : ""}`}
                onClick={() => setDesktopTab("wishes")}
                title="心愿墙"
              >
                <span className="desktop-menu-icon">◇</span>
                <span className="desktop-menu-text">心愿墙</span>
              </button>
              <button
                className={`desktop-menu-btn ${desktopTab === "gallery" ? "active" : ""}`}
                onClick={() => setDesktopTab("gallery")}
                title="图库"
              >
                <span className="desktop-menu-icon">▥</span>
                <span className="desktop-menu-text">图库</span>
              </button>
            </div>

            <button className="desktop-switch-btn" onClick={() => setMode("chooser")} title="返回入口">
              <span className="desktop-menu-icon">⎋</span>
              <span className="desktop-menu-text">返回入口选择页</span>
            </button>
          </div>
        </aside>

        <main className={`desktop-main ${desktopTab === "value" ? "desktop-main-scroll" : ""}`}>
          <header className="desktop-header">
            <div>
              <h2 className="desktop-title">
                {desktopTab === "value" && "主页"}
                {desktopTab === "overview" && "总览"}
                {desktopTab === "items" && "清单"}
                {desktopTab === "wishes" && "心愿墙"}
                {desktopTab === "gallery" && "图库"}
              </h2>
              <p className="desktop-subtitle">
                {desktopTab === "value" && "直观查看每件物品的购买价值、拥有天数与每日成本。"}
                {desktopTab === "overview" && "以宏观视角查看资产分布、近期变更和全局统计。"}
                {desktopTab === "items" && "统一管理物品资料、编辑信息与维护附件。"}
                {desktopTab === "wishes" && "维护你的待购清单与目标价格。"}
                {desktopTab === "gallery" && "管理所有图片资产，支持分类、重命名与上传。"}
              </p>
            </div>
            <div className="desktop-header-actions">
              <button className="theme-toggle" onClick={toggleTheme}>
                <span title={theme === "light" ? "切换到深色模式" : "切换到浅色模式"}>
                  {theme === "light" ? "🌙" : "☀️"}
                </span>
              </button>
              <button className="desktop-header-btn" onClick={() => chooseMode("mobile")}>
                切换到 移动端卡片页
              </button>
            </div>
          </header>

          {error && <div className="notice desktop-notice">接口异常：{error}</div>}
          {loading && <div className="notice desktop-notice">数据加载中...</div>}

          {desktopTab === "value" && (
            <>
              <section className="desktop-panel">
                <div className="desktop-panel-head desktop-value-panel-head">
                  <div>
                    <div className="desktop-panel-title">物值账明细</div>
                    <div className="desktop-panel-subtitle">按分类、状态和排序方式筛选你要查看的物品卡片。</div>
                  </div>
                  <div className="desktop-value-toolbar">
                    <select
                      className="form-select"
                      value={desktopOverviewCategory}
                      onChange={(e) => setDesktopOverviewCategory(e.target.value)}
                    >
                      {DESKTOP_ALL_CATS.filter((value, index, array) => array.indexOf(value) === index).map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <select
                      className="form-select"
                      value={desktopOverviewSort}
                      onChange={(e) => setDesktopOverviewSort(e.target.value)}
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="desktop-segmented">
                      <button
                        className={`desktop-segmented-btn ${desktopOverviewStatus === "all" ? "active" : ""}`}
                        onClick={() => setDesktopOverviewStatus("all")}
                      >
                        全部
                      </button>
                      <button
                        className={`desktop-segmented-btn ${desktopOverviewStatus === "active" ? "active" : ""}`}
                        onClick={() => setDesktopOverviewStatus("active")}
                      >
                        活跃
                      </button>
                      <button
                        className={`desktop-segmented-btn ${desktopOverviewStatus === "inactive" ? "active" : ""}`}
                        onClick={() => setDesktopOverviewStatus("inactive")}
                      >
                        停用
                      </button>
                    </div>
                  </div>
                </div>
                <div className="desktop-panel-subtitle desktop-panel-subtitle-tight">
                  当前条件：{desktopOverviewCategory} · {desktopOverviewStatus === "all" ? "全部状态" : desktopOverviewStatus === "active" ? "活跃" : "停用"}
                </div>
                <div className="desktop-value-grid desktop-value-grid-single">
                  {desktopOverviewItems.length === 0 ? (
                    <div className="desktop-empty-inline">当前筛选条件下暂无物品。</div>
                  ) : (
                    desktopOverviewItems.map((item) => {
                      const images = getDesktopValueImages(item);
                      const imageIndex = getDesktopValueImageIndex(item.id, images.length);
                      const activeImage = images[imageIndex];
                      const isUploadingImage = Boolean(desktopValueUploading[item.id]);

                      return (
                      <div className="desktop-value-card" key={item.id} onClick={() => openDesktopDetail(item, "value")}>
                        <div className="desktop-value-card-body">
                          <div className="desktop-value-content">
                            <div className="desktop-value-card-head">
                              <div>
                                <div className="desktop-list-name">{item.name}</div>
                                <div className="desktop-value-meta-row">
                                  <div className="desktop-list-meta">
                                    {(item.category || "未分类")} · {item.purchaseChannel || "未填写购买渠道"}
                                  </div>
                                  <div className={`item-status-badge ${item.status === "inactive" ? "inactive" : ""}`}>
                                    {item.status === "active" ? "使用中" : "已停用"}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="desktop-value-stats">
                              <div className="desktop-value-stat">
                                <strong>¥{Number(item.price || 0).toFixed(2)}</strong>
                                <span>购买价格</span>
                              </div>
                              <div className="desktop-value-stat">
                                <strong>{calcDays(item.buyDate, item.stopDate)}</strong>
                                <span>拥有天数</span>
                              </div>
                              <div className="desktop-value-stat accent">
                                <strong>¥{calcDailyCost(Number(item.price || 0), calcDays(item.buyDate, item.stopDate))}</strong>
                                <span>每日成本</span>
                              </div>
                            </div>
                            <div className="desktop-value-note">
                              <span className="desktop-value-note-label">笔记</span>
                              <span className="desktop-value-note-text">{item.note || "暂无笔记"}</span>
                            </div>
                          </div>
                          <div className="desktop-value-media" onClick={(event) => event.stopPropagation()}>
                            {activeImage ? (
                              <>
                                <img className="desktop-value-media-image" src={activeImage.url} alt={activeImage.title || item.name} />
                                {images.length > 1 && (
                                  <>
                                    <button
                                      className="desktop-value-media-nav desktop-value-media-nav-prev"
                                      onClick={(event) => changeDesktopValueImage(event, item.id, images.length, -1)}
                                    >
                                      ←
                                    </button>
                                    <button
                                      className="desktop-value-media-nav desktop-value-media-nav-next"
                                      onClick={(event) => changeDesktopValueImage(event, item.id, images.length, 1)}
                                    >
                                      →
                                    </button>
                                    <div className="desktop-value-media-indicator">
                                      {imageIndex + 1}/{images.length}
                                    </div>
                                  </>
                                )}
                              </>
                            ) : (
                              <label className={`desktop-value-media-empty ${isUploadingImage ? "uploading" : ""}`}>
                                <input
                                  type="file"
                                  accept="image/*"
                                  hidden
                                  disabled={isUploadingImage}
                                  onClick={(event) => event.stopPropagation()}
                                  onChange={(event) => handleDesktopValueImageUpload(event, item)}
                                />
                                {isUploadingImage ? "上传中..." : "暂无关联图片，点击上传"}
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    )})
                  )}
                </div>
              </section>
            </>
          )}
          {desktopTab === "gallery" && (
            <>
              <Gallery />
            </>
          )}

          {desktopTab === "overview" && (
            <>
              <section className="desktop-stats-grid">
                <article className="desktop-stat-panel accent">
                  <span>总投入</span>
                  <strong>¥{totalValue.toFixed(2)}</strong>
                </article>
                <article className="desktop-stat-panel">
                  <span>启用物品</span>
                  <strong>{activeItems.length}</strong>
                </article>
                <article className="desktop-stat-panel">
                  <span>停用物品</span>
                  <strong>{inactiveItems.length}</strong>
                </article>
                <article className="desktop-stat-panel">
                  <span>活跃资产</span>
                  <strong>¥{activeValue.toFixed(2)}</strong>
                </article>
              </section>

              <section className="desktop-panel desktop-overview-tools">
                <div className="desktop-panel-head">
                  <div>
                    <div className="desktop-panel-title">统计筛选器</div>
                    <div className="desktop-panel-subtitle">按分类、状态和排序方式动态查看总览统计结果。</div>
                  </div>
                </div>

                <div className="desktop-toolbar-grid">
                  <div className="desktop-toolbar-field">
                    <label className="desktop-toolbar-label">分类筛选</label>
                    <select
                      className="form-select"
                      value={desktopOverviewCategory}
                      onChange={(e) => setDesktopOverviewCategory(e.target.value)}
                    >
                      {DESKTOP_ALL_CATS.filter((value, index, array) => array.indexOf(value) === index).map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="desktop-toolbar-field">
                    <label className="desktop-toolbar-label">排序方式</label>
                    <select
                      className="form-select"
                      value={desktopOverviewSort}
                      onChange={(e) => setDesktopOverviewSort(e.target.value)}
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="desktop-toolbar-field desktop-toolbar-field-wide">
                    <label className="desktop-toolbar-label">状态切换</label>
                    <div className="desktop-segmented">
                      <button
                        className={`desktop-segmented-btn ${desktopOverviewStatus === "all" ? "active" : ""}`}
                        onClick={() => setDesktopOverviewStatus("all")}
                      >
                        全部
                      </button>
                      <button
                        className={`desktop-segmented-btn ${desktopOverviewStatus === "active" ? "active" : ""}`}
                        onClick={() => setDesktopOverviewStatus("active")}
                      >
                        活跃
                      </button>
                      <button
                        className={`desktop-segmented-btn ${desktopOverviewStatus === "inactive" ? "active" : ""}`}
                        onClick={() => setDesktopOverviewStatus("inactive")}
                      >
                        停用
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="desktop-content-grid">
                <article className="desktop-panel desktop-overview-panel-compact">
                  <div className="desktop-panel-title">分类分布</div>
                  <div className="desktop-category-list">
                    {(desktopOverviewItems.length ? Object.entries(desktopOverviewItems.reduce((acc, item) => {
                      const key = item.category || "未分类";
                      acc[key] = (acc[key] || 0) + Number(item.price || 0);
                      return acc;
                    }, {})) : topCategories)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([category, value]) => (
                      <div className="desktop-category-row" key={category}>
                        <div className="desktop-category-head">
                          <span>{category}</span>
                          <span>¥{value.toFixed(2)}</span>
                        </div>
                        <div className="desktop-category-track">
                          <div
                            className="desktop-category-fill"
                            style={{ width: `${desktopOverviewSpend ? (value / desktopOverviewSpend) * 100 : totalValue ? (value / totalValue) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="desktop-panel desktop-overview-panel-compact">
                  <div className="desktop-panel-title">{desktopOverviewListConfig.title}</div>
                  <div className="desktop-list">
                    {desktopOverviewListItems.map((item) => (
                      <div className="desktop-list-row" key={item.id}>
                        <div>
                          <div className="desktop-list-name">{item.name}</div>
                          <div className="desktop-list-meta">{desktopOverviewListConfig.meta(item)}</div>
                        </div>
                        <div className="desktop-list-price">¥{Number(item.price || 0).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </article>
              </section>
            </>
          )}

          {desktopTab === "items" && (
            <>
              {selectedItem ? (
                <ItemDetail item={selectedItem} navigate={desktopNavigate} backTarget={desktopDetailReturnTab === "value" ? "list" : "list"} />
              ) : desktopItemFormOpen ? (
                <AddItem navigate={desktopNavigate} editItem={editItem} />
              ) : (
                <section className="desktop-panel">
                  <div className="desktop-panel-head desktop-items-panel-head">
                    <div>
                      <div className="desktop-panel-title">全部物品</div>
                      <div className="desktop-panel-subtitle">电脑端已与 移动端同步，可直接管理物品。</div>
                    </div>
                    <div className="desktop-items-panel-actions">
                      <input
                        className="form-input desktop-items-search-input"
                        placeholder="搜索名称、分类、渠道、备注"
                        value={desktopItemsSearch}
                        onChange={(e) => setDesktopItemsSearch(e.target.value)}
                      />
                      <button className="desktop-primary-btn" onClick={() => desktopNavigate("add")}>
                        + 新增物品
                      </button>
                    </div>
                  </div>
                  <div className="desktop-table-wrap">
                    <table className="desktop-table">
                      <colgroup>
                        <col className="desktop-col-name" />
                        <col className="desktop-col-category" />
                        <col className="desktop-col-date" />
                        <col className="desktop-col-days" />
                        <col className="desktop-col-status" />
                        <col className="desktop-col-price" />
                        <col className="desktop-col-actions" />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>名称</th>
                          <th>分类</th>
                          <th>购买日期</th>
                          <th>使用天数</th>
                          <th>状态</th>
                          <th>价格</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {desktopItemsFiltered.map((item) => (
                          <tr key={item.id}>
                            <td>{item.name}</td>
                            <td>{item.category}</td>
                            <td>{item.buyDate}</td>
                            <td>{formatUsageDuration(item.buyDate, item.stopDate)}</td>
                            <td>{item.status === "active" ? "使用中" : "已停用"}</td>
                            <td>¥{Number(item.price || 0).toFixed(2)}</td>
                            <td>
                              <div className="desktop-action-group">
                                <button className="desktop-action-btn" onClick={() => desktopNavigate("detail", item)}>
                                  查看
                                </button>
                                <button className="desktop-action-btn" onClick={() => desktopNavigate("edit", item)}>
                                  编辑
                                </button>
                                <button className="desktop-action-btn warning" onClick={() => handleDesktopToggleItemStatus(item)}>
                                  {item.status === "active" ? "禁用" : "启用"}
                                </button>
                                <button className="desktop-action-btn danger" onClick={() => handleDesktopDeleteItem(item)}>
                                  删除
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {desktopItemsFiltered.length === 0 && (
                    <div className="desktop-empty-inline desktop-items-empty">没有匹配的物品</div>
                  )}
                </section>
              )}
            </>
          )}

          {desktopTab === "wishes" && (
            <section className="desktop-panel">
              <div className="desktop-panel-head">
                <div>
                  <div className="desktop-panel-title">心愿墙</div>
                  <div className="desktop-panel-subtitle">与 移动端共用同一套新增与删除接口。</div>
                </div>
                <button className="desktop-primary-btn" onClick={() => setDesktopWishFormOpen((value) => !value)}>
                  {desktopWishFormOpen ? "收起表单" : "+ 添加心愿"}
                </button>
              </div>

              {desktopWishFormOpen && (
                <div className="desktop-form-card">
                  <div className="desktop-form-grid two-col">
                    <input
                      className="form-input"
                      placeholder="物品名称 *"
                      value={desktopWishForm.name}
                      onChange={(e) => setDesktopWishField("name", e.target.value)}
                    />
                    <input
                      className="form-input"
                      type="number"
                      placeholder="目标价格 *"
                      value={desktopWishForm.targetPrice}
                      onChange={(e) => setDesktopWishField("targetPrice", e.target.value)}
                    />
                  </div>
                  <div className="desktop-form-grid two-col">
                    <select
                      className="form-select"
                      value={desktopWishForm.category}
                      onChange={(e) => setDesktopWishField("category", e.target.value)}
                    >
                      <option value="">选择分类</option>
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <div />
                  </div>
                  <textarea
                    className="form-textarea"
                    placeholder="备注（可选）"
                    value={desktopWishForm.note}
                    onChange={(e) => setDesktopWishField("note", e.target.value)}
                  />
                  <div className="desktop-form-actions">
                    <button className="desktop-primary-btn" onClick={handleDesktopWishAdd}>
                      保存心愿
                    </button>
                  </div>
                </div>
              )}

              <div className="desktop-wish-grid">
                {wishes.map((wish) => (
                  <article className="desktop-wish-card" key={wish.id}>
                    <div className="desktop-wish-card-head">
                      <div>
                        <div className="desktop-wish-name">{wish.name}</div>
                        <div className="desktop-wish-price">目标价 ¥{Number(wish.targetPrice || 0).toFixed(2)}</div>
                      </div>
                      <button
                        className="desktop-action-btn danger"
                        onClick={async () => {
                          try {
                            await deleteWish(wish.id);
                          } catch (requestError) {
                            alert(requestError.message || "删除心愿失败");
                          }
                        }}
                      >
                        删除
                      </button>
                    </div>
                    <div className="desktop-wish-meta">{wish.category || "未分类"}</div>
                    <div className="desktop-wish-note">{wish.note || "暂无备注"}</div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className={`mode-toolbar ${toolbarExpanded ? "expanded" : "collapsed"}`} onClick={() => !toolbarExpanded && setToolbarExpanded(true)}>
        {!toolbarExpanded ? (
          <div className="mode-toolbar-toggle-btn">
            <span>⚙️ 模式设置</span>
          </div>
        ) : (
          <>
            <span className="mode-toolbar-label">当前：移动端 卡片页</span>
            <button className="theme-toggle mode-theme-toggle" onClick={(e) => { e.stopPropagation(); toggleTheme(); }}>
              <span title={theme === "light" ? "切换到深色模式" : "切换到浅色模式"}>
                {theme === "light" ? "🌙" : "☀️"}
              </span>
            </button>
            <button className="mode-toolbar-btn" onClick={(e) => { e.stopPropagation(); setMode("chooser"); }}>
              返回入口页
            </button>
            <button className="mode-toolbar-btn" onClick={(e) => { e.stopPropagation(); chooseMode("desktop"); }}>
              电脑端页面
            </button>
            <button className="mode-toolbar-close" onClick={(e) => { e.stopPropagation(); setToolbarExpanded(false); }}>
              收起
            </button>
          </>
        )}
      </div>

      <div className="app">
        {page === "list" && <ItemList navigate={navigate} />}
        {page === "add" && <AddItem navigate={navigate} editItem={editItem} />}
        {page === "detail" && <ItemDetail item={selectedItem} navigate={navigate} />}
        {page === "stats" && <Stats navigate={navigate} />}
        {page === "wish" && <WishList navigate={navigate} />}
        {page === "data" && <Data navigate={navigate} />}

        {page !== "add" && page !== "detail" && (
          <nav className="bottom-nav">
            <button
              className={`nav-btn ${page === "list" ? "active" : ""}`}
              onClick={() => navigate("list")}
            >
              <span className="nav-icon">◈</span>
              <span>物品</span>
            </button>
            <button
              className={`nav-btn ${page === "stats" ? "active" : ""}`}
              onClick={() => navigate("stats")}
            >
              <span className="nav-icon">◎</span>
              <span>统计</span>
            </button>
            <button className="nav-add-btn" onClick={() => navigate("add")}>
              <span>＋</span>
            </button>
            <button
              className={`nav-btn ${page === "wish" ? "active" : ""}`}
              onClick={() => navigate("wish")}
            >
              <span className="nav-icon">◇</span>
              <span>心愿</span>
            </button>
            <button
              className={`nav-btn ${page === "data" ? "active" : ""}`}
              onClick={() => navigate("data")}
            >
              <span className="nav-icon">◉</span>
              <span>数据</span>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
