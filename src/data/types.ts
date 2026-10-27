// 主表与预算子表的行数据结构定义

/** Trade 状态：系统维护字段，不可由用户手动编辑，仅通过"录Trade"操作变更 */
export type TradeStatus = "未录入" | "已录入";

export interface MainRow {
  /** Trade状态：系统自动维护，用户不可编辑 */
  tradeStatus: TradeStatus;
  /** 导入序号（不可删除）：只读，关联键 */
  seq: number;
  /** TO：填写 TO 的用户名（账号） */
  to: string;
  /** 工作室：仅团队名 */
  studio: string;
  /** 达人营销Offer编号 */
  offerNo: string;
  /** 交付实习生：邮箱 */
  internEmail: string;
  /** 成本类型：投流成本/达人成本/其他成本，驱动大量字段的必填/置空 */
  costType: string;
  /** 达人编号：仅达人成本时必填 */
  influencerNo: string;
  /** 供应商编号：达人成本时由达人编号带出，其他成本时必填 */
  vendorNo: string;
  /** 外部报价（含税原币） */
  externalQuoteAmount: number | null;
  /** 外部报价币种 */
  externalQuoteCurrency: string;
  /** 下单日期 YYYY/MM/DD */
  orderDate: string;
  /** 预计交付日期 YYYY/MM/DD */
  expectedDeliveryDate: string;
  /** 实际交付日期 YYYY/MM/DD */
  actualDeliveryDate: string;
  /** 交付作品链接：多行 */
  deliveryLinks: string;
  /** 手续费承担方 */
  feeBearer: string;
  /** 付款周期 */
  paymentCycle: string;
  /** 首付比例：仅付款周期=进度款时必填 */
  downPaymentRatio: number | null;
  /** 付款方式 */
  paymentMethod: string;
  /** 我方签约主体 */
  contractEntity: string;
  /** 增值税发票类型 */
  invoiceType: string;
  /** 税率 */
  taxRate: number | null;
  /** 币种 */
  currency: string;
  /** 收款主体编号 */
  payeeEntityNo: string;
  /** 期望付款时间 YYYY/MM/DD */
  expectedPaymentDate: string;
  /** 合作信息附件类型 */
  attachmentType: string;
  /** 供应商合同编号：多个用逗号分隔 */
  vendorContractNo: string;
  /** 内容形式 */
  contentForm: string;
  /** 授权时长(月) */
  authDuration: string;
  /** 采购内容：多选，逗号分隔 */
  purchaseContent: string[];
  /** 其他要求 */
  otherRequirements: string;
  /** KPI内容 */
  kpiContent: string;
  /** 备注 */
  remark: string;
}

export interface BudgetRow {
  /** 导入序号（不可删除）：关联主表 seq，同一订单多行同序号 */
  seq: number;
  /** offer预算项：必须存在于主表 offer 中 */
  budgetItem: string;
  /** 单价(账期币种)：必填，默认 0.00 */
  unitPrice: number;
  /** 数量 */
  quantity: number;
  /** 备注 */
  remark: string;
}
