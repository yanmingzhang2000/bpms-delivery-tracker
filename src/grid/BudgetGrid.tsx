import { useCallback, useMemo, useState } from "react";
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
      const entry = visibleRows[row];
      if (!entry) return;
      const next = applyCellEdit(entry.row, budgetColumns[col].id, newValue);
      const updated = [...rows];
      updated[entry.originalIndex] = next;
      onRowsChange(updated);
    },
    [rows, visibleRows, onRowsChange]
  );

  // Excel 风格拖拽填充（fillHandle）一次性产出多个单元格的编辑，这里按可见行号
  // 映射回 rows 的原始下标后再应用更新。
  const onCellsEdited = useCallback(
    (newValues: readonly EditListItem[]) => {
      const updated = [...rows];
      for (const { location, value } of newValues) {
        const [col, row] = location;
        const entry = visibleRows[row];
        if (!entry) continue;
        updated[entry.originalIndex] = applyCellEdit(entry.row, budgetColumns[col].id, value);
      }
      onRowsChange(updated);
      return true;
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
      onCellsEdited={onCellsEdited}
      onColumnResize={onColumnResize}
      freezeColumns={BUDGET_FROZEN_COLUMNS}
      customRenderers={allCells}
      rowMarkers="number"
      cellActivationBehavior="single-click"
      fillHandle
      smoothScrollX
      smoothScrollY
      width="100%"
      height="100%"
      rowHeight={34}
    />
  );
}

/** 把一次单元格编辑（单条编辑或拖拽填充中的一格）应用到行数据上，返回更新后的新对象 */
function applyCellEdit(
  record: BudgetRow,
  fieldId: string,
  newValue: EditableGridCell
): BudgetRow {
  const next = { ...record };

  if (newValue.kind === GridCellKind.Custom) {
    const data = (newValue as any).data;
    if (data?.kind === "dropdown-cell") {
      (next as any)[fieldId] = data.value ?? "";
    }
  } else if (newValue.kind === GridCellKind.Text) {
    (next as any)[fieldId] = newValue.data ?? "";
  } else if (newValue.kind === GridCellKind.Number) {
    (next as any)[fieldId] = newValue.data ?? 0;
  }

  return next;
}
