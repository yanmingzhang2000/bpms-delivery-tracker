import { useState } from "react";
import "@glideapps/glide-data-grid/dist/index.css";
import "@glideapps/glide-data-grid-cells/dist/index.css";
import PurchaseOrderTrackerPage from "./pages/PurchaseOrderTrackerPage";
import PaymentRequestTrackerPage from "./pages/PaymentRequestTrackerPage";

type TabKey = "purchaseOrder" | "paymentRequest";

const TABS: { key: TabKey; label: string }[] = [
  { key: "purchaseOrder", label: "采购订单 Tracker" },
  { key: "paymentRequest", label: "请款 Tracker" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("purchaseOrder");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        padding: "16px",
        gap: "12px",
      }}
    >
      <header>
        <h2 style={{ margin: 0, fontSize: 18 }}>BPMS 交付 Tracker</h2>
        <p style={{ margin: "4px 0 0", color: "#666", fontSize: 13 }}>
          基于 Glide Data Grid 搭建的前端 Demo（纯前端假数据，刷新后改动会丢失）。
        </p>
      </header>

      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e1e4e8" }}>
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                border: "none",
                borderBottom: isActive ? "2px solid #2f6fed" : "2px solid transparent",
                background: "transparent",
                color: isActive ? "#2f6fed" : "#555",
                fontWeight: isActive ? 600 : 400,
                fontSize: 14,
                padding: "8px 16px",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "purchaseOrder" ? <PurchaseOrderTrackerPage /> : <PaymentRequestTrackerPage />}
    </div>
  );
}
