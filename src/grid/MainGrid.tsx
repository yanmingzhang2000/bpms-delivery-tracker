import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CompactSelection,
  DataEditor,
  GridCellKind,
  type EditableGridCell,
  type EditListItem,
  type GridCell,
  type GridColumn,
  type GridSelection,
  type Item,
} from "@glideapps/glide-data-grid";
import { allCells } from "@glideapps/glide-data-grid-cells";
import type { MainRow } from "../data/types";
import { isFieldMissing } from "../data/validation";
import { mainColumns, MAIN_FROZEN_COLUMNS } from "./mainColumns";
import {
  agreementStatusCell,
  dateCell,
  dropdownCell,
  formatSlashDate,
  linkCell,
  longTextCell,
  multiSelectCell,
  numberCell,
  paymentRequestInitiationCell,
  readonlySeqCell,
  textCell,
  tradeStatusCell,
} from "./cellHelpers";
import {
  ATTACHMENT_TYPE_OPTIONS,
  AUTH_DURATION_OPTIONS,
  CONTENT_FORM_OPTIONS,
  CONTRACT_ENTITY_OPTIONS,
  COST_TYPE_OPTIONS,
  CURRENCY_OPTIONS,
  ENTITY_FIXED_CURRENCY,
  FEE_BEARER_OPTIONS,
  INVOICE_TYPE_OPTIONS,
  PAYMENT_CYCLE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  PURCHASE_CONTENT_OPTIONS,
} from "../data/enums";

interface MainGridProps {
  rows: MainRow[];
  onRowsChange: (rows: MainRow[]) => void;
  selectedSeq: number | null;
  onSelectRow: (seq: number) => void;
  /** 当前勾选的行号（rows 数组下标），用于"录Trade"等批量操作 */
  checkedRows: ReadonlySet<number>;
  onCheckedRowsChange: (rows: ReadonlySet<number>) => void;
}

/**
 * 根据"成本类型"自动决定某些字段是否只读/置空，复刻表格说明里的级联规则。
 * 投流成本：达人/供应商/手续费/付款周期/付款方式/收款主体编号/期望付款时间/
 *           合作信息附件类型/内容形式/授权时长/采购内容 全部置空+只读
 * 达人成本：供应商编号只读（由达人编号带出），其余必填字段可编辑
 * 其他成本：达人编号置空+只读，其余必填字段可编辑
 */
function getFieldAvailability(costType: string) {
  const isFlow = costType === "投流成本";
  const isInfluencer = costType === "达人成本";
  return {
    influencerNo: { readonly: !isInfluencer },
    vendorNo: { readonly: isFlow || isInfluencer }, // 达人成本时由达人编号带出，视为只读展示
    feeBearer: { readonly: isFlow },
    paymentCycle: { readonly: isFlow },
    paymentMethod: { readonly: isFlow },
    payeeEntityNo: { readonly: isFlow },
    expectedPaymentDate: { readonly: isFlow },
    attachmentType: { readonly: isFlow },
    contentForm: { readonly: isFlow },
    authDuration: { readonly: isFlow },
    purchaseContent: { readonly: isFlow },
  };
}

export default function MainGrid({
  rows,
  onRowsChange,
  selectedSeq,
  onSelectRow,
  checkedRows,
  onCheckedRowsChange,
}: MainGridProps) {
  const [columns, setColumns] = useState<GridColumn[]>(mainColumns);

  // gridSelection 是受控属性，必须同时管理 current（当前聚焦/编辑中的单元格）、
  // columns、rows 三部分。之前的实现只把 rows（勾选的行）纳入状态，current 永远是
  // undefined，导致双击单元格时 Grid 内部认为"没有单元格可以被激活"，编辑弹层
  // 完全打不开。现在把完整的 GridSelection 存成 state，勾选行时只替换 rows 字段，
  // 其余交互（点击/双击进入编辑）通过 onGridSelectionChange 原样同步 current。
  const [gridSelection, setGridSelection] = useState<GridSelection>({
    columns: CompactSelection.empty(),
    rows: CompactSelection.empty(),
  });

  // 勾选变化（来自 checkedRows 这个 prop）时，只同步 rows 部分，保留当前的 current/columns
  useEffect(() => {
    let rowSelection = CompactSelection.empty();
    for (const rowIndex of checkedRows) {
      rowSelection = rowSelection.add(rowIndex);
    }
    setGridSelection((prev) => ({ ...prev, rows: rowSelection }));
  }, [checkedRows]);

  const onGridSelectionChange = useCallback(
    (newSelection: GridSelection) => {
      setGridSelection(newSelection);
      onCheckedRowsChange(new Set(newSelection.rows.toArray()));
    },
    [onCheckedRowsChange]
  );

  const getCellContent = useCallback(
    (item: Item): GridCell => {
      const [col, row] = item;
      const record = rows[row];
      if (!record) return textCell("");
      const colDef = mainColumns[col];
      const availability = getFieldAvailability(record.costType);

      switch (colDef.id) {
        case "tradeStatus":
          return tradeStatusCell(record.tradeStatus);
        case "paymentRequestStatus":
          return paymentRequestInitiationCell(record.paymentRequestStatus);
        case "agreementStatus":
          return agreementStatusCell(record.agreementStatus);
        case "seq":
          return readonlySeqCell(record.seq);
        case "to":
          return textCell(record.to, false, isFieldMissing(record, "to"));
        case "studio":
          return textCell(record.studio, false, isFieldMissing(record, "studio"));
        case "offerNo":
          return textCell(record.offerNo, false, isFieldMissing(record, "offerNo"));
        case "internEmail":
          return textCell(record.internEmail);
        case "costType":
          return dropdownCell(
            record.costType,
            COST_TYPE_OPTIONS,
            false,
            isFieldMissing(record, "costType")
          );
        case "influencerNo":
          return textCell(
            record.influencerNo,
            availability.influencerNo.readonly,
            isFieldMissing(record, "influencerNo")
          );
        case "vendorNo":
          return textCell(
            record.vendorNo,
            availability.vendorNo.readonly,
            isFieldMissing(record, "vendorNo")
          );
        case "externalQuoteAmount":
          return numberCell(
            record.externalQuoteAmount,
            false,
            isFieldMissing(record, "externalQuoteAmount")
          );
        case "externalQuoteCurrency":
          return dropdownCell(
            record.externalQuoteCurrency,
            CURRENCY_OPTIONS,
            false,
            isFieldMissing(record, "externalQuoteCurrency")
          );
        case "orderDate":
          return dateCell(record.orderDate, false, isFieldMissing(record, "orderDate"));
        case "expectedDeliveryDate":
          return dateCell(
            record.expectedDeliveryDate,
            false,
            isFieldMissing(record, "expectedDeliveryDate")
          );
        case "actualDeliveryDate":
          return dateCell(record.actualDeliveryDate);
        case "deliveryLinks":
          return longTextCell(record.deliveryLinks);
        case "feeBearer":
          return dropdownCell(
            record.feeBearer,
            FEE_BEARER_OPTIONS,
            availability.feeBearer.readonly,
            isFieldMissing(record, "feeBearer")
          );
        case "paymentCycle":
          return dropdownCell(
            record.paymentCycle,
            PAYMENT_CYCLE_OPTIONS,
            availability.paymentCycle.readonly,
            isFieldMissing(record, "paymentCycle")
          );
        case "downPaymentRatio":
          return numberCell(
            record.downPaymentRatio,
            record.paymentCycle !== "进度款",
            isFieldMissing(record, "downPaymentRatio")
          );
        case "paymentMethod":
          return dropdownCell(
            record.paymentMethod,
            PAYMENT_METHOD_OPTIONS,
            availability.paymentMethod.readonly,
            isFieldMissing(record, "paymentMethod")
          );
        case "contractEntity":
          return dropdownCell(
            record.contractEntity,
            CONTRACT_ENTITY_OPTIONS,
            record.paymentMethod === "境内个人平台支付"
          );
        case "invoiceType":
          return dropdownCell(
            record.invoiceType,
            INVOICE_TYPE_OPTIONS,
            record.paymentMethod === "境内个人平台支付"
          );
        case "taxRate":
          return numberCell(record.taxRate, record.invoiceType !== "专票");
        case "currency":
          return dropdownCell(
            record.currency,
            CURRENCY_OPTIONS,
            Boolean(ENTITY_FIXED_CURRENCY[record.contractEntity]),
            isFieldMissing(record, "currency")
          );
        case "payeeEntityNo":
          return textCell(
            record.payeeEntityNo,
            availability.payeeEntityNo.readonly,
            isFieldMissing(record, "payeeEntityNo")
          );
        case "expectedPaymentDate":
          return dateCell(
            record.expectedPaymentDate,
            availability.expectedPaymentDate.readonly,
            isFieldMissing(record, "expectedPaymentDate")
          );
        case "attachmentType":
          return dropdownCell(
            record.attachmentType,
            ATTACHMENT_TYPE_OPTIONS,
            availability.attachmentType.readonly,
            isFieldMissing(record, "attachmentType")
          );
        case "agreementLink":
          return linkCell(record.agreementLink);
        case "vendorContractNo":
          return textCell(record.vendorContractNo);
        case "contentForm":
          return dropdownCell(
            record.contentForm,
            CONTENT_FORM_OPTIONS,
            availability.contentForm.readonly,
            isFieldMissing(record, "contentForm")
          );
        case "authDuration":
          return dropdownCell(
            record.authDuration,
            AUTH_DURATION_OPTIONS,
            availability.authDuration.readonly,
            isFieldMissing(record, "authDuration")
          );
        case "purchaseContent":
          return multiSelectCell(
            record.purchaseContent,
            PURCHASE_CONTENT_OPTIONS,
            availability.purchaseContent.readonly,
            isFieldMissing(record, "purchaseContent")
          );
        case "otherRequirements":
          return longTextCell(record.otherRequirements);
        case "kpiContent":
          return longTextCell(record.kpiContent);
        case "remark":
          return longTextCell(record.remark);
        default:
          return textCell("");
      }
    },
    [rows]
  );

  const onCellEdited = useCallback(
    (item: Item, newValue: EditableGridCell) => {
      const [col, row] = item;
      const record = rows[row];
      if (!record) return;
      const next = applyCellEdit(record, mainColumns[col].id, newValue);
      const updated = [...rows];
      updated[row] = next;
      onRowsChange(updated);
    },
    [rows, onRowsChange]
  );

  // Excel 风格拖拽填充（fillHandle）会一次性产出多个单元格的编辑，走这个回调；
  // 不读/不只读的目标格子会按同样规则逐一应用更新，只读格子（由 getCellContent 决定）
  // 在拖拽过程中已经不会被 Grid 纳入填充目标，这里仅做防御性跳过。
  const onCellsEdited = useCallback(
    (newValues: readonly EditListItem[]) => {
      const updated = [...rows];
      for (const { location, value } of newValues) {
        const [col, row] = location;
        const record = updated[row];
        if (!record) continue;
        updated[row] = applyCellEdit(record, mainColumns[col].id, value);
      }
      onRowsChange(updated);
      return true;
    },
    [rows, onRowsChange]
  );

  const onColumnResize = useCallback((column: GridColumn, newSize: number) => {
    setColumns((prev) =>
      prev.map((c) => (c.title === column.title ? { ...c, width: newSize } : c))
    );
  }, []);

  const onCellClicked = useCallback(
    (item: Item) => {
      const [, row] = item;
      const record = rows[row];
      if (record) onSelectRow(record.seq);
    },
    [rows, onSelectRow]
  );

  return (
    <DataEditor
      columns={columns}
      rows={rows.length}
      getCellContent={getCellContent}
      onCellEdited={onCellEdited}
      onCellsEdited={onCellsEdited}
      onColumnResize={onColumnResize}
      onCellClicked={onCellClicked}
      freezeColumns={MAIN_FROZEN_COLUMNS}
      customRenderers={allCells}
      rowMarkers="both"
      gridSelection={gridSelection}
      onGridSelectionChange={onGridSelectionChange}
      rowSelect="multi"
      cellActivationBehavior="single-click"
      fillHandle
      smoothScrollX
      smoothScrollY
      width="100%"
      height="100%"
      getRowThemeOverride={(row) =>
        rows[row]?.seq === selectedSeq
          ? { bgCell: "#e8f0fe", bgCellMedium: "#dbe6fb" }
          : undefined
      }
      rowHeight={34}
    />
  );
}

/** 把一次单元格编辑（单条编辑或拖拽填充中的一格）应用到行数据上，返回更新后的新对象 */
function applyCellEdit(record: MainRow, fieldId: string, newValue: EditableGridCell): MainRow {
  const next = { ...record };

  if (newValue.kind === GridCellKind.Custom) {
    const data = (newValue as any).data;
    if (data?.kind === "dropdown-cell") {
      applyDropdownChange(next, fieldId, data.value ?? "");
    } else if (data?.kind === "date-picker-cell") {
      (next as any)[fieldId] = formatSlashDate(data.date ?? null);
    } else if (data?.kind === "multi-select-cell") {
      (next as any)[fieldId] = data.values ?? [];
    }
  } else if (newValue.kind === GridCellKind.Text) {
    (next as any)[fieldId] = newValue.data ?? "";
  } else if (newValue.kind === GridCellKind.Number) {
    (next as any)[fieldId] = newValue.data ?? null;
  }

  return next;
}

/** 处理下拉枚举字段的变化，并应用联动规则（成本类型/付款方式/我方签约主体/发票类型 等驱动的字段） */
function applyDropdownChange(next: MainRow, fieldId: string, value: string) {
  (next as any)[fieldId] = value;

  switch (fieldId) {
    case "costType": {
      if (value === "投流成本") {
        next.influencerNo = "";
        next.vendorNo = "";
        next.feeBearer = "";
        next.paymentCycle = "";
        next.downPaymentRatio = null;
        next.paymentMethod = "";
        next.payeeEntityNo = "";
        next.expectedPaymentDate = "";
        next.attachmentType = "";
        next.contentForm = "";
        next.authDuration = "";
        next.purchaseContent = [];
      } else if (value === "达人成本") {
        next.attachmentType = "供应商合同";
      } else if (value === "其他成本") {
        next.influencerNo = "";
        next.attachmentType = "供应商合同";
      }
      break;
    }
    case "paymentMethod": {
      if (value === "境内个人平台支付") {
        next.contractEntity = "江苏钛动科技有限公司";
        next.invoiceType = "专票";
        next.taxRate = 6;
        next.currency = "人民币";
      }
      break;
    }
    case "contractEntity": {
      const fixedCurrency = ENTITY_FIXED_CURRENCY[value];
      if (fixedCurrency) next.currency = fixedCurrency;
      break;
    }
    case "invoiceType": {
      if (value === "专票") next.taxRate = 6;
      else next.taxRate = null;
      break;
    }
    case "paymentCycle": {
      if (value !== "进度款") next.downPaymentRatio = null;
      break;
    }
    default:
      break;
  }
}
