import { useState } from "react";
import ItemList from "./pages/ItemList";
import AddItem from "./pages/AddItem";
import ItemDetail from "./pages/ItemDetail";
import Stats from "./pages/Stats";
import WishList from "./pages/WishList";
import { ItemProvider } from "./context/ItemContext";
import { useItems } from "./context/ItemContext";
import { CATEGORIES } from "./utils/calc";
import "./App.css";

export default function App() {
  return (
    <ItemProvider>
      <AppContent />
    </ItemProvider>
  );
}

function AppContent() {
  const [mode, setMode] = useState("chooser");
  const [page, setPage] = useState("list");
  const [selectedItem, setSelectedItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [desktopTab, setDesktopTab] = useState("overview");
  const [desktopItemFormOpen, setDesktopItemFormOpen] = useState(false);
  const [desktopWishFormOpen, setDesktopWishFormOpen] = useState(false);
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
  } = useItems();

  const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 900;
  const recommendedMode = isMobileDevice ? "mobile" : "desktop";

  const activeItems = items.filter((item) => item.status === "active");
  const inactiveItems = items.filter((item) => item.status === "inactive");
  const totalValue = items.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const activeValue = activeItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const latestItems = [...items]
    .sort((a, b) => new Date(b.buyDate) - new Date(a.buyDate))
    .slice(0, 5);

  const categorySummary = items.reduce((acc, item) => {
    const key = item.category || "未分类";
    acc[key] = (acc[key] || 0) + Number(item.price || 0);
    return acc;
  }, {});

  const topCategories = Object.entries(categorySummary)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const resetDesktopItemView = () => {
    setSelectedItem(null);
    setEditItem(null);
    setDesktopItemFormOpen(false);
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
      setDesktopTab("items");
      setSelectedItem(data);
      setEditItem(null);
      setDesktopItemFormOpen(false);
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
      setDesktopTab("items");
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

  const handleDesktopToggleStatus = async (item) => {
    try {
      if (item.status === "active") {
        if (!window.confirm(`标记「${item.name}」为已停用？`)) {
          return;
        }
        await deactivateItem(item.id);
      } else {
        await reactivateItem(item.id);
      }
    } catch (requestError) {
      alert(requestError.message || "更新物品状态失败");
    }
  };

  const chooseMode = (nextMode) => {
    setMode(nextMode);
    if (nextMode === "desktop") {
      setDesktopTab("overview");
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
            首次进入时可选择更适合你的浏览方式，手机推荐卡片式 APP 页面，电脑推荐常规网站页面。
          </p>

          <div className="entry-recommend">
            当前设备推荐：
            <strong>{recommendedMode === "mobile" ? " APP 卡片页" : " 电脑网站页"}</strong>
          </div>

          <div className="entry-options">
            <button
              className={`entry-option ${recommendedMode === "mobile" ? "recommended" : ""}`}
              onClick={() => chooseMode("mobile")}
            >
              <span className="entry-option-tag">APP端</span>
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
      <div className="desktop-shell">
        <aside className="desktop-sidebar">
          <div>
            <div className="desktop-brand">物值账</div>
            <div className="desktop-brand-subtitle">你的物品价值管理台</div>
          </div>

          <div className="desktop-menu">
            <button
              className={`desktop-menu-btn ${desktopTab === "overview" ? "active" : ""}`}
              onClick={() => setDesktopTab("overview")}
            >
              总览
            </button>
            <button
              className={`desktop-menu-btn ${desktopTab === "items" ? "active" : ""}`}
              onClick={() => setDesktopTab("items")}
            >
              物品清单
            </button>
            <button
              className={`desktop-menu-btn ${desktopTab === "wishes" ? "active" : ""}`}
              onClick={() => setDesktopTab("wishes")}
            >
              心愿单
            </button>
          </div>

          <button className="desktop-switch-btn" onClick={() => setMode("chooser")}>
            返回入口选择页
          </button>
        </aside>

        <main className="desktop-main">
          <header className="desktop-header">
            <div>
              <h2 className="desktop-title">
                {desktopTab === "overview" && "资产总览"}
                {desktopTab === "items" && "物品清单"}
                {desktopTab === "wishes" && "心愿单"}
              </h2>
              <p className="desktop-subtitle">电脑端采用常规网站布局，适合更高效地查看与管理数据。</p>
            </div>
            <div className="desktop-header-actions">
              <button className="desktop-header-btn" onClick={() => chooseMode("mobile")}>
                切换到 APP 卡片页
              </button>
            </div>
          </header>

          {error && <div className="notice desktop-notice">接口异常：{error}</div>}
          {loading && <div className="notice desktop-notice">数据加载中...</div>}

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
                  <span>闲置物品</span>
                  <strong>{inactiveItems.length}</strong>
                </article>
                <article className="desktop-stat-panel">
                  <span>活跃资产</span>
                  <strong>¥{activeValue.toFixed(2)}</strong>
                </article>
              </section>

              <section className="desktop-content-grid">
                <article className="desktop-panel">
                  <div className="desktop-panel-title">最近新增</div>
                  <div className="desktop-list">
                    {latestItems.map((item) => (
                      <div className="desktop-list-row" key={item.id}>
                        <div>
                          <div className="desktop-list-name">{item.name}</div>
                          <div className="desktop-list-meta">{item.category} · {item.buyDate}</div>
                        </div>
                        <div className="desktop-list-price">¥{Number(item.price || 0).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="desktop-panel">
                  <div className="desktop-panel-title">分类分布</div>
                  <div className="desktop-category-list">
                    {topCategories.map(([category, value]) => (
                      <div className="desktop-category-row" key={category}>
                        <div className="desktop-category-head">
                          <span>{category}</span>
                          <span>¥{value.toFixed(2)}</span>
                        </div>
                        <div className="desktop-category-track">
                          <div
                            className="desktop-category-fill"
                            style={{ width: `${totalValue ? (value / totalValue) * 100 : 0}%` }}
                          />
                        </div>
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
                <ItemDetail item={selectedItem} navigate={desktopNavigate} />
              ) : desktopItemFormOpen ? (
                <AddItem navigate={desktopNavigate} editItem={editItem} />
              ) : (
                <section className="desktop-panel">
                  <div className="desktop-panel-head">
                    <div>
                      <div className="desktop-panel-title">全部物品</div>
                      <div className="desktop-panel-subtitle">电脑端已与 APP 端同步，可直接管理物品。</div>
                    </div>
                    <button className="desktop-primary-btn" onClick={() => desktopNavigate("add")}>
                      + 新增物品
                    </button>
                  </div>
                  <div className="desktop-table-wrap">
                    <table className="desktop-table">
                      <thead>
                        <tr>
                          <th>名称</th>
                          <th>分类</th>
                          <th>购买日期</th>
                          <th>状态</th>
                          <th>价格</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id}>
                            <td>{item.name}</td>
                            <td>{item.category}</td>
                            <td>{item.buyDate}</td>
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
                                <button className="desktop-action-btn" onClick={() => handleDesktopToggleStatus(item)}>
                                  {item.status === "active" ? "停用" : "恢复"}
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
                </section>
              )}
            </>
          )}

          {desktopTab === "wishes" && (
            <section className="desktop-panel">
              <div className="desktop-panel-head">
                <div>
                  <div className="desktop-panel-title">心愿单</div>
                  <div className="desktop-panel-subtitle">与 APP 端共用同一套新增与删除接口。</div>
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
      <div className="mode-toolbar">
        <span className="mode-toolbar-label">当前：APP 卡片页</span>
        <button className="mode-toolbar-btn" onClick={() => setMode("chooser")}>
          返回入口页
        </button>
        <button className="mode-toolbar-btn" onClick={() => chooseMode("desktop")}>
          电脑端页面
        </button>
      </div>

      <div className="app">
        {page === "list" && <ItemList navigate={navigate} />}
        {page === "add" && <AddItem navigate={navigate} editItem={editItem} />}
        {page === "detail" && <ItemDetail item={selectedItem} navigate={navigate} />}
        {page === "stats" && <Stats navigate={navigate} />}
        {page === "wish" && <WishList navigate={navigate} />}

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
            <button className="nav-btn" onClick={() => setMode("chooser")}>
              <span className="nav-icon">◉</span>
              <span>模式</span>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
