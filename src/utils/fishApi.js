const FISH_API_PREFIX = "/fish-api";
const FISH_AUTH_PREFIX = "/fish-auth";

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
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.detail || data?.message || `请求失败（${response.status}）`;
    throw new Error(message);
  }

  return data;
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
  loginStatus(payload) {
    return fishRequest(`${FISH_AUTH_PREFIX}/status`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getDashboardSummary() {
    return fishRequest(`${FISH_API_PREFIX}/dashboard/summary`);
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

