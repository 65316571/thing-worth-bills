import WishBoardPanel from "../components/WishBoardPanel";

export default function WishList({ navigate }) {
  return (
    <div className="app">
      <div className="page-header">
        <div className="page-title">心愿墙</div>
        <div className="page-subtitle">记录未来想买的东西、预算与购买用途</div>
      </div>

      <div className="scroll-area">
        <div className="notice">
          🎯 先用测试数据搭好心愿墙结构，后续可再接入价格监控、提醒邮件和购买进度追踪。
        </div>
        <WishBoardPanel mobile navigate={navigate} />
      </div>
    </div>
  );
}
