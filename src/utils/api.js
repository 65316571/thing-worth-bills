async function request(url, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(url, {
    headers: isFormData
      ? {
          ...(options.headers || {}),
        }
      : {
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

async function uploadFileToOss(file) {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  const response = await request("/api/uploads/file", {
    method: "POST",
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type,
      contentBase64: btoa(binary),
    }),
  });

  return response.upload.url;
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
  updateItemAsset(id, assetId, payload) {
    return request(`/api/items/${id}/assets/${assetId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  updateAsset(assetId, payload) {
    return request(`/api/assets/${assetId}`, {
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
  createItemAsset(id, payload) {
    return request(`/api/items/${id}/assets`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  deleteItemAsset(id, assetId) {
    return request(`/api/items/${id}/assets/${assetId}`, {
      method: "DELETE",
    });
  },
  uploadFileToOss,
  getAssets(params) {
    if (!params || typeof params === "string") {
      const query = params ? `?type=${encodeURIComponent(params)}` : "";
      return request(`/api/assets${query}`);
    }

    const query = new URLSearchParams();
    if (params.type) query.set("type", params.type);
    if (params.itemKeyword) query.set("itemKeyword", params.itemKeyword);
    if (params.titleKeyword) query.set("titleKeyword", params.titleKeyword);
    const qs = query.toString();
    return request(`/api/assets${qs ? `?${qs}` : ""}`);
  },
  getWishes() {
    return request("/api/wish-board-items");
  },
  createWish(payload) {
    return request("/api/wish-board-items", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  deleteWish(id) {
    return request(`/api/wish-board-items/${id}`, {
      method: "DELETE",
    });
  },
  getVipMemberships() {
    return request("/api/vip-memberships");
  },
  createVipMembership(payload) {
    return request("/api/vip-memberships", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateVipMembership(id, payload) {
    return request(`/api/vip-memberships/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deleteVipMembership(id) {
    return request(`/api/vip-memberships/${id}`, {
      method: "DELETE",
    });
  },
};
