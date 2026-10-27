import { type GridColumn } from "@glideapps/glide-data-grid";

// 主表 31 个字段对应的列定义。
// id 必须与 MainRow 的 key 一一对应，供 getCellContent / onCellEdited 使用。
export const mainColumns: (GridColumn & { id: string })[] = [
  { id: "tradeStatus", title: "Trade状态", width: 100 },
  { id: "seq", title: "导入序号（不可删除）*", width: 90 },
  { id: "to", title: "TO*", width: 110 },
  { id: "studio", title: "工作室*", width: 110 },
  { id: "offerNo", title: "达人营销Offer编号*", width: 180 },
  { id: "internEmail", title: "交付实习生", width: 170 },
  { id: "costType", title: "成本类型*", width: 110 },
  { id: "influencerNo", title: "达人编号", width: 160 },
  { id: "vendorNo", title: "供应商编号", width: 150 },
  { id: "externalQuoteAmount", title: "外部报价（含税原币）*", width: 160 },
  { id: "externalQuoteCurrency", title: "外部报价币种*", width: 130 },
  { id: "orderDate", title: "下单日期*", width: 120 },
  { id: "expectedDeliveryDate", title: "预计交付日期*", width: 130 },
  { id: "actualDeliveryDate", title: "实际交付日期", width: 130 },
  { id: "deliveryLinks", title: "交付作品链接", width: 240 },
  { id: "feeBearer", title: "手续费", width: 160 },
  { id: "paymentCycle", title: "付款周期", width: 110 },
  { id: "downPaymentRatio", title: "首付比例", width: 100 },
  { id: "paymentMethod", title: "付款方式", width: 140 },
  { id: "contractEntity", title: "我方签约主体", width: 220 },
  { id: "invoiceType", title: "增值税发票类型", width: 130 },
  { id: "taxRate", title: "税率", width: 90 },
  { id: "currency", title: "币种*", width: 130 },
  { id: "payeeEntityNo", title: "收款主体编号", width: 150 },
  { id: "expectedPaymentDate", title: "期望付款时间", width: 130 },
  { id: "attachmentType", title: "合作信息附件类型", width: 150 },
  { id: "vendorContractNo", title: "供应商合同编号", width: 180 },
  { id: "contentForm", title: "内容形式", width: 100 },
  { id: "authDuration", title: "授权时长(月)", width: 120 },
  { id: "purchaseContent", title: "采购内容", width: 200 },
  { id: "otherRequirements", title: "其他要求", width: 200 },
  { id: "kpiContent", title: "KPI内容", width: 200 },
  { id: "remark", title: "备注", width: 200 },
];

export const MAIN_FROZEN_COLUMNS = 3; // 冻结 Trade状态 + 序号 + TO 三列
