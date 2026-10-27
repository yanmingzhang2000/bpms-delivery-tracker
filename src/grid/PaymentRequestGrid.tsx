import { useCallback, useState } from "react";
import {
  DataEditor,
  GridCellKind,
  type EditableGridCell,
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
}

export default function PaymentRequestGrid({ rows, onRowsChange }: PaymentRequestGridProps) {
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
      const colDef = paymentRequestColumns[col];
      const record = rows[row];
      if (!record) return;

      const next = { ...record };

      if (newValue.kind === GridCellKind.Custom) {
        const data = (newValue as any).data;
        if (data?.kind === "dropdown-cell") {
          (next as any)[colDef.id] = data.value ?? "";
        } else if (data?.kind === "date-picker-cell") {
          (next as any)[colDef.id] = formatSlashDate(data.date ?? null);
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

  return (
    <DataEditor
      columns={columns}
      rows={rows.length}
      getCellContent={getCellContent}
      onCellEdited={onCellEdited}
      onColumnResize={onColumnResize}
      freezeColumns={PAYMENT_REQUEST_FROZEN_COLUMNS}
      customRenderers={allCells}
      rowMarkers="number"
      smoothScrollX
      smoothScrollY
      width="100%"
      height="100%"
      rowHeight={34}
    />
  );
}
