import { useCallback, useMemo, useState } from "react";
import "@glideapps/glide-data-grid/dist/index.css";
import "@glideapps/glide-data-grid-cells/dist/index.css";
import MainGrid from "./grid/MainGrid";
import BudgetGrid from "./grid/BudgetGrid";
import { initialBudgetRows, initialMainRows } from "./data/sampleData";
import type { BudgetRow, MainRow } from "./data/types";

export default function App() {
  const [mainRows, setMainRows] = useState<MainRow[]>(initialMainRows);
  const [budgetRows, setBudgetRows] = useState<BudgetRow[]>(initialBudgetRows);
  const [selectedSeq, setSelectedSeq] = useState<number | null>(initialMainRows[0]?.seq ?? null);
  // 勾选的行号（mainRows 数组下标），用于"录Trade"批量操作
  const [checkedRows, setCheckedRows] = useState<ReadonlySet<number>>(new Set());
  const [tradeToast, setTradeToast] = useState<string | null>(null);

  // 勾选中有多少行是"未录入"状态（已录入的行即使被勾选也不会被重复处理）
  const pendingCount = useMemo(
    () =>
      Array.from(checkedRows).filter((idx) => mainRows[idx]?.tradeStatus === "未录入").length,
    [checkedRows, mainRows]
  );

  const handleRecordTrade = useCallback(() => {
    if (pendingCount === 0) return;
    const updated = mainRows.map((row, idx) =>
      checkedRows.has(idx) && row.tradeStatus === "未录入"
        ? { ...row, tradeStatus: "已录入" as const }
        : row
    );
    setMainRows(updated);
    setTradeToast(`已为 ${pendingCount} 条记录录入 Trade`);
    setCheckedRows(new Set());
    window.setTimeout(() => setTradeToast(null), 2500);
  }, [mainRows, checkedRows, pendingCount]);

  const selectedMainRow = useMemo(
    () => mainRows.find((r) => r.seq === selectedSeq) ?? null,
    [mainRows, selectedSeq]
  );

  const budgetCountForSelected = useMemo(
    () => budgetRows.filter((r) => r.seq === selectedSeq).length,
    [budgetRows, selectedSeq]
  );

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
          点击主表任意一行，下方预算明细会自动联动筛选；勾选主表左侧复选框后可点击"录Trade"批量更新
          Trade 状态（系统字段，不可手动编辑）。
        </p>
      </header>

      <section style={{ flex: "1 1 60%", minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            基本信息（主表，{mainRows.length} 条）
            {checkedRows.size > 0 && (
              <span style={{ fontWeight: 400, color: "#666" }}>
                {" "}
                —— 已勾选 {checkedRows.size} 行（其中 {pendingCount} 行待录入）
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {tradeToast && (
              <span style={{ color: "#0a7a3d", fontSize: 12 }}>{tradeToast}</span>
            )}
            <button
              onClick={handleRecordTrade}
              disabled={pendingCount === 0}
              style={{
                border: "1px solid #2f6fed",
                background: pendingCount === 0 ? "#f0f1f3" : "#2f6fed",
                color: pendingCount === 0 ? "#9aa1ac" : "#fff",
                borderRadius: 4,
                padding: "6px 14px",
                fontSize: 13,
                cursor: pendingCount === 0 ? "not-allowed" : "pointer",
              }}
              title={
                pendingCount === 0
                  ? "请先勾选至少一条未录入 Trade 的记录"
                  : `录入 ${pendingCount} 条 Trade`
              }
            >
              录Trade{pendingCount > 0 ? `（${pendingCount}）` : ""}
            </button>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, border: "1px solid #e1e4e8", borderRadius: 6 }}>
          <MainGrid
            rows={mainRows}
            onRowsChange={setMainRows}
            selectedSeq={selectedSeq}
            onSelectRow={setSelectedSeq}
            checkedRows={checkedRows}
            onCheckedRowsChange={setCheckedRows}
          />
        </div>
      </section>

      <section style={{ flex: "1 1 40%", minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            采购项（预算子表）
            {selectedMainRow ? (
              <span style={{ fontWeight: 400, color: "#666" }}>
                {" "}
                —— 当前关联序号 {selectedMainRow.seq}（{selectedMainRow.offerNo}），共{" "}
                {budgetCountForSelected} 条
              </span>
            ) : (
              <span style={{ fontWeight: 400, color: "#666" }}> —— 显示全部</span>
            )}
          </div>
          {selectedSeq != null && (
            <button
              onClick={() => setSelectedSeq(null)}
              style={{
                border: "1px solid #d0d5dd",
                background: "#fff",
                borderRadius: 4,
                padding: "4px 10px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              清除筛选，查看全部预算项
            </button>
          )}
        </div>
        <div style={{ flex: 1, minHeight: 0, border: "1px solid #e1e4e8", borderRadius: 6 }}>
          <BudgetGrid rows={budgetRows} onRowsChange={setBudgetRows} filterSeq={selectedSeq} />
        </div>
      </section>
    </div>
  );
}
