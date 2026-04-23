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

function getProductTitle(item) {
  return item?.["商品信息"]?.["商品标题"] || "-";
}

function getProductPrice(item) {
  return item?.["商品信息"]?.["当前售价"] ?? "-";
}

function getProductLink(item) {
  return item?.["商品信息"]?.["商品链接"] || "";
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

        <div className="desktop-shop-native-subtitle">
          接口来自 server-fish（默认 8000 端口）。如提示请求失败，请确认后端已启动，且开发代理已配置。
        </div>
      </div>

      <div className="desktop-shop-native-body">
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
              <div className="desktop-shop-mini-row" key={`${row.task_id ?? "na"}-${row.task_name}`}>
                <div className="desktop-shop-mini-name">{row.task_name}</div>
                <div className="desktop-shop-mini-meta">
                  {row.keyword} · {row.enabled ? "启用" : "停用"} · {row.is_running ? "运行中" : "未运行"}
                </div>
                <div className="desktop-shop-mini-right">{row.latest_recommended_price !== null && row.latest_recommended_price !== undefined ? formatMoney(row.latest_recommended_price) : "-"}</div>
              </div>
            ))}
            {(snapshot?.task_summaries || []).length === 0 && <div className="desktop-empty-inline">暂无任务数据</div>}
          </div>
        </div>

        <div className="desktop-shop-card">
          <div className="desktop-shop-card-title">最近动态</div>
          <div className="desktop-shop-mini-table">
            {(snapshot?.recent_activities || []).slice(0, 10).map((row) => (
              <div className="desktop-shop-mini-row" key={row.id}>
                <div className="desktop-shop-mini-name">{row.title}</div>
                <div className="desktop-shop-mini-meta">
                  {row.task_name} · {row.keyword} · {row.status}
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

  const [createMode, setCreateMode] = useState("keyword");
  const [form, setForm] = useState({
    task_name: "",
    keyword: "",
    description: "",
    cron: "",
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
    const payload = {
      task_name: form.task_name.trim(),
      keyword: form.keyword.trim(),
      description: form.description.trim() || undefined,
      cron: form.cron.trim() || null,
      max_pages: Number(form.max_pages || 1),
      min_price: form.min_price.trim() ? form.min_price.trim() : null,
      max_price: form.max_price.trim() ? form.max_price.trim() : null,
      decision_mode: createMode,
    };

    if (!payload.task_name || !payload.keyword) {
      setError("任务名称与关键字为必填");
      return;
    }

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
            <div className="desktop-shop-form-label">Cron（可选）</div>
            <input className="form-input" value={form.cron} onChange={(e) => setForm((p) => ({ ...p, cron: e.target.value }))} placeholder="例如：*/20 * * * *" />
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
              <th>Cron</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>
                  <div className="desktop-shop-task-name">{task.task_name}</div>
                  <div className="desktop-shop-task-sub">{task.description || "-"}</div>
                </td>
                <td>{task.keyword}</td>
                <td>{task.decision_mode === "ai" ? "AI" : "关键词"}</td>
                <td>{task.cron || "-"}</td>
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
                <td colSpan={6}>
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

  const [filters, setFilters] = useState({
    recommended_only: true,
    ai_recommended_only: false,
    keyword_recommended_only: false,
    sort_by: "crawl_time",
    sort_order: "desc",
    page: 1,
    limit: 30,
  });

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
  }, [filters.page, filters.limit, filters.sort_by, filters.sort_order, filters.recommended_only, filters.ai_recommended_only, filters.keyword_recommended_only]);

  const totalPages = useMemo(() => {
    const limit = Number(filters.limit || 1);
    return limit ? Math.max(1, Math.ceil((total || 0) / limit)) : 1;
  }, [filters.limit, total]);

  const exportUrl = useMemo(() => {
    if (!selected) return "";
    return fishApi.buildResultExportUrl(selected, filters);
  }, [filters, selected]);

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
    <div className="desktop-shop-section">
      <div className="desktop-shop-toolbar-row">
        <div className="desktop-panel-title">结果查看</div>
        <div className="desktop-shop-toolbar-actions">
          <button className="desktop-action-btn" onClick={loadFiles} disabled={loadingFiles}>
            {loadingFiles ? "刷新中..." : "刷新文件"}
          </button>
          <button className="desktop-action-btn" onClick={() => selected && window.open(exportUrl, "_blank", "noopener,noreferrer")} disabled={!selected}>
            导出 CSV
          </button>
        </div>
      </div>

      {error && <div className="notice desktop-notice">接口异常：{error}</div>}

      <div className="desktop-shop-results-grid">
        <div className="desktop-shop-card">
          <div className="desktop-shop-card-title">文件</div>
          <div className="desktop-shop-file-list">
            {files.map((filename) => (
              <div className={`desktop-shop-file ${selected === filename ? "active" : ""}`} key={filename}>
                <button className="desktop-shop-file-btn" onClick={() => { setFilters((p) => ({ ...p, page: 1 })); setSelected(filename); }}>
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
          <div className="desktop-shop-card-title">筛选</div>
          <div className="desktop-shop-filter-row">
            <label className="desktop-shop-check">
              <input
                type="checkbox"
                checked={Boolean(filters.recommended_only)}
                onChange={(e) => setFilters((p) => ({ ...p, page: 1, recommended_only: e.target.checked }))}
              />
              仅推荐
            </label>
            <label className="desktop-shop-check">
              <input
                type="checkbox"
                checked={Boolean(filters.ai_recommended_only)}
                onChange={(e) => setFilters((p) => ({ ...p, page: 1, ai_recommended_only: e.target.checked }))}
              />
              仅 AI 推荐
            </label>
            <label className="desktop-shop-check">
              <input
                type="checkbox"
                checked={Boolean(filters.keyword_recommended_only)}
                onChange={(e) => setFilters((p) => ({ ...p, page: 1, keyword_recommended_only: e.target.checked }))}
              />
              仅关键词推荐
            </label>

            <select className="form-select" value={filters.sort_by} onChange={(e) => setFilters((p) => ({ ...p, page: 1, sort_by: e.target.value }))}>
              <option value="crawl_time">按爬取时间</option>
              <option value="publish_time">按发布时间</option>
              <option value="price">按价格</option>
              <option value="keyword_hit_count">按命中数</option>
            </select>
            <select className="form-select" value={filters.sort_order} onChange={(e) => setFilters((p) => ({ ...p, page: 1, sort_order: e.target.value }))}>
              <option value="desc">降序</option>
              <option value="asc">升序</option>
            </select>

            <select className="form-select" value={filters.limit} onChange={(e) => setFilters((p) => ({ ...p, page: 1, limit: Number(e.target.value) }))}>
              <option value={20}>20/页</option>
              <option value={30}>30/页</option>
              <option value={50}>50/页</option>
            </select>
          </div>

          {insights && (
            <div className="desktop-shop-insights">
              <div className="desktop-shop-insights-title">洞察</div>
              <div className="desktop-shop-kv-grid desktop-shop-kv-grid-tight">
                <div className="desktop-shop-kv">
                  <div className="desktop-shop-kv-label">样本数</div>
                  <div className="desktop-shop-kv-value">{insights?.market_summary?.sample_count ?? "-"}</div>
                </div>
                <div className="desktop-shop-kv">
                  <div className="desktop-shop-kv-label">均价</div>
                  <div className="desktop-shop-kv-value">{insights?.market_summary?.avg_price !== null && insights?.market_summary?.avg_price !== undefined ? formatMoney(insights.market_summary.avg_price) : "-"}</div>
                </div>
                <div className="desktop-shop-kv">
                  <div className="desktop-shop-kv-label">中位数</div>
                  <div className="desktop-shop-kv-value">{insights?.market_summary?.median_price !== null && insights?.market_summary?.median_price !== undefined ? formatMoney(insights.market_summary.median_price) : "-"}</div>
                </div>
                <div className="desktop-shop-kv">
                  <div className="desktop-shop-kv-label">最新快照</div>
                  <div className="desktop-shop-kv-value">{formatDateTime(insights?.latest_snapshot_at)}</div>
                </div>
              </div>
            </div>
          )}

          <div className="desktop-shop-pagination">
            <button className="desktop-action-btn" onClick={() => setFilters((p) => ({ ...p, page: 1 }))} disabled={filters.page <= 1}>
              首页
            </button>
            <button className="desktop-action-btn" onClick={() => setFilters((p) => ({ ...p, page: Math.max(1, p.page - 1) }))} disabled={filters.page <= 1}>
              上一页
            </button>
            <div className="desktop-shop-pagination-text">
              第 {filters.page} / {totalPages} 页 · 共 {total} 条
            </div>
            <button className="desktop-action-btn" onClick={() => setFilters((p) => ({ ...p, page: Math.min(totalPages, p.page + 1) }))} disabled={filters.page >= totalPages}>
              下一页
            </button>
          </div>

          <div className="desktop-shop-results-list">
            {loadingItems && <div className="desktop-empty-inline">加载中...</div>}
            {!loadingItems &&
              items.map((item, idx) => {
                const analysis = item?.ai_analysis || {};
                const recommended = Boolean(analysis.is_recommended);
                const link = getProductLink(item);
                return (
                  <div className={`desktop-shop-result-card ${recommended ? "recommended" : ""}`} key={`${item?.["商品信息"]?.["商品ID"] || idx}`}>
                    <div className="desktop-shop-result-head">
                      <div className="desktop-shop-result-title">{getProductTitle(item)}</div>
                      <div className="desktop-shop-result-price">{getProductPrice(item)}</div>
                    </div>
                    <div className="desktop-shop-result-meta">
                      <span>任务：{item?.["任务名称"] || "-"}</span>
                      <span>关键字：{item?.["搜索关键字"] || "-"}</span>
                      <span>爬取：{formatDateTime(item?.["爬取时间"])}</span>
                      <span>发布：{formatDateTime(item?.["商品信息"]?.["发布时间"])}</span>
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
            {!loadingItems && items.length === 0 && <div className="desktop-empty-inline">暂无结果</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function FishLogs() {
  const [tasks, setTasks] = useState([]);
  const [taskId, setTaskId] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  async function loadTail(reset = false) {
    if (!taskId) return;
    const nextOffset = reset ? 0 : offset;
    setLoading(true);
    setError("");
    try {
      const data = await fishApi.getLogTail(Number(taskId), nextOffset, 120);
      setContent(data?.content || "");
      setHasMore(Boolean(data?.has_more));
      setOffset(data?.next_offset ?? 0);
    } catch (e) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }

  async function clear() {
    if (!taskId) return;
    setError("");
    try {
      await fishApi.clearLogs(Number(taskId));
      setOffset(0);
      setContent("");
      loadTail(true);
    } catch (e) {
      setError(e.message || "清空失败");
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (!taskId) return;
    setOffset(0);
    loadTail(true);
  }, [taskId]);

  return (
    <div className="desktop-shop-section">
      <div className="desktop-shop-toolbar-row">
        <div className="desktop-panel-title">日志</div>
        <div className="desktop-shop-toolbar-actions">
          <select className="form-select" value={taskId} onChange={(e) => setTaskId(e.target.value)}>
            {tasks.map((t) => (
              <option value={t.id} key={t.id}>
                {t.task_name}
              </option>
            ))}
          </select>
          <button className="desktop-action-btn" onClick={() => loadTail(true)} disabled={loading || !taskId}>
            {loading ? "加载中..." : "刷新"}
          </button>
          <button className="desktop-action-btn warning" onClick={clear} disabled={!taskId}>
            清空
          </button>
        </div>
      </div>

      {error && <div className="notice desktop-notice">接口异常：{error}</div>}

      <div className="desktop-shop-log">
        <pre className="desktop-shop-log-pre">{content || "暂无日志"}</pre>
      </div>

      <div className="desktop-shop-pagination desktop-shop-pagination-left">
        <button className="desktop-action-btn" onClick={() => { setOffset(Math.max(0, offset - 120)); loadTail(); }} disabled={offset <= 0}>
          上一页
        </button>
        <button className="desktop-action-btn" onClick={() => loadTail()} disabled={!hasMore}>
          下一页
        </button>
        <div className="desktop-shop-pagination-text">偏移行：{offset}</div>
      </div>
    </div>
  );
}

function FishSettings() {
  const [status, setStatus] = useState(null);
  const [ai, setAi] = useState(null);
  const [aiKeySet, setAiKeySet] = useState(false);
  const [aiForm, setAiForm] = useState({ OPENAI_API_KEY: "", OPENAI_BASE_URL: "", OPENAI_MODEL_NAME: "", PROXY_URL: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const s = await fishApi.getSystemStatus();
      setStatus(s);
      setAiKeySet(Boolean(s?.env_file?.openai_api_key_set));
      const a = await fishApi.getAiSettings();
      setAi(a);
      setAiForm({
        OPENAI_API_KEY: "",
        OPENAI_BASE_URL: a?.OPENAI_BASE_URL || "",
        OPENAI_MODEL_NAME: a?.OPENAI_MODEL_NAME || "",
        PROXY_URL: a?.PROXY_URL || "",
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

      <div className="desktop-shop-split desktop-shop-split-tight">
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
          </div>

          <div className="desktop-shop-kv-grid desktop-shop-kv-grid-tight">
            <div className="desktop-shop-kv">
              <div className="desktop-shop-kv-label">登录态文件</div>
              <div className="desktop-shop-kv-value">{loginState?.exists ? "存在" : "不存在"}</div>
            </div>
            <div className="desktop-shop-kv">
              <div className="desktop-shop-kv-label">路径</div>
              <div className="desktop-shop-kv-value">{loginState?.path || "-"}</div>
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

        <FishLoginStateCard onDone={refresh} />
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
              placeholder={aiKeySet ? "已配置（如需更新请重新填写）" : "未配置"}
            />
            <div className="desktop-shop-form-label">{aiKeySet ? "后端出于安全不会回传 Key；留空表示保持不变。" : "当前未配置 Key；填写后保存即可生效。"}</div>
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
    </div>
  );
}

function FishLoginStateCard({ onDone }) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const data = await fishApi.updateLoginState(content);
      setMessage(data?.message || "已保存");
      setContent("");
      onDone?.();
    } catch (e) {
      setError(e.message || "保存失败");
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const data = await fishApi.deleteLoginState();
      setMessage(data?.message || "已删除");
      onDone?.();
    } catch (e) {
      setError(e.message || "删除失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="desktop-shop-card">
      <div className="desktop-shop-card-title">登录态（xianyu_state.json）</div>
      {error && <div className="notice desktop-notice">接口异常：{error}</div>}
      {message && <div className="notice desktop-notice">{message}</div>}
      <textarea className="form-textarea" rows={10} value={content} onChange={(e) => setContent(e.target.value)} placeholder="粘贴 xianyu_state.json 内容（JSON 文本）" />
      <div className="desktop-shop-form-actions">
        <button className="desktop-action-btn warning" onClick={remove} disabled={loading}>
          删除
        </button>
        <button className="desktop-primary-btn" onClick={save} disabled={loading || !content.trim()}>
          {loading ? "保存中..." : "保存"}
        </button>
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
              <textarea
                className="form-textarea"
                rows={12}
                value={detail.content || ""}
                onChange={(e) => setDetail((p) => ({ ...p, content: e.target.value }))}
              />
              <div className="desktop-shop-form-actions">
                <button className="desktop-primary-btn" onClick={save} disabled={loading}>
                  保存
                </button>
              </div>
            </>
          )}
        </div>
      </div>

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
