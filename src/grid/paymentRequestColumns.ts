import { type GridColumn } from "@glideapps/glide-data-grid";

// 请款 Tracker 列定义。
// status 为系统维护字段；orderSeq/offerNo 用于关联采购订单；
// 其余字段来自 BPMS 采购订单详情页"账期信息"模块（付款方式=请款时的展示内容）；
// paidAmount ~ remainingRequestableAmount 对应"易快报请款详情"模块，均为财务系统同步的只读金额。
export const paymentRequestColumns: (GridColumn & { id: string })[] = [
  { id: "status", title: "请款单状态", width: 140 },
  { id: "orderSeq", title: "关联采购订单序号*", width: 140 },
  { id: "offerNo", title: "达人营销Offer编号", width: 180 },
  { id: "feeBearer", title: "手续费", width: 160 },
  { id: "paymentCycle", title: "付款周期", width: 110 },
  { id: "paymentMethod", title: "付款方式", width: 140 },
  { id: "contractEntity", title: "我方签约主体", width: 220 },
  { id: "currency", title: "币种", width: 110 },
  { id: "payeeEntityName", title: "收款主体名称", width: 150 },
  { id: "payeeAccount", title: "收款账户", width: 220 },
  { id: "expectedPaymentDate", title: "期望付款时间", width: 130 },
  { id: "paidAmount", title: "财务已付款金额", width: 140 },
  { id: "cumulativeRequestedAmount", title: "累计已申请付款金额", width: 160 },
  { id: "pendingRequestAmount", title: "申请中的金额", width: 130 },
  { id: "remainingRequestableAmount", title: "剩余可申请付款金额", width: 160 },
  { id: "remark", title: "备注", width: 200 },
];

export const PAYMENT_REQUEST_FROZEN_COLUMNS = 3; // 冻结 请款单状态 + 关联订单序号 + Offer编号
