import type { MainRow, PaymentRequestRow } from "./types";

/**
 * 从采购订单（MainRow）构造一张新的请款单（PaymentRequestRow）。
 *
 * 带出规则：订单上已经有的"账期信息"字段（手续费/付款周期/我方签约主体/币种/期望付款时间）
 * 直接复制过去；请款单特有、订单上没有的字段（收款主体名称、收款账户）留空，
 * 需要用户在请款 Tracker 里手动补填；易快报同步的 4 个金额字段作为新请款单默认是 0
 * （尚未发生任何实际付款/申请）；初始状态为"草稿"，表示刚生成、还没提交审批。
 */
export function buildPaymentRequestFromOrder(order: MainRow): PaymentRequestRow {
  return {
    status: "草稿",
    orderSeq: order.seq,
    offerNo: order.offerNo,
    feeBearer: order.feeBearer,
    paymentCycle: order.paymentCycle,
    paymentMethod: order.paymentMethod,
    contractEntity: order.contractEntity,
    currency: order.currency,
    payeeEntityName: "",
    payeeAccount: "",
    expectedPaymentDate: order.expectedPaymentDate,
    paidAmount: 0,
    cumulativeRequestedAmount: 0,
    pendingRequestAmount: 0,
    remainingRequestableAmount: order.externalQuoteAmount ?? 0,
    remark: "",
  };
}

/** 只有付款方式为"请款"的订单才允许发起请款 */
export function canInitiatePaymentRequest(order: MainRow): boolean {
  return order.paymentMethod === "请款";
}
