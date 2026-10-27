import { useCallback, useMemo, useState } from "react";
import {
  CompactSelection,
  DataEditor,
  GridCellKind,
  type EditableGridCell,
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
  dateCell,
  dropdownCell,
  formatSlashDate,
  longTextCell,
  multiSelectCell,
  numberCell,
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

  // 用 glide-data-grid 内置的行选择（rowMarkers="both"）来承载"勾选"交互，
  // 对外通过 checkedRows（Set<行号>）暴露，供"录Trade"按钮读取。
  const gridSelection: GridSelection = useMemo(() => {
    let rowSelection = CompactSelection.empty();
    for (const rowIndex of checkedRows) {
      rowSelection = rowSelection.add(rowIndex);
    }
    return {
      columns: CompactSelection.empty(),
      rows: rowSelection,
    };
  }, [checkedRows]);

  const onGridSelectionChange = useCallback(
    (newSelection: GridSelection) => {
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
      const colDef = mainColumns[col];
      const record = rows[row];
      if (!record) return;

      const next = { ...record };

      if (newValue.kind === GridCellKind.Custom) {
        const data = (newValue as any).data;
        if (data?.kind === "dropdown-cell") {
          applyDropdownChange(next, colDef.id, data.value ?? "");
        } else if (data?.kind === "date-picker-cell") {
          (next as any)[colDef.id] = formatSlashDate(data.date ?? null);
        } else if (data?.kind === "multi-select-cell") {
          (next as any)[colDef.id] = data.values ?? [];
        }
      } else if (newValue.kind === GridCellKind.Text) {
        (next as any)[colDef.id] = newValue.data ?? "";
      } else if (newValue.kind === GridCellKind.Number) {
        (next as any)[colDef.id] = newValue.data ?? null;
      }

      const updated = [...rows];
      updated[row] = next;
      onRowsChange(updated);
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
      onColumnResize={onColumnResize}
      onCellClicked={onCellClicked}
      freezeColumns={MAIN_FROZEN_COLUMNS}
      customRenderers={allCells}
      rowMarkers="both"
      gridSelection={gridSelection}
      onGridSelectionChange={onGridSelectionChange}
      rowSelect="multi"
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
