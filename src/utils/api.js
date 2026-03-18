async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export const api = {
  getItems() {
    return request("/api/items");
  },
  createItem(payload) {
    return request("/api/items", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateItem(id, payload) {
    return request(`/api/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  updateItemStatus(id, status) {
    return request(`/api/items/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
  deleteItem(id) {
    return request(`/api/items/${id}`, {
      method: "DELETE",
    });
  },
  getWishes() {
    return request("/api/wishes");
  },
  createWish(payload) {
    return request("/api/wishes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  deleteWish(id) {
    return request(`/api/wishes/${id}`, {
      method: "DELETE",
    });
  },
};
