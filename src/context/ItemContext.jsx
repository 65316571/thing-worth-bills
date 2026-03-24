import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../utils/api";

const ItemContext = createContext();

function replaceItemById(items, nextItem) {
  return items.map((item) => (item.id === nextItem.id ? nextItem : item));
}

export function ItemProvider({ children }) {
  const [items, setItems] = useState([]);
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [itemsResponse, wishesResponse] = await Promise.all([
        api.getItems(),
        api.getWishes(),
      ]);

      setItems(itemsResponse.items || []);
      setWishes(wishesResponse.wishes || []);
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
    const response = await api.createWish(wish);
    setWishes((prev) => [response.wish, ...prev]);
    return response.wish;
  };

  const deleteWish = async (id) => {
    await api.deleteWish(id);
    setWishes((prev) => prev.filter((w) => w.id !== id));
  };

  const value = useMemo(
    () => ({
      items,
      wishes,
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
    }),
    [items, wishes, loading, error],
    [items, wishes, loading, error],
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
