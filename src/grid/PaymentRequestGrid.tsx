import { useCallback, useState } from "react";
import {
  DataEditor,
  GridCellKind,
  type EditableGridCell,
  type EditListItem,
  type GridCell,
  type GridColumn,
  type Item,
} from "@glideapps/glide-data-grid";
import { allCells } from "@glideapps/glide-data-grid-cells";
import type { PaymentRequestRow } from "../data/types";
import {
  paymentRequestColumns,
  PAYMENT_REQUEST_FROZEN_COLUMNS,
} from "./paymentRequestColumns";
import {
  dateCell,
  dropdownCell,
  formatSlashDate,
  longTextCell,
  numberCell,
  paymentRequestStatusCell,
  readonlySeqCell,
  textCell,
} from "./cellHelpers";
import {
  CONTRACT_ENTITY_OPTIONS,
  CURRENCY_OPTIONS,
  FEE_BEARER_OPTIONS,
  PAYMENT_CYCLE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from "../data/enums";

interface PaymentRequestGridProps {
  rows: PaymentRequestRow[];
  onRowsChange: (rows: PaymentRequestRow[]) => void;
  /** 需要高亮展示的订单序号集合（比如刚从采购订单页"发起请款"生成的那几条） */
  highlightOrderSeqs?: ReadonlySet<number>;
}

export default function PaymentRequestGrid({
  rows,
  onRowsChange,
  highlightOrderSeqs,
}: PaymentRequestGridProps) {
  const [columns, setColumns] = useState<GridColumn[]>(paymentRequestColumns);

  const getCellContent = useCallback(
    (item: Item): GridCell => {
      const [col, row] = item;
      const record = rows[row];
      if (!record) return textCell("");
      const colDef = paymentRequestColumns[col];

      switch (colDef.id) {
        case "status":
          return paymentRequestStatusCell(record.status);
        case "orderSeq":
          return readonlySeqCell(record.orderSeq);
        case "offerNo":
          return textCell(record.offerNo, true); // 只读展示，真实来源应是采购订单
        case "feeBearer":
          return dropdownCell(record.feeBearer, FEE_BEARER_OPTIONS);
        case "paymentCycle":
          return dropdownCell(record.paymentCycle, PAYMENT_CYCLE_OPTIONS);
        case "paymentMethod":
          return dropdownCell(record.paymentMethod, PAYMENT_METHOD_OPTIONS);
        case "contractEntity":
          return dropdownCell(record.contractEntity, CONTRACT_ENTITY_OPTIONS);
        case "currency":
          return dropdownCell(record.currency, CURRENCY_OPTIONS);
        case "payeeEntityName":
          return textCell(record.payeeEntityName);
        case "payeeAccount":
          return textCell(record.payeeAccount);
        case "expectedPaymentDate":
          return dateCell(record.expectedPaymentDate);
        case "paidAmount":
          return numberCell(record.paidAmount, true); // 财务系统同步，只读
        case "cumulativeRequestedAmount":
          return numberCell(record.cumulativeRequestedAmount, true);
        case "pendingRequestAmount":
          return numberCell(record.pendingRequestAmount, true);
        case "remainingRequestableAmount":
          return numberCell(record.remainingRequestableAmount, true);
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
      const next = applyCellEdit(record, paymentRequestColumns[col].id, newValue);
      const updated = [...rows];
      updated[row] = next;
      onRowsChange(updated);
    },
    [rows, onRowsChange]
  );

  // Excel 风格拖拽填充（fillHandle）会一次性产出多个单元格的编辑，走这个回调
  const onCellsEdited = useCallback(
    (newValues: readonly EditListItem[]) => {
      const updated = [...rows];
      for (const { location, value } of newValues) {
        const [col, row] = location;
        const record = updated[row];
        if (!record) continue;
        updated[row] = applyCellEdit(record, paymentRequestColumns[col].id, value);
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

  return (
    <DataEditor
      columns={columns}
      rows={rows.length}
      getCellContent={getCellContent}
      onCellEdited={onCellEdited}
      onCellsEdited={onCellsEdited}
      onColumnResize={onColumnResize}
      freezeColumns={PAYMENT_REQUEST_FROZEN_COLUMNS}
      customRenderers={allCells}
      rowMarkers="number"
      cellActivationBehavior="single-click"
      fillHandle
      smoothScrollX
      smoothScrollY
      width="100%"
      height="100%"
      rowHeight={34}
      getRowThemeOverride={(row) =>
        highlightOrderSeqs?.has(rows[row]?.orderSeq)
          ? { bgCell: "#f1ebfb", bgCellMedium: "#e6daf7" }
          : undefined
      }
    />
  );
}

/** 把一次单元格编辑（单条编辑或拖拽填充中的一格）应用到行数据上，返回更新后的新对象 */
function applyCellEdit(
  record: PaymentRequestRow,
  fieldId: string,
  newValue: EditableGridCell
): PaymentRequestRow {
  const next = { ...record };

  if (newValue.kind === GridCellKind.Custom) {
    const data = (newValue as any).data;
    if (data?.kind === "dropdown-cell") {
      (next as any)[fieldId] = data.value ?? "";
    } else if (data?.kind === "date-picker-cell") {
      (next as any)[fieldId] = formatSlashDate(data.date ?? null);
    }
  } else if (newValue.kind === GridCellKind.Text) {
    (next as any)[fieldId] = newValue.data ?? "";
  } else if (newValue.kind === GridCellKind.Number) {
    (next as any)[fieldId] = newValue.data ?? null;
  }

  return next;
}
