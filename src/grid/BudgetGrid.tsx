import { useCallback, useMemo, useState } from "react";
import {
  DataEditor,
  GridCellKind,
  type EditableGridCell,
  type GridCell,
  type GridColumn,
  type Item,
} from "@glideapps/glide-data-grid";
import { allCells } from "@glideapps/glide-data-grid-cells";
import type { BudgetRow } from "../data/types";
import { budgetColumns, BUDGET_FROZEN_COLUMNS } from "./budgetColumns";
import { dropdownCell, longTextCell, numberCell, readonlySeqCell } from "./cellHelpers";
import { BUDGET_ITEM_OPTIONS } from "../data/enums";

interface BudgetGridProps {
  rows: BudgetRow[];
  onRowsChange: (rows: BudgetRow[]) => void;
  /** 仅展示该 seq 对应的预算明细；为 null 时展示全部 */
  filterSeq: number | null;
}

export default function BudgetGrid({ rows, onRowsChange, filterSeq }: BudgetGridProps) {
  const [columns, setColumns] = useState<GridColumn[]>(budgetColumns);

  // 保留原始索引，便于编辑时写回完整列表
  const visibleRows = useMemo(() => {
    return rows
      .map((row, originalIndex) => ({ row, originalIndex }))
      .filter((entry) => filterSeq == null || entry.row.seq === filterSeq);
  }, [rows, filterSeq]);

  const getCellContent = useCallback(
    (item: Item): GridCell => {
      const [col, row] = item;
      const entry = visibleRows[row];
      if (!entry) return longTextCell("");
      const record = entry.row;
      const colDef = budgetColumns[col];

      switch (colDef.id) {
        case "seq":
          return readonlySeqCell(record.seq);
        case "budgetItem":
          return dropdownCell(record.budgetItem, BUDGET_ITEM_OPTIONS);
        case "unitPrice":
          return numberCell(record.unitPrice);
        case "quantity":
          return numberCell(record.quantity);
        case "remark":
          return longTextCell(record.remark);
        default:
          return longTextCell("");
      }
    },
    [visibleRows]
  );

  const onCellEdited = useCallback(
    (item: Item, newValue: EditableGridCell) => {
      const [col, row] = item;
      const colDef = budgetColumns[col];
      const entry = visibleRows[row];
      if (!entry) return;

      const next = { ...entry.row };

      if (newValue.kind === GridCellKind.Custom) {
        const data = (newValue as any).data;
        if (data?.kind === "dropdown-cell") {
          (next as any)[colDef.id] = data.value ?? "";
        }
      } else if (newValue.kind === GridCellKind.Text) {
        (next as any)[colDef.id] = newValue.data ?? "";
      } else if (newValue.kind === GridCellKind.Number) {
        (next as any)[colDef.id] = newValue.data ?? 0;
      }

      const updated = [...rows];
      updated[entry.originalIndex] = next;
      onRowsChange(updated);
    },
    [rows, visibleRows, onRowsChange]
  );

  const onColumnResize = useCallback((column: GridColumn, newSize: number) => {
    setColumns((prev) =>
      prev.map((c) => (c.title === column.title ? { ...c, width: newSize } : c))
    );
  }, []);

  return (
    <DataEditor
      columns={columns}
      rows={visibleRows.length}
      getCellContent={getCellContent}
      onCellEdited={onCellEdited}
      onColumnResize={onColumnResize}
      freezeColumns={BUDGET_FROZEN_COLUMNS}
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
