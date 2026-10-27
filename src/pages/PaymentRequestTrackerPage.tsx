import { useCallback, useMemo, useState } from "react";
import PaymentRequestGrid from "../grid/PaymentRequestGrid";
import type { MainRow, PaymentRequestRow } from "../data/types";
import type { DraftState } from "../hooks/useDraftState";
import SaveBar from "../components/SaveBar";
import { buildPaymentRequestFromOrder, canInitiatePaymentRequest } from "../data/paymentRequestBuilder";
import { getMissingFieldLabels } from "../data/validation";

/** 一次"发起请款"批量操作的结果汇总 */
interface PaymentRequestRunSummary {
  successSeqs: number[];
  /** 付款方式不是"请款"，不允许发起 */
  wrongPaymentMethod: { seq: number; offerNo: string; paymentMethod: string }[];
  /** 合作附件尚未生成，按业务流程（Trade→合同→请款）必须先生成合同才能发起请款 */
  agreementNotReady: { seq: number; offerNo: string }[];
  /** 本地必填校验未通过 */
  validationFailures: { seq: number; offerNo: string; missingFields: string[] }[];
}

interface PaymentRequestTrackerPageProps {
  mainState: DraftState<MainRow[]>;
  paymentRequestState: DraftState<PaymentRequestRow[]>;
}

export default function PaymentRequestTrackerPage({
  mainState,
  paymentRequestState,
}: PaymentRequestTrackerPageProps) {
  const { draft: rows, setDraft, isDirty, save, discard } = paymentRequestState;
  const mainRows = mainState.draft;

  // 勾选的采购订单行下标
  const [checkedOrderIndexes, setCheckedOrderIndexes] = useState<ReadonlySet<number>>(new Set());
  const [isInitiating, setIsInitiating] = useState(false);
  const [runSummary, setRunSummary] = useState<PaymentRequestRunSummary | null>(null);
  // 刚发起请款成功的订单序号，用于高亮请款单列表里对应的行
  const [highlightOrderSeqs, setHighlightOrderSeqs] = useState<ReadonlySet<number>>(new Set());

  // 勾选中有多少行处于"未发起"状态
  const pendingPaymentCount = useMemo(
    () =>
      Array.from(checkedOrderIndexes).filter(
        (idx) => mainRows[idx]?.paymentRequestStatus === "未发起"
      ).length,
    [checkedOrderIndexes, mainRows]
  );

  const handleInitiatePaymentRequest = useCallback(() => {
    if (pendingPaymentCount === 0 || isInitiating) return;

    const targetIndexes = Array.from(checkedOrderIndexes).filter(
      (idx) => mainRows[idx]?.paymentRequestStatus === "未发起"
    );

    setIsInitiating(true);

    const successSeqs: number[] = [];
    const wrongPaymentMethod: PaymentRequestRunSummary["wrongPaymentMethod"] = [];
    const agreementNotReady: PaymentRequestRunSummary["agreementNotReady"] = [];
    const validationFailures: PaymentRequestRunSummary["validationFailures"] = [];
    const newPaymentRequests: PaymentRequestRow[] = [];

    for (const idx of targetIndexes) {
      const row = mainRows[idx];
      if (!canInitiatePaymentRequest(row)) {
        if (row.paymentMethod !== "请款") {
          wrongPaymentMethod.push({
            seq: row.seq,
            offerNo: row.offerNo,
            paymentMethod: row.paymentMethod || "（未填写）",
          });
        } else {
          agreementNotReady.push({ seq: row.seq, offerNo: row.offerNo });
        }
        continue;
      }
      const missingFields = getMissingFieldLabels(row);
      if (missingFields.length > 0) {
        validationFailures.push({ seq: row.seq, offerNo: row.offerNo, missingFields });
        continue;
      }
      newPaymentRequests.push(buildPaymentRequestFromOrder(row));
      successSeqs.push(row.seq);
    }

    if (newPaymentRequests.length > 0) {
      paymentRequestState.commitDirectly((current) => [...current, ...newPaymentRequests]);
      const successSet = new Set(successSeqs);
      mainState.commitDirectly((current) =>
        current.map((row) =>
          successSet.has(row.seq) ? { ...row, paymentRequestStatus: "已发起" as const } : row
        )
      );
      setHighlightOrderSeqs(successSet);
    }

    setRunSummary({ successSeqs, wrongPaymentMethod, agreementNotReady, validationFailures });
    setIsInitiating(false);
    setCheckedOrderIndexes(new Set());
  }, [
    mainRows,
    checkedOrderIndexes,
    pendingPaymentCount,
    isInitiating,
    mainState,
    paymentRequestState,
  ]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        gap: "12px",
      }}
    >
      <p style={{ margin: 0, color: "#666", fontSize: 13 }}>
        每一行是一张请款单，通过"关联采购订单序号"关联到采购订单 Tracker 里的具体订单。
        字段来自 BPMS 采购订单详情页"账期信息"模块（付款方式=请款时的展示内容）。
        请款单状态为系统字段（草稿 → 审批中(报价) → 审批通过(报价) → 审批中(请款) → 审批通过(请款)，任一环节可能被驳回），不可手动编辑；
        财务已付款金额等 4 个金额字段来自易快报同步，仅只读展示。
        点击任意格子即可编辑，选中格子右下角可拖拽填充；改动会先暂存，点击"保存"才会正式生效。
      </p>

      {/* 发起请款：勾选采购订单后批量生成请款单 */}
      <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            采购订单（勾选后发起请款）
            {checkedOrderIndexes.size > 0 && (
              <span style={{ fontWeight: 400, color: "#666" }}>
                {" "}
                —— 已勾选 {checkedOrderIndexes.size} 行，{pendingPaymentCount} 行可发起请款
              </span>
            )}
          </div>
          <button
            onClick={handleInitiatePaymentRequest}
            disabled={pendingPaymentCount === 0 || isInitiating}
            style={{
              border: "1px solid #7a4fd1",
              background: pendingPaymentCount === 0 || isInitiating ? "#f0f1f3" : "#7a4fd1",
              color: pendingPaymentCount === 0 || isInitiating ? "#9aa1ac" : "#fff",
              borderRadius: 4,
              padding: "6px 14px",
              fontSize: 13,
              cursor: pendingPaymentCount === 0 || isInitiating ? "not-allowed" : "pointer",
            }}
            title={
              pendingPaymentCount === 0
                ? "请先勾选至少一条未发起请款、且付款方式为「请款」的记录"
                : `为 ${pendingPaymentCount} 条记录发起请款`
            }
          >
            {isInitiating
              ? "发起中…"
              : `发起请款${pendingPaymentCount > 0 ? `（${pendingPaymentCount}）` : ""}`}
          </button>
        </div>
        <div style={{ height: 220, border: "1px solid #e1e4e8", borderRadius: 6 }}>
          <OrderPickerGrid
            rows={mainRows}
            checkedRows={checkedOrderIndexes}
            onCheckedRowsChange={setCheckedOrderIndexes}
          />
        </div>
        {runSummary && (
          <PaymentRequestRunSummaryPanel
            summary={runSummary}
            onClose={() => setRunSummary(null)}
          />
        )}
      </section>

      {/* 请款单列表 */}
      <section style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            请款单列表（共 {rows.length} 条）
            {highlightOrderSeqs.size > 0 && (
              <span style={{ fontWeight: 400, color: "#7a4fd1" }}>
                {" "}
                —— 已高亮刚生成的 {highlightOrderSeqs.size} 条
              </span>
            )}
          </div>
          <SaveBar isDirty={isDirty} onSave={save} onDiscard={discard} />
        </div>
        <div style={{ flex: 1, minHeight: 0, border: "1px solid #e1e4e8", borderRadius: 6 }}>
          <PaymentRequestGrid
            rows={rows}
            onRowsChange={setDraft}
            highlightOrderSeqs={highlightOrderSeqs}
          />
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 采购订单选择表格（轻量版，只展示关键列，支持勾选）
// ---------------------------------------------------------------------------
import {
  CompactSelection,
  DataEditor,
  GridCellKind,
  type GridCell,
  type GridColumn,
  type GridSelection,
  type Item,
} from "@glideapps/glide-data-grid";
import { useEffect } from "react";
import { textCell, readonlySeqCell } from "../grid/cellHelpers";

const ORDER_PICKER_COLUMNS: (GridColumn & { id: string })[] = [
  { id: "seq",                   title: "序号",         width: 70  },
  { id: "offerNo",               title: "Offer编号",    width: 180 },
  { id: "costType",              title: "成本类型",     width: 110 },
  { id: "paymentMethod",         title: "付款方式",     width: 140 },
  { id: "tradeStatus",           title: "Trade状态",    width: 110 },
  { id: "agreementStatus",       title: "合作附件状态", width: 120 },
  { id: "paymentRequestStatus",  title: "请款状态",     width: 110 },
];

function OrderPickerGrid({
  rows,
  checkedRows,
  onCheckedRowsChange,
}: {
  rows: MainRow[];
  checkedRows: ReadonlySet<number>;
  onCheckedRowsChange: (s: ReadonlySet<number>) => void;
}) {
  const [gridSelection, setGridSelection] = useState<GridSelection>({
    columns: CompactSelection.empty(),
    rows: CompactSelection.empty(),
  });

  // 外部 checkedRows 变化时同步 rows 部分
  useEffect(() => {
    let rowSel = CompactSelection.empty();
    for (const idx of checkedRows) rowSel = rowSel.add(idx);
    setGridSelection((prev) => ({ ...prev, rows: rowSel }));
  }, [checkedRows]);

  const onGridSelectionChange = useCallback(
    (newSel: GridSelection) => {
      setGridSelection(newSel);
      onCheckedRowsChange(new Set(newSel.rows.toArray()));
    },
    [onCheckedRowsChange]
  );

  const getCellContent = useCallback(
    (item: Item): GridCell => {
      const [col, row] = item;
      const record = rows[row];
      if (!record) return { kind: GridCellKind.Text, data: "", displayData: "", allowOverlay: false };
      const colId = ORDER_PICKER_COLUMNS[col].id;
      switch (colId) {
        case "seq":                  return readonlySeqCell(record.seq);
        case "offerNo":              return textCell(record.offerNo, true);
        case "costType":             return textCell(record.costType, true);
        case "paymentMethod":        return textCell(record.paymentMethod, true);
        case "tradeStatus":          return textCell(record.tradeStatus, true);
        case "agreementStatus":      return textCell(record.agreementStatus, true);
        case "paymentRequestStatus": return textCell(record.paymentRequestStatus, true);
        default:                     return textCell("", true);
      }
    },
    [rows]
  );

  return (
    <DataEditor
      columns={ORDER_PICKER_COLUMNS}
      rows={rows.length}
      getCellContent={getCellContent}
      rowMarkers="both"
      gridSelection={gridSelection}
      onGridSelectionChange={onGridSelectionChange}
      freezeColumns={2}
      smoothScrollX
      smoothScrollY
      width="100%"
      height="100%"
      rowHeight={34}
      cellActivationBehavior="second-click"
    />
  );
}

// ---------------------------------------------------------------------------
// 发起请款结果面板
// ---------------------------------------------------------------------------
function PaymentRequestRunSummaryPanel({
  summary,
  onClose,
}: {
  summary: PaymentRequestRunSummary;
  onClose: () => void;
}) {
  const { successSeqs, wrongPaymentMethod, agreementNotReady, validationFailures } = summary;
  const totalSkipped = wrongPaymentMethod.length + agreementNotReady.length + validationFailures.length;

  return (
    <div
      style={{
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
          发起请款 结果：
          <span style={{ color: "#0a7a3d" }}> 成功生成 {successSeqs.length} 张请款单</span>
          {totalSkipped > 0 && <span style={{ color: "#c0362c" }}>，跳过 {totalSkipped} 条</span>}
        </strong>
        <button
          onClick={onClose}
          style={{ border: "none", background: "transparent", cursor: "pointer", color: "#666", fontSize: 12 }}
        >
          关闭 ✕
        </button>
      </div>

      {wrongPaymentMethod.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ color: "#c0362c", fontWeight: 600 }}>付款方式非"请款"，不需要发起请款：</div>
          <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
            {wrongPaymentMethod.map((f) => (
              <li key={f.seq}>序号 {f.seq}（{f.offerNo || "无Offer编号"}）：当前付款方式为"{f.paymentMethod}"</li>
            ))}
          </ul>
        </div>
      )}

      {agreementNotReady.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ color: "#c0362c", fontWeight: 600 }}>合作附件（合同）尚未生成，请先生成合作附件再发起请款：</div>
          <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
            {agreementNotReady.map((f) => (
              <li key={f.seq}>序号 {f.seq}（{f.offerNo || "无Offer编号"}）</li>
            ))}
          </ul>
        </div>
      )}

      {validationFailures.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ color: "#c0362c", fontWeight: 600 }}>本地校验未通过（未生成请款单，请补全后重新勾选）：</div>
          <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
            {validationFailures.map((f) => (
              <li key={f.seq}>序号 {f.seq}（{f.offerNo || "无Offer编号"}）缺少：{f.missingFields.join("、")}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
