const FISH_API_PREFIX = "/fish-api";

function encodePathSegments(path) {
  const raw = String(path || "").replace(/\\/g, "/");
  const segments = raw.split("/").filter(Boolean).map((part) => encodeURIComponent(part));
  return segments.join("/");
}

function stringifySafe(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function formatFastApiValidationDetail(detail) {
  if (!Array.isArray(detail)) return "";
  const lines = detail
    .map((item) => {
      if (!item || typeof item !== "object") return String(item);
      const loc = Array.isArray(item.loc) ? item.loc.join(".") : "";
      const msg = item.msg ? String(item.msg) : "";
      const type = item.type ? String(item.type) : "";
      const parts = [loc, msg, type].filter(Boolean);
      return parts.join("：");
    })
    .filter(Boolean);
  return lines.length ? lines.join("；") : "";
}

function buildErrorMessage({ status, statusText, data, rawText }) {
  const detail = data?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  const validation = formatFastApiValidationDetail(detail);
  if (validation) return validation;
  const message = data?.message;
  if (typeof message === "string" && message.trim()) return message;
  const errorMessage = data?.error?.message;
  if (typeof errorMessage === "string" && errorMessage.trim()) return errorMessage;
  if (detail !== undefined && detail !== null) return stringifySafe(detail);
  if (rawText && typeof rawText === "string") return rawText.slice(0, 300);
  return `请求失败（${status}${statusText ? ` ${statusText}` : ""}）`;
}

async function fishRequest(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = isFormData
    ? {
        ...(options.headers || {}),
      }
    : {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      };

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message = buildErrorMessage({
      status: response.status,
      statusText: response.statusText,
      data,
      rawText: text,
    });
    throw new Error(message);
  }

  return data ?? (text || null);
}

function withQuery(path, params) {
  if (!params) return path;
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });
  const qs = searchParams.toString();
  return qs ? `${path}?${qs}` : path;
}

export const fishApi = {
  getDashboardSummary() {
    return fishRequest(`${FISH_API_PREFIX}/dashboard/summary`);
  },

  getKeeperSummary() {
    return fishRequest(`${FISH_API_PREFIX}/keeper/summary`);
  },

  listImageTasks() {
    return fishRequest(`${FISH_API_PREFIX}/keeper/images/tasks`);
  },

  listTaskImages(taskDir) {
    return fishRequest(`${FISH_API_PREFIX}/keeper/images/tasks/${encodeURIComponent(taskDir)}/files`);
  },

  deleteTaskImageDir(taskDir) {
    return fishRequest(`${FISH_API_PREFIX}/keeper/images/tasks/${encodeURIComponent(taskDir)}`, { method: "DELETE" });
  },

  deleteImageFile(relPath) {
    const encoded = encodePathSegments(relPath);
    return fishRequest(`${FISH_API_PREFIX}/keeper/images/files/${encoded}`, { method: "DELETE" });
  },

  listLogFiles() {
    return fishRequest(`${FISH_API_PREFIX}/keeper/logs/files`);
  },

  deleteLogFile(filename) {
    return fishRequest(`${FISH_API_PREFIX}/keeper/logs/files/${encodeURIComponent(filename)}`, { method: "DELETE" });
  },

  buildDbDownloadUrl() {
    return `${FISH_API_PREFIX}/keeper/db/download`;
  },

  getTasks() {
    return fishRequest(`${FISH_API_PREFIX}/tasks`);
  },

  createTask(payload) {
    return fishRequest(`${FISH_API_PREFIX}/tasks`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  generateTask(payload) {
    return fishRequest(`${FISH_API_PREFIX}/tasks/generate`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getTaskGenerationJob(jobId) {
    return fishRequest(`${FISH_API_PREFIX}/tasks/generate-jobs/${encodeURIComponent(jobId)}`);
  },

  updateTask(taskId, payload) {
    return fishRequest(`${FISH_API_PREFIX}/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  startTask(taskId) {
    return fishRequest(`${FISH_API_PREFIX}/tasks/start/${taskId}`, { method: "POST" });
  },

  stopTask(taskId) {
    return fishRequest(`${FISH_API_PREFIX}/tasks/stop/${taskId}`, { method: "POST" });
  },

  deleteTask(taskId) {
    return fishRequest(`${FISH_API_PREFIX}/tasks/${taskId}`, { method: "DELETE" });
  },

  getResultFiles() {
    return fishRequest(`${FISH_API_PREFIX}/results/files`);
  },

  deleteResultFile(filename) {
    return fishRequest(`${FISH_API_PREFIX}/results/files/${encodeURIComponent(filename)}`, { method: "DELETE" });
  },

  getResultContent(filename, params) {
    return fishRequest(withQuery(`${FISH_API_PREFIX}/results/${encodeURIComponent(filename)}`, params));
  },

  getResultInsights(filename) {
    return fishRequest(`${FISH_API_PREFIX}/results/${encodeURIComponent(filename)}/insights`);
  },

  buildResultExportUrl(filename, params) {
    const base = `${FISH_API_PREFIX}/results/${encodeURIComponent(filename)}/export`;
    return withQuery(base, params);
  },

  getLogTail(taskId, offsetLines = 0, limitLines = 80) {
    return fishRequest(
      withQuery(`${FISH_API_PREFIX}/logs/tail`, {
        task_id: taskId,
        offset_lines: offsetLines,
        limit_lines: limitLines,
      })
    );
  },

  buildTaskLogDownloadUrl(taskId) {
    return withQuery(`${FISH_API_PREFIX}/logs/file`, { task_id: taskId });
  },

  clearLogs(taskId) {
    return fishRequest(withQuery(`${FISH_API_PREFIX}/logs`, taskId ? { task_id: taskId } : {}), { method: "DELETE" });
  },

  getSystemStatus() {
    return fishRequest(`${FISH_API_PREFIX}/settings/status`);
  },

  getAiSettings() {
    return fishRequest(`${FISH_API_PREFIX}/settings/ai`);
  },

  updateAiSettings(payload) {
    return fishRequest(`${FISH_API_PREFIX}/settings/ai`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  testAiSettings(payload) {
    return fishRequest(`${FISH_API_PREFIX}/settings/ai/test`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getBandwidthSettings() {
    return fishRequest(`${FISH_API_PREFIX}/settings/bandwidth`);
  },

  updateBandwidthSettings(payload) {
    return fishRequest(`${FISH_API_PREFIX}/settings/bandwidth`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  getNotificationSettings() {
    return fishRequest(`${FISH_API_PREFIX}/settings/notifications`);
  },

  updateNotificationSettings(payload) {
    return fishRequest(`${FISH_API_PREFIX}/settings/notifications`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  testNotificationSettings(payload) {
    return fishRequest(`${FISH_API_PREFIX}/settings/notifications/test`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateLoginState(content) {
    return fishRequest(`${FISH_API_PREFIX}/login-state`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  deleteLoginState() {
    return fishRequest(`${FISH_API_PREFIX}/login-state`, { method: "DELETE" });
  },

  listAccounts() {
    return fishRequest(`${FISH_API_PREFIX}/accounts`);
  },

  getAccount(name) {
    return fishRequest(`${FISH_API_PREFIX}/accounts/${encodeURIComponent(name)}`);
  },

  createAccount(payload) {
    return fishRequest(`${FISH_API_PREFIX}/accounts`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateAccount(name, content) {
    return fishRequest(`${FISH_API_PREFIX}/accounts/${encodeURIComponent(name)}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    });
  },

  deleteAccount(name) {
    return fishRequest(`${FISH_API_PREFIX}/accounts/${encodeURIComponent(name)}`, { method: "DELETE" });
  },
};
