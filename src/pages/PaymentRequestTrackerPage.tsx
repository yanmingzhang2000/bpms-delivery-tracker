import { useState } from "react";
import PaymentRequestGrid from "../grid/PaymentRequestGrid";
import { initialPaymentRequestRows } from "../data/sampleData";
import type { PaymentRequestRow } from "../data/types";

export default function PaymentRequestTrackerPage() {
  const [rows, setRows] = useState<PaymentRequestRow[]>(initialPaymentRequestRows);

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
      </p>

      <section style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
          请款单列表（共 {rows.length} 条）
        </div>
        <div style={{ flex: 1, minHeight: 0, border: "1px solid #e1e4e8", borderRadius: 6 }}>
          <PaymentRequestGrid rows={rows} onRowsChange={setRows} />
        </div>
      </section>
    </div>
  );
}
