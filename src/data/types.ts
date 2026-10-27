// 主表与预算子表的行数据结构定义

/** Trade 状态：系统维护字段，不可由用户手动编辑，仅通过"录Trade"操作变更 */
export type TradeStatus = "未录入" | "已录入";

/** 发起请款状态：系统维护字段，标记该采购订单是否已经生成过请款单，避免重复发起 */
export type PaymentRequestInitiationStatus = "未发起" | "已发起";

/** 合作附件生成状态：系统维护字段，标记该订单是否已经生成过合作附件（协议） */
export type AgreementStatus = "未生成" | "已生成";

export interface MainRow {
  /** Trade状态：系统自动维护，用户不可编辑 */
  tradeStatus: TradeStatus;
  /** 发起请款状态：系统自动维护，用户不可编辑 */
  paymentRequestStatus: PaymentRequestInitiationStatus;
  /** 合作附件生成状态：系统自动维护，用户不可编辑 */
  agreementStatus: AgreementStatus;
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
  /** 合作附件链接：系统生成，点击跳转查看具体的合作协议文件 */
  agreementLink: string;
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

/**
 * 请款单状态：对应 BPMS 截图里的"订单状态"流转条，系统维护，用户不可编辑。
 * 草稿 → 审批中(报价) → 审批通过(报价) → 审批中(请款) → 审批通过(请款)，任一审批环节都可能被驳回。
 */
export type PaymentRequestStatus =
  | "草稿"
  | "审批中(报价)"
  | "审批通过(报价)"
  | "审批中(请款)"
  | "审批通过(请款)"
  | "已驳回";

/**
 * 请款单（请款 Tracker 的行数据）。
 * 字段来源：BPMS 采购订单详情页的"账期信息"模块（付款方式=请款 时展示的内容），
 * 以及"易快报请款详情"模块（财务系统同步回来的只读金额，用于展示申请/已付进度）。
 * 通过 orderSeq / offerNo 关联到采购订单 Tracker 里的具体订单。
 */
export interface PaymentRequestRow {
  /** 请款单状态：系统自动维护，用户不可编辑 */
  status: PaymentRequestStatus;
  /** 关联的采购订单序号（对应 MainRow.seq） */
  orderSeq: number;
  /** 关联的达人营销Offer编号（对应 MainRow.offerNo，便于直接查看） */
  offerNo: string;
  /** 手续费承担方 */
  feeBearer: string;
  /** 付款周期 */
  paymentCycle: string;
  /** 付款方式：请款单场景下通常固定为"请款" */
  paymentMethod: string;
  /** 我方签约主体 */
  contractEntity: string;
  /** 币种 */
  currency: string;
  /** 收款主体名称 */
  payeeEntityName: string;
  /** 收款账户：银行账号/第三方支付账号等 */
  payeeAccount: string;
  /** 期望付款时间 YYYY/MM/DD */
  expectedPaymentDate: string;
  /** 财务已付款金额：易快报同步，只读 */
  paidAmount: number | null;
  /** 累计已申请付款金额：易快报同步，只读 */
  cumulativeRequestedAmount: number | null;
  /** 申请中的金额：易快报同步，只读 */
  pendingRequestAmount: number | null;
  /** 剩余可申请付款金额：易快报同步，只读 */
  remainingRequestableAmount: number | null;
  /** 备注 */
  remark: string;
}
