import PaymentRequestGrid from "../grid/PaymentRequestGrid";
import type { PaymentRequestRow } from "../data/types";
import type { DraftState } from "../hooks/useDraftState";
import SaveBar from "../components/SaveBar";

interface PaymentRequestTrackerPageProps {
  paymentRequestState: DraftState<PaymentRequestRow[]>;
  /** 需要高亮的订单序号（比如刚从采购订单页"发起请款"生成的那几条） */
  highlightOrderSeqs?: ReadonlySet<number>;
}

export default function PaymentRequestTrackerPage({
  paymentRequestState,
  highlightOrderSeqs,
}: PaymentRequestTrackerPageProps) {
  const { draft: rows, setDraft, isDirty, save, discard } = paymentRequestState;

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
        每一行是一张请款单，通过"关联采购订单序号"关联到采购订单 Tracker 里的具体订单，
        可以在采购订单 Tracker 页面勾选订单并点击"发起请款"自动生成。
        字段来自 BPMS 采购订单详情页"账期信息"模块（付款方式=请款时的展示内容）。
        请款单状态为系统字段（草稿 → 审批中(报价) → 审批通过(报价) → 审批中(请款) → 审批通过(请款)，任一环节可能被驳回），不可手动编辑；
        财务已付款金额等 4 个金额字段来自易快报同步，仅只读展示。
        点击任意格子即可编辑，选中格子右下角可拖拽填充；改动会先暂存，点击"保存"才会正式生效。
      </p>

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
            {highlightOrderSeqs && highlightOrderSeqs.size > 0 && (
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
