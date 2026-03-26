import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../utils/api";

const ItemContext = createContext();
const WISH_STORAGE_KEY = "thing-worth-local-wishes";
const VIP_STORAGE_KEY = "thing-worth-local-vips";

const MOCK_WISHES = [
  {
    id: "wish-mock-1",
    name: "iPad mini 7",
    targetPrice: 3299,
    category: "电子产品",
    purpose: "通勤时看书、记灵感和做轻量手账",
    note: "希望等到教育优惠或二手好价再入手",
    createdAt: "2026-03-20T09:00:00.000Z",
  },
  {
    id: "wish-mock-2",
    name: "人体工学椅",
    targetPrice: 1800,
    category: "其他",
    purpose: "改善久坐办公和剪视频时的腰背支撑",
    note: "优先看二手成色好的品牌款",
    createdAt: "2026-03-18T11:30:00.000Z",
  },
  {
    id: "wish-mock-3",
    name: "SONY WH-1000XM6",
    targetPrice: 2199,
    category: "耳机",
    purpose: "出差降噪、专注办公和夜间听歌",
    note: "等首发热度过后关注活动价",
    createdAt: "2026-03-16T08:20:00.000Z",
  },
];

const MOCK_VIPS = [
  {
    id: "vip-mock-1",
    name: "哔哩哔哩大会员",
    level: "年度",
    website: "https://www.bilibili.com",
    account: "主账号",
    benefits: ["番剧抢先看", "高码率画质", "专属装扮"],
    expireAt: "2026-11-18",
    status: "active",
    note: "主要给追番和投屏用。",
  },
  {
    id: "vip-mock-2",
    name: "网易云音乐黑胶",
    level: "连续包月",
    website: "https://music.163.com",
    account: "手机尾号 5521",
    benefits: ["无损音质", "会员曲库", "听歌识曲增强"],
    expireAt: "2026-04-06",
    status: "expiring",
    note: "如果下月使用频率不高可以先停。",
  },
];

function getLocalWishes() {
  if (typeof window === "undefined") {
    return MOCK_WISHES;
  }

  const raw = window.localStorage.getItem(WISH_STORAGE_KEY);

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (error) {
      // ignore parse error and fallback to mock wishes
    }
  }

  window.localStorage.setItem(WISH_STORAGE_KEY, JSON.stringify(MOCK_WISHES));
  return MOCK_WISHES;
}

function saveLocalWishes(nextWishes) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(WISH_STORAGE_KEY, JSON.stringify(nextWishes));
}

function getLocalVips() {
  if (typeof window === "undefined") {
    return MOCK_VIPS;
  }

  const raw = window.localStorage.getItem(VIP_STORAGE_KEY);

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (error) {
      // ignore parse error and fallback to mock vips
    }
  }

  window.localStorage.setItem(VIP_STORAGE_KEY, JSON.stringify(MOCK_VIPS));
  return MOCK_VIPS;
}

function saveLocalVips(nextVips) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(VIP_STORAGE_KEY, JSON.stringify(nextVips));
}

function replaceItemById(items, nextItem) {
  return items.map((item) => (item.id === nextItem.id ? nextItem : item));
}

function replaceVipById(vips, nextVip) {
  return vips.map((vip) => (vip.id === nextVip.id ? nextVip : vip));
}

export function ItemProvider({ children }) {
  const [items, setItems] = useState([]);
  const [wishes, setWishes] = useState(() => getLocalWishes());
  const [vipMemberships, setVipMemberships] = useState(() => getLocalVips());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [itemsResult, wishesResult, vipResult] = await Promise.allSettled([
        api.getItems(),
        api.getWishes(),
        api.getVipMemberships(),
      ]);

      if (itemsResult.status === "fulfilled") {
        setItems(itemsResult.value.items || []);
      } else {
        throw itemsResult.reason;
      }

      if (wishesResult.status === "fulfilled") {
        const nextWishes = wishesResult.value.wishes || [];
        setWishes(nextWishes);
        saveLocalWishes(nextWishes);
      } else {
        setWishes(getLocalWishes());
      }

      if (vipResult.status === "fulfilled") {
        const nextVips = vipResult.value.vips || [];
        setVipMemberships(nextVips);
        saveLocalVips(nextVips);
      } else {
        setVipMemberships(getLocalVips());
      }
    } catch (loadError) {
      setError(loadError.message || "数据加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addItem = async (item) => {
    const response = await api.createItem(item);
    setItems((prev) => [response.item, ...prev]);
    return response.item;
  };

  const updateItem = async (id, data) => {
    const currentItem = items.find((it) => it.id === id);
    const response = await api.updateItem(id, {
      ...currentItem,
      ...data,
    });
    setItems((prev) => replaceItemById(prev, response.item));
    return response.item;
  };

  const deleteItem = async (id) => {
    await api.deleteItem(id);
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const deactivateItem = async (id) => {
    const response = await api.updateItemStatus(id, "inactive");
    setItems((prev) => replaceItemById(prev, response.item));
    return response.item;
  };

  const reactivateItem = async (id) => {
    const response = await api.updateItemStatus(id, "active");
    setItems((prev) => replaceItemById(prev, response.item));
    return response.item;
  };

  const addItemAsset = async (id, asset) => {
    const response = await api.createItemAsset(id, asset);
    setItems((prev) => prev.map((item) => {
      if (item.id !== id) {
        return item;
      }

      return {
        ...item,
        assets: [response.asset, ...(item.assets || [])],
      };
    }));
    return response.asset;
  };

  const deleteItemAsset = async (id, assetId) => {
    await api.deleteItemAsset(id, assetId);
    setItems((prev) => prev.map((item) => {
      if (item.id !== id) {
        return item;
      }

      return {
        ...item,
        assets: (item.assets || []).filter((asset) => asset.id !== assetId),
      };
    }));
  };

  const updateItemAsset = async (id, assetId, data) => {
    const response = await api.updateItemAsset(id, assetId, data);
    setItems((prev) => prev.map((item) => {
      if (item.id !== id) {
        return item;
      }
      return {
        ...item,
        assets: (item.assets || []).map((asset) => (asset.id === response.asset.id ? response.asset : asset)),
      };
    }));
    return response.asset;
  };

  const updateAsset = async (assetId, data) => {
    const response = await api.updateAsset(assetId, data);
    const nextAsset = response.asset;

    setItems((prev) => {
      const cleaned = prev.map((item) => ({
        ...item,
        assets: (item.assets || []).filter((asset) => asset.id !== nextAsset.id),
      }));

      return cleaned.map((item) => {
        if (item.id !== nextAsset.itemId) {
          return item;
        }

        return {
          ...item,
          assets: [nextAsset, ...(item.assets || [])],
        };
      });
    });

    return nextAsset;
  };

  const addWish = async (wish) => {
    try {
      const response = await api.createWish(wish);
      setWishes((prev) => {
        const next = [response.wish, ...prev];
        saveLocalWishes(next);
        return next;
      });
      return response.wish;
    } catch (error) {
      const nextWish = {
        ...wish,
        id: `wish-local-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      setWishes((prev) => {
        const next = [nextWish, ...prev];
        saveLocalWishes(next);
        return next;
      });

      return nextWish;
    }
  };

  const deleteWish = async (id) => {
    try {
      await api.deleteWish(id);
    } catch (error) {
      // frontend mock mode
    }

    setWishes((prev) => {
      const next = prev.filter((w) => w.id !== id);
      saveLocalWishes(next);
      return next;
    });
  };

  const addVipMembership = async (vip) => {
    try {
      const response = await api.createVipMembership(vip);
      setVipMemberships((prev) => {
        const next = [response.vip, ...prev];
        saveLocalVips(next);
        return next;
      });
      return response.vip;
    } catch (error) {
      const nextVip = {
        ...vip,
        id: `vip-local-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      setVipMemberships((prev) => {
        const next = [nextVip, ...prev];
        saveLocalVips(next);
        return next;
      });

      return nextVip;
    }
  };

  const updateVipMembership = async (id, vip) => {
    try {
      const response = await api.updateVipMembership(id, vip);
      setVipMemberships((prev) => {
        const next = replaceVipById(prev, response.vip);
        saveLocalVips(next);
        return next;
      });
      return response.vip;
    } catch (error) {
      const nextVip = {
        ...vip,
        id,
        updatedAt: new Date().toISOString(),
      };

      setVipMemberships((prev) => {
        const next = replaceVipById(prev, nextVip);
        saveLocalVips(next);
        return next;
      });

      return nextVip;
    }
  };

  const deleteVipMembership = async (id) => {
    try {
      await api.deleteVipMembership(id);
    } catch (error) {
      // frontend mock mode
    }

    setVipMemberships((prev) => {
      const next = prev.filter((vip) => vip.id !== id);
      saveLocalVips(next);
      return next;
    });
  };

  const value = useMemo(
    () => ({
      items,
      wishes,
      vipMemberships,
      loading,
      error,
      reload: loadData,
      addItem,
      updateItem,
      deleteItem,
      deactivateItem,
      reactivateItem,
      addItemAsset,
      deleteItemAsset,
      updateItemAsset,
      updateAsset,
      addWish,
      deleteWish,
      addVipMembership,
      updateVipMembership,
      deleteVipMembership,
    }),
    [items, wishes, vipMemberships, loading, error],
  );

  return (
    <ItemContext.Provider
      value={value}
    >
      {children}
    </ItemContext.Provider>
  );
}

export const useItems = () => useContext(ItemContext);
