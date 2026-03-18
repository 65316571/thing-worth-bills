import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../utils/api";

const ItemContext = createContext();

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
    setItems((prev) => prev.map((it) => (it.id === id ? response.item : it)));
    return response.item;
  };

  const deleteItem = async (id) => {
    await api.deleteItem(id);
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const deactivateItem = async (id) => {
    const response = await api.updateItemStatus(id, "inactive");
    setItems((prev) => prev.map((it) => (it.id === id ? response.item : it)));
    return response.item;
  };

  const reactivateItem = async (id) => {
    const response = await api.updateItemStatus(id, "active");
    setItems((prev) => prev.map((it) => (it.id === id ? response.item : it)));
    return response.item;
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
      addWish,
      deleteWish,
    }),
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
