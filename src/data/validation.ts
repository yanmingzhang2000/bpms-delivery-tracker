import type { MainRow } from "./types";

/**
 * 主表字段的必填规则。
 *
 * 分两类：
 * - base: 永远必填（对应字段清单里的固定 *），不随其他字段变化
 * - conditional: 条件必填，是否必填取决于同一行里其他字段的取值
 *   （复刻表格说明里"成本类型/付款方式/付款周期"驱动的必填规则）
 *
 * required(row) 返回 true 表示该字段"当前这一行"必填。
 */
interface FieldRule {
  field: keyof MainRow;
  label: string;
  required: (row: MainRow) => boolean;
  /** 判断该字段是否为空（不同类型的空值定义不同：''/null/[]） */
  isEmpty: (row: MainRow) => boolean;
}

const isBlank = (v: string | null | undefined) => v == null || v.trim() === "";
const isNil = (v: number | null | undefined) => v == null;
const isEmptyArray = (v: string[] | null | undefined) => !v || v.length === 0;

export const mainFieldRules: FieldRule[] = [
  // ---- 基础必填（固定 *） ----
  { field: "to", label: "TO", required: () => true, isEmpty: (r) => isBlank(r.to) },
  { field: "studio", label: "工作室", required: () => true, isEmpty: (r) => isBlank(r.studio) },
  {
    field: "offerNo",
    label: "达人营销Offer编号",
    required: () => true,
    isEmpty: (r) => isBlank(r.offerNo),
  },
  {
    field: "costType",
    label: "成本类型",
    required: () => true,
    isEmpty: (r) => isBlank(r.costType),
  },
  {
    field: "externalQuoteAmount",
    label: "外部报价（含税原币）",
    required: () => true,
    isEmpty: (r) => isNil(r.externalQuoteAmount),
  },
  {
    field: "externalQuoteCurrency",
    label: "外部报价币种",
    required: () => true,
    isEmpty: (r) => isBlank(r.externalQuoteCurrency),
  },
  {
    field: "orderDate",
    label: "下单日期",
    required: () => true,
    isEmpty: (r) => isBlank(r.orderDate),
  },
  {
    field: "expectedDeliveryDate",
    label: "预计交付日期",
    required: () => true,
    isEmpty: (r) => isBlank(r.expectedDeliveryDate),
  },
  { field: "currency", label: "币种", required: () => true, isEmpty: (r) => isBlank(r.currency) },

  // ---- 条件必填（随成本类型/付款方式/付款周期联动） ----
  {
    field: "influencerNo",
    label: "达人编号",
    required: (r) => r.costType === "达人成本",
    isEmpty: (r) => isBlank(r.influencerNo),
  },
  {
    field: "vendorNo",
    label: "供应商编号",
    required: (r) => r.costType === "其他成本",
    isEmpty: (r) => isBlank(r.vendorNo),
  },
  {
    field: "feeBearer",
    label: "手续费",
    required: (r) => r.costType === "达人成本" || r.costType === "其他成本",
    isEmpty: (r) => isBlank(r.feeBearer),
  },
  {
    field: "paymentCycle",
    label: "付款周期",
    required: (r) => r.costType === "达人成本" || r.costType === "其他成本",
    isEmpty: (r) => isBlank(r.paymentCycle),
  },
  {
    field: "downPaymentRatio",
    label: "首付比例",
    required: (r) => r.paymentCycle === "进度款",
    isEmpty: (r) => isNil(r.downPaymentRatio),
  },
  {
    field: "paymentMethod",
    label: "付款方式",
    required: (r) => r.costType === "达人成本" || r.costType === "其他成本",
    isEmpty: (r) => isBlank(r.paymentMethod),
  },
  {
    field: "payeeEntityNo",
    label: "收款主体编号",
    required: (r) => r.costType === "达人成本" || r.costType === "其他成本",
    isEmpty: (r) => isBlank(r.payeeEntityNo),
  },
  {
    field: "expectedPaymentDate",
    label: "期望付款时间",
    required: (r) => r.costType === "达人成本" || r.costType === "其他成本",
    isEmpty: (r) => isBlank(r.expectedPaymentDate),
  },
  {
    field: "attachmentType",
    label: "合作信息附件类型",
    required: (r) => r.costType === "达人成本" || r.costType === "其他成本",
    isEmpty: (r) => isBlank(r.attachmentType),
  },
  {
    field: "contentForm",
    label: "内容形式",
    required: (r) => r.costType === "达人成本" || r.costType === "其他成本",
    isEmpty: (r) => isBlank(r.contentForm),
  },
  {
    field: "authDuration",
    label: "授权时长(月)",
    required: (r) => r.costType === "达人成本" || r.costType === "其他成本",
    isEmpty: (r) => isBlank(r.authDuration),
  },
  {
    field: "purchaseContent",
    label: "采购内容",
    required: (r) => r.costType === "达人成本" || r.costType === "其他成本",
    isEmpty: (r) => isEmptyArray(r.purchaseContent),
  },
];

const ruleByField = new Map(mainFieldRules.map((rule) => [rule.field, rule]));

/** 判断某一行某个字段当前是否"必填但为空"，供表格实时标红使用 */
export function isFieldMissing(row: MainRow, field: keyof MainRow): boolean {
  const rule = ruleByField.get(field);
  if (!rule) return false;
  return rule.required(row) && rule.isEmpty(row);
}

/** 校验整行，返回所有"必填但为空"的字段标签（用于录Trade前的拦截提示） */
export function getMissingFieldLabels(row: MainRow): string[] {
  return mainFieldRules
    .filter((rule) => rule.required(row) && rule.isEmpty(row))
    .map((rule) => rule.label);
}

/** 整行是否通过必填校验 */
export function isRowValid(row: MainRow): boolean {
  return getMissingFieldLabels(row).length === 0;
}
