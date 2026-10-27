import { useCallback, useMemo, useState } from "react";
import "@glideapps/glide-data-grid/dist/index.css";
import "@glideapps/glide-data-grid-cells/dist/index.css";
import MainGrid from "./grid/MainGrid";
import BudgetGrid from "./grid/BudgetGrid";
import { initialBudgetRows, initialMainRows } from "./data/sampleData";
import type { BudgetRow, MainRow } from "./data/types";
import { getMissingFieldLabels } from "./data/validation";
import { mockRecordTradeApi } from "./data/tradeApi";

/** 一次"录Trade"批量操作的结果汇总，用于结果面板展示 */
interface TradeRunSummary {
  successSeqs: number[];
  /** 本地必填校验未通过，没有发起请求的行 */
  validationFailures: { seq: number; offerNo: string; missingFields: string[] }[];
  /** 发起了请求但 BPMS 侧返回失败的行 */
  apiFailures: { seq: number; offerNo: string; errorMessage: string }[];
}

export default function App() {
  const [mainRows, setMainRows] = useState<MainRow[]>(initialMainRows);
  const [budgetRows, setBudgetRows] = useState<BudgetRow[]>(initialBudgetRows);
  const [selectedSeq, setSelectedSeq] = useState<number | null>(initialMainRows[0]?.seq ?? null);
  // 勾选的行号（mainRows 数组下标），用于"录Trade"批量操作
  const [checkedRows, setCheckedRows] = useState<ReadonlySet<number>>(new Set());
  const [isRecording, setIsRecording] = useState(false);
  const [runSummary, setRunSummary] = useState<TradeRunSummary | null>(null);

  // 勾选中有多少行是"未录入"状态（已录入的行即使被勾选也不会被重复处理）
  const pendingCount = useMemo(
    () =>
      Array.from(checkedRows).filter((idx) => mainRows[idx]?.tradeStatus === "未录入").length,
    [checkedRows, mainRows]
  );

  const handleRecordTrade = useCallback(async () => {
    if (pendingCount === 0 || isRecording) return;

    const targetIndexes = Array.from(checkedRows).filter(
      (idx) => mainRows[idx]?.tradeStatus === "未录入"
    );

    // 第一步：本地必填校验，不合格的行直接判定失败，不发请求
    const toSubmit: number[] = [];
    const validationFailures: TradeRunSummary["validationFailures"] = [];
    for (const idx of targetIndexes) {
      const row = mainRows[idx];
      const missingFields = getMissingFieldLabels(row);
      if (missingFields.length > 0) {
        validationFailures.push({ seq: row.seq, offerNo: row.offerNo, missingFields });
      } else {
        toSubmit.push(idx);
      }
    }

    setIsRecording(true);
    setRunSummary(null);

    // 第二步：对通过校验的行，并发调用"单条录入"接口（模拟真实 BPMS 接口只支持单条的情况）
    const apiResults = await Promise.all(
      toSubmit.map((idx) => mockRecordTradeApi(mainRows[idx]))
    );

    const successSeqs: number[] = [];
    const apiFailures: TradeRunSummary["apiFailures"] = [];
    apiResults.forEach((result, i) => {
      const row = mainRows[toSubmit[i]];
      if (result.success) {
        successSeqs.push(result.seq);
      } else {
        apiFailures.push({
          seq: result.seq,
          offerNo: row.offerNo,
          errorMessage: result.errorMessage ?? "未知错误",
        });
      }
    });

    // 第三步：只把接口返回成功的行改成"已录入"；校验失败/接口失败的行保持"未录入"，可以修正后重新提交
    if (successSeqs.length > 0) {
      const successSet = new Set(successSeqs);
      setMainRows((prev) =>
        prev.map((row) =>
          successSet.has(row.seq) && row.tradeStatus === "未录入"
            ? { ...row, tradeStatus: "已录入" as const }
            : row
        )
      );
    }

    setRunSummary({ successSeqs, validationFailures, apiFailures });
    setIsRecording(false);
    setCheckedRows(new Set());
  }, [mainRows, checkedRows, pendingCount, isRecording]);

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
          点击主表任意一行，下方预算明细会自动联动筛选；勾选主表左侧复选框后可点击"录Trade"批量提交
          （模拟真实 BPMS 接口按单条处理：先做本地必填校验，通过后再逐条调用接口，接口有概率模拟业务失败）。
          必填字段为空时会用浅红色标出；Trade 状态为系统字段，不可手动编辑。
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
            <button
              onClick={handleRecordTrade}
              disabled={pendingCount === 0 || isRecording}
              style={{
                border: "1px solid #2f6fed",
                background: pendingCount === 0 || isRecording ? "#f0f1f3" : "#2f6fed",
                color: pendingCount === 0 || isRecording ? "#9aa1ac" : "#fff",
                borderRadius: 4,
                padding: "6px 14px",
                fontSize: 13,
                cursor: pendingCount === 0 || isRecording ? "not-allowed" : "pointer",
              }}
              title={
                pendingCount === 0
                  ? "请先勾选至少一条未录入 Trade 的记录"
                  : `录入 ${pendingCount} 条 Trade`
              }
            >
              {isRecording ? "录入中…" : `录Trade${pendingCount > 0 ? `（${pendingCount}）` : ""}`}
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
        {runSummary && (
          <TradeRunSummaryPanel summary={runSummary} onClose={() => setRunSummary(null)} />
        )}
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

/** "录Trade"批量操作的结果反馈面板：分别列出成功、本地校验失败、接口调用失败的记录 */
function TradeRunSummaryPanel({
  summary,
  onClose,
}: {
  summary: TradeRunSummary;
  onClose: () => void;
}) {
  const { successSeqs, validationFailures, apiFailures } = summary;
  const totalFailures = validationFailures.length + apiFailures.length;

  return (
    <div
      style={{
        marginTop: 8,
        border: "1px solid #e1e4e8",
        borderRadius: 6,
        padding: "10px 12px",
        fontSize: 13,
        background: "#fafbfc",
        maxHeight: 180,
        overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong style={{ fontSize: 13 }}>
          录Trade 结果：
          <span style={{ color: "#0a7a3d" }}> 成功 {successSeqs.length} 条</span>
          {totalFailures > 0 && <span style={{ color: "#c0362c" }}>，失败 {totalFailures} 条</span>}
        </strong>
        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "#666",
            fontSize: 12,
          }}
        >
          关闭 ✕
        </button>
      </div>

      {validationFailures.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ color: "#c0362c", fontWeight: 600 }}>
            本地校验未通过（未发起请求，请补全后重新勾选）：
          </div>
          <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
            {validationFailures.map((f) => (
              <li key={f.seq}>
                序号 {f.seq}（{f.offerNo || "无Offer编号"}）缺少：{f.missingFields.join("、")}
              </li>
            ))}
          </ul>
        </div>
      )}

      {apiFailures.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ color: "#c0362c", fontWeight: 600 }}>BPMS 接口返回失败：</div>
          <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
            {apiFailures.map((f) => (
              <li key={f.seq}>
                序号 {f.seq}（{f.offerNo || "无Offer编号"}）：{f.errorMessage}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
