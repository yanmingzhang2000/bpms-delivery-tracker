// 各字段的枚举可选值集中管理，方便后续维护和对接真实接口时替换

/** 币种可选范围（外部报价币种 / 币种 两个字段共用） */
export const CURRENCY_OPTIONS = [
  "人民币",
  "港币",
  "美金",
  "日元",
  "欧元",
  "英镑",
  "马来西亚林吉特(MYR)",
  "印度尼西亚卢比(IDR)",
  "泰铢",
  "菲律宾比索",
  "俄罗斯卢布",
  "沙特里亚尔",
  "新加坡元",
  "墨西哥比索",
  "巴西币",
  "越南盾",
] as const;

/** 成本类型：驱动一大批字段的必填/置空逻辑 */
export const COST_TYPE_OPTIONS = ["投流成本", "达人成本", "其他成本"] as const;

/** 手续费承担方 */
export const FEE_BEARER_OPTIONS = [
  "钛动承担双方手续费",
  "供应商承担双方手续费",
  "双方各自承担",
] as const;

/** 付款周期 */
export const PAYMENT_CYCLE_OPTIONS = ["全额预付", "进度款", "全款后付"] as const;

/** 付款方式 */
export const PAYMENT_METHOD_OPTIONS = ["请款", "境内个人平台支付"] as const;

/** 我方签约主体 */
export const CONTRACT_ENTITY_OPTIONS = [
  "广州跃播科技有限公司",
  "TECLAND TECHNOLOGY (THAILAND)CO.,LTD.",
  "钛动科技股份有限公司",
  "TecDo Hong Kong Limited",
  "TECDO NETWORK(M) SDN. BHD.",
  "PT SETSAIL TECHNOLOGY INDONESIA",
  "TEC-AD LIMITED",
  "Whatech Mobile CO., Limited",
  "DATECH MEDIA DC LTD",
  "LIVELAB MEDIA MX, S. DE R.L. DE C.V.",
  "广州市沃钛移动科技有限公司",
  "INTERNETIX ADS LTDA",
  "江苏钛动科技有限公司",
] as const;

/** 增值税发票类型 */
export const INVOICE_TYPE_OPTIONS = ["专票", "普票", "无票"] as const;

/** 合作信息附件类型 */
export const ATTACHMENT_TYPE_OPTIONS = ["供应商合同"] as const;

/** 内容形式 */
export const CONTENT_FORM_OPTIONS = ["图文", "视频"] as const;

/** 授权时长(月) */
export const AUTH_DURATION_OPTIONS = ["0", "1个月", "3个月", "6个月"] as const;

/** 采购内容（多选） */
export const PURCHASE_CONTENT_OPTIONS = [
  "视频贴",
  "完播",
  "植入",
  "直播",
  "插片",
  "口播",
  "post",
  "story",
  "reel",
  "其他",
] as const;

/** 我方签约主体 -> 固定币种 的联动规则 */
export const ENTITY_FIXED_CURRENCY: Record<string, string> = {
  江苏钛动科技有限公司: "人民币",
  钛动科技股份有限公司: "人民币",
  "TECDO NETWORK(M) SDN. BHD.": "马来西亚林吉特(MYR)",
  "PT SETSAIL TECHNOLOGY INDONESIA": "印度尼西亚卢比(IDR)",
};

/** offer预算项可选值（示例，真实场景应来自主表"成本类型"等配置） */
export const BUDGET_ITEM_OPTIONS = ["达人成本", "投流成本", "其他成本"] as const;

/** 请款单状态可选值（系统维护，仅用于只读展示/下拉筛选，不支持用户手动改） */
export const PAYMENT_REQUEST_STATUS_OPTIONS = [
  "草稿",
  "审批中(报价)",
  "审批通过(报价)",
  "审批中(请款)",
  "审批通过(请款)",
  "已驳回",
] as const;
