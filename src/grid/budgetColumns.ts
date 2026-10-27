import { type GridColumn } from "@glideapps/glide-data-grid";

// 预算子表 5 个字段对应的列定义
export const budgetColumns: (GridColumn & { id: string })[] = [
  { id: "seq", title: "导入序号（不可删除）*", width: 150 },
  { id: "budgetItem", title: "offer预算项*", width: 160 },
  { id: "unitPrice", title: "单价(账期币种)*", width: 150 },
  { id: "quantity", title: "数量*", width: 100 },
  { id: "remark", title: "备注", width: 260 },
];

export const BUDGET_FROZEN_COLUMNS = 1; // 冻结序号列
