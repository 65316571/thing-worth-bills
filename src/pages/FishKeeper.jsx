import { useEffect, useMemo, useState } from "react";
import { fishApi } from "../utils/fishApi";

function formatBytes(value) {
  const size = Number(value || 0);
  if (!Number.isFinite(size) || size <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let idx = 0;
  let cur = size;
  while (cur >= 1024 && idx < units.length - 1) {
    cur /= 1024;
    idx += 1;
  }
  return `${cur.toFixed(cur >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}

function formatDateTimeFromEpoch(seconds) {
  const ms = Number(seconds) * 1000;
  if (!Number.isFinite(ms) || ms <= 0) return "-";
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function buildFishImageUrl(relPath) {
  if (!relPath) return "";
  const raw = String(relPath);
  if (/^https?:\/\//i.test(raw)) return raw;
  const segments = raw.split("/").filter(Boolean).map((part) => encodeURIComponent(part));
  return `/fish-api/keeper/images/raw/${segments.join("/")}`;
}

function getProductTitle(item) {
  return item?.["商品信息"]?.["商品标题"] || "-";
}

function getProductLink(item) {
  return item?.["商品信息"]?.["商品链接"] || "";
}

function getProductPrice(item) {
  return item?.["商品信息"]?.["当前售价"] ?? "-";
}

function getProductImage(item) {
  const localMain = item?.["商品信息"]?.["本地主图链接"];
  if (localMain && typeof localMain === "string") return localMain;
  const main = item?.["商品信息"]?.["商品主图链接"];
  if (main && typeof main === "string") return main;
  const localList = item?.["商品信息"]?.["本地图片列表"];
  if (Array.isArray(localList) && localList.length && typeof localList[0] === "string") return localList[0];
  const list = item?.["商品信息"]?.["商品图片列表"];
  if (Array.isArray(list) && list.length && typeof list[0] === "string") return list[0];
  return "";
}

function buildResultImageUrl(src) {
  if (!src) return "";
  const raw = String(src);
  if (/^https?:\/\//i.test(raw)) return raw;
  return buildFishImageUrl(raw);
}

export default function FishKeeper() {
  const [tab, setTab] = useState("overview");

  return (
    <div className="desktop-panel desktop-shop-native">
      <div className="desktop-shop-native-head">
        <div className="desktop-segmented desktop-shop-native-tabs">
          <button className={`desktop-segmented-btn ${tab === "overview" ? "active" : ""}`} onClick={() => setTab("overview")}>
            总览
          </button>
          <button className={`desktop-segmented-btn ${tab === "results" ? "active" : ""}`} onClick={() => setTab("results")}>
            结果文件
          </button>
          <button className={`desktop-segmented-btn ${tab === "images" ? "active" : ""}`} onClick={() => setTab("images")}>
            图片
          </button>
          <button className={`desktop-segmented-btn ${tab === "logs" ? "active" : ""}`} onClick={() => setTab("logs")}>
            日志文件
          </button>
          <button className={`desktop-segmented-btn ${tab === "db" ? "active" : ""}`} onClick={() => setTab("db")}>
            数据库
          </button>
        </div>
        <div className="desktop-shop-native-subtitle">管理 server-fish 运行产生的数据、文件与图片。</div>
      </div>

      <div className="desktop-shop-native-body">
        {tab === "overview" && <KeeperOverview />}
        {tab === "results" && <KeeperResults />}
        {tab === "images" && <KeeperImages />}
        {tab === "logs" && <KeeperLogs />}
        {tab === "db" && <KeeperDb />}
      </div>
    </div>
  );
}

function KeeperOverview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const res = await fishApi.getKeeperSummary();
      setData(res);
    } catch (e) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="desktop-shop-section">
      <div className="desktop-shop-toolbar-row">
        <div className="desktop-panel-title">鱼掌柜总览</div>
        <button className="desktop-action-btn" onClick={refresh} disabled={loading}>
          {loading ? "刷新中..." : "刷新"}
        </button>
      </div>

      {error && <div className="notice desktop-notice">接口异常：{error}</div>}

      <div className="desktop-shop-kv-grid">
        <div className="desktop-shop-kv">
          <div className="desktop-shop-kv-label">图片目录</div>
          <div className="desktop-shop-kv-value">{data?.images?.dir || "-"}</div>
        </div>
        <div className="desktop-shop-kv">
          <div className="desktop-shop-kv-label">任务图片目录数</div>
          <div className="desktop-shop-kv-value">{data?.images?.task_dirs?.length ?? "-"}</div>
        </div>
        <div className="desktop-shop-kv">
          <div className="desktop-shop-kv-label">图片文件数</div>
          <div className="desktop-shop-kv-value">{data?.images?.file_count ?? "-"}</div>
        </div>
        <div className="desktop-shop-kv">
          <div className="desktop-shop-kv-label">数据库文件</div>
          <div className="desktop-shop-kv-value">{data?.db?.exists ? `${formatBytes(data?.db?.size)}` : "不存在"}</div>
        </div>
      </div>

      <div className="desktop-shop-kv-grid">
        <div className="desktop-shop-kv">
          <div className="desktop-shop-kv-label">日志目录</div>
          <div className="desktop-shop-kv-value">{data?.logs?.dir || "-"}</div>
        </div>
        <div className="desktop-shop-kv">
          <div className="desktop-shop-kv-label">日志文件数</div>
          <div className="desktop-shop-kv-value">{data?.logs?.files?.length ?? "-"}</div>
        </div>
        <div className="desktop-shop-kv">
          <div className="desktop-shop-kv-label">结果文件管理</div>
          <div className="desktop-shop-kv-value">请在「结果文件」查看/导出/删除</div>
        </div>
        <div className="desktop-shop-kv">
          <div className="desktop-shop-kv-label">图片访问前缀</div>
          <div className="desktop-shop-kv-value">/fish-images/...</div>
        </div>
      </div>
    </div>
  );
}

function KeeperResults() {
  const [files, setFiles] = useState([]);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemsError, setItemsError] = useState("");
  const limit = 10;
  const [searchText, setSearchText] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await fishApi.getResultFiles();
      const list = data?.files || data || [];
      const normalized = Array.isArray(list) ? list : [];
      setFiles(normalized);
      if (!selected && normalized.length) setSelected(normalized[0]);
    } catch (e) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }

  async function loadItems(targetPage = 1) {
    if (!selected) return;
    setLoadingItems(true);
    setItemsError("");
    try {
      const safePage = Math.max(1, Number(targetPage || 1));
      const data = await fishApi.getResultContent(selected, {
        page: safePage,
        limit,
        recommended_only: false,
        sort_by: "crawl_time",
        sort_order: "desc",
      });
      setItems(Array.isArray(data?.items) ? data.items : []);
      setTotalItems(Number(data?.total_items || 0));
      setPage(safePage);
    } catch (e) {
      setItems([]);
      setTotalItems(0);
      setItemsError(e.message || "加载失败");
    } finally {
      setLoadingItems(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!selected) {
      setItems([]);
      setTotalItems(0);
      setPage(1);
      return;
    }
    loadItems(1);
  }, [selected]);

  const exportUrl = useMemo(() => {
    if (!selected) return "";
    return fishApi.buildResultExportUrl(selected, { recommended_only: false, sort_by: "crawl_time", sort_order: "desc" });
  }, [selected]);

  function ndjsonUrl(filename) {
    if (!filename) return "";
    return `/fish-api/results/files/${encodeURIComponent(filename)}`;
  }

  async function removeFile(filename) {
    setError("");
    try {
      await fishApi.deleteResultFile(filename);
      if (selected === filename) setSelected("");
      refresh();
    } catch (e) {
      setError(e.message || "删除失败");
    }
  }

  const totalPages = useMemo(() => {
    if (!totalItems) return 1;
    return Math.max(1, Math.ceil(totalItems / limit));
  }, [limit, totalItems]);

  const filteredItems = useMemo(() => {
    const q = String(searchText || "").trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const analysis = item?.ai_analysis || {};
      const fields = [
        getProductTitle(item),
        getProductPrice(item),
        item?.["任务名称"],
        item?.["搜索关键字"],
        analysis.reason,
        analysis.analysis_source,
      ];
      return fields
        .filter((v) => v !== undefined && v !== null)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [items, searchText]);

  return (
    <div className="desktop-shop-section">
      <div className="desktop-shop-toolbar-row">
        <div className="desktop-panel-title">结果文件</div>
        <div className="desktop-shop-toolbar-actions">
          <button className="desktop-action-btn" onClick={refresh} disabled={loading}>
            {loading ? "刷新中..." : "刷新"}
          </button>
          {selected && (
            <>
              <button className="desktop-action-btn" onClick={() => window.open(ndjsonUrl(selected), "_blank", "noopener,noreferrer")}>
                下载 NDJSON
              </button>
              <button className="desktop-action-btn" onClick={() => window.open(exportUrl, "_blank", "noopener,noreferrer")}>
                导出 CSV
              </button>
            </>
          )}
        </div>
      </div>
      {error && <div className="notice desktop-notice">接口异常：{error}</div>}

      <div className="desktop-shop-results-grid">
        <div className="desktop-shop-card">
          <div className="desktop-shop-card-title">文件列表</div>
          <div className="desktop-shop-file-list">
            {files.map((filename) => (
              <div className={`desktop-shop-file ${selected === filename ? "active" : ""}`} key={filename}>
                <button className="desktop-shop-file-btn" onClick={() => setSelected(filename)}>
                  {filename}
                </button>
                <button className="desktop-shop-file-del" onClick={() => removeFile(filename)} title="删除文件">
                  ×
                </button>
              </div>
            ))}
            {files.length === 0 && <div className="desktop-empty-inline">暂无结果文件</div>}
          </div>
        </div>

        <div className="desktop-shop-card desktop-shop-card-wide">
          <div className="desktop-shop-card-title">{selected ? `结果预览：${selected}` : "结果预览"}</div>
          {!selected && <div className="desktop-empty-inline">请选择一个结果文件</div>}
          {selected && (
            <>
              {itemsError && <div className="notice desktop-notice">接口异常：{itemsError}</div>}
              <div className="desktop-shop-pagination desktop-shop-pagination-left" style={{ marginTop: 0 }}>
                <button className="desktop-action-btn" onClick={() => loadItems(Math.max(1, page - 1))} disabled={page <= 1 || loadingItems}>
                  上一页
                </button>
                <button className="desktop-action-btn" onClick={() => loadItems(Math.min(totalPages, page + 1))} disabled={page >= totalPages || loadingItems}>
                  下一页
                </button>
                <div className="desktop-shop-pagination-text">
                  {loadingItems ? "加载中..." : `第 ${page}/${totalPages} 页 · 共 ${totalItems} 条`}
                </div>
              </div>

              <div className="desktop-shop-filter-row" style={{ marginTop: 12 }}>
                <input className="form-input" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="搜索当前页结果（标题/任务/关键字/原因）" />
              </div>

              <div className="desktop-shop-results-list">
                {filteredItems.map((item, idx) => {
                  const analysis = item?.ai_analysis || {};
                  const recommended = Boolean(analysis.is_recommended);
                  const link = getProductLink(item);
                  const image = buildResultImageUrl(getProductImage(item));
                  return (
                    <div className={`desktop-shop-result-card ${recommended ? "recommended" : ""}`} key={`${item?.["商品信息"]?.["商品ID"] || idx}`}>
                      <div className="desktop-shop-result-head">
                        <div className="desktop-shop-result-left">
                          {image ? (
                            <img
                              className="desktop-shop-result-thumb"
                              src={image}
                              alt={getProductTitle(item)}
                              loading="lazy"
                              onClick={() => window.open(image, "_blank", "noopener,noreferrer")}
                              style={{ cursor: "pointer" }}
                            />
                          ) : (
                            <div className="desktop-shop-result-thumb desktop-shop-result-thumb-empty">暂无图片</div>
                          )}
                          <div className="desktop-shop-result-head-text">
                            <div className="desktop-shop-result-title">{getProductTitle(item)}</div>
                            <div className="desktop-shop-result-meta">
                              <span>任务：{item?.["任务名称"] || "-"}</span>
                              <span>关键字：{item?.["搜索关键字"] || "-"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="desktop-shop-result-price">{getProductPrice(item)}</div>
                      </div>

                      <div className="desktop-shop-result-reason">
                        <span className="desktop-shop-result-reason-text">{analysis.reason || "-"}</span>
                      </div>

                      <div className="desktop-shop-result-actions">
                        {link ? (
                          <button className="desktop-action-btn" onClick={() => window.open(link, "_blank", "noopener,noreferrer")}>
                            打开链接
                          </button>
                        ) : (
                          <button className="desktop-action-btn" disabled>
                            无链接
                          </button>
                        )}
                        {analysis.keyword_hit_count !== undefined && analysis.keyword_hit_count !== null && (
                          <span className="desktop-shop-badge">命中 {analysis.keyword_hit_count}</span>
                        )}
                        {analysis.analysis_source && <span className="desktop-shop-badge">{analysis.analysis_source === "ai" ? "AI" : "关键词"}</span>}
                        {analysis.value_score !== undefined && analysis.value_score !== null && <span className="desktop-shop-badge">价值 {analysis.value_score}</span>}
                      </div>
                    </div>
                  );
                })}
                {!loadingItems && filteredItems.length === 0 && <div className="desktop-empty-inline">暂无结果</div>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function KeeperImages() {
  const [tasks, setTasks] = useState([]);
  const [taskDir, setTaskDir] = useState("");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function refreshTasks() {
    setLoading(true);
    setError("");
    try {
      const data = await fishApi.listImageTasks();
      const list = data?.tasks || [];
      setTasks(Array.isArray(list) ? list : []);
      if (!taskDir && Array.isArray(list) && list.length) setTaskDir(list[0]);
    } catch (e) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }

  async function refreshFiles(dir) {
    if (!dir) return;
    setLoading(true);
    setError("");
    try {
      const data = await fishApi.listTaskImages(dir);
      setFiles(Array.isArray(data?.files) ? data.files : []);
    } catch (e) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshTasks();
  }, []);

  useEffect(() => {
    if (!taskDir) return;
    refreshFiles(taskDir);
  }, [taskDir]);

  async function deleteFile(relPath) {
    setError("");
    try {
      await fishApi.deleteImageFile(relPath);
      refreshFiles(taskDir);
    } catch (e) {
      setError(e.message || "删除失败");
    }
  }

  async function deleteTaskDir() {
    if (!taskDir) return;
    setError("");
    try {
      await fishApi.deleteTaskImageDir(taskDir);
      setTaskDir("");
      setFiles([]);
      refreshTasks();
    } catch (e) {
      setError(e.message || "删除失败");
    }
  }

  return (
    <div className="desktop-shop-section">
      <div className="desktop-shop-toolbar-row">
        <div className="desktop-panel-title">图片管理</div>
        <div className="desktop-shop-toolbar-actions">
          <button className="desktop-action-btn" onClick={refreshTasks} disabled={loading}>
            刷新目录
          </button>
          <button className="desktop-action-btn warning" onClick={deleteTaskDir} disabled={!taskDir}>
            删除当前目录
          </button>
        </div>
      </div>
      {error && <div className="notice desktop-notice">接口异常：{error}</div>}

      <div className="desktop-shop-card">
        <div className="desktop-shop-form-actions" style={{ justifyContent: "flex-start" }}>
          <select className="form-select" value={taskDir} onChange={(e) => setTaskDir(e.target.value)} disabled={tasks.length === 0}>
            {tasks.map((t) => (
              <option value={t} key={t}>
                {t}
              </option>
            ))}
          </select>
          <button className="desktop-action-btn" onClick={() => refreshFiles(taskDir)} disabled={!taskDir}>
            刷新图片
          </button>
          <div className="desktop-shop-pagination-text">共 {files.length} 张</div>
        </div>

        {files.length === 0 ? (
          <div className="desktop-empty-inline">暂无图片</div>
        ) : (
          <div className="fish-keeper-image-grid">
            {files.map((f) => {
              const url = buildFishImageUrl(f.rel_path);
              return (
                <div className="fish-keeper-image-card" key={f.rel_path}>
                  <img className="fish-keeper-image" src={url} alt={f.name} loading="lazy" onClick={() => window.open(url, "_blank", "noopener,noreferrer")} />
                  <div className="fish-keeper-image-meta">
                    <div className="fish-keeper-image-name" title={f.name}>
                      {f.name}
                    </div>
                    <div className="fish-keeper-image-sub">
                      {formatBytes(f.size)} · {formatDateTimeFromEpoch(f.mtime)}
                    </div>
                  </div>
                  <button className="fish-keeper-image-del" onClick={() => deleteFile(f.rel_path)} title="删除图片">
                    删除
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function KeeperLogs() {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await fishApi.listLogFiles();
      setFiles(Array.isArray(data?.files) ? data.files : []);
    } catch (e) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function downloadUrl(filename) {
    return `/fish-api/keeper/logs/files/${encodeURIComponent(filename)}`;
  }

  async function remove(filename) {
    setError("");
    try {
      await fishApi.deleteLogFile(filename);
      refresh();
    } catch (e) {
      setError(e.message || "删除失败");
    }
  }

  return (
    <div className="desktop-shop-section">
      <div className="desktop-shop-toolbar-row">
        <div className="desktop-panel-title">日志文件</div>
        <button className="desktop-action-btn" onClick={refresh} disabled={loading}>
          {loading ? "刷新中..." : "刷新"}
        </button>
      </div>
      {error && <div className="notice desktop-notice">接口异常：{error}</div>}

      <div className="desktop-shop-card">
        <div className="desktop-shop-file-list">
          {files.map((f) => (
            <div className="desktop-shop-file" key={f.name}>
              <button className="desktop-shop-file-btn" onClick={() => window.open(downloadUrl(f.name), "_blank", "noopener,noreferrer")}>
                {f.name}
              </button>
              <div className="desktop-shop-pagination-text">{formatBytes(f.size)} · {formatDateTimeFromEpoch(f.mtime)}</div>
              <button className="desktop-shop-file-del" onClick={() => remove(f.name)} title="删除日志">
                ×
              </button>
            </div>
          ))}
          {files.length === 0 && <div className="desktop-empty-inline">暂无日志文件</div>}
        </div>
      </div>
    </div>
  );
}

function KeeperDb() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const res = await fishApi.getKeeperSummary();
      setData(res?.db || null);
    } catch (e) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const url = useMemo(() => fishApi.buildDbDownloadUrl(), []);

  return (
    <div className="desktop-shop-section">
      <div className="desktop-shop-toolbar-row">
        <div className="desktop-panel-title">数据库</div>
        <button className="desktop-action-btn" onClick={refresh} disabled={loading}>
          {loading ? "刷新中..." : "刷新"}
        </button>
      </div>
      {error && <div className="notice desktop-notice">接口异常：{error}</div>}

      <div className="desktop-shop-card">
        <div className="desktop-shop-kv-grid desktop-shop-kv-grid-tight">
          <div className="desktop-shop-kv">
            <div className="desktop-shop-kv-label">路径</div>
            <div className="desktop-shop-kv-value">{data?.path || "-"}</div>
          </div>
          <div className="desktop-shop-kv">
            <div className="desktop-shop-kv-label">状态</div>
            <div className="desktop-shop-kv-value">{data?.exists ? "存在" : "不存在"}</div>
          </div>
          <div className="desktop-shop-kv">
            <div className="desktop-shop-kv-label">大小</div>
            <div className="desktop-shop-kv-value">{data?.exists ? formatBytes(data?.size) : "-"}</div>
          </div>
          <div className="desktop-shop-kv">
            <div className="desktop-shop-kv-label">下载</div>
            <div className="desktop-shop-kv-value">
              <button className="desktop-action-btn" onClick={() => window.open(url, "_blank", "noopener,noreferrer")} disabled={!data?.exists}>
                下载 sqlite
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
