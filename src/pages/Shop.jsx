import { useEffect, useMemo, useRef, useState } from "react";
import { fishApi } from "../utils/fishApi";

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

function formatMoney(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return value ?? "-";
  return `¥${num.toFixed(2)}`;
}

function formatText(value, fallback = "-") {
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
}

function getProductTitle(item) {
  return item?.["商品信息"]?.["商品标题"] || "-";
}

function getProductPrice(item) {
  return item?.["商品信息"]?.["当前售价"] ?? "-";
}

function getProductLink(item) {
  return item?.["商品信息"]?.["商品链接"] || "";
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

function buildImageUrl(src) {
  if (!src) return "";
  const raw = String(src);
  if (/^https?:\/\//i.test(raw)) return raw;
  const segments = raw.split("/").filter(Boolean).map((part) => encodeURIComponent(part));
  return `/fish-images/${segments.join("/")}`;
}

export default function Shop() {
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="desktop-panel desktop-shop-native">
      <div className="desktop-shop-native-head">
        <div className="desktop-segmented desktop-shop-native-tabs">
          <button className={`desktop-segmented-btn ${tab === "dashboard" ? "active" : ""}`} onClick={() => setTab("dashboard")}>
            总览
          </button>
          <button className={`desktop-segmented-btn ${tab === "tasks" ? "active" : ""}`} onClick={() => setTab("tasks")}>
            任务
          </button>
          <button className={`desktop-segmented-btn ${tab === "results" ? "active" : ""}`} onClick={() => setTab("results")}>
            结果
          </button>
          <button className={`desktop-segmented-btn ${tab === "logs" ? "active" : ""}`} onClick={() => setTab("logs")}>
            日志
          </button>
          <button className={`desktop-segmented-btn ${tab === "settings" ? "active" : ""}`} onClick={() => setTab("settings")}>
            设置
          </button>
          <button className={`desktop-segmented-btn ${tab === "accounts" ? "active" : ""}`} onClick={() => setTab("accounts")}>
            账号
          </button>
        </div>
      </div>

      <div className={`desktop-shop-native-body ${tab === "results" || tab === "dashboard" ? "desktop-shop-native-body-fixed" : ""}`}>
        {tab === "dashboard" && <FishDashboard />}
        {tab === "tasks" && <FishTasks />}
        {tab === "results" && <FishResults />}
        {tab === "logs" && <FishLogs />}
        {tab === "settings" && <FishSettings />}
        {tab === "accounts" && <FishAccounts />}
      </div>
    </div>
  );
}

function FishDashboard() {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await fishApi.getDashboardSummary();
      setSnapshot(data);
    } catch (e) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const summary = snapshot?.summary;

  return (
    <div className="desktop-shop-section">
      <div className="desktop-shop-toolbar-row">
        <div className="desktop-panel-title">总览</div>
        <button className="desktop-action-btn" onClick={refresh} disabled={loading}>
          {loading ? "刷新中..." : "刷新"}
        </button>
      </div>

      {error && <div className="notice desktop-notice">接口异常：{error}</div>}

      <section className="desktop-stats-grid desktop-shop-stats-grid">
        <article className="desktop-stat-panel">
          <span>启用任务</span>
          <strong>{summary?.enabled_tasks ?? "-"}</strong>
        </article>
        <article className="desktop-stat-panel">
          <span>运行中任务</span>
          <strong>{summary?.running_tasks ?? "-"}</strong>
        </article>
        <article className="desktop-stat-panel">
          <span>结果文件</span>
          <strong>{summary?.result_files ?? "-"}</strong>
        </article>
        <article className="desktop-stat-panel accent">
          <span>推荐商品</span>
          <strong>{summary?.recommended_items ?? "-"}</strong>
        </article>
      </section>

      <div className="desktop-shop-kv-grid">
        <div className="desktop-shop-kv">
          <div className="desktop-shop-kv-label">扫描商品</div>
          <div className="desktop-shop-kv-value">{summary?.scanned_items ?? "-"}</div>
        </div>
        <div className="desktop-shop-kv">
          <div className="desktop-shop-kv-label">AI 推荐</div>
          <div className="desktop-shop-kv-value">{summary?.ai_recommended_items ?? "-"}</div>
        </div>
        <div className="desktop-shop-kv">
          <div className="desktop-shop-kv-label">关键词推荐</div>
          <div className="desktop-shop-kv-value">{summary?.keyword_recommended_items ?? "-"}</div>
        </div>
        <div className="desktop-shop-kv">
          <div className="desktop-shop-kv-label">更新时间</div>
          <div className="desktop-shop-kv-value">{formatDateTime(summary?.last_updated_at)}</div>
        </div>
      </div>

      <div className="desktop-shop-split">
        <div className="desktop-shop-card">
          <div className="desktop-shop-card-title">任务概览</div>
          <div className="desktop-shop-mini-table">
            {(snapshot?.task_summaries || []).slice(0, 8).map((row) => (
              <div className="desktop-shop-mini-row" key={`${row.task_id ?? "na"}-${row.task_name ?? row.taskName ?? row.name ?? row.keyword ?? "na"}`}>
                <div className="desktop-shop-mini-name">{formatText(row.task_name ?? row.taskName ?? row.name ?? row.keyword)}</div>
                <div className="desktop-shop-mini-meta">
                  {formatText(row.keyword)} · {row.enabled ? "启用" : "停用"} · {row.is_running ? "运行中" : "未运行"}
                </div>
                <div className="desktop-shop-mini-right">{row.latest_recommended_price !== null && row.latest_recommended_price !== undefined ? formatMoney(row.latest_recommended_price) : "-"}</div>
              </div>
            ))}
            {(snapshot?.task_summaries || []).length === 0 && <div className="desktop-empty-inline">暂无任务数据</div>}
          </div>
        </div>

        <div className="desktop-shop-card">
          <div className="desktop-shop-card-title">最近动态</div>
          <div className="desktop-shop-mini-table desktop-shop-mini-table-scroll">
            {(snapshot?.recent_activities || []).map((row) => (
              <div className="desktop-shop-mini-row" key={row.id}>
                <div className="desktop-shop-mini-name">{row.title}</div>
                <div className="desktop-shop-mini-meta">
                  {formatText(row.task_name)} · {formatText(row.keyword)} · {formatText(row.status)}
                </div>
                <div className="desktop-shop-mini-right">{formatDateTime(row.timestamp)}</div>
              </div>
            ))}
            {(snapshot?.recent_activities || []).length === 0 && <div className="desktop-empty-inline">暂无动态</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function FishTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function normalizeKeywordRulesText(text) {
    if (!text) return [];
    return String(text)
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const [createMode, setCreateMode] = useState("keyword");
  const [form, setForm] = useState({
    task_name: "",
    keyword: "",
    description: "",
    keyword_rules_text: "",
    max_pages: 3,
    min_price: "",
    max_price: "",
    decision_mode: "keyword",
  });

  const [job, setJob] = useState(null);
  const pollRef = useRef(null);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await fishApi.getTasks();
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!job?.job_id) return;

    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }

    pollRef.current = window.setInterval(async () => {
      try {
        const data = await fishApi.getTaskGenerationJob(job.job_id);
        const nextJob = data?.job || data;
        setJob(nextJob);
        if (nextJob?.status === "completed" || nextJob?.status === "failed") {
          window.clearInterval(pollRef.current);
          pollRef.current = null;
          refresh();
        }
      } catch {
      }
    }, 1200);

    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [job?.job_id]);

  async function toggleEnabled(task, enabled) {
    const previous = task.enabled;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, enabled } : t)));
    try {
      await fishApi.updateTask(task.id, { enabled });
    } catch (e) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, enabled: previous } : t)));
      setError(e.message || "更新失败");
    }
  }

  async function start(taskId) {
    setError("");
    try {
      await fishApi.startTask(taskId);
      refresh();
    } catch (e) {
      setError(e.message || "启动失败");
    }
  }

  async function stop(taskId) {
    setError("");
    try {
      await fishApi.stopTask(taskId);
      refresh();
    } catch (e) {
      setError(e.message || "停止失败");
    }
  }

  async function remove(taskId) {
    setError("");
    try {
      await fishApi.deleteTask(taskId);
      refresh();
    } catch (e) {
      setError(e.message || "删除失败");
    }
  }

  async function submitCreate() {
    setError("");
    const taskName = form.task_name.trim();
    const keyword = form.keyword.trim();
    const description = form.description.trim();
    const keywordRules = normalizeKeywordRulesText(form.keyword_rules_text);

    if (!taskName || !keyword) {
      setError("任务名称与关键字为必填");
      return;
    }
    if (createMode === "ai" && !description) {
      setError("AI 判断模式下，描述为必填");
      return;
    }

    const effectiveKeywordRules =
      createMode === "keyword" ? (keywordRules.length ? keywordRules : [keyword]) : [];

    const payload = {
      task_name: taskName,
      keyword,
      description: description || undefined,
      max_pages: Number(form.max_pages || 1),
      min_price: form.min_price.trim() ? form.min_price.trim() : null,
      max_price: form.max_price.trim() ? form.max_price.trim() : null,
      decision_mode: createMode,
      keyword_rules: effectiveKeywordRules,
    };

    setLoading(true);
    try {
      if (createMode === "ai") {
        const data = await fishApi.generateTask(payload);
        if (data?.job) {
          setJob(data.job);
        } else if (data?.task) {
          setJob(null);
          refresh();
        }
      } else {
        const data = await fishApi.generateTask(payload);
        if (data?.task) {
          setJob(null);
          refresh();
        }
      }
      setForm((prev) => ({ ...prev, description: "" }));
    } catch (e) {
      setError(e.message || "创建失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="desktop-shop-section">
      <div className="desktop-shop-toolbar-row">
        <div className="desktop-panel-title">任务管理</div>
        <button className="desktop-action-btn" onClick={refresh} disabled={loading}>
          {loading ? "刷新中..." : "刷新"}
        </button>
      </div>

      {error && <div className="notice desktop-notice">接口异常：{error}</div>}

      <div className="desktop-shop-card">
        <div className="desktop-shop-card-title">新建任务</div>
        <div className="desktop-shop-form-grid">
          <div className="desktop-shop-form-field">
            <div className="desktop-shop-form-label">模式</div>
            <select
              className="form-select"
              value={createMode}
              onChange={(e) => {
                const mode = e.target.value;
                setCreateMode(mode);
                setForm((prev) => ({ ...prev, decision_mode: mode }));
              }}
            >
              <option value="keyword">关键词</option>
              <option value="ai">AI</option>
            </select>
          </div>

          <div className="desktop-shop-form-field">
            <div className="desktop-shop-form-label">任务名称</div>
            <input className="form-input" value={form.task_name} onChange={(e) => setForm((p) => ({ ...p, task_name: e.target.value }))} placeholder="例如：Switch2 低价" />
          </div>

          <div className="desktop-shop-form-field">
            <div className="desktop-shop-form-label">搜索关键字</div>
            <input className="form-input" value={form.keyword} onChange={(e) => setForm((p) => ({ ...p, keyword: e.target.value }))} placeholder="例如：switch 2" />
          </div>

          <div className="desktop-shop-form-field">
            <div className="desktop-shop-form-label">最大页数</div>
            <input
              className="form-input"
              type="number"
              min="1"
              value={form.max_pages}
              onChange={(e) => setForm((p) => ({ ...p, max_pages: e.target.value }))}
            />
          </div>

          <div className="desktop-shop-form-field">
            <div className="desktop-shop-form-label">最低价（可选）</div>
            <input className="form-input" value={form.min_price} onChange={(e) => setForm((p) => ({ ...p, min_price: e.target.value }))} placeholder="例如：500" />
          </div>

          <div className="desktop-shop-form-field">
            <div className="desktop-shop-form-label">最高价（可选）</div>
            <input className="form-input" value={form.max_price} onChange={(e) => setForm((p) => ({ ...p, max_price: e.target.value }))} placeholder="例如：2000" />
          </div>

          <div className="desktop-shop-form-field desktop-shop-form-field-wide">
            <div className="desktop-shop-form-label">描述（建议填写，有助于 AI 生成标准）</div>
            <textarea className="form-textarea" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="例如：仅自用成色好；不要翻新；优先同城" />
          </div>

          {createMode === "keyword" && (
            <div className="desktop-shop-form-field desktop-shop-form-field-wide">
              <div className="desktop-shop-form-label">关键词规则（逗号或换行分隔，留空则默认使用“搜索关键字”）</div>
              <textarea
                className="form-textarea"
                rows={3}
                value={form.keyword_rules_text}
                onChange={(e) => setForm((p) => ({ ...p, keyword_rules_text: e.target.value }))}
                placeholder="例如：全新, 未拆封, 国行"
              />
            </div>
          )}
        </div>

        <div className="desktop-shop-form-actions">
          <button className="desktop-primary-btn" onClick={submitCreate} disabled={loading}>
            {loading ? "提交中..." : createMode === "ai" ? "AI 生成并创建" : "创建任务"}
          </button>
        </div>

        {job && (
          <div className="desktop-shop-job">
            <div className="desktop-shop-job-title">生成进度：{job.status}</div>
            <div className="desktop-shop-job-meta">{job.message}</div>
            <div className="desktop-shop-job-steps">
              {(job.steps || []).map((step) => (
                <div className="desktop-shop-job-step" key={step.key}>
                  <span className={`desktop-shop-job-dot ${step.status}`}></span>
                  <span className="desktop-shop-job-step-label">{step.label}</span>
                  <span className="desktop-shop-job-step-msg">{step.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="desktop-table-wrap desktop-shop-table-wrap">
        <table className="desktop-table">
          <thead>
            <tr>
              <th>任务</th>
              <th>关键字</th>
              <th>模式</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>
                  <div className="desktop-shop-task-name">{task.task_name}</div>
                  {task.description ? <div className="desktop-shop-task-sub">{task.description}</div> : null}
                </td>
                <td>{task.keyword}</td>
                <td>{task.decision_mode === "ai" ? "AI" : "关键词"}</td>
                <td>
                  <div className="desktop-shop-task-state">
                    <button className={`desktop-action-btn ${task.enabled ? "" : "warning"}`} onClick={() => toggleEnabled(task, !task.enabled)}>
                      {task.enabled ? "启用中" : "已停用"}
                    </button>
                    <span className={`desktop-shop-pill ${task.is_running ? "running" : ""}`}>{task.is_running ? "运行中" : "未运行"}</span>
                  </div>
                </td>
                <td>
                  <div className="desktop-action-group">
                    <button className="desktop-action-btn" onClick={() => start(task.id)} disabled={!task.enabled || task.is_running}>
                      启动
                    </button>
                    <button className="desktop-action-btn warning" onClick={() => stop(task.id)} disabled={!task.is_running}>
                      停止
                    </button>
                    <button className="desktop-action-btn danger" onClick={() => remove(task.id)}>
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="desktop-empty-inline">暂无任务</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FishResults() {
  const [files, setFiles] = useState([]);
  const [selected, setSelected] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [insights, setInsights] = useState(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState("");

  const [fileQuery, setFileQuery] = useState("");
  const DEFAULT_FILTERS = useMemo(
    () => ({
      recommended_only: false,
      ai_recommended_only: false,
      keyword_recommended_only: false,
      sort_by: "crawl_time",
      sort_order: "desc",
      page: 1,
      limit: 10,
      q: "",
    }),
    []
  );

  const [filters, setFilters] = useState({
    recommended_only: false,
    ai_recommended_only: false,
    keyword_recommended_only: false,
    sort_by: "crawl_time",
    sort_order: "desc",
    page: 1,
    limit: 10,
    q: "",
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  async function loadFiles() {
    setLoadingFiles(true);
    setError("");
    try {
      const data = await fishApi.getResultFiles();
      const list = data?.files || data || [];
      setFiles(Array.isArray(list) ? list : []);
      if (!selected && Array.isArray(list) && list.length) {
        setSelected(list[0]);
      }
    } catch (e) {
      setError(e.message || "加载失败");
    } finally {
      setLoadingFiles(false);
    }
  }

  async function loadContent(filename, nextFilters) {
    if (!filename) return;
    setLoadingItems(true);
    setError("");
    try {
      const data = await fishApi.getResultContent(filename, nextFilters);
      setTotal(data?.total_items ?? 0);
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setError(e.message || "加载失败");
    } finally {
      setLoadingItems(false);
    }
  }

  async function loadInsights(filename) {
    if (!filename) return;
    try {
      const data = await fishApi.getResultInsights(filename);
      setInsights(data);
    } catch {
      setInsights(null);
    }
  }

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    if (!selected) return;
    loadContent(selected, filters);
    loadInsights(selected);
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    loadContent(selected, filters);
  }, [
    filters.page,
    filters.limit,
    filters.sort_by,
    filters.sort_order,
    filters.recommended_only,
    filters.ai_recommended_only,
    filters.keyword_recommended_only,
    filters.q,
  ]);

  const totalPages = useMemo(() => {
    const limit = Number(filters.limit || 1);
    return limit ? Math.max(1, Math.ceil((total || 0) / limit)) : 1;
  }, [filters.limit, total]);

  const exportParams = useMemo(() => {
    return {
      recommended_only: filters.recommended_only,
      ai_recommended_only: filters.ai_recommended_only,
      keyword_recommended_only: filters.keyword_recommended_only,
      sort_by: filters.sort_by,
      sort_order: filters.sort_order,
      q: filters.q,
    };
  }, [
    filters.recommended_only,
    filters.ai_recommended_only,
    filters.keyword_recommended_only,
    filters.sort_by,
    filters.sort_order,
    filters.q,
  ]);

  const exportUrl = useMemo(() => {
    if (!selected) return "";
    return fishApi.buildResultExportUrl(selected, exportParams);
  }, [exportParams, selected]);

  const filteredFiles = useMemo(() => {
    const q = String(fileQuery || "").trim().toLowerCase();
    if (!q) return files;
    return files.filter((name) => String(name).toLowerCase().includes(q));
  }, [fileQuery, files]);

  function resetFilters() {
    setFilters((p) => ({ ...DEFAULT_FILTERS, page: 1, limit: p.limit || DEFAULT_FILTERS.limit }));
  }

  function setAiOnly(nextValue) {
    setFilters((p) => ({
      ...p,
      page: 1,
      ai_recommended_only: Boolean(nextValue),
      keyword_recommended_only: Boolean(nextValue) ? false : p.keyword_recommended_only,
    }));
  }

  function setKeywordOnly(nextValue) {
    setFilters((p) => ({
      ...p,
      page: 1,
      keyword_recommended_only: Boolean(nextValue),
      ai_recommended_only: Boolean(nextValue) ? false : p.ai_recommended_only,
    }));
  }

  async function removeFile(filename) {
    setError("");
    try {
      await fishApi.deleteResultFile(filename);
      if (selected === filename) {
        setSelected("");
        setItems([]);
        setTotal(0);
        setInsights(null);
      }
      loadFiles();
    } catch (e) {
      setError(e.message || "删除失败");
    }
  }

  return (
    <div className="desktop-shop-section fish-results-page">
      <div className="desktop-shop-toolbar-row">
        <div className="desktop-panel-title">结果查看</div>
        <div className="desktop-shop-toolbar-actions">
          <button className="desktop-action-btn" onClick={loadFiles} disabled={loadingFiles}>
            {loadingFiles ? "刷新中..." : "刷新文件"}
          </button>
          <button className="desktop-action-btn" onClick={() => setFiltersOpen(true)} disabled={!selected}>
            筛选
          </button>
          <button className="desktop-action-btn" onClick={resetFilters} disabled={!selected}>
            重置
          </button>
          <button className="desktop-action-btn" onClick={() => selected && window.open(exportUrl, "_blank", "noopener,noreferrer")} disabled={!selected}>
            导出 CSV
          </button>
        </div>
      </div>

      {error && <div className="notice desktop-notice">接口异常：{error}</div>}

      <div className="fish-results-layout">
        <div className="fish-results-aside">
          <div className="desktop-shop-card fish-results-files-card">
            <div className="fish-results-card-head">
              <div className="desktop-shop-card-title">文件</div>
              <button className="desktop-action-btn" onClick={loadFiles} disabled={loadingFiles}>
                {loadingFiles ? "刷新中..." : "刷新"}
              </button>
            </div>

            <input className="form-input fish-results-file-search" value={fileQuery} onChange={(e) => setFileQuery(e.target.value)} placeholder="搜索文件名" />

            <div className="fish-results-file-list">
              {filteredFiles.map((filename) => (
                <div className={`desktop-shop-file ${selected === filename ? "active" : ""}`} key={filename}>
                  <button className="desktop-shop-file-btn" onClick={() => { setFilters((p) => ({ ...p, page: 1 })); setSelected(filename); }}>
                    {filename}
                  </button>
                  <button className="desktop-shop-file-del" onClick={() => removeFile(filename)} title="删除文件">
                    ×
                  </button>
                </div>
              ))}
              {filteredFiles.length === 0 && <div className="desktop-empty-inline">{files.length === 0 ? "暂无结果文件" : "未找到匹配文件"}</div>}
            </div>
          </div>
        </div>

        <div className="fish-results-main">
          <div className="desktop-shop-card fish-results-sticky-card">
            <div className="fish-results-toolbar-row">
              <input
                className="form-input fish-results-q"
                value={filters.q}
                onChange={(e) => setFilters((p) => ({ ...p, page: 1, q: e.target.value }))}
                placeholder="搜索：标题 / 关键字 / 任务 / 卖家"
                disabled={!selected}
              />

              <div className="desktop-shop-pagination fish-results-pagination">
                <button className="desktop-action-btn" onClick={() => setFilters((p) => ({ ...p, page: 1 }))} disabled={!selected || filters.page <= 1}>
                  首页
                </button>
                <button className="desktop-action-btn" onClick={() => setFilters((p) => ({ ...p, page: Math.max(1, p.page - 1) }))} disabled={!selected || filters.page <= 1}>
                  上一页
                </button>
                <div className="desktop-shop-pagination-text">
                  {selected ? `第 ${filters.page} / ${totalPages} 页 · 共 ${total} 条` : "未选择文件"}
                </div>
                <button className="desktop-action-btn" onClick={() => setFilters((p) => ({ ...p, page: Math.min(totalPages, p.page + 1) }))} disabled={!selected || filters.page >= totalPages}>
                  下一页
                </button>
              </div>
            </div>

            {insights && (
              <div className="fish-results-insights-bar">
                <div className="fish-results-insights-label">洞察</div>
                <div className="fish-results-insights-items">
                  <div className="fish-results-insight-item">
                    <div className="fish-results-insight-k">样本</div>
                    <div className="fish-results-insight-v">{insights?.market_summary?.sample_count ?? "-"}</div>
                  </div>
                  <div className="fish-results-insight-item">
                    <div className="fish-results-insight-k">均价</div>
                    <div className="fish-results-insight-v">
                      {insights?.market_summary?.avg_price !== null && insights?.market_summary?.avg_price !== undefined ? formatMoney(insights.market_summary.avg_price) : "-"}
                    </div>
                  </div>
                  <div className="fish-results-insight-item">
                    <div className="fish-results-insight-k">中位数</div>
                    <div className="fish-results-insight-v">
                      {insights?.market_summary?.median_price !== null && insights?.market_summary?.median_price !== undefined ? formatMoney(insights.market_summary.median_price) : "-"}
                    </div>
                  </div>
                  <div className="fish-results-insight-item">
                    <div className="fish-results-insight-k">最新快照</div>
                    <div className="fish-results-insight-v">{formatDateTime(insights?.latest_snapshot_at)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {filtersOpen && (
            <div
              className="fish-results-filter-drawer-backdrop"
              onClick={() => setFiltersOpen(false)}
              role="presentation"
            >
              <div className="fish-results-filter-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="筛选">
                <div className="fish-results-filter-drawer-head">
                  <div className="fish-results-filter-drawer-title">筛选</div>
                  <button className="desktop-action-btn" onClick={() => setFiltersOpen(false)}>
                    关闭
                  </button>
                </div>

                <div className="fish-results-filter-drawer-body">
                  <div className="fish-results-filter-group">
                    <div className="fish-results-filter-group-title">推荐筛选</div>
                    <div className="fish-results-seg">
                      <button
                        className={`fish-results-seg-btn ${filters.recommended_only ? "active" : ""}`}
                        onClick={() => setFilters((p) => ({ ...p, page: 1, recommended_only: !p.recommended_only }))}
                        disabled={!selected}
                        type="button"
                      >
                        仅推荐
                      </button>
                      <button
                        className={`fish-results-seg-btn ${filters.ai_recommended_only ? "active" : ""}`}
                        onClick={() => setAiOnly(!filters.ai_recommended_only)}
                        disabled={!selected}
                        type="button"
                      >
                        仅 AI
                      </button>
                      <button
                        className={`fish-results-seg-btn ${filters.keyword_recommended_only ? "active" : ""}`}
                        onClick={() => setKeywordOnly(!filters.keyword_recommended_only)}
                        disabled={!selected}
                        type="button"
                      >
                        仅关键词
                      </button>
                    </div>
                  </div>

                  <div className="fish-results-filter-group">
                    <div className="fish-results-filter-group-title">排序字段</div>
                    <div className="fish-results-seg">
                      <button className={`fish-results-seg-btn ${filters.sort_by === "crawl_time" ? "active" : ""}`} onClick={() => setFilters((p) => ({ ...p, page: 1, sort_by: "crawl_time" }))} disabled={!selected} type="button">
                        爬取时间
                      </button>
                      <button className={`fish-results-seg-btn ${filters.sort_by === "publish_time" ? "active" : ""}`} onClick={() => setFilters((p) => ({ ...p, page: 1, sort_by: "publish_time" }))} disabled={!selected} type="button">
                        发布时间
                      </button>
                      <button className={`fish-results-seg-btn ${filters.sort_by === "price" ? "active" : ""}`} onClick={() => setFilters((p) => ({ ...p, page: 1, sort_by: "price" }))} disabled={!selected} type="button">
                        价格
                      </button>
                      <button className={`fish-results-seg-btn ${filters.sort_by === "keyword_hit_count" ? "active" : ""}`} onClick={() => setFilters((p) => ({ ...p, page: 1, sort_by: "keyword_hit_count" }))} disabled={!selected} type="button">
                        命中数
                      </button>
                    </div>
                  </div>

                  <div className="fish-results-filter-group">
                    <div className="fish-results-filter-group-title">排序方向</div>
                    <div className="fish-results-seg">
                      <button className={`fish-results-seg-btn ${filters.sort_order === "desc" ? "active" : ""}`} onClick={() => setFilters((p) => ({ ...p, page: 1, sort_order: "desc" }))} disabled={!selected} type="button">
                        降序
                      </button>
                      <button className={`fish-results-seg-btn ${filters.sort_order === "asc" ? "active" : ""}`} onClick={() => setFilters((p) => ({ ...p, page: 1, sort_order: "asc" }))} disabled={!selected} type="button">
                        升序
                      </button>
                    </div>
                  </div>

                  <div className="fish-results-filter-group">
                    <div className="fish-results-filter-group-title">每页数量</div>
                    <div className="fish-results-seg">
                      <button className={`fish-results-seg-btn ${Number(filters.limit) === 10 ? "active" : ""}`} onClick={() => setFilters((p) => ({ ...p, page: 1, limit: 10 }))} disabled={!selected} type="button">
                        10/页
                      </button>
                      <button className={`fish-results-seg-btn ${Number(filters.limit) === 30 ? "active" : ""}`} onClick={() => setFilters((p) => ({ ...p, page: 1, limit: 30 }))} disabled={!selected} type="button">
                        30/页
                      </button>
                      <button className={`fish-results-seg-btn ${Number(filters.limit) === 50 ? "active" : ""}`} onClick={() => setFilters((p) => ({ ...p, page: 1, limit: 50 }))} disabled={!selected} type="button">
                        50/页
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="desktop-shop-card fish-results-list-card">
            <div className="desktop-shop-card-title">结果</div>
            <div className="desktop-shop-results-list" style={{ marginTop: 0 }}>
              {!selected && <div className="desktop-empty-inline">请选择左侧文件后查看结果</div>}
              {selected && loadingItems && <div className="desktop-empty-inline">加载中...</div>}
              {selected &&
                !loadingItems &&
                items.map((item, idx) => {
                  const analysis = item?.ai_analysis || {};
                  const recommended = Boolean(analysis.is_recommended);
                  const link = getProductLink(item);
                  const image = buildImageUrl(getProductImage(item));
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
                              <span>爬取：{formatDateTime(item?.["爬取时间"])}</span>
                              <span>发布：{formatDateTime(item?.["商品信息"]?.["发布时间"])}</span>
                            </div>
                          </div>
                        </div>
                        <div className="desktop-shop-result-price">{getProductPrice(item)}</div>
                      </div>
                      <div className="desktop-shop-result-reason">
                        <span className={`desktop-shop-pill ${recommended ? "running" : ""}`}>{recommended ? "推荐" : "不推荐"}</span>
                        <span className="desktop-shop-result-reason-text">{analysis.reason || "-"}</span>
                      </div>
                      <div className="desktop-shop-result-actions">
                        <button className="desktop-action-btn" onClick={() => link && window.open(link, "_blank", "noopener,noreferrer")} disabled={!link}>
                          打开链接
                        </button>
                        {analysis.keyword_hit_count !== undefined && analysis.keyword_hit_count !== null && (
                          <span className="desktop-shop-badge">命中 {analysis.keyword_hit_count}</span>
                        )}
                        {analysis.analysis_source && <span className="desktop-shop-badge">{analysis.analysis_source === "ai" ? "AI" : "关键词"}</span>}
                        {analysis.value_score !== undefined && analysis.value_score !== null && <span className="desktop-shop-badge">价值 {analysis.value_score}</span>}
                      </div>
                    </div>
                  );
                })}
              {selected && !loadingItems && items.length === 0 && <div className="desktop-empty-inline">暂无结果</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FishLogs() {
  const [tasks, setTasks] = useState([]);
  const [taskId, setTaskId] = useState("");
  const [offsetLines, setOffsetLines] = useState(0);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const limitLines = 160;

  async function loadTasks() {
    try {
      const data = await fishApi.getTasks();
      const list = Array.isArray(data) ? data : [];
      setTasks(list);
      if (!taskId && list.length) {
        setTaskId(String(list[0].id));
      }
    } catch {
    }
  }

  async function loadTailAt(targetOffsetLines) {
    if (!taskId) return;
    setLoading(true);
    setError("");
    try {
      const safeOffset = Math.max(0, Number(targetOffsetLines || 0));
      const data = await fishApi.getLogTail(Number(taskId), safeOffset, limitLines);
      setContent(data?.content || "");
      setHasMore(Boolean(data?.has_more));
      setOffsetLines(safeOffset);
      setNextOffset(Number(data?.next_offset ?? safeOffset));
    } catch (e) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleClearLogs() {
    if (!taskId) return;
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await fishApi.clearLogs(Number(taskId));
      setOffsetLines(0);
      setNextOffset(0);
      setHasMore(false);
      setContent("");
      setMessage("日志已清空");
    } catch (e) {
      setError(e.message || "清空失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (!taskId) return;
    setOffsetLines(0);
    setNextOffset(0);
    loadTailAt(0);
  }, [taskId]);

  return (
    <div className="desktop-shop-section">
      <div className="desktop-shop-toolbar-row">
        <div className="desktop-panel-title">日志</div>
        <div className="desktop-shop-toolbar-actions">
          <button className="desktop-action-btn" onClick={() => loadTailAt(0)} disabled={loading || !taskId}>
            {loading ? "加载中..." : "刷新到最新"}
          </button>
          <button className="desktop-action-btn" onClick={() => loadTailAt(Math.max(0, offsetLines - limitLines))} disabled={offsetLines <= 0 || loading || !taskId}>
            上一页
          </button>
          <button className="desktop-action-btn" onClick={() => loadTailAt(nextOffset)} disabled={!hasMore || loading || !taskId}>
            下一页
          </button>
          <button
            className="desktop-action-btn"
            onClick={() => taskId && window.open(fishApi.buildTaskLogDownloadUrl(Number(taskId)), "_blank", "noopener,noreferrer")}
            disabled={!taskId}
          >
            下载全部
          </button>
          <button className="desktop-action-btn warning" onClick={handleClearLogs} disabled={!taskId || loading}>
            清空日志
          </button>
        </div>
      </div>

      {error && <div className="notice desktop-notice">接口异常：{error}</div>}
      {message && <div className="notice desktop-notice">{message}</div>}

      <div className="desktop-shop-card desktop-shop-log-card">
        <div className="desktop-shop-log-controls">
          <select className="form-select desktop-shop-log-select" value={taskId} onChange={(e) => setTaskId(e.target.value)} disabled={tasks.length === 0}>
            {tasks.map((t) => (
              <option value={t.id} key={t.id}>
                {t.task_name}
              </option>
            ))}
          </select>
          <div className="desktop-shop-pagination-text">
            {taskId ? `已向上翻 ${offsetLines} 行 · 每页 ${limitLines} 行` : "请选择任务后查看日志"}
          </div>
        </div>

        <div className="desktop-shop-log">
          <pre className="desktop-shop-log-pre">{content || "暂无日志"}</pre>
        </div>
      </div>
    </div>
  );
}

function FishSettings() {
  const [status, setStatus] = useState(null);
  const [ai, setAi] = useState(null);
  const [aiKeyMasked, setAiKeyMasked] = useState("");
  const [aiKeySet, setAiKeySet] = useState(false);
  const [aiForm, setAiForm] = useState({ OPENAI_API_KEY: "", OPENAI_BASE_URL: "", OPENAI_MODEL_NAME: "", PROXY_URL: "" });
  const [bandwidth, setBandwidth] = useState({ BANDWIDTH_MODE: "normal", RATE_LIMIT_MULTIPLIER: "" });
  const [notifications, setNotifications] = useState({
    FEISHU_WEBHOOK_URL: "", FEISHU_SECRET: "",
    SMTP_HOST: "smtp.qq.com", SMTP_PORT: "587", SMTP_USERNAME: "", SMTP_PASSWORD: "", SMTP_SENDER: "", SMTP_RECIPIENT: "start.haohao@qq.com", SMTP_USE_TLS: true,
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const [s, a, b, n] = await Promise.all([
        fishApi.getSystemStatus(),
        fishApi.getAiSettings(),
        fishApi.getBandwidthSettings(),
        fishApi.getNotificationSettings(),
      ]);
      setStatus(s);
      setAi(a);
      setAiKeyMasked(a?.OPENAI_API_KEY_MASKED || "");
      setAiKeySet(Boolean(a?.OPENAI_API_KEY_SET));
      setAiForm({
        OPENAI_API_KEY: "",
        OPENAI_BASE_URL: a?.OPENAI_BASE_URL || "",
        OPENAI_MODEL_NAME: a?.OPENAI_MODEL_NAME || "",
        PROXY_URL: a?.PROXY_URL || "",
      });
      setBandwidth({
        BANDWIDTH_MODE: b?.BANDWIDTH_MODE || "normal",
        RATE_LIMIT_MULTIPLIER: b?.RATE_LIMIT_MULTIPLIER || "",
      });
      setNotifications({
        FEISHU_WEBHOOK_URL: n?.FEISHU_WEBHOOK_URL || "",
        FEISHU_SECRET: n?.FEISHU_SECRET || "",
        SMTP_HOST: n?.SMTP_HOST || "smtp.qq.com",
        SMTP_PORT: n?.SMTP_PORT ? String(n.SMTP_PORT) : "587",
        SMTP_USERNAME: n?.SMTP_USERNAME || "",
        SMTP_PASSWORD: n?.SMTP_PASSWORD || "",
        SMTP_SENDER: n?.SMTP_SENDER || "",
        SMTP_RECIPIENT: n?.SMTP_RECIPIENT || "start.haohao@qq.com",
        SMTP_USE_TLS: n?.SMTP_USE_TLS !== false,
      });
    } catch (e) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function saveAi() {
    setError("");
    setMessage("");
    try {
      await fishApi.updateAiSettings({
        OPENAI_API_KEY: aiForm.OPENAI_API_KEY || null,
        OPENAI_BASE_URL: aiForm.OPENAI_BASE_URL || null,
        OPENAI_MODEL_NAME: aiForm.OPENAI_MODEL_NAME || null,
        PROXY_URL: aiForm.PROXY_URL || null,
      });
      setMessage("AI 配置已保存");
      refresh();
    } catch (e) {
      setError(e.message || "保存失败");
    }
  }

  async function testAi() {
    setError("");
    setMessage("");
    try {
      const data = await fishApi.testAiSettings({
        OPENAI_API_KEY: aiForm.OPENAI_API_KEY || null,
        OPENAI_BASE_URL: aiForm.OPENAI_BASE_URL || null,
        OPENAI_MODEL_NAME: aiForm.OPENAI_MODEL_NAME || null,
        PROXY_URL: aiForm.PROXY_URL || null,
      });
      setMessage(data?.message || (data?.success ? "测试成功" : "测试失败"));
    } catch (e) {
      setError(e.message || "测试失败");
    }
  }

  async function saveBandwidth() {
    setError("");
    setMessage("");
    try {
      await fishApi.updateBandwidthSettings({
        BANDWIDTH_MODE: bandwidth.BANDWIDTH_MODE || null,
        RATE_LIMIT_MULTIPLIER: bandwidth.RATE_LIMIT_MULTIPLIER || null,
      });
      setMessage("带宽设置已保存");
    } catch (e) {
      setError(e.message || "保存失败");
    }
  }

  async function saveNotifications() {
    setError("");
    setMessage("");
    try {
      const payload = {};
      Object.entries(notifications).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) payload[k] = v;
      });
      await fishApi.updateNotificationSettings(payload);
      setMessage("通知设置已保存");
      refresh();
    } catch (e) {
      setError(e.message || "保存失败");
    }
  }

  async function testNotification(channel) {
    setError("");
    setMessage("");
    try {
      const settings = {};
      Object.entries(notifications).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) settings[k] = v;
      });
      const data = await fishApi.testNotificationSettings({ channel, settings });
      const results = Object.values(data?.results || {});
      const success = results.filter((r) => r?.success);
      const fail = results.filter((r) => !r?.success);
      if (fail.length === 0) {
        setMessage(`测试通知发送成功 (${success.length}/${results.length})`);
      } else {
        setError(`测试通知部分失败: ${fail.map((r) => `${r.label}: ${r.message}`).join("; ")}`);
      }
    } catch (e) {
      setError(e.message || "测试失败");
    }
  }

  const loginState = status?.login_state_file;
  const envFile = status?.env_file;

  return (
    <div className="desktop-shop-section">
      <div className="desktop-shop-toolbar-row">
        <div className="desktop-panel-title">设置</div>
        <button className="desktop-action-btn" onClick={refresh} disabled={loading}>
          {loading ? "刷新中..." : "刷新"}
        </button>
      </div>

      {error && <div className="notice desktop-notice">接口异常：{error}</div>}
      {message && <div className="notice desktop-notice">{message}</div>}

      <div className="desktop-shop-card">
        <div className="desktop-shop-card-title">系统状态</div>
        <div className="desktop-shop-kv-grid desktop-shop-kv-grid-tight">
          <div className="desktop-shop-kv">
            <div className="desktop-shop-kv-label">爬虫运行</div>
            <div className="desktop-shop-kv-value">{status?.scraper_running ? "是" : "否"}</div>
          </div>
          <div className="desktop-shop-kv">
            <div className="desktop-shop-kv-label">AI 已配置</div>
            <div className="desktop-shop-kv-value">{status?.ai_configured ? "是" : "否"}</div>
          </div>
          <div className="desktop-shop-kv">
            <div className="desktop-shop-kv-label">通知已配置</div>
            <div className="desktop-shop-kv-value">{status?.notification_configured ? "是" : "否"}</div>
          </div>
          <div className="desktop-shop-kv">
            <div className="desktop-shop-kv-label">无头模式</div>
            <div className="desktop-shop-kv-value">{status?.headless_mode ? "是" : "否"}</div>
          </div>
          <div className="desktop-shop-kv">
            <div className="desktop-shop-kv-label">登录态文件</div>
            <div className="desktop-shop-kv-value">{loginState?.exists ? "存在" : "不存在"}</div>
          </div>
          <div className="desktop-shop-kv">
            <div className="desktop-shop-kv-label">.env</div>
            <div className="desktop-shop-kv-value">{envFile?.exists ? "存在" : "不存在"}</div>
          </div>
          <div className="desktop-shop-kv">
            <div className="desktop-shop-kv-label">Key 已设置</div>
            <div className="desktop-shop-kv-value">{envFile?.openai_api_key_set ? "是" : "否"}</div>
          </div>
        </div>
      </div>

      <div className="desktop-shop-card">
        <div className="desktop-shop-card-title">AI 配置</div>
        <div className="desktop-shop-form-grid desktop-shop-form-grid-2">
          <div className="desktop-shop-form-field">
            <div className="desktop-shop-form-label">OPENAI_API_KEY</div>
            <input
              className="form-input"
              value={aiForm.OPENAI_API_KEY}
              onChange={(e) => setAiForm((p) => ({ ...p, OPENAI_API_KEY: e.target.value }))}
              placeholder={aiKeySet ? `已配置：${aiKeyMasked || "已隐藏"}` : "未配置"}
            />
          </div>
          <div className="desktop-shop-form-field">
            <div className="desktop-shop-form-label">OPENAI_BASE_URL</div>
            <input className="form-input" value={aiForm.OPENAI_BASE_URL} onChange={(e) => setAiForm((p) => ({ ...p, OPENAI_BASE_URL: e.target.value }))} placeholder="例如：https://api.openai.com/v1" />
          </div>
          <div className="desktop-shop-form-field">
            <div className="desktop-shop-form-label">OPENAI_MODEL_NAME</div>
            <input className="form-input" value={aiForm.OPENAI_MODEL_NAME} onChange={(e) => setAiForm((p) => ({ ...p, OPENAI_MODEL_NAME: e.target.value }))} placeholder="例如：gpt-4o-mini" />
          </div>
          <div className="desktop-shop-form-field">
            <div className="desktop-shop-form-label">PROXY_URL</div>
            <input className="form-input" value={aiForm.PROXY_URL} onChange={(e) => setAiForm((p) => ({ ...p, PROXY_URL: e.target.value }))} placeholder="例如：http://127.0.0.1:7890" />
          </div>
        </div>

        <div className="desktop-shop-form-actions">
          <button className="desktop-action-btn" onClick={testAi}>
            测试
          </button>
          <button className="desktop-primary-btn" onClick={saveAi}>
            保存
          </button>
        </div>
      </div>

      <div className="desktop-shop-card">
        <div className="desktop-shop-card-title">带宽限速</div>
        <div className="desktop-shop-form-grid desktop-shop-form-grid-2">
          <div className="desktop-shop-form-field">
            <div className="desktop-shop-form-label">限速模式</div>
            <select
              className="form-select"
              value={bandwidth.BANDWIDTH_MODE}
              onChange={(e) => setBandwidth((p) => ({ ...p, BANDWIDTH_MODE: e.target.value }))}
            >
              <option value="normal">正常 (1.0x)</option>
              <option value="economy">经济/白天限速 (2.0x)</option>
              <option value="aggressive">激进/夜间加速 (0.6x)</option>
            </select>
          </div>
          <div className="desktop-shop-form-field">
            <div className="desktop-shop-form-label">自定义倍数（留空使用模式预设）</div>
            <input
              className="form-input"
              type="number"
              step="0.1"
              min="0.1"
              value={bandwidth.RATE_LIMIT_MULTIPLIER}
              onChange={(e) => setBandwidth((p) => ({ ...p, RATE_LIMIT_MULTIPLIER: e.target.value }))}
              placeholder="例如：2.5"
            />
          </div>
        </div>
        <div className="desktop-shop-form-actions">
          <button className="desktop-primary-btn" onClick={saveBandwidth}>
            保存带宽设置
          </button>
        </div>
      </div>

      <div className="desktop-shop-card">
        <div className="desktop-shop-card-title">通知渠道</div>

        <div className="desktop-shop-card" style={{ marginBottom: 16, background: "var(--bg-1)" }}>
          <div className="desktop-shop-card-title" style={{ fontSize: 14 }}>飞书机器人</div>
          <div className="desktop-shop-form-grid desktop-shop-form-grid-2">
            <div className="desktop-shop-form-field">
              <div className="desktop-shop-form-label">Webhook 地址</div>
              <input
                className="form-input"
                value={notifications.FEISHU_WEBHOOK_URL}
                onChange={(e) => setNotifications((p) => ({ ...p, FEISHU_WEBHOOK_URL: e.target.value }))}
                placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
              />
            </div>
            <div className="desktop-shop-form-field">
              <div className="desktop-shop-form-label">Secret（可选）</div>
              <input
                className="form-input"
                type="password"
                value={notifications.FEISHU_SECRET}
                onChange={(e) => setNotifications((p) => ({ ...p, FEISHU_SECRET: e.target.value }))}
                placeholder="启用了签名校验时填写"
              />
            </div>
          </div>
          <div className="desktop-shop-form-actions">
            <button className="desktop-action-btn" onClick={() => testNotification("feishu")}>
              测试飞书
            </button>
          </div>
        </div>

        <div className="desktop-shop-card" style={{ background: "var(--bg-1)" }}>
          <div className="desktop-shop-card-title" style={{ fontSize: 14 }}>SMTP 邮件</div>
          <div className="desktop-shop-form-grid desktop-shop-form-grid-2">
            <div className="desktop-shop-form-field">
              <div className="desktop-shop-form-label">SMTP 服务器</div>
              <input
                className="form-input"
                value={notifications.SMTP_HOST}
                onChange={(e) => setNotifications((p) => ({ ...p, SMTP_HOST: e.target.value }))}
                placeholder="例如：smtp.qq.com"
              />
            </div>
            <div className="desktop-shop-form-field">
              <div className="desktop-shop-form-label">端口</div>
              <input
                className="form-input"
                type="number"
                value={notifications.SMTP_PORT}
                onChange={(e) => setNotifications((p) => ({ ...p, SMTP_PORT: e.target.value }))}
                placeholder="例如：587"
              />
            </div>
            <div className="desktop-shop-form-field">
              <div className="desktop-shop-form-label">用户名</div>
              <input
                className="form-input"
                value={notifications.SMTP_USERNAME}
                onChange={(e) => setNotifications((p) => ({ ...p, SMTP_USERNAME: e.target.value }))}
                placeholder="例如：yourname@qq.com"
              />
            </div>
            <div className="desktop-shop-form-field">
              <div className="desktop-shop-form-label">密码 / 授权码</div>
              <input
                className="form-input"
                type="password"
                value={notifications.SMTP_PASSWORD}
                onChange={(e) => setNotifications((p) => ({ ...p, SMTP_PASSWORD: e.target.value }))}
                placeholder="邮箱授权码"
              />
            </div>
            <div className="desktop-shop-form-field">
              <div className="desktop-shop-form-label">发件人</div>
              <input
                className="form-input"
                value={notifications.SMTP_SENDER}
                onChange={(e) => setNotifications((p) => ({ ...p, SMTP_SENDER: e.target.value }))}
                placeholder="例如：yourname@qq.com"
              />
            </div>
            <div className="desktop-shop-form-field">
              <div className="desktop-shop-form-label">收件人</div>
              <input
                className="form-input"
                value={notifications.SMTP_RECIPIENT}
                onChange={(e) => setNotifications((p) => ({ ...p, SMTP_RECIPIENT: e.target.value }))}
                placeholder="例如：yourname@gmail.com"
              />
            </div>
            <div className="desktop-shop-form-field">
              <div className="desktop-shop-form-label">使用 TLS</div>
              <select
                className="form-select"
                value={notifications.SMTP_USE_TLS ? "true" : "false"}
                onChange={(e) => setNotifications((p) => ({ ...p, SMTP_USE_TLS: e.target.value === "true" }))}
              >
                <option value="true">是</option>
                <option value="false">否</option>
              </select>
            </div>
          </div>
          <div className="desktop-shop-form-actions">
            <button className="desktop-action-btn" onClick={() => testNotification("smtp")}>
              测试邮件
            </button>
          </div>
        </div>

        <div className="desktop-shop-form-actions" style={{ marginTop: 16 }}>
          <button className="desktop-primary-btn" onClick={saveNotifications}>
            保存通知设置
          </button>
        </div>
      </div>
    </div>
  );
}

function FishAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [selected, setSelected] = useState("");
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [createName, setCreateName] = useState("");
  const [createContent, setCreateContent] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerTitle, setViewerTitle] = useState("");
  const [viewerContent, setViewerContent] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const data = await fishApi.listAccounts();
      setAccounts(Array.isArray(data) ? data : []);
      if (!selected && Array.isArray(data) && data.length) {
        setSelected(data[0].name);
      }
    } catch (e) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(name) {
    if (!name) return;
    setError("");
    try {
      const data = await fishApi.getAccount(name);
      setDetail(data);
    } catch (e) {
      setError(e.message || "加载失败");
      setDetail(null);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!selected) return;
    loadDetail(selected);
  }, [selected]);

  async function create() {
    setError("");
    setMessage("");
    if (!createName.trim() || !createContent.trim()) {
      setError("名称与内容为必填");
      return;
    }
    setLoading(true);
    try {
      const data = await fishApi.createAccount({ name: createName.trim(), content: createContent });
      setMessage("账号已创建");
      setCreateName("");
      setCreateContent("");
      await refresh();
      setSelected(data?.name || createName.trim());
    } catch (e) {
      setError(e.message || "创建失败");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!detail?.name) return;
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await fishApi.updateAccount(detail.name, detail.content || "");
      setMessage("已保存");
      refresh();
    } catch (e) {
      setError(e.message || "保存失败");
    } finally {
      setLoading(false);
    }
  }

  async function remove(name) {
    if (!name) return;
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await fishApi.deleteAccount(name);
      setMessage("已删除");
      setSelected("");
      setDetail(null);
      refresh();
    } catch (e) {
      setError(e.message || "删除失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="desktop-shop-section">
      <div className="desktop-shop-toolbar-row">
        <div className="desktop-panel-title">账号管理</div>
        <button className="desktop-action-btn" onClick={refresh} disabled={loading}>
          {loading ? "刷新中..." : "刷新"}
        </button>
      </div>

      {error && <div className="notice desktop-notice">接口异常：{error}</div>}
      {message && <div className="notice desktop-notice">{message}</div>}

      <div className="desktop-shop-results-grid desktop-shop-accounts-grid">
        <div className="desktop-shop-card">
          <div className="desktop-shop-card-title">账号列表</div>
          <div className="desktop-shop-file-list">
            {accounts.map((a) => (
              <div className={`desktop-shop-file ${selected === a.name ? "active" : ""}`} key={a.name}>
                <button className="desktop-shop-file-btn" onClick={() => setSelected(a.name)}>
                  {a.name}
                </button>
                <button className="desktop-shop-file-del" onClick={() => remove(a.name)} title="删除账号">
                  ×
                </button>
              </div>
            ))}
            {accounts.length === 0 && <div className="desktop-empty-inline">暂无账号</div>}
          </div>
        </div>

        <div className="desktop-shop-card desktop-shop-card-wide">
          <div className="desktop-shop-card-title">详情</div>
          {!detail && <div className="desktop-empty-inline">请选择一个账号</div>}
          {detail && (
            <>
              <div className="desktop-shop-account-head">
                <div className="desktop-shop-account-title">{detail.name}</div>
                <div className="desktop-shop-account-path">{detail.path}</div>
              </div>
              <pre className="fish-account-preview">{(detail.content || "").slice(0, 900) || "暂无内容"}</pre>
              <div className="desktop-shop-form-actions">
                <button
                  className="desktop-action-btn"
                  onClick={() => {
                    setViewerTitle(detail.name || "账号详情");
                    setViewerContent(detail.content || "");
                    setViewerOpen(true);
                  }}
                >
                  查看详情
                </button>
                <button
                  className="desktop-primary-btn"
                  onClick={() => {
                    setEditorTitle(detail.name || "编辑账号");
                    setEditorContent(detail.content || "");
                    setEditorOpen(true);
                  }}
                  disabled={loading}
                >
                  编辑
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {viewerOpen && (
        <div className="dialog-overlay" onClick={() => setViewerOpen(false)}>
          <div className="dialog-content fish-viewer-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3 className="dialog-title">{viewerTitle || "详情"}</h3>
            </div>
            <pre className="fish-viewer-pre">{viewerContent || "暂无内容"}</pre>
            <div className="dialog-actions">
              <button
                className="dialog-btn"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(viewerContent || "");
                    setMessage("已复制到剪贴板");
                  } catch {
                    setError("复制失败，请手动复制");
                  }
                }}
              >
                复制 JSON
              </button>
              <button className="dialog-btn primary" onClick={() => setViewerOpen(false)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {editorOpen && (
        <div className="dialog-overlay" onClick={() => setEditorOpen(false)}>
          <div className="dialog-content fish-viewer-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3 className="dialog-title">{editorTitle || "编辑"}</h3>
            </div>
            <textarea className="form-textarea fish-editor-textarea" value={editorContent} onChange={(e) => setEditorContent(e.target.value)} />
            <div className="dialog-actions">
              <button
                className="dialog-btn primary"
                onClick={async () => {
                  if (!detail?.name) return;
                  setError("");
                  setMessage("");
                  setLoading(true);
                  try {
                    await fishApi.updateAccount(detail.name, editorContent || "");
                    setMessage("已保存");
                    setEditorOpen(false);
                    loadDetail(detail.name);
                    refresh();
                  } catch (e) {
                    setError(e.message || "保存失败");
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                保存
              </button>
                <button className="dialog-btn" onClick={() => setEditorOpen(false)}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="desktop-shop-card">
        <div className="desktop-shop-card-title">新建账号</div>
        <div className="desktop-shop-form-grid desktop-shop-form-grid-2">
          <div className="desktop-shop-form-field">
            <div className="desktop-shop-form-label">名称</div>
            <input className="form-input" value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="例如：main" />
          </div>
          <div className="desktop-shop-form-field desktop-shop-form-field-wide">
            <div className="desktop-shop-form-label">内容</div>
            <textarea className="form-textarea" rows={8} value={createContent} onChange={(e) => setCreateContent(e.target.value)} placeholder="粘贴账号状态内容（JSON 或文本）" />
          </div>
        </div>
        <div className="desktop-shop-form-actions">
          <button className="desktop-primary-btn" onClick={create} disabled={loading}>
            创建
          </button>
        </div>
      </div>
    </div>
  );
}
