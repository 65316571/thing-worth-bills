import { createContext, useContext, useState } from "react";

const ItemContext = createContext();

const SAMPLE_ITEMS = [
  {
    id: 1,
    name: "小米2万mAh充电宝",
    price: 159,
    buyDate: "2023-02-15",
    category: "电子产品",
    icon: null,
    status: "active",
    note: "出行必备，很耐用",
  },
  {
    id: 2,
    name: "飞智黑武士3 Pro",
    price: 264.38,
    buyDate: "2023-01-08",
    category: "游戏设备",
    icon: null,
    status: "active",
    note: "手游神器",
  },
  {
    id: 3,
    name: "黑铁牛键盘",
    price: 281.92,
    buyDate: "2023-01-01",
    category: "电子产品",
    icon: null,
    status: "active",
    note: "段落感很棒",
  },
  {
    id: 4,
    name: "索尼WH-1000XM4",
    price: 1899,
    buyDate: "2022-08-20",
    category: "耳机",
    icon: null,
    status: "active",
    note: "降噪效果一流",
  },
  {
    id: 5,
    name: "旧款机械键盘",
    price: 399,
    buyDate: "2021-03-10",
    stopDate: "2023-01-01",
    category: "电子产品",
    icon: null,
    status: "inactive",
    note: "已换掉",
  },
];

const SAMPLE_WISHES = [
  {
    id: 1,
    name: "iPad Pro 11寸",
    targetPrice: 3000,
    category: "电子产品",
    note: "等价格降到3000以下再买",
    currentPrice: null,
    link: null,
  },
  {
    id: 2,
    name: "Switch OLED",
    targetPrice: 1800,
    category: "游戏设备",
    note: "咸鱼找个好价",
    currentPrice: null,
    link: null,
  },
];

export function ItemProvider({ children }) {
  const [items, setItems] = useState(SAMPLE_ITEMS);
  const [wishes, setWishes] = useState(SAMPLE_WISHES);

  const addItem = (item) => {
    setItems((prev) => [
      ...prev,
      { ...item, id: Date.now(), status: "active" },
    ]);
  };

  const updateItem = (id, data) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...data } : it)));
  };

  const deleteItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const deactivateItem = (id) => {
    const today = new Date().toISOString().split("T")[0];
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, status: "inactive", stopDate: today } : it
      )
    );
  };

  const reactivateItem = (id) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, status: "active", stopDate: undefined } : it
      )
    );
  };

  const addWish = (wish) => {
    setWishes((prev) => [...prev, { ...wish, id: Date.now() }]);
  };

  const deleteWish = (id) => {
    setWishes((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <ItemContext.Provider
      value={{
        items,
        wishes,
        addItem,
        updateItem,
        deleteItem,
        deactivateItem,
        reactivateItem,
        addWish,
        deleteWish,
      }}
    >
      {children}
    </ItemContext.Provider>
  );
}

export const useItems = () => useContext(ItemContext);
